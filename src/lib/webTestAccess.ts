import "server-only";

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export class WebTestAccessError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 401
  ) {
    super(message);
    this.name = "WebTestAccessError";
  }
}

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

const rateLimitBuckets = new Map<string, number[]>();

function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (rateLimitBuckets.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    throw new WebTestAccessError("TOO_MANY_ATTEMPTS", "Too many sign-in attempts. Try again later.", 429);
  }
  recent.push(now);
  rateLimitBuckets.set(key, recent);
  if (rateLimitBuckets.size > 1_000) {
    for (const [bucketKey, times] of rateLimitBuckets) {
      if (times.every((time) => now - time >= windowMs)) rateLimitBuckets.delete(bucketKey);
    }
  }
}

type WebTestAccount = {
  login: string;
  password: string;
  email: string;
  name?: string;
};

/**
 * Non-production sign-in for testing pages that sit behind auth() without a Google
 * account on hand — e.g. verifying /subscribe/upi-test from an automated browser.
 * Deliberately separate from MOBILE_ACCESS_ACCOUNTS_JSON: that one can grant
 * fullAccess/reviewer status for App Store review, this one never does. The account
 * it creates always starts subscriptionStatus "inactive" so paywalled pages render
 * their real, unpaid state instead of skipping it.
 */
function configuredWebTestAccounts(): WebTestAccount[] {
  const configured = process.env.WEB_TEST_ACCESS_ACCOUNTS_JSON?.trim();
  if (!configured) return [];
  try {
    const parsed = JSON.parse(configured) as WebTestAccount[];
    if (!Array.isArray(parsed)) throw new Error("Expected an array");
    for (const account of parsed) {
      if (!account?.login || !account.password || !account.email) {
        throw new Error("Each test account needs login, password, and email");
      }
    }
    return parsed;
  } catch (error) {
    console.error("[Web test access] WEB_TEST_ACCESS_ACCOUNTS_JSON is invalid", error);
    return [];
  }
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export async function exchangeWebTestCredentials(input: {
  login: string;
  password: string;
  rateLimitKey: string;
}) {
  enforceRateLimit(input.rateLimitKey, 5, 10 * 60 * 1000);

  const accounts = configuredWebTestAccounts();
  if (accounts.length === 0) {
    throw new WebTestAccessError("ACCESS_NOT_CONFIGURED", "Username sign-in is not configured.", 503);
  }

  const login = input.login.trim().toLowerCase();
  const account = accounts.find((candidate) => candidate.login.trim().toLowerCase() === login);
  if (!account || !secureEqual(input.password, account.password)) {
    throw new WebTestAccessError("INVALID_CREDENTIALS", "Username or password is incorrect.");
  }

  const user = await prisma.user.upsert({
    where: { email: account.email.trim().toLowerCase() },
    update: {},
    create: {
      email: account.email.trim().toLowerCase(),
      emailVerified: new Date(),
      name: account.name?.trim() || login,
      subscriptionStatus: "inactive",
      currency: "INR",
      profile: {
        create: {
          displayName: account.name?.trim() || login,
          onboardingCompleted: true,
          subscriptionStatus: "inactive",
          subscriptionProvider: "web-test-account"
        }
      }
    }
  });

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires }
  });

  return { sessionToken, expires };
}
