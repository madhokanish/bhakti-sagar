import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { getRazorpayClient } from "@/lib/razorpay";
import {
  TOTAL_BILLING_CYCLES,
  TRIAL_DAYS,
  buildSubscriptionSummary,
  updateUserSubscriptionRazorpayById
} from "@/lib/razorpaySubscription";
import { hasSubscriptionEntitlement } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let userId: string;
  try {
    const session = await requireMobileSession(request);
    if (!session.user.email) {
      return NextResponse.json(
        { error: "Your account needs an email address before subscribing." },
        { status: 400 }
      );
    }
    userId = session.user.id;
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }

  const planId = process.env.RAZORPAY_PLAN_ID_MONTHLY?.trim();
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  if (!planId || !keyId) {
    return NextResponse.json(
      { error: "Payment is not configured yet. Please contact support." },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Don't strand the user with a second mandate (and a second authentication charge)
  // when they already have one. The client should route to the manage/status view.
  if (hasSubscriptionEntitlement(user.subscriptionStatus)) {
    return NextResponse.json(
      {
        error: "You already have an active subscription.",
        code: "ALREADY_SUBSCRIBED",
        subscription: buildSubscriptionSummary(user)
      },
      { status: 409 }
    );
  }

  const startAt = Math.floor(Date.now() / 1000) + TRIAL_DAYS * 24 * 60 * 60;

  try {
    const razorpay = getRazorpayClient();
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: TOTAL_BILLING_CYCLES,
      customer_notify: 1,
      start_at: startAt,
      notes: { userId, email: user.email ?? "" }
    });

    await updateUserSubscriptionRazorpayById({
      userId,
      razorpaySubscriptionId: subscription.id,
      subscriptionStatus: subscription.status
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      // Returned rather than compiled into the app so a Razorpay key rotation doesn't
      // require shipping a new build to the Play Store.
      keyId,
      // Razorpay's own hosted checkout page for this subscription. The native Android SDK
      // does not offer UPI for subscription checkout on this account (support ticket open),
      // while this page does — so Android opens it in a Custom Tab instead of the SDK.
      hostedUrl: (subscription as { short_url?: string }).short_url ?? null,
      trialEnd: new Date(startAt * 1000).toISOString()
    });
  } catch (error) {
    const razorpayError = error as { statusCode?: number | string; error?: { description?: string } };
    const description =
      razorpayError?.error?.description ||
      (error instanceof Error ? error.message : "Unable to start subscription.");
    const status = Number(razorpayError?.statusCode) === 401 ? 401 : 500;
    return NextResponse.json({ error: description }, { status });
  }
}
