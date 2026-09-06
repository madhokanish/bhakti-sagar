import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { authenticateMobileHeaders } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { hasSubscriptionEntitlement } from "@/lib/subscription";
import { headers as nextHeaders } from "next/headers";

export const BHAKTIGPT_COOKIE = "bs_bhaktigpt_session";
// Native apps have no durable cookie jar — the Android client's is in-memory — so they send
// a stable per-install id instead. Without it every cold start would look like a brand-new
// anonymous visitor and the guide would have forgotten the conversation.
const ANON_ID_HEADER = "x-bhakti-anon-id";
// A v4 UUID as the client generates it. Narrow on purpose: this value becomes a database
// key, and the only thing it unlocks is that install's own chat history.
const ANON_ID_PATTERN = /^[0-9a-fA-F-]{36}$/;
const ANON_LIMIT = 3;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
// Chat is unlimited for everyone now (ad-supported model) — flip true to bring back
// a lifetime cap of ANON_LIMIT messages for non-logged-in users.
const ENFORCE_ANON_LIMIT = false;

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

function readDeviceAnonId(): string | null {
  try {
    const value = nextHeaders().get(ANON_ID_HEADER)?.trim();
    return value && ANON_ID_PATTERN.test(value) ? value : null;
  } catch {
    return null;
  }
}

export async function resolveBhaktiIdentity(): Promise<BhaktiIdentity> {
  let sessionUserId: string | null = null;
  try {
    const headerStore = nextHeaders();
    const mobileSession = await authenticateMobileHeaders(headerStore);
    if (mobileSession) {
      sessionUserId = mobileSession.user.id;
    } else {
      const session = await auth();
      sessionUserId = session?.user?.id ?? null;
    }
  } catch (error) {
    // Keep Bhakti Chat available in anonymous mode even if auth/session tables are unavailable.
    console.error("[Bhakti Chat] Auth unavailable, falling back to anonymous mode.", error);
  }

  const cookieStore = cookies();
  const parsed = decodeCookiePayload(cookieStore.get(BHAKTIGPT_COOKIE)?.value);

  // Only consulted when there is no signed cookie, so the web path is untouched. It is not
  // signed, which is fine for what it is: guessing another install's UUID is the only way to
  // reach their history, and nothing here grants entitlement — that still requires a real
  // session (see requireMobileSession on the subscription routes).
  const sessionId = parsed?.sessionId ?? readDeviceAnonId() ?? crypto.randomUUID();
  const needsCookieSet = !parsed;

  const payload: ParsedAnonCookie = {
    sessionId,
    exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS
  };

  return {
    isAuthenticated: Boolean(sessionUserId),
    userId: sessionUserId,
    anonSessionId: sessionId,
    needsCookieSet,
    cookieValue: needsCookieSet ? encodeCookiePayload(payload) : null
  };
}

export const CLIENT_HEADER = "x-bhakti-client";

/**
 * True when the caller is a client whose paid features are enforced here rather than only in
 * its own UI. Android only, for now, and deliberately opt-in by header.
 *
 * iOS is excluded because it has no purchase path at all — StoreKit was pulled before
 * release, so `isPro` is permanently false there and the server has no way to recognise a
 * paying iOS user. Enforcing against it would delete the feature on iOS and earn nothing.
 * When iOS gets a purchase path and authenticates, it sends this header too and the
 * exclusion disappears on its own.
 *
 * Being header-driven, this is bypassable by simply omitting the header — which is why the
 * per-IP burst limit on the image route is not conditional. Treat this as enforcing the
 * product rule against the shipped app, not as an anti-abuse boundary.
 */
export function isSubscriptionEnforcedClient(headersLike: Headers): boolean {
  return headersLike.get(CLIENT_HEADER)?.trim().toLowerCase() === "android";
}

export type SubscriptionGate =
  | { ok: true; userId: string }
  | { ok: false; reason: "auth_required" | "subscription_required" };

/**
 * Server-side entitlement check for the features चढ़ावा actually pays for — image generation
 * and voice. Chat deliberately does not use this: it is free for everyone, signed in or not.
 *
 * This exists because the client gates were the only thing standing in front of endpoints
 * that cost real money per call, and the app no longer requires anyone to sign in to reach
 * them. A client gate is a UX affordance; this is the enforcement.
 *
 * Entitlement is read from the same field the subscription summary uses, so what the server
 * allows and what the app shows can never disagree.
 */
export async function requireSubscribedUser(): Promise<SubscriptionGate> {
  const identity = await resolveBhaktiIdentity();
  if (!identity.isAuthenticated || !identity.userId) {
    return { ok: false, reason: "auth_required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: identity.userId },
      select: { subscriptionStatus: true }
    });
    if (!user || !hasSubscriptionEntitlement(user.subscriptionStatus)) {
      return { ok: false, reason: "subscription_required" };
    }
    return { ok: true, userId: identity.userId };
  } catch (error) {
    // Fail CLOSED, unlike the voice minute cap above. That cap protects against overspend by
    // people who are entitled; this decides whether someone is entitled at all, and a
    // database blip must not hand out paid generations to everyone who asks.
    console.error("[entitlement] lookup failed, denying", error);
    return { ok: false, reason: "subscription_required" };
  }
}

