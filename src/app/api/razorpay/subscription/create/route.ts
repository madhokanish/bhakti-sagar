import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRazorpayClient } from "@/lib/razorpay";
import {
  TOTAL_BILLING_CYCLES,
  TRIAL_DAYS,
  updateUserSubscriptionRazorpayById
} from "@/lib/razorpaySubscription";

export const runtime = "nodejs";

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
