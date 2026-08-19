import "server-only";

import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  setSubscriptionStatusWhere,
  setUserSubscriptionStatus,
  type SubscriptionStatusSource
} from "@/lib/subscriptionStatus";
import { getRazorpayClient } from "@/lib/razorpay";
import { hasSubscriptionEntitlement } from "@/lib/subscription";

/**
 * Days between mandate authentication and the first real charge. Razorpay levies its own
 * fixed, auto-refunded authentication charge up front; this only controls when real
 * billing starts (the subscription's `start_at`).
 */
export const TRIAL_DAYS = 3;

/**
 * Razorpay Subscriptions require a total_count; there is no "forever" option.
 * 120 monthly cycles (10 years) is effectively indefinite for this use case.
 */
export const TOTAL_BILLING_CYCLES = 120;

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
  source?: SubscriptionStatusSource;
}) {
  return setUserSubscriptionStatus({
    userId: input.userId,
    status: input.subscriptionStatus ?? undefined,
    source: input.source ?? "razorpay-create",
    data: {
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      trialEnd: input.trialEnd ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd ?? undefined,
      currency: "INR",
      // Starting a new subscription supersedes any earlier pending cancellation.
      cancellationRequestedAt: null
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
  source?: SubscriptionStatusSource;
}) {
  return setSubscriptionStatusWhere({
    where: { razorpaySubscriptionId: input.razorpaySubscriptionId },
    status: input.subscriptionStatus,
    source: input.source ?? "razorpay-webhook",
    data: {
      trialEnd: input.trialEnd ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null
    }
  });
}

export type SubscriptionSummary = {
  /** Whether the app should unlock paid features. The only field clients need to gate on. */
  isPro: boolean;
  status: string;
  subscriptionId: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  /** When the member asked to cancel, if they are still inside the period they paid for. */
  cancellationRequestedAt: string | null;
  /**
   * False for a member who has cancelled but still has paid time left. Clients should show
   * "ends on <currentPeriodEnd>" rather than a renewal date when this is false.
   */
  willRenew: boolean;
};

/** Single shape for entitlement, shared by /api/mobile/me and the mobile status route. */
export function buildSubscriptionSummary(
  user: Pick<
    User,
    | "subscriptionStatus"
    | "razorpaySubscriptionId"
    | "trialEnd"
    | "currentPeriodEnd"
    | "cancellationRequestedAt"
  >
): SubscriptionSummary {
  const isPro = hasSubscriptionEntitlement(user.subscriptionStatus);
  return {
    isPro,
    status: user.subscriptionStatus,
    subscriptionId: user.razorpaySubscriptionId,
    trialEnd: user.trialEnd?.toISOString() ?? null,
    currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
    cancellationRequestedAt: user.cancellationRequestedAt?.toISOString() ?? null,
    willRenew: isPro && !user.cancellationRequestedAt
  };
}

/**
 * Pulls current state from Razorpay and writes it back locally. Used to resolve the gap
 * between a user approving a mandate in their UPI app and the webhook actually landing —
 * without it, the app would show "not subscribed" for the seconds/minutes in between.
 */
export async function reconcileSubscriptionFromRazorpay(user: User): Promise<User> {
  if (!user.razorpaySubscriptionId) return user;

  try {
    const razorpay = getRazorpayClient();
    const subscription = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
    return await setUserSubscriptionStatus({
      userId: user.id,
      status: mapRazorpaySubscriptionStatus(subscription.status),
      source: "razorpay-reconcile",
      data: {
        trialEnd: subscription.start_at ? new Date(subscription.start_at * 1000) : null,
        currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null
      }
    });
  } catch {
    // Reconcile is best-effort: a Razorpay outage or a mode-orphaned id must not break a
    // status read. The webhook remains the primary path for state changes.
    return user;
  }
}

export type CancelResult = {
  cancelledImmediately: boolean;
  accessUntil: string | null;
};

/**
 * Cancels a user's subscription. Shared by the web and mobile cancel routes so both keep
 * identical semantics.
 *
 * cancelAtCycleEnd only works once a subscription has an active billing cycle to defer to
 * — i.e. after its first real charge. During the trial window (status "trialing" /
 * Razorpay's "authenticated") there is no cycle yet and Razorpay rejects the call, so
 * cancel immediately instead. Past the trial, defer to cycle end so access continues
 * through the period already paid for, matching the published refund policy.
 */
export async function cancelSubscriptionForUser(user: User): Promise<CancelResult> {
  if (!user.razorpaySubscriptionId) {
    throw new Error("No active subscription found.");
  }

  const cancelAtCycleEnd = user.subscriptionStatus === "active";

  try {
    const razorpay = getRazorpayClient();
    const subscription = await razorpay.subscriptions.cancel(
      user.razorpaySubscriptionId,
      cancelAtCycleEnd
    );

    if (!cancelAtCycleEnd) {
      // Immediate cancellation — reflect it locally now rather than waiting on a webhook.
      await updateSubscriptionByRazorpaySubscriptionId({
        razorpaySubscriptionId: subscription.id,
        subscriptionStatus: mapRazorpaySubscriptionStatus(subscription.status),
        trialEnd: subscription.start_at ? new Date(subscription.start_at * 1000) : null,
        currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null,
        source: "razorpay-cancel"
      });
    } else {
      // Deferred cancellation. Status legitimately stays "active" until Razorpay ends the
      // cycle, so the status write above would be wrong here — but writing nothing at all
      // (the previous behaviour) left a cancelled membership looking identical to a
      // renewing one. Record the request itself instead.
      await prisma.user.update({
        where: { id: user.id },
        data: { cancellationRequestedAt: new Date() }
      });
    }

    return {
      cancelledImmediately: !cancelAtCycleEnd,
      accessUntil: subscription.current_end
        ? new Date(subscription.current_end * 1000).toISOString()
        : null
    };
  } catch (error) {
    const description =
      (error as { error?: { description?: string } })?.error?.description ||
      (error instanceof Error ? error.message : "Unable to cancel subscription.");

    // Razorpay reports a subscription id as "invalid or could not be found" when it
    // belongs to a different mode (test vs live) than the currently configured API keys
    // — e.g. a record created before a test-to-live credential switch. There is nothing
    // left to cancel on Razorpay's side, so just clear the stale local state instead of
    // leaving the user stuck unable to cancel something that no longer exists.
    if (description.toLowerCase().includes("could not be found")) {
      await updateSubscriptionByRazorpaySubscriptionId({
        razorpaySubscriptionId: user.razorpaySubscriptionId,
        subscriptionStatus: "cancelled",
        trialEnd: null,
        currentPeriodEnd: null,
        source: "razorpay-cancel"
      });
      return { cancelledImmediately: true, accessUntil: null };
    }

    throw new Error(description);
  }
}
