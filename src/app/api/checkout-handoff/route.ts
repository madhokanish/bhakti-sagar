import { NextRequest, NextResponse } from "next/server";
import { consumeHandoffToken } from "@/lib/webCheckoutHandoff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = isProduction ? "__Secure-authjs.session-token" : "authjs.session-token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const origin = request.nextUrl.origin;
  // Carried through the redirect so checkout opens in the language the app was showing.
  const lang = request.nextUrl.searchParams.get("lang") === "hi" ? "hi" : "en";

  if (!token) {
    return NextResponse.redirect(new URL("/subscribe?handoff=invalid", origin));
  }

  const consumed = await consumeHandoffToken(token);
  if (!consumed) {
    // Expired, already used, or never existed. The app can mint another.
    return NextResponse.redirect(new URL("/subscribe?handoff=expired", origin));
  }

  // Land on the checkout page already signed in. Redirect rather than render so the
  // single-use token leaves the address bar immediately.
  const response = NextResponse.redirect(new URL(`/subscribe/upi-test?lang=${lang}`, origin));
  response.cookies.set(SESSION_COOKIE_NAME, consumed.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction,
    expires: consumed.expires
  });
  return response;
}
