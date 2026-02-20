import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supportedLangs = ["en", "hi"];
const AUTH_SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token"
];

function hasAuthSessionCookie(request: NextRequest) {
  return AUTH_SESSION_COOKIE_NAMES.some((name) => {
    const value = request.cookies.get(name)?.value;
    return Boolean(value);
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const normalizedPath =
    first && supportedLangs.includes(first)
      ? `/${segments.slice(1).join("/") || ""}`.replace(/\/$/, "") || "/"
      : pathname;

  if (normalizedPath === "/account" && !hasAuthSessionCookie(request)) {
    const signinUrl = request.nextUrl.clone();
    signinUrl.pathname = "/signin";
    signinUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(signinUrl);
  }

  if (first && supportedLangs.includes(first)) {
    const rewrittenPath = `/${segments.slice(1).join("/")}`;
    const url = request.nextUrl.clone();
    url.pathname = rewrittenPath === "/" ? "/" : rewrittenPath;
    const headers = new Headers(request.headers);
    headers.set("x-lang", first);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const headers = new Headers(request.headers);
  headers.set("x-lang", "en");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next|static|.*\\..*).*)"]
};
