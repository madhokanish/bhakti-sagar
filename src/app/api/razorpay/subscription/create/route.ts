import { NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";
import { upsertUserSubscriptionRazorpay } from "@/lib/razorpaySubscription";

export const runtime = "nodejs";

// Matches the Daily Bhakti flow we're mirroring: ₹1 mandate authentication now,
// first real ₹199 charge after a 3-day trial.
const TRIAL_DAYS = 3;
// Razorpay Subscriptions require a total_count; there's no "forever" option.
// 120 monthly cycles (10 years) is effectively indefinite for this use case.
const TOTAL_BILLING_CYCLES = 120;

type CreateSubscriptionBody = {
  email?: string;
};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateSubscriptionBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

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
      notes: { email }
    });

    await upsertUserSubscriptionRazorpay({
      email,
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
