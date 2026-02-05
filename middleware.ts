import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supportedLangs = ["en", "hi"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

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
