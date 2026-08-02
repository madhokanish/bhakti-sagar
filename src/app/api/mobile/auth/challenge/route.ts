import { NextResponse } from "next/server";
import { createMobileAuthChallenge, enforceMobileAuthRateLimit } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { getRequestMetaFromRequest } from "@/lib/requestMeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const meta = getRequestMetaFromRequest(request);
    enforceMobileAuthRateLimit(`${meta.ip || "unknown"}:challenge`, 30, 10 * 60 * 1000);
    const challenge = await createMobileAuthChallenge();
    return NextResponse.json({
      challengeId: challenge.challengeId,
      nonce: challenge.nonce,
      expiresAt: challenge.expiresAt.toISOString()
    });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
