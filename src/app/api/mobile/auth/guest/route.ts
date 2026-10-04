import { NextResponse } from "next/server";
import { enforceMobileAuthRateLimit, exchangeGuestDevice } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { AUTH_EVENT_TYPES, logAuthEvent } from "@/lib/authEvents";
import { getRequestMetaFromRequest } from "@/lib/requestMeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The app calls this when someone taps pay without signing in. It returns the same session
// shape as the other exchanges, flagged user.isGuest, so checkout runs unchanged.
export async function POST(request: Request) {
  try {
    const meta = getRequestMetaFromRequest(request);
    enforceMobileAuthRateLimit(`${meta.ip || "unknown"}:guest`, 20, 10 * 60 * 1000);
    const result = await exchangeGuestDevice({
      anonId: request.headers.get("x-bhakti-anon-id") || ""
    });
    await logAuthEvent({
      eventType: AUTH_EVENT_TYPES.MOBILE_GUEST_SESSION,
      userId: result.user.id,
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
