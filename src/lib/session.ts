import "server-only";

import crypto from "node:crypto";
import type { NextResponse } from "next/server";

export const SUBSCRIPTION_SESSION_COOKIE = "bs_subscription_session";

export type SubscriptionSessionPayload = {
  userId: string;
  email: string;
  status: string;
  entitled: boolean;
  iat: number;
  exp: number;
};

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim();

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSignedSessionToken(payload: SubscriptionSessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySignedSessionToken(token: string | undefined | null) {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  if (expected.length !== signature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as SubscriptionSessionPayload;
    if (!parsed?.userId || !parsed?.email || !parsed?.exp) return null;
    if (Date.now() > parsed.exp * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildSessionPayload({
  userId,
  email,
  status,
  entitled
}: {
  userId: string;
  email: string;
  status: string;
  entitled: boolean;
}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    userId,
    email,
    status,
    entitled,
    iat: now,
    exp: now + THIRTY_DAYS_SECONDS
  } satisfies SubscriptionSessionPayload;
}

export function setSubscriptionSessionCookie(
  response: NextResponse,
  payload: SubscriptionSessionPayload
) {
  response.cookies.set(SUBSCRIPTION_SESSION_COOKIE, createSignedSessionToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS
  });
}

export function clearSubscriptionSessionCookie(response: NextResponse) {
  response.cookies.set(SUBSCRIPTION_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}
