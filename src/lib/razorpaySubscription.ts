import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Razorpay's own subscription statuses. "authenticated" is the mandate-registered,
 * not-yet-billing state (our trial window) and is remapped to "trialing" so the
 * existing hasSubscriptionEntitlement()/ENTITLED_STATUSES check in subscription.ts
 * keeps working unchanged for Razorpay users, same as it does for Stripe users.
 */
export function mapRazorpaySubscriptionStatus(razorpayStatus: string): string {
  if (razorpayStatus === "authenticated") return "trialing";
  return razorpayStatus;
}

export async function updateUserSubscriptionRazorpayById(input: {
  userId: string;
  razorpaySubscriptionId: string;
  subscriptionStatus?: string | null;
  trialEnd?: Date | null;
  currentPeriodEnd?: Date | null;
}) {
  return prisma.user.update({
    where: { id: input.userId },
    data: {
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      subscriptionStatus: input.subscriptionStatus ?? undefined,
      trialEnd: input.trialEnd ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd ?? undefined,
      currency: "INR"
    }
  });
}

export async function getUserByRazorpaySubscriptionId(razorpaySubscriptionId: string) {
  return prisma.user.findUnique({
    where: { razorpaySubscriptionId }
  });
}

export async function updateSubscriptionByRazorpaySubscriptionId(input: {
  razorpaySubscriptionId: string;
  subscriptionStatus: string;
  trialEnd?: Date | null;
  currentPeriodEnd?: Date | null;
}) {
  return prisma.user.updateMany({
    where: { razorpaySubscriptionId: input.razorpaySubscriptionId },
    data: {
      subscriptionStatus: input.subscriptionStatus,
      trialEnd: input.trialEnd ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null
    }
  });
}
