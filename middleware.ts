import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

function withEnPrefix(pathname: string) {
  if (pathname === "/") return "/en";
  return `/en${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "en" || segments[0] === "hi") {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname;
}

function withEnglishHeaders(request: NextRequest, response: NextResponse) {
  const headers = new Headers(request.headers);
  headers.set("x-lang", "en");
  const nextResponse = NextResponse.next({ request: { headers } });

  for (const [key, value] of response.headers.entries()) {
    nextResponse.headers.set(key, value);
  }

  nextResponse.cookies.set("NEXT_LOCALE", "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax"
  });

  return nextResponse;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/chat") {
    return withEnglishHeaders(request, NextResponse.next());
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
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/en";
    const response = NextResponse.redirect(redirectUrl, 302);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return response;
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first === "hi") {
    const redirectUrl = request.nextUrl.clone();
    const rest = segments.slice(1).join("/");
    redirectUrl.pathname = rest ? `/en/${rest}` : "/en";
    const response = NextResponse.redirect(redirectUrl, 302);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return response;
  }

  if (first !== "en") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = withEnPrefix(pathname);
    const response = NextResponse.redirect(redirectUrl, 302);
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
    authUrl.pathname = "/en";
    authUrl.searchParams.set("auth", "1");
    authUrl.searchParams.set("callbackUrl", "/en/profile");
    const response = NextResponse.redirect(authUrl, 302);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return response;
  }

  return withEnglishHeaders(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next|static|.*\\..*).*)"]
};
