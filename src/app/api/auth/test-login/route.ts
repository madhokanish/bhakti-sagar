import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { exchangeWebTestCredentials, WebTestAccessError } from "@/lib/webTestAccess";
import { getRequestMetaFromRequest } from "@/lib/requestMeta";

const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = isProduction ? "__Secure-authjs.session-token" : "authjs.session-token";

export async function POST(request: NextRequest) {
  let body: { login?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const login = typeof body.login === "string" ? body.login : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!login || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const meta = getRequestMetaFromRequest(request);

  try {
    const { sessionToken, expires } = await exchangeWebTestCredentials({
      login,
      password,
      rateLimitKey: meta.ip || "unknown"
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isProduction,
      expires
    });
    return response;
  } catch (error) {
    if (error instanceof WebTestAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[test-login] Unexpected error", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
