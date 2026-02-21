import "server-only";

import { headers as nextHeaders } from "next/headers";

export type RequestMeta = {
  ip: string | null;
  userAgent: string | null;
};

export function getClientIpFromHeaders(headersLike: Headers): string | null {
  const forwarded = headersLike.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded
      .split(",")
      .map((segment) => segment.trim())
      .find(Boolean);

    if (first) return first;
  }

  const realIp = headersLike.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const vercelIp = headersLike.get("x-vercel-forwarded-for")?.trim();
  if (vercelIp) return vercelIp;

  return null;
}

export function getRequestMetaFromRequest(request?: Request | null): RequestMeta {
  if (!request) {
    return {
      ip: null,
      userAgent: null
    };
  }

  return {
    ip: getClientIpFromHeaders(request.headers),
    userAgent: request.headers.get("user-agent")?.trim() || null
  };
}

export function getRequestMetaFromCurrentHeaders(): RequestMeta {
  try {
    const headerStore = nextHeaders();
    const headerMap = new Headers();

    for (const [key, value] of headerStore.entries()) {
      headerMap.set(key, value);
    }

    return {
      ip: getClientIpFromHeaders(headerMap),
      userAgent: headerMap.get("user-agent")?.trim() || null
    };
  } catch {
    return {
      ip: null,
      userAgent: null
    };
  }
}
