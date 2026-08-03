import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import {
  mapRazorpaySubscriptionStatus,
  updateSubscriptionByRazorpaySubscriptionId
} from "@/lib/razorpaySubscription";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to manage your subscription." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.razorpaySubscriptionId) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
  }

  try {
    const razorpay = getRazorpayClient();
    // cancelAtCycleEnd only works once a subscription has an active billing cycle to
    // defer to — i.e. after its first real charge. During the trial window (status
    // "trialing" / Razorpay's "authenticated") there's no cycle yet, so Razorpay rejects
    // it; cancel immediately instead. Once past the trial, defer to cycle end so access
    // continues through the period already paid for, matching the refund policy.
    const cancelAtCycleEnd = user.subscriptionStatus === "active";
    const subscription = await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, cancelAtCycleEnd);

    if (!cancelAtCycleEnd) {
      // Immediate cancellation — reflect it locally now rather than waiting on a webhook.
      await updateSubscriptionByRazorpaySubscriptionId({
        razorpaySubscriptionId: subscription.id,
        subscriptionStatus: mapRazorpaySubscriptionStatus(subscription.status),
        trialEnd: subscription.start_at ? new Date(subscription.start_at * 1000) : null,
        currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null
      });
    }

    return NextResponse.json({
      success: true,
      cancelledImmediately: !cancelAtCycleEnd,
      accessUntil: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null
    });
  } catch (error) {
    const description =
      (error as { error?: { description?: string } })?.error?.description ||
      (error instanceof Error ? error.message : "Unable to cancel subscription.");
    return NextResponse.json({ error: description }, { status: 500 });
  }
}
