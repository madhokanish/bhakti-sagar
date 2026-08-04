import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { buildSubscriptionSummary } from "@/lib/razorpaySubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireMobileSession(request);

    // Entitlement rides along on the session-validation call the app already makes at
    // launch, so the common case needs no extra round trip.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionStatus: true,
        razorpaySubscriptionId: true,
        trialEnd: true,
        currentPeriodEnd: true
      }
    });

    return NextResponse.json({
      user: session.user,
      expiresAt: session.expiresAt.toISOString(),
      subscription: user ? buildSubscriptionSummary(user) : null
    });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
