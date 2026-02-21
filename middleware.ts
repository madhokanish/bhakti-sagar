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
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(redirectUrl, 301);
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // Canonicalize the root to a locale-prefixed route.
  if (pathname === "/") {
    const preferred = request.cookies.get("NEXT_LOCALE")?.value;
    const locale = preferred && supportedLangs.includes(preferred) ? preferred : "en";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}`;
    return NextResponse.redirect(redirectUrl, 302);
  }

  // Enforce locale-prefixed routes for all other pages.
  if (!first || !supportedLangs.includes(first)) {
    const preferred = request.cookies.get("NEXT_LOCALE")?.value;
    const locale = preferred && supportedLangs.includes(preferred) ? preferred : "en";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
    return NextResponse.redirect(redirectUrl, 302);
  }
  const normalizedPathRaw =
    first && supportedLangs.includes(first)
      ? `/${segments.slice(1).join("/") || ""}`.replace(/\/$/, "") || "/"
      : pathname;
  const normalizedPath = normalizedPathRaw.replace(/\/$/, "") || "/";

  if (
    normalizedPath === "/live" ||
    normalizedPath.startsWith("/live/") ||
    normalizedPath === "/live-darshan" ||
    normalizedPath.startsWith("/live-darshan/") ||
    normalizedPath === "/online-puja" ||
    normalizedPath.startsWith("/online-puja/") ||
    normalizedPath === "/bhaktigpt" ||
    normalizedPath === "/bhaktigpt/krishna" ||
    normalizedPath === "/bhaktigpt/lakshmi" ||
    normalizedPath === "/bhaktigpt/shani-dev"
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl, 301);
  }

  if ((normalizedPath === "/account" || normalizedPath === "/profile") && !hasAuthSessionCookie(request)) {
    const authUrl = request.nextUrl.clone();
    authUrl.pathname = "/";
    authUrl.searchParams.set("auth", "1");
    authUrl.searchParams.set("callbackUrl", "/profile");
    return NextResponse.redirect(authUrl);
  }

  if (first && supportedLangs.includes(first)) {
    const headers = new Headers(request.headers);
    headers.set("x-lang", first);
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set("NEXT_LOCALE", first, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return response;
  }

  const headers = new Headers(request.headers);
  headers.set("x-lang", "en");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next|static|.*\\..*).*)"]
};
