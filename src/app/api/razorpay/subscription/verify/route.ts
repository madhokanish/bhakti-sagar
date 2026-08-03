import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";
import {
  mapRazorpaySubscriptionStatus,
  updateSubscriptionByRazorpaySubscriptionId
} from "@/lib/razorpaySubscription";

export const runtime = "nodejs";

type VerifyBody = {
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as VerifyBody;
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    return NextResponse.json({ error: "Payment is not configured yet." }, { status: 503 });
  }

  // Subscription signature payload is payment_id|subscription_id (order-based
  // Standard Checkout uses order_id|payment_id instead — different formula).
  const payload = `${razorpay_payment_id}|${razorpay_subscription_id}`;
  const expectedSignature = createHmac("sha256", keySecret).update(payload).digest("hex");

  if (!safeEqual(expectedSignature, razorpay_signature)) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  try {
    // Don't trust the client-reported status — re-fetch the subscription from
    // Razorpay so entitlement reflects what Razorpay actually recorded.
    const razorpay = getRazorpayClient();
    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    const mappedStatus = mapRazorpaySubscriptionStatus(subscription.status);

    await updateSubscriptionByRazorpaySubscriptionId({
      razorpaySubscriptionId: subscription.id,
      subscriptionStatus: mappedStatus,
      trialEnd: subscription.start_at ? new Date(subscription.start_at * 1000) : null,
      currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null
    });

    return NextResponse.json({ success: true, status: mappedStatus });
  } catch (error) {
    const description =
      (error as { error?: { description?: string } })?.error?.description ||
      (error instanceof Error ? error.message : "Unable to verify subscription.");
    return NextResponse.json({ error: description }, { status: 500 });
  }
}
