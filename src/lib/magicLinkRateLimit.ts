import "server-only";

import { createHash } from "node:crypto";

const EMAIL_MAX_PER_HOUR = 5;
const IP_MAX_PER_HOUR = 10;
const COOLDOWN_SECONDS = 30;
const WINDOW_MS = 60 * 60 * 1000;

const globalRateLimiter = globalThis as unknown as {
  magicLinkLimiter?: {
    hourlyHits: Map<string, number[]>;
    cooldowns: Map<string, number>;
    warnedAboutMemoryProd: boolean;
    warnedAboutUpstashError: boolean;
  };
};

function getMemoryStore() {
  if (!globalRateLimiter.magicLinkLimiter) {
    globalRateLimiter.magicLinkLimiter = {
      hourlyHits: new Map<string, number[]>(),
      cooldowns: new Map<string, number>(),
      warnedAboutMemoryProd: false,
      warnedAboutUpstashError: false
    };
  }

  return globalRateLimiter.magicLinkLimiter;
}

export type MagicLinkRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  reason: "ok" | "cooldown" | "email_hourly" | "ip_hourly";
  source: "upstash" | "memory";
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashValue(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}

function upstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  return {
    url,
    token
  };
}

async function upstashCommand(command: Array<string | number>) {
  const config = upstashConfig();
  if (!config) {
    throw new Error("Upstash is not configured.");
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command.map((part) => String(part))),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Upstash command failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as { result?: unknown; error?: string };
  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.result;
}

function getHourBucket(now: number) {
  return Math.floor(now / WINDOW_MS);
}

async function consumeWithUpstash(input: { email: string; ip: string | null }): Promise<MagicLinkRateLimitResult> {
  const now = Date.now();
  const bucket = getHourBucket(now);
  const emailHash = hashValue(normalizeEmail(input.email));
  const emailCountKey = `auth:magiclink:email:${emailHash}:${bucket}`;
  const cooldownKey = `auth:magiclink:cooldown:${emailHash}`;

  const cooldownResult = await upstashCommand(["SET", cooldownKey, "1", "EX", COOLDOWN_SECONDS, "NX"]);
  if (cooldownResult !== "OK") {
    return {
      allowed: false,
      retryAfterSeconds: COOLDOWN_SECONDS,
      reason: "cooldown",
      source: "upstash"
    };
  }

  const emailCountRaw = await upstashCommand(["INCR", emailCountKey]);
  await upstashCommand(["EXPIRE", emailCountKey, Math.ceil(WINDOW_MS / 1000) + 120]);
  const emailCount = Number(emailCountRaw ?? 0);

  if (emailCount > EMAIL_MAX_PER_HOUR) {
    return {
      allowed: false,
      retryAfterSeconds: COOLDOWN_SECONDS,
      reason: "email_hourly",
      source: "upstash"
    };
  }

  if (input.ip) {
    const ipHash = hashValue(input.ip);
    const ipCountKey = `auth:magiclink:ip:${ipHash}:${bucket}`;
    const ipCountRaw = await upstashCommand(["INCR", ipCountKey]);
    await upstashCommand(["EXPIRE", ipCountKey, Math.ceil(WINDOW_MS / 1000) + 120]);
    const ipCount = Number(ipCountRaw ?? 0);

    if (ipCount > IP_MAX_PER_HOUR) {
      return {
        allowed: false,
        retryAfterSeconds: COOLDOWN_SECONDS,
        reason: "ip_hourly",
        source: "upstash"
      };
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    reason: "ok",
    source: "upstash"
  };
}

function pruneHits(hits: number[], now: number) {
  return hits.filter((timestamp) => now - timestamp < WINDOW_MS);
}

function getRetryAfterFromHits(hits: number[], now: number) {
  if (hits.length === 0) return COOLDOWN_SECONDS;
  const oldestWithinWindow = Math.min(...hits);
  const msRemaining = WINDOW_MS - (now - oldestWithinWindow);
  return Math.max(1, Math.ceil(msRemaining / 1000));
}

function consumeWithMemory(input: { email: string; ip: string | null }): MagicLinkRateLimitResult {
  const store = getMemoryStore();
  const now = Date.now();

  if (process.env.NODE_ENV === "production" && !store.warnedAboutMemoryProd) {
    store.warnedAboutMemoryProd = true;
    console.warn(
      "[Auth] Using in-memory magic-link rate limiting in production. Configure Upstash Redis for durable rate limiting."
    );
  }

  const emailKey = `email:${hashValue(normalizeEmail(input.email))}`;
  const ipKey = input.ip ? `ip:${hashValue(input.ip)}` : null;

  const cooldownUntil = store.cooldowns.get(emailKey) ?? 0;
  if (cooldownUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((cooldownUntil - now) / 1000)),
      reason: "cooldown",
      source: "memory"
    };
  }

  const emailHits = pruneHits(store.hourlyHits.get(emailKey) ?? [], now);
  if (emailHits.length >= EMAIL_MAX_PER_HOUR) {
    store.hourlyHits.set(emailKey, emailHits);
    return {
      allowed: false,
      retryAfterSeconds: getRetryAfterFromHits(emailHits, now),
      reason: "email_hourly",
      source: "memory"
    };
  }

  let ipHits: number[] | null = null;
  if (ipKey) {
    ipHits = pruneHits(store.hourlyHits.get(ipKey) ?? [], now);
    if (ipHits.length >= IP_MAX_PER_HOUR) {
      store.hourlyHits.set(ipKey, ipHits);
      return {
        allowed: false,
        retryAfterSeconds: getRetryAfterFromHits(ipHits, now),
        reason: "ip_hourly",
        source: "memory"
      };
    }
  }

  emailHits.push(now);
  store.hourlyHits.set(emailKey, emailHits);

  if (ipKey && ipHits) {
    ipHits.push(now);
    store.hourlyHits.set(ipKey, ipHits);
  }

  store.cooldowns.set(emailKey, now + COOLDOWN_SECONDS * 1000);

  return {
    allowed: true,
    retryAfterSeconds: 0,
    reason: "ok",
    source: "memory"
  };
}

export async function consumeMagicLinkRateLimit(input: {
  email: string;
  ip: string | null;
}): Promise<MagicLinkRateLimitResult> {
  const store = getMemoryStore();

  if (upstashConfig()) {
    try {
      return await consumeWithUpstash(input);
    } catch (error) {
      if (!store.warnedAboutUpstashError) {
        store.warnedAboutUpstashError = true;
        console.error("[Auth] Upstash limiter failed, falling back to in-memory limiter.", error);
      }
    }
  }

  return consumeWithMemory(input);
}
