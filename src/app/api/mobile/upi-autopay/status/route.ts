import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import {
  buildUpiAutopaySummary,
  latestUpiAutopayMandate,
  reconcileUpiAutopayMandate
} from "@/lib/razorpayUpiAutopaySubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireMobileSession(request);
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const mandate = await latestUpiAutopayMandate(user.id);
    const current = new URL(request.url).searchParams.get("refresh") === "1"
      ? await reconcileUpiAutopayMandate(user, mandate)
      : user;
    return NextResponse.json({ subscription: buildUpiAutopaySummary(current, mandate) });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
