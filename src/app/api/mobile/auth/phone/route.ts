import { NextResponse } from "next/server";
import { enforceMobileAuthRateLimit, exchangePhoneIdToken } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { AUTH_EVENT_TYPES, logAuthEvent } from "@/lib/authEvents";
import { getRequestMetaFromRequest } from "@/lib/requestMeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Phone sign-in. Firebase has already delivered the SMS and checked the code by the time the
 * app calls this; all that arrives here is the resulting ID token.
 *
 * No challenge/nonce pairing, unlike the Google route. That exists there to bind a Google
 * credential to a request this app started, whereas a Firebase phone token is only issued
 * after Firebase itself verified a code sent to that number, and it carries its own audience
 * and expiry. The rate limit below is what stops this being hammered.
 */
export async function POST(request: Request) {
  try {
    const meta = getRequestMetaFromRequest(request);
    enforceMobileAuthRateLimit(`${meta.ip || "unknown"}:phone`, 20, 10 * 60 * 1000);
    const body = (await request.json()) as { idToken?: string };
    const result = await exchangePhoneIdToken({ idToken: body.idToken?.trim() || "" });
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
