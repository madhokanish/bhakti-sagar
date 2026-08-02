import "server-only";

import crypto from "node:crypto";
import type { Prisma, User } from "@prisma/client";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const SESSION_TOUCH_INTERVAL_MS = 15 * 60 * 1000;
const rateLimitBuckets = new Map<string, number[]>();

export class MobileAuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 401
  ) {
    super(message);
    this.name = "MobileAuthError";
  }
}

export type MobileUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  isReviewer: boolean;
};

export type AuthenticatedMobileSession = {
  sessionId: string;
  user: MobileUser;
  expiresAt: Date;
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("base64url");
}

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function enforceMobileAuthRateLimit(
  key: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const recent = (rateLimitBuckets.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    throw new MobileAuthError(
      "TOO_MANY_ATTEMPTS",
      "Too many sign-in attempts. Try again later.",
      429
    );
  }
  recent.push(now);
  rateLimitBuckets.set(key, recent);

  // Bound memory for long-lived Node processes. Serverless instances reset naturally.
  if (rateLimitBuckets.size > 5_000) {
    for (const [bucketKey, times] of rateLimitBuckets) {
      if (times.every((time) => now - time >= windowMs)) rateLimitBuckets.delete(bucketKey);
    }
  }
}

function googleClientId() {
  const value =
    process.env.ANDROID_GOOGLE_WEB_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim();
  if (!value) {
    throw new MobileAuthError(
      "AUTH_NOT_CONFIGURED",
      "Google sign-in is not configured.",
      503
    );
  }
  return value;
}

function toMobileUser(user: Pick<User, "id" | "email" | "name" | "image" | "isReviewer">): MobileUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    isReviewer: user.isReviewer
  };
}

async function issueMobileSession(user: User) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.mobileSession.create({
    data: {
      tokenHash: sha256(token),
      userId: user.id,
      expiresAt
    }
  });

  return {
    token,
    expiresAt,
    user: toMobileUser(user)
  };
}

async function ensureProfile(
  tx: Prisma.TransactionClient,
  userId: string,
  name: string | null
) {
  await tx.userProfile.upsert({
    where: { userId },
    update: name ? { displayName: name } : {},
    create: {
      userId,
      displayName: name
    }
  });
}

async function findOrCreateGoogleUser(input: {
  subject: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  hostedDomain: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: input.subject
        }
      },
      include: { user: true }
    });

    if (account) {
      const user = await tx.user.update({
        where: { id: account.userId },
        data: {
          name: account.user.name || input.name,
          image: account.user.image || input.image,
          emailVerified:
            account.user.emailVerified ?? (input.emailVerified ? new Date() : null)
        }
      });
      await ensureProfile(tx, user.id, user.name);
      return user;
    }

    if (!input.email || !input.emailVerified) {
      throw new MobileAuthError(
        "VERIFIED_EMAIL_REQUIRED",
        "A verified email address is required for BhaktiChat.",
        403
      );
    }

    const existingUser = await tx.user.findUnique({
      where: { email: input.email }
    });

    // Google is authoritative for Gmail and Workspace addresses. For a Google Account
    // created with a third-party address, never merge into an existing BhaktiChat account
    // based on email alone; that account must first be linked through an authenticated flow.
    const googleIsAuthoritative =
      input.email.endsWith("@gmail.com") || Boolean(input.hostedDomain);
    if (existingUser && !googleIsAuthoritative) {
      throw new MobileAuthError(
        "ACCOUNT_LINK_REQUIRED",
        "This email already belongs to a BhaktiChat account. Contact support to link Google safely.",
        409
      );
    }

    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: existingUser.name || input.name,
            image: existingUser.image || input.image,
            emailVerified: existingUser.emailVerified || new Date()
          }
        })
      : await tx.user.create({
          data: {
            email: input.email,
            name: input.name,
            image: input.image,
            emailVerified: new Date(),
            currency: "INR"
          }
        });

    await tx.account.create({
      data: {
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: input.subject
      }
    });
    await ensureProfile(tx, user.id, user.name);
    return user;
  });
}

export async function createMobileAuthChallenge() {
  await prisma.mobileAuthChallenge.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - CHALLENGE_TTL_MS) } }
  });
  const nonce = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  const challenge = await prisma.mobileAuthChallenge.create({
    data: {
      nonceHash: sha256(nonce),
      expiresAt
    }
  });

  return {
    challengeId: challenge.id,
    nonce,
    expiresAt
  };
}

