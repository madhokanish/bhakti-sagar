import { NextResponse } from "next/server";
import { enforceMobileAuthRateLimit, exchangeGoogleIdToken } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { AUTH_EVENT_TYPES, logAuthEvent } from "@/lib/authEvents";
import { getRequestMetaFromRequest } from "@/lib/requestMeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const meta = getRequestMetaFromRequest(request);
    enforceMobileAuthRateLimit(`${meta.ip || "unknown"}:google`, 20, 10 * 60 * 1000);
    const body = (await request.json()) as { challengeId?: string; idToken?: string };
    const result = await exchangeGoogleIdToken({
      challengeId: body.challengeId?.trim() || "",
      idToken: body.idToken?.trim() || ""
    });
    await logAuthEvent({
      eventType: AUTH_EVENT_TYPES.MOBILE_GOOGLE_LOGIN_SUCCESS,
      userId: result.user.id,
      email: result.user.email,
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    return NextResponse.json({
      accessToken: result.token,
      expiresAt: result.expiresAt.toISOString(),
      user: result.user
    });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
