import { NextResponse } from "next/server";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireMobileSession(request);
    return NextResponse.json({
      user: session.user,
      expiresAt: session.expiresAt.toISOString()
    });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
