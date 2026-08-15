import "server-only";

import type { RazorpayAutopayMandate, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasSubscriptionEntitlement } from "@/lib/subscription";
import {
  fetchRazorpayPayment,
  findConfirmedUpiToken,
  getUpiAutopayConfig
} from "@/lib/razorpayUpiAutopay";

export type UpiAutopaySummary = {
  isPro: boolean;
  status: string;
  subscriptionId: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
};

export function buildUpiAutopaySummary(user: Pick<User, "subscriptionStatus" | "trialEnd" | "currentPeriodEnd">, mandate?: Pick<RazorpayAutopayMandate, "id"> | null): UpiAutopaySummary {
  return {
    isPro: hasSubscriptionEntitlement(user.subscriptionStatus),
    status: user.subscriptionStatus,
    subscriptionId: mandate?.id ?? null,
    trialEnd: user.trialEnd?.toISOString() ?? null,
    currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null
  };
}

function nextMonthlyDate(from: Date) {
  const next = new Date(from);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

async function expireElapsedAccess(user: User) {
  if (!hasSubscriptionEntitlement(user.subscriptionStatus)) return user;
  const end = user.currentPeriodEnd ?? user.trialEnd;
  if (!end || end > new Date()) return user;
  return prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "past_due", currentPeriodEnd: end }
  });
}

/**
 * Server-side source of truth after Android returns from a UPI app. The deep link is never
 * trusted as proof of payment: Razorpay's payment object must be captured and its linked
 * UPI recurring token must be confirmed before the membership trial is unlocked.
 */
export async function reconcileUpiAutopayMandate(user: User, mandate: RazorpayAutopayMandate | null) {
  if (!mandate) return expireElapsedAccess(user);

  if (mandate.status === "pending") {
    try {
      const payment = await fetchRazorpayPayment(mandate.razorpayPaymentId);
      const token = payment.token_id
        ? { id: payment.token_id, recurring: true, method: "upi", recurring_details: { status: "confirmed" } }
        : await findConfirmedUpiToken(mandate.razorpayCustomerId, mandate.createdAt);

      if (payment.status === "captured" && payment.method === "upi" && token?.id) {
        const config = getUpiAutopayConfig();
        const trialEnd = new Date();
        trialEnd.setUTCDate(trialEnd.getUTCDate() + config.trialDays);
        await prisma.$transaction([
          prisma.razorpayAutopayMandate.update({
            where: { id: mandate.id },
            data: {
              razorpayTokenId: token.id,
              status: "active",
              approvedAt: new Date(),
              nextBillingAt: trialEnd,
              lastCheckedAt: new Date()
            }
          }),
          prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "trialing",
              currency: "INR",
              trialEnd,
              currentPeriodEnd: trialEnd
            }
          })
        ]);
        return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      }

      if (["failed", "refunded"].includes(payment.status)) {
        await prisma.razorpayAutopayMandate.update({
          where: { id: mandate.id },
          data: { status: "failed", lastCheckedAt: new Date() }
        });
      } else {
        await prisma.razorpayAutopayMandate.update({
          where: { id: mandate.id },
          data: { lastCheckedAt: new Date() }
        });
      }
    } catch {
      // A refresh should never revoke access or turn an outage into a user-facing failure.
    }
  }

  return expireElapsedAccess(user);
}

export async function latestUpiAutopayMandate(userId: string) {
  return prisma.razorpayAutopayMandate.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

export function followingBillingDate(periodEnd: Date) {
  return nextMonthlyDate(periodEnd);
}

/** Applies a captured scheduled debit to the corresponding mandate and membership. */
export async function recordCapturedUpiAutopayCharge(paymentId: string) {
  const charge = await prisma.razorpayAutopayCharge.findUnique({
    where: { razorpayPaymentId: paymentId },
    include: { mandate: true }
  });
  if (!charge || charge.status === "captured") return;

  const nextPeriodEnd = followingBillingDate(charge.scheduledFor);
  await prisma.$transaction([
    prisma.razorpayAutopayCharge.update({
      where: { id: charge.id },
      data: { status: "captured", completedAt: new Date() }
    }),
    prisma.razorpayAutopayMandate.update({
      where: { id: charge.mandateId },
      data: { status: "active", nextBillingAt: nextPeriodEnd }
    }),
    prisma.user.update({
      where: { id: charge.mandate.userId },
      data: {
        subscriptionStatus: "active",
        currency: "INR",
        trialEnd: null,
        currentPeriodEnd: nextPeriodEnd
      }
    })
  ]);
}
