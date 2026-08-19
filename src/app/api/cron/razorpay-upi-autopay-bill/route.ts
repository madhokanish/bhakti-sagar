import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setUserSubscriptionStatus } from "@/lib/subscriptionStatus";
import {
  createRecurringUpiDebit,
  createScheduledDebitOrder
} from "@/lib/razorpayUpiAutopay";
import { followingBillingDate } from "@/lib/razorpayUpiAutopaySubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Creates one Razorpay order and one recurring payment for each due direct mandate.
 * The unique `(mandateId, scheduledFor)` constraint makes retrying this handler safe: a
 * second cron invocation cannot produce a second debit for the same month.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const mandates = await prisma.razorpayAutopayMandate.findMany({
    where: {
      status: "active",
      razorpayTokenId: { not: null },
      nextBillingAt: { lte: now },
      expiresAt: { gt: now }
    },
    include: { user: true },
    take: 100
  });

  let charged = 0;
  const failures: string[] = [];
  for (const mandate of mandates) {
    const scheduledFor = mandate.nextBillingAt!;
    try {
      const existing = await prisma.razorpayAutopayCharge.findUnique({
        where: { mandateId_scheduledFor: { mandateId: mandate.id, scheduledFor } }
      });
      if (existing) continue;

      const order = await createScheduledDebitOrder({
        amount: mandate.billingAmount,
        tokenId: mandate.razorpayTokenId!,
        scheduledFor,
        receipt: `bc-debit-${mandate.id.slice(-10)}-${scheduledFor.getTime()}`.slice(0, 40),
        mandateId: mandate.id
      });
      const payment = await createRecurringUpiDebit({
        orderId: order.id,
        customerId: mandate.razorpayCustomerId,
        tokenId: mandate.razorpayTokenId!,
        amount: mandate.billingAmount,
        email: mandate.user.email,
        contact: mandate.customerContact,
        mandateId: mandate.id
      });
      await prisma.razorpayAutopayCharge.create({
        data: {
          mandateId: mandate.id,
          razorpayOrderId: order.id,
          razorpayPaymentId: payment.id,
          amount: mandate.billingAmount,
          status: payment.status,
          scheduledFor,
          completedAt: payment.status === "captured" ? now : null
        }
      });

      if (payment.status === "captured") {
        const nextPeriodEnd = followingBillingDate(scheduledFor);
        await prisma.$transaction(async (tx) => {
          await tx.razorpayAutopayMandate.update({
            where: { id: mandate.id },
            data: { nextBillingAt: nextPeriodEnd }
          });
          await setUserSubscriptionStatus({
            userId: mandate.userId,
            status: "active",
            source: "upi-autopay-charge",
            data: { currency: "INR", trialEnd: null, currentPeriodEnd: nextPeriodEnd },
            client: tx
          });
        });
      }
      charged += 1;
    } catch (error) {
      failures.push(`${mandate.id}:${error instanceof Error ? error.message : "unknown"}`);
    }
  }
  return NextResponse.json({ due: mandates.length, charged, failures });
}
