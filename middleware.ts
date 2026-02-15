import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supportedLangs = ["en", "hi"];
const SESSION_COOKIE = "bs_subscription_session";

type SessionPayload = {
  entitled?: boolean;
  exp?: number;
};

function parseSessionEntitlement(cookieValue: string | undefined) {
  if (!cookieValue) return false;
  const [payloadBase64] = cookieValue.split(".");
  if (!payloadBase64) return false;
  try {
    const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as SessionPayload;
    if (!payload.entitled) return false;
    if (!payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function isPremiumApi(pathname: string, request: NextRequest) {
  if (pathname === "/api/online-puja/checkout") return true;
  if (pathname === "/api/darshan-player") {
    return request.nextUrl.searchParams.get("preview") !== "1";
  }
  return false;
}

function isPremiumPage(pathname: string) {
  if (/^\/online-puja\/[^/]+\/checkout$/.test(pathname)) return true;
  if (pathname.startsWith("/online-puja/confirmation/")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const normalizedPath =
    first && supportedLangs.includes(first)
      ? `/${segments.slice(1).join("/") || ""}`.replace(/\/$/, "") || "/"
      : pathname;

  const isEntitled = parseSessionEntitlement(request.cookies.get(SESSION_COOKIE)?.value);
  if (!isEntitled && (isPremiumApi(normalizedPath, request) || isPremiumPage(normalizedPath))) {
    if (normalizedPath.startsWith("/api/")) {
      return NextResponse.json({ error: "Subscription required." }, { status: 402 });
    }
    const subscribeUrl = request.nextUrl.clone();
    subscribeUrl.pathname = "/subscribe";
    subscribeUrl.searchParams.set("returnTo", normalizedPath);
    return NextResponse.redirect(subscribeUrl);
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