export function getAnonLimitInfo(messageCount: number) {
  if (!ENFORCE_ANON_LIMIT) {
    return {
      remaining: 999,
      max: 999,
      used: 0
    };
  }

  return {
    remaining: Math.max(ANON_LIMIT - messageCount, 0),
    max: ANON_LIMIT,
    used: messageCount
  };
}

const globalUsageFallback = globalThis as unknown as {
  bhaktiUsageFallbackMap?: Map<string, number>;
};

function getUsageFallbackMap() {
  if (!globalUsageFallback.bhaktiUsageFallbackMap) {
    globalUsageFallback.bhaktiUsageFallbackMap = new Map<string, number>();
  }
  return globalUsageFallback.bhaktiUsageFallbackMap;
}

function getUsageFallbackKey(identity: BhaktiIdentity) {
  if (identity.userId) return `user:${identity.userId}`;
  if (identity.anonSessionId) return `session:${identity.anonSessionId}`;
  return null;
}

function getFallbackCount(identity: BhaktiIdentity) {
  const key = getUsageFallbackKey(identity);
  if (!key) return 0;
  return getUsageFallbackMap().get(key) ?? 0;
}

export async function getUsageForIdentity(identity: BhaktiIdentity) {
  if (identity.isAuthenticated && identity.userId) {
    try {
      const usage = await prisma.bhaktiGptUsage.findUnique({
        where: { userId: identity.userId }
      });

      return {
        messageCount: usage?.messageCount ?? 0,
        limitReached: false,
        ...getAnonLimitInfo(0)
      };
    } catch (error) {
      console.error("[Bhakti Chat] Usage lookup failed for authenticated user.", error);
      return {
        messageCount: getFallbackCount(identity),
        limitReached: false,
        ...getAnonLimitInfo(0)
      };
    }
  }

  if (!identity.anonSessionId) {
    return {
      messageCount: 0,
      limitReached: false,
      ...getAnonLimitInfo(0)
    };
  }

  let count = 0;
  try {
    const usage = await prisma.bhaktiGptUsage.findUnique({
      where: { sessionId: identity.anonSessionId }
    });

    count = usage?.messageCount ?? 0;
  } catch (error) {
    console.error("[Bhakti Chat] Usage lookup failed for anonymous session.", error);
    count = getFallbackCount(identity);
  }

  return {
    messageCount: count,
    limitReached: ENFORCE_ANON_LIMIT ? count >= ANON_LIMIT : false,
    ...getAnonLimitInfo(count)
  };
}

export async function incrementAnonymousUsage(sessionId: string) {
  if (!ENFORCE_ANON_LIMIT) {
    return 0;
  }

  try {
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
  } catch (error) {
    console.error("[Bhakti Chat] Usage increment failed for anonymous session.", error);
    const fallbackKey = `session:${sessionId}`;
    const map = getUsageFallbackMap();
    const next = (map.get(fallbackKey) ?? 0) + 1;
    map.set(fallbackKey, next);
    return next;
  }
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

// Voice sessions (OpenAI Realtime API) cost materially more per minute than text chat's
// LLM-completion-only cost, so they get their own cap independent of the message-count
// limiter above.
//
// Persisted in Postgres rather than in memory. The previous Map lived on globalThis, which on
// Vercel means one copy per lambda instance, discarded on cold start — a user routed to a
// fresh instance started the day over. Realtime audio is the most expensive model in the
// stack, so this counter is the only thing bounding a runaway session and it has to be shared.

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC day boundary
}

/** The realtime model in use. Shared so the session route and usage recording agree. */
export function resolveRealtimeModel(): string {
  return process.env.OPENAI_REALTIME_MODEL?.trim() || "gpt-realtime";
}

/**
 * Records one completed voice turn. Best-effort: reporting must never fail a turn.
 *
 * Duration is all the server can observe — the client holds the realtime connection directly,
 * so token counts never reach us.
 */
export async function recordVoiceTurnUsage(input: {
  rateKey: string;
  userId?: string | null;
  guideId: string;
  conversationId?: string | null;
  durationSeconds: number;
}): Promise<void> {
  if (!(input.durationSeconds > 0)) return;
  try {
    await prisma.voiceTurnUsage.create({
      data: {
        rateKey: input.rateKey,
        userId: input.userId ?? null,
        guideId: input.guideId,
        conversationId: input.conversationId ?? null,
        model: resolveRealtimeModel(),
        durationSeconds: input.durationSeconds
      }
    });
  } catch (error) {
    console.error("[voiceUsage] failed to record turn", error);
  }
}

