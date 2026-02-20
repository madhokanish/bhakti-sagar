import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const BHAKTIGPT_COOKIE = "bs_bhaktigpt_session";
const ANON_LIMIT = 3;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

type ParsedAnonCookie = {
  sessionId: string;
  exp: number;
};

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new Error("SESSION_SECRET or NEXTAUTH_SECRET must be configured.");
  }

  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeCookiePayload(payload: ParsedAnonCookie) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function decodeCookiePayload(raw: string | undefined | null): ParsedAnonCookie | null {
  if (!raw) return null;
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  if (expected.length !== signature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ParsedAnonCookie;
    if (!parsed.sessionId || !parsed.exp) return null;
    if (Date.now() > parsed.exp * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type BhaktiIdentity = {
  isAuthenticated: boolean;
  userId: string | null;
  anonSessionId: string | null;
  needsCookieSet: boolean;
  cookieValue: string | null;
};

export async function resolveBhaktiIdentity(): Promise<BhaktiIdentity> {
  const session = await auth();
  const cookieStore = cookies();
  const parsed = decodeCookiePayload(cookieStore.get(BHAKTIGPT_COOKIE)?.value);

  const sessionId = parsed?.sessionId ?? crypto.randomUUID();
  const needsCookieSet = !parsed;

  const payload: ParsedAnonCookie = {
    sessionId,
    exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS
  };

  return {
    isAuthenticated: Boolean(session?.user?.id),
    userId: session?.user?.id ?? null,
    anonSessionId: sessionId,
    needsCookieSet,
    cookieValue: needsCookieSet ? encodeCookiePayload(payload) : null
  };
}

export function getAnonLimitInfo(messageCount: number) {
  return {
    remaining: Math.max(ANON_LIMIT - messageCount, 0),
    max: ANON_LIMIT,
    used: messageCount
  };
}

export async function getUsageForIdentity(identity: BhaktiIdentity) {
  if (identity.isAuthenticated && identity.userId) {
    const usage = await prisma.bhaktiGptUsage.findUnique({
      where: { userId: identity.userId }
    });

    return {
      messageCount: usage?.messageCount ?? 0,
      limitReached: false,
      ...getAnonLimitInfo(0)
    };
  }

  if (!identity.anonSessionId) {
    return {
      messageCount: 0,
      limitReached: false,
      ...getAnonLimitInfo(0)
    };
  }

  const usage = await prisma.bhaktiGptUsage.findUnique({
    where: { sessionId: identity.anonSessionId }
  });

  const count = usage?.messageCount ?? 0;
  return {
    messageCount: count,
    limitReached: count >= ANON_LIMIT,
    ...getAnonLimitInfo(count)
  };
}

export async function incrementAnonymousUsage(sessionId: string) {
  const usage = await prisma.bhaktiGptUsage.upsert({
    where: { sessionId },
    update: {
      messageCount: { increment: 1 }
    },
    create: {
      sessionId,
      messageCount: 1
    },
    select: {
      messageCount: true
    }
  });

  return usage.messageCount;
}

const globalRateLimit = globalThis as unknown as {
  bhaktiRateMap?: Map<string, number[]>;
};

function getRateMap() {
  if (!globalRateLimit.bhaktiRateMap) {
    globalRateLimit.bhaktiRateMap = new Map<string, number[]>();
  }
  return globalRateLimit.bhaktiRateMap;
}

export function isRateLimited(key: string, limit = 20, windowMs = 60_000) {
  const map = getRateMap();
  const now = Date.now();
  const prev = map.get(key) ?? [];
  const next = prev.filter((t) => now - t < windowMs);

  if (next.length >= limit) {
    map.set(key, next);
    return true;
  }

  next.push(now);
  map.set(key, next);
  return false;
}

const CRISIS_PATTERNS = [
  /\b(kill myself|suicide|end my life|want to die|self harm|hurt myself)\b/i,
  /\b(kill someone|hurt someone|violence)\b/i,
  /\b(abuse|assault|unsafe at home)\b/i
];

export function detectCrisisIntent(input: string) {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(input));
}

export function crisisSupportResponse() {
  return [
    "Reflection: I hear that this feels urgent and heavy right now, and I want your immediate safety to come first.",
    "Principle: I cannot support harm, and I want you to reach real human support immediately.",
    "Action: If you are in immediate danger, call local emergency services now. If you can, contact a trusted person and stay with them while you seek help.",
    "Mantra/Practice: Place one hand on your chest, breathe slowly for 10 breaths, and repeat: 'I choose safety right now.'"
  ].join("\n");
}
