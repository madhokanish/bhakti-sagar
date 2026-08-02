import { NextResponse } from "next/server";
import { requireMobileSession, revokeMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { AUTH_EVENT_TYPES, logAuthEvent } from "@/lib/authEvents";
import { getRequestMetaFromRequest } from "@/lib/requestMeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await requireMobileSession(request);
    await revokeMobileSession(session.sessionId);
    const meta = getRequestMetaFromRequest(request);
    await logAuthEvent({
      eventType: AUTH_EVENT_TYPES.MOBILE_SESSION_REVOKED,
      userId: session.user.id,
      email: session.user.email,
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
