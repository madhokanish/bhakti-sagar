import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  mapRazorpaySubscriptionStatus,
  updateSubscriptionByRazorpaySubscriptionId
} from "@/lib/razorpaySubscription";

export const runtime = "nodejs";

const HANDLED_EVENTS = new Set([
  "subscription.authenticated",
  "subscription.activated",
  "subscription.charged",
  "subscription.completed",
  "subscription.pending",
  "subscription.halted",
  "subscription.cancelled",
  "subscription.updated"
]);

type RazorpaySubscriptionEntity = {
  id: string;
  status: string;
  start_at?: number | null;
  current_end?: number | null;
};

type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    subscription?: { entity?: RazorpaySubscriptionEntity };
  };
};

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook signature missing." }, { status: 400 });
  }

  const rawBody = await request.text();
  const expectedSignature = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  if (!safeEqual(expectedSignature, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: RazorpayWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const eventId = request.headers.get("x-razorpay-event-id");
  if (eventId) {
    const existing = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  try {
    if (HANDLED_EVENTS.has(event.event)) {
      const subscription = event.payload?.subscription?.entity;
      if (subscription) {
        await updateSubscriptionByRazorpaySubscriptionId({
          razorpaySubscriptionId: subscription.id,
          subscriptionStatus: mapRazorpaySubscriptionStatus(subscription.status),
          trialEnd: subscription.start_at ? new Date(subscription.start_at * 1000) : null,
          currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null
        });
      }
    }

    if (eventId) {
      await prisma.razorpayWebhookEvent.create({
        data: { eventId, type: event.event }
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
