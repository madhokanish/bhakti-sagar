import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setUserSubscriptionStatus } from "@/lib/subscriptionStatus";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { cancelUpiAutopayToken } from "@/lib/razorpayUpiAutopay";
import { latestUpiAutopayMandate } from "@/lib/razorpayUpiAutopaySubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = (await requireMobileSession(request)).user.id;
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }

  const mandate = await latestUpiAutopayMandate(userId);
  if (!mandate?.razorpayTokenId || mandate.status !== "active") {
    return NextResponse.json({ error: "No active UPI AutoPay mandate found." }, { status: 400 });
  }

  try {
    await cancelUpiAutopayToken(mandate.razorpayCustomerId, mandate.razorpayTokenId);
    const now = new Date();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const keepAccess = !!user.currentPeriodEnd && user.currentPeriodEnd > now && user.subscriptionStatus === "active";
    await prisma.$transaction(async (tx) => {
      await tx.razorpayAutopayMandate.update({
        where: { id: mandate.id },
        data: { status: "cancellation_requested", cancellationRequestedAt: now }
      });
      await setUserSubscriptionStatus({
        userId,
        status: keepAccess ? "active" : "cancelled",
        source: "upi-autopay-cancel",
        data: keepAccess ? {} : { trialEnd: null, currentPeriodEnd: null },
        client: tx
      });
    });
    return NextResponse.json({ success: true, cancelledImmediately: !keepAccess, accessUntil: keepAccess ? user.currentPeriodEnd?.toISOString() : null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to cancel UPI AutoPay." }, { status: 500 });
  }
}