export async function exchangeGoogleIdToken(input: {
  challengeId: string;
  idToken: string;
}) {
  if (!input.challengeId || !input.idToken) {
    throw new MobileAuthError("INVALID_REQUEST", "Missing sign-in response.", 400);
  }

  const challenge = await prisma.mobileAuthChallenge.findUnique({
    where: { id: input.challengeId }
  });
  if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date()) {
    throw new MobileAuthError(
      "CHALLENGE_EXPIRED",
      "This sign-in attempt expired. Please try again."
    );
  }

  let payload;
  try {
    const verified = await jwtVerify(input.idToken, GOOGLE_JWKS, {
      audience: googleClientId(),
      issuer: ["https://accounts.google.com", "accounts.google.com"]
    });
    payload = verified.payload;
  } catch {
    throw new MobileAuthError("INVALID_GOOGLE_TOKEN", "Google sign-in could not be verified.");
  }

  if (
    typeof payload.nonce !== "string" ||
    !secureEqual(sha256(payload.nonce), challenge.nonceHash)
  ) {
    throw new MobileAuthError("INVALID_NONCE", "This sign-in response is no longer valid.");
  }

  const consumed = await prisma.mobileAuthChallenge.updateMany({
    where: {
      id: challenge.id,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    data: { consumedAt: new Date() }
  });
  if (consumed.count !== 1) {
    throw new MobileAuthError("CHALLENGE_REUSED", "This sign-in response was already used.");
  }

  if (!payload.sub) {
    throw new MobileAuthError("INVALID_GOOGLE_TOKEN", "Google account identifier is missing.");
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
  const user = await findOrCreateGoogleUser({
    subject: payload.sub,
    email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name.trim() || null : null,
    image: typeof payload.picture === "string" ? payload.picture : null,
    hostedDomain: typeof payload.hd === "string" ? payload.hd : null
  });

  return issueMobileSession(user);
}

export async function exchangeReviewerCredentials(input: {
  username: string;
  accessKey: string;
}) {
  const expectedUsername = process.env.PLAY_REVIEW_USERNAME?.trim();
  const expectedAccessKey = process.env.PLAY_REVIEW_ACCESS_KEY?.trim();
  const reviewEmail = process.env.PLAY_REVIEW_EMAIL?.trim().toLowerCase();

  if (!expectedUsername || !expectedAccessKey || !reviewEmail) {
    throw new MobileAuthError(
      "REVIEW_ACCESS_NOT_CONFIGURED",
      "Google Play review access is not configured.",
      503
    );
  }
  if (
    !secureEqual(input.username.trim(), expectedUsername) ||
    !secureEqual(input.accessKey, expectedAccessKey)
  ) {
    throw new MobileAuthError("INVALID_REVIEW_CREDENTIALS", "Review credentials are invalid.");
  }

  const user = await prisma.user.upsert({
    where: { email: reviewEmail },
    update: {
      isReviewer: true,
      name: "Google Play Reviewer",
      subscriptionStatus: "active",
      currency: "INR"
    },
    create: {
      email: reviewEmail,
      emailVerified: new Date(),
      name: "Google Play Reviewer",
      isReviewer: true,
      subscriptionStatus: "active",
      currency: "INR",
      profile: {
        create: {
          displayName: "Google Play Reviewer",
          onboardingCompleted: true,
          subscriptionStatus: "active",
          subscriptionProvider: "play-review"
        }
      }
    }
  });

  return issueMobileSession(user);
}

export async function authenticateMobileHeaders(
  headers: Pick<Headers, "get">
): Promise<AuthenticatedMobileSession | null> {
  const authorization = headers.get("authorization")?.trim();
  if (!authorization?.toLowerCase().startsWith("bearer ")) return null;
  const token = authorization.slice(7).trim();
  if (!token) return null;

  const session = await prisma.mobileSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true }
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;

  if (Date.now() - session.lastUsedAt.getTime() >= SESSION_TOUCH_INTERVAL_MS) {
    void prisma.mobileSession
      .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
  }

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    user: toMobileUser(session.user)
  };
}

export async function requireMobileSession(request: Request) {
  const session = await authenticateMobileHeaders(request.headers);
  if (!session) {
    throw new MobileAuthError("AUTH_REQUIRED", "Please sign in again.");
  }
  return session;
}

export async function revokeMobileSession(sessionId: string) {
  await prisma.mobileSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function deleteMobileAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const activeStatuses = new Set(["active", "trialing", "past_due"]);
  if (!user.isReviewer && activeStatuses.has(user.subscriptionStatus.toLowerCase())) {
    throw new MobileAuthError(
      "SUBSCRIPTION_CANCELLATION_REQUIRED",
      "Cancel your active subscription before deleting your account.",
      409
    );
  }

  await prisma.$transaction(async (tx) => {
    // Security audit events can be retained without personal identifiers.
    await tx.authEvent.updateMany({
      where: { userId },
      data: {
        userId: null,
        email: null,
        ip: null,
        userAgent: null
      }
    });
    await tx.user.delete({ where: { id: userId } });
  });
}
