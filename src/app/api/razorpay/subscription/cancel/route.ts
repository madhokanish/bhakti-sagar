import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";

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
    // cancelAtCycleEnd: keep Pro access through the period already paid for, matching
    // the refund policy ("stays active until the end of the period you already paid for").
    // Razorpay's own subscription.status stays "active" until the cycle actually ends, then
    // the existing webhook handler picks up subscription.cancelled automatically.
    const subscription = await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, true);

    return NextResponse.json({
      success: true,
      accessUntil: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null
    });
  } catch (error) {
    const description =
      (error as { error?: { description?: string } })?.error?.description ||
      (error instanceof Error ? error.message : "Unable to cancel subscription.");
    return NextResponse.json({ error: description }, { status: 500 });
  }
}