/** Resolved daily cap in minutes, or null when capping is disabled. */
function voiceDailyCapMinutes(): number | null {
  const capRaw = process.env.VOICE_DAILY_MINUTES_CAP?.trim();
  const cap = capRaw ? Number(capRaw) : 20;
  if (!Number.isFinite(cap) || cap <= 0) return null;
  return cap;
}

/** True if `key` has already used up its daily voice-minutes cap (env `VOICE_DAILY_MINUTES_CAP`). */
export async function isVoiceDailyCapReached(key: string): Promise<boolean> {
  const cap = voiceDailyCapMinutes();
  if (cap === null) return false;

  try {
    const row = await prisma.voiceUsageDaily.findUnique({
      where: { rateKey_day: { rateKey: key, day: todayKey() } },
      select: { minutesUsed: true }
    });
    return (row?.minutesUsed ?? 0) >= cap;
  } catch (error) {
    // Fail open. A database blip must not lock every user out of voice; the spend risk of a
    // few uncapped minutes is smaller than the product risk of a dead feature.
    console.error("[voiceCap] read failed, allowing session", error);
    return false;
  }
}

/**
 * Adds `minutes` to `key`'s usage for today. Atomic increment, so two concurrent turn-complete
 * calls cannot clobber each other the way a read-modify-write would.
 */
export async function recordVoiceMinutesUsed(key: string, minutes: number): Promise<void> {
  const safeMinutes = Math.max(0, minutes);
  if (safeMinutes === 0) return;
  const day = todayKey();

  try {
    await prisma.voiceUsageDaily.upsert({
      where: { rateKey_day: { rateKey: key, day } },
      create: { rateKey: key, day, minutesUsed: safeMinutes },
      update: { minutesUsed: { increment: safeMinutes } }
    });
  } catch (error) {
    console.error("[voiceCap] write failed, minutes not counted", error);
  }
}

const CRISIS_PATTERNS = [
  /\b(kill myself|suicide|end my life|want to die|self harm|hurt myself)\b/i,
  /\b(kill someone|hurt someone|violence)\b/i,
  /\b(abuse|assault|unsafe at home)\b/i
];

export function detectCrisisIntent(input: string) {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(input));
}

// Crisis response is a fixed, safety-critical template (never model-generated). Every version
// MUST keep all four safety elements: (1) acknowledge the pain, (2) an explicit refusal to help
// cause harm to the user or anyone else, (3) urge immediate emergency services + a trusted person,
// (4) a grounding breath. Only the tone/language is warmed up here — no framework labels, and it
// now matches the user's language so the message actually lands.
export function crisisSupportResponse(locale?: string | null) {
  const lang = (locale ?? "").toLowerCase();

  if (lang === "hi") {
    return [
      "एक पल रुको, मैं तुम्हारे साथ हूँ। अभी जो तुम महसूस कर रहे हो वो बहुत भारी है, और तुम्हारी सुरक्षा सबसे ज़रूरी है।",
      "मैं इस दर्द को समझता हूँ, पर मैं किसी को भी — तुम्हें या किसी और को — नुकसान पहुँचाने में मदद नहीं कर सकता। मैं चाहता हूँ कि तुम अभी किसी इंसान तक पहुँचो जो सच में मदद कर सके।",
      "अगर तुम ख़तरे में हो तो अभी अपने local emergency number पर कॉल करो, या किसी भरोसे वाले इंसान को तुरंत बुलाओ और उनके साथ रहो।",
      "और अभी, मेरे साथ एक काम करो: एक हाथ अपने सीने पर रखो और धीरे-धीरे दस साँस लो। तुम अकेले नहीं हो।"
    ].join("\n\n");
  }

  if (lang === "en") {
    return [
      "Stay with me for a moment. What you're feeling right now is really heavy, and your safety matters most.",
      "I understand the pain, but I can't help with anything that would hurt you or someone else. I truly want you to reach a real person who can help, right now.",
      "If you're in immediate danger, please call your local emergency number now, or reach out to someone you trust and stay with them.",
      "And right now, do this with me: place one hand on your chest and take ten slow breaths. You are not alone."
    ].join("\n\n");
  }

  // Hinglish — the app's primary language, and the default.
  return [
    "Ek pal ruko, main tumhare saath hoon. Abhi jo tum mehsoos kar rahe ho wo bahut bhaari hai, aur tumhari safety sabse zaroori hai.",
    "Main is dard ko samajhta hoon, par main kisi ko bhi — tumhe ya kisi aur ko — nuksan pahunchane mein madad nahi kar sakta. Main chahta hoon ki tum abhi kisi insaan tak pahuncho jo sach mein madad kar sake.",
    "Agar tum khatre mein ho toh abhi apne local emergency number par call karo, ya kisi bharose wale insaan ko turant bulao aur unke saath raho.",
    "Aur abhi, mere saath ek kaam karo: ek haath apne seene par rakho aur dheere dheere das saans lo. Tum akele nahi ho."
  ].join("\n\n");
}
