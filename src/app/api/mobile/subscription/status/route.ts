import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import {
  buildSubscriptionSummary,
  reconcileSubscriptionFromRazorpay
} from "@/lib/razorpaySubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireMobileSession(request);

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Default is a cheap DB read. `?refresh=1` additionally pulls from Razorpay — the app
    // uses it right after the user returns from approving a mandate in their UPI app,
    // when the webhook may not have landed yet.
    const refresh = new URL(request.url).searchParams.get("refresh") === "1";
    const current = refresh ? await reconcileSubscriptionFromRazorpay(user) : user;

    return NextResponse.json({ subscription: buildSubscriptionSummary(current) });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
