import "server-only";

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Hands an already-authenticated mobile-app user off to a Custom Tab as a real
 * signed-in web session.
 *
 * The app opens checkout in Chrome, which has its own cookie jar in a separate
 * process -- the app cannot set a session cookie there. So the app mints a token
 * here, puts it in the URL, and /api/checkout-handoff exchanges it for the same
 * session cookie Google OAuth would set.
 *
 * The token is the bearer of a full login, so it is deliberately weak-by-design
 * in only one direction: it is single-use and expires in five minutes. Both are
 * enforced in [consumeHandoffToken], and the token is stored hashed so a database
 * leak does not hand out sessions.
 */

const HANDOFF_TTL_MS = 5 * 60 * 1000;
const WEB_SESSION_TTL_MS = 60 * 60 * 1000;

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("base64url");
}

export async function createHandoffToken(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + HANDOFF_TTL_MS);

  await prisma.webCheckoutHandoff.create({
    data: { token: sha256(token), userId, expiresAt }
  });

  return { token, expiresAt };
}

export type ConsumedHandoff = {
  sessionToken: string;
  expires: Date;
};

/**
 * Validates and burns a handoff token, returning a fresh web session for its user.
 * Returns null for anything not usable -- unknown, expired, or already used -- so
 * callers cannot distinguish those cases and probe for valid tokens.
 */
export async function consumeHandoffToken(token: string): Promise<ConsumedHandoff | null> {
  const handoff = await prisma.webCheckoutHandoff.findUnique({
    where: { token: sha256(token) }
  });

  if (!handoff) return null;
  if (handoff.usedAt) return null;
  if (handoff.expiresAt.getTime() < Date.now()) return null;

  // Burn first, then mint. updateMany with usedAt:null makes this a compare-and-set:
  // two concurrent requests race here and exactly one sees count === 1, so a token
  // cannot yield two sessions.
  const burned = await prisma.webCheckoutHandoff.updateMany({
    where: { id: handoff.id, usedAt: null },
    data: { usedAt: new Date() }
  });
  if (burned.count !== 1) return null;

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + WEB_SESSION_TTL_MS);
  await prisma.session.create({
    data: { sessionToken, userId: handoff.userId, expires }
  });

  return { sessionToken, expires };
}
