import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRazorpayClient } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import {
  TOTAL_BILLING_CYCLES,
  TRIAL_DAYS,
  updateUserSubscriptionRazorpayById
} from "@/lib/razorpaySubscription";

export const runtime = "nodejs";

/** A still-unpaid subscription younger than this is handed out again instead of a new one. */
const REUSE_WINDOW_SECONDS = 15 * 60;

/** Razorpay states in which the mandate is already approved: never start a second one. */
const MANDATE_APPROVED = new Set(["authenticated", "active", "pending"]);

export async function POST() {
  const session = await auth();
  // Identity is enough; email is optional. Phone-OTP accounts have no email but are fully
  // valid subscribers, and Razorpay does not require one to create a subscription.
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to subscribe." }, { status: 401 });
  }
  const userId = session.user.id;
  const email = session.user.email ?? null;

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

    // The app loads checkout ahead of the tap, and again when someone comes back from it, so
    // this runs far more often than people pay. Webhooks find the user by the subscription id
    // stored on their row; overwriting it with a fresh one after they approved a mandate in
    // their UPI app would strand that payment. So: hand back the same unpaid subscription
    // while it is fresh, and refuse once a mandate exists.
    const existingId = (
      await prisma.user.findUnique({ where: { id: userId }, select: { razorpaySubscriptionId: true } })
    )?.razorpaySubscriptionId;
    if (existingId) {
      const existing = await razorpay.subscriptions.fetch(existingId).catch(() => null);
      if (existing && MANDATE_APPROVED.has(existing.status)) {
        return NextResponse.json(
          { error: "You already have a membership.", code: "ALREADY_SUBSCRIBED" },
          { status: 409 }
        );
      }
      const ageSeconds = existing ? Date.now() / 1000 - Number(existing.created_at) : Infinity;
      if (existing?.status === "created" && existing.plan_id === planId && ageSeconds < REUSE_WINDOW_SECONDS) {
        return NextResponse.json({
          subscriptionId: existing.id,
          trialEnd: new Date(Number(existing.start_at) * 1000).toISOString()
        });
      }
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: TOTAL_BILLING_CYCLES,
      customer_notify: 1,
      start_at: startAt,
      notes: { userId, ...(email ? { email } : {}) }
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
