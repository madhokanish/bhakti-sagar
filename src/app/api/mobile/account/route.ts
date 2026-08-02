import { NextResponse } from "next/server";
import { deleteMobileAccount, requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { AUTH_EVENT_TYPES, logAuthEvent } from "@/lib/authEvents";
import { getRequestMetaFromRequest } from "@/lib/requestMeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const session = await requireMobileSession(request);
    const meta = getRequestMetaFromRequest(request);
    await deleteMobileAccount(session.user.id);
    await logAuthEvent({
      eventType: AUTH_EVENT_TYPES.ACCOUNT_DELETED,
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
