import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRazorpayClient } from "@/lib/razorpay";
import { updateUserSubscriptionRazorpayById } from "@/lib/razorpaySubscription";

export const runtime = "nodejs";

// Matches the Daily Bhakti flow we're mirroring: a small mandate authentication
// charge now (Razorpay decides the amount — ₹5 in test mode), first real ₹199
// charge after a 3-day trial.
const TRIAL_DAYS = 3;
// Razorpay Subscriptions require a total_count; there's no "forever" option.
// 120 monthly cycles (10 years) is effectively indefinite for this use case.
const TOTAL_BILLING_CYCLES = 120;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Please sign in to subscribe." }, { status: 401 });
  }
  const userId = session.user.id;
  const email = session.user.email;

  const planId = process.env.RAZORPAY_PLAN_ID_MONTHLY?.trim();
  if (!planId) {
    return NextResponse.json(
      { error: "Payment is not configured yet. Please contact support." },
      { status: 503 }
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
      notes: { userId, email }
    });

    await updateUserSubscriptionRazorpayById({
      userId,
      razorpaySubscriptionId: subscription.id,
      subscriptionStatus: subscription.status
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
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
