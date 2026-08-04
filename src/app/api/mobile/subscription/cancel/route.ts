import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { cancelSubscriptionForUser } from "@/lib/razorpaySubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let userId: string;
  try {
    const session = await requireMobileSession(request);
    userId = session.user.id;
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.razorpaySubscriptionId) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
  }

  try {
    const result = await cancelSubscriptionForUser(user);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to cancel subscription." },
      { status: 500 }
    );
  }
}
