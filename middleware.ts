import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LEGACY_HOSTS = new Set(["bhakti-sagar.com", "www.bhakti-sagar.com"]);
const WWW_HOSTS = new Set(["www.bhaktichat.com", "www.bhakti-sagar.com"]);
const CANONICAL_HOST = "bhaktichat.com";

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

function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "en" || segments[0] === "hi") {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname;
}

function withRequestLanguage(request: NextRequest, lang: "en" | "hi") {
  const headers = new Headers(request.headers);
  headers.set("x-lang", lang);
  headers.set("x-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set("NEXT_LOCALE", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax"
  });
  return response;
}

export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.toLowerCase();
  const isCanonicalFamilyHost =
    host === CANONICAL_HOST || WWW_HOSTS.has(host) || LEGACY_HOSTS.has(host);

  if (isCanonicalFamilyHost && forwardedProto && forwardedProto !== "https") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https:";
    redirectUrl.host = WWW_HOSTS.has(host) || LEGACY_HOSTS.has(host) ? CANONICAL_HOST : host;
    return NextResponse.redirect(redirectUrl, { status: 308 });
  }

  if (WWW_HOSTS.has(host)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https:";
    redirectUrl.host = CANONICAL_HOST;
    return NextResponse.redirect(redirectUrl, { status: 308 });
  }

  if (LEGACY_HOSTS.has(host)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https:";
    redirectUrl.host = CANONICAL_HOST;
    return NextResponse.redirect(redirectUrl, { status: 308 });
  }

  const { pathname } = request.nextUrl;

  const localizedToolsMatch = pathname.match(/^\/(en|hi)\/(aartis|choghadiya)(?:\/.*)?$/);
  if (localizedToolsMatch) {
    const lang = localizedToolsMatch[1] === "hi" ? "hi" : "en";
    return withRequestLanguage(request, lang);
  }

  if (pathname === "/chat") {
    return withRequestLanguage(request, "en");
  }

  if (pathname === "/hi") {
    return withRequestLanguage(request, "hi");
  }

  if (pathname === "/en/chat" || pathname === "/hi/chat") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/chat";
    const response = NextResponse.redirect(redirectUrl, 301);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return response;
  }

  if (pathname === "/bhaktigpt/chat" || pathname === "/en/bhaktigpt/chat" || pathname === "/hi/bhaktigpt/chat") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/chat";
    const response = NextResponse.redirect(redirectUrl, 301);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return response;
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(redirectUrl, 301);
  }

  if (pathname === "/") {
    return withRequestLanguage(request, "en");
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first === "en" || first === "hi") {
    const redirectUrl = request.nextUrl.clone();
    const rest = segments.slice(1).join("/");
    redirectUrl.pathname = rest ? `/${rest}` : "/";
    const response = NextResponse.redirect(redirectUrl, 308);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return response;
  }

  const normalizedPath = stripLocalePrefix(pathname).replace(/\/$/, "") || "/";

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
    redirectUrl.pathname = "/chat";
    if (normalizedPath === "/bhaktigpt/lakshmi") {
      redirectUrl.search = "?guide=lakshmi";
    } else if (normalizedPath === "/bhaktigpt/shani-dev") {
      redirectUrl.search = "?guide=shani";
    } else {
      redirectUrl.search = "?guide=krishna";
    }
    const response = NextResponse.redirect(redirectUrl, 301);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return response;
  }

  if ((normalizedPath === "/account" || normalizedPath === "/profile") && !hasAuthSessionCookie(request)) {
    const authUrl = request.nextUrl.clone();
    authUrl.pathname = "/";
    authUrl.searchParams.set("auth", "1");
    authUrl.searchParams.set("callbackUrl", "/profile");
    const response = NextResponse.redirect(authUrl, 302);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return response;
  }

  return withRequestLanguage(request, "en");
}

export const config = {
  matcher: ["/((?!_next|static|.*\\..*).*)"]
};
