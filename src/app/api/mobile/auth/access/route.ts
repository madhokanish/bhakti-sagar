import { NextResponse } from "next/server";
import { enforceMobileAuthRateLimit, exchangeAccessCredentials } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { AUTH_EVENT_TYPES, logAuthEvent } from "@/lib/authEvents";
import { getRequestMetaFromRequest } from "@/lib/requestMeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const meta = getRequestMetaFromRequest(request);
    enforceMobileAuthRateLimit(`${meta.ip || "unknown"}:access`, 8, 15 * 60 * 1000);
    const body = (await request.json()) as { login?: string; password?: string };
    const result = await exchangeAccessCredentials({
      login: body.login || "",
      password: body.password || ""
    });
    await logAuthEvent({
      eventType: AUTH_EVENT_TYPES.MOBILE_ACCESS_LOGIN_SUCCESS,
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
