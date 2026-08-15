import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { hasSubscriptionEntitlement } from "@/lib/subscription";
import {
  RazorpayUpiAutopayError,
  createUpiAutopayCustomer,
  createUpiMandateAuthorization,
  createUpiMandateOrder,
  getUpiAutopayConfig
} from "@/lib/razorpayUpiAutopay";
import { buildUpiAutopaySummary, latestUpiAutopayMandate } from "@/lib/razorpayUpiAutopaySubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeIndianMobile(value: unknown) {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "").replace(/^91/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = (await requireMobileSession(request)).user.id;
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }

  const contact = normalizeIndianMobile((await request.json().catch(() => ({}))).contact);
  if (!contact) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit Indian mobile number to set up UPI AutoPay.", code: "INVALID_CONTACT" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) {
    return NextResponse.json({ error: "Your account needs an email address before subscribing." }, { status: 400 });
  }
  if (hasSubscriptionEntitlement(user.subscriptionStatus)) {
    const mandate = await latestUpiAutopayMandate(userId);
    return NextResponse.json(
      { error: "You already have an active membership.", code: "ALREADY_SUBSCRIBED", subscription: buildUpiAutopaySummary(user, mandate) },
      { status: 409 }
    );
  }

  const pending = await prisma.razorpayAutopayMandate.findFirst({
    where: { userId, status: "pending", createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } },
    orderBy: { createdAt: "desc" }
  });
  if (pending) {
    return NextResponse.json(
      { error: "Your earlier UPI request is still awaiting approval. Please return to your UPI app or try again in a few minutes.", code: "AUTHORIZATION_PENDING" },
      { status: 409 }
    );
  }

  try {
    const config = getUpiAutopayConfig();
    const firstBillingAt = new Date();
    firstBillingAt.setUTCDate(firstBillingAt.getUTCDate() + config.trialDays);
    const customer = await createUpiAutopayCustomer({ name: user.name, email: user.email, contact, userId });
    const receiptSuffix = `${Date.now()}-${userId.slice(-6)}`;
    const order = await createUpiMandateOrder({
      customerId: customer.id,
      authorizationAmount: config.authorizationAmount,
      billingAmount: config.billingAmount,
      expiresAt: config.expiresAt,
      receipt: `bc-mandate-${receiptSuffix}`.slice(0, 40),
      mandateId: userId
    });
    const authorization = await createUpiMandateAuthorization({
      orderId: order.id,
      customerId: customer.id,
      authorizationAmount: config.authorizationAmount,
      mandateId: userId
    });

    if (!authorization.link.startsWith("upi://mandate")) {
      throw new Error("Razorpay did not return a UPI mandate link.");
    }

    const mandate = await prisma.razorpayAutopayMandate.create({
      data: {
        userId,
        razorpayCustomerId: customer.id,
        customerContact: contact,
        razorpayOrderId: order.id,
        razorpayPaymentId: authorization.razorpay_payment_id,
        authorizationAmount: config.authorizationAmount,
        billingAmount: config.billingAmount,
        nextBillingAt: firstBillingAt,
        expiresAt: config.expiresAt
      }
    });
    return NextResponse.json({ mandateId: mandate.id, upiIntentUrl: authorization.link });
  } catch (error) {
    const message = error instanceof RazorpayUpiAutopayError || error instanceof Error
      ? error.message
      : "Unable to start UPI AutoPay.";
    return NextResponse.json({ error: message }, { status: error instanceof RazorpayUpiAutopayError ? error.status : 500 });
  }
}
