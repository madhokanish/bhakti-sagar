import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Every membership status write in the app funnels through this module. The User row only
 * holds the *current* status, so a transition — most importantly pro -> not pro — leaves no
 * trace unless it is logged as it happens. `SubscriptionStatusChange` is that log.
 *
 * Writes go through `setUserSubscriptionStatus` (single user, known id) or
 * `setSubscriptionStatusWhere` (updateMany semantics, e.g. "whichever user owns this Razorpay
 * subscription id"). Both read the prior status first and only log when it actually changed,
 * so a webhook that redelivers the same state does not spam the log.
 */

/** Which code path made a change. Kept as a closed union so the admin view can rely on it. */
export type SubscriptionStatusSource =
  | "stripe-checkout"
  | "stripe-webhook"
  | "razorpay-create"
  | "razorpay-verify"
  | "razorpay-webhook"
  | "razorpay-cancel"
  | "razorpay-reconcile"
  | "upi-autopay-authorize"
  | "upi-autopay-charge"
  | "upi-autopay-cancel"
  | "upi-autopay-expire"
  | "mobile-auth";

/** Accepts either the base client or a transaction client, so callers inside `$transaction` work. */
type Client = typeof prisma | Prisma.TransactionClient;

/** Status recorded as the "from" side when the user did not exist before the write. */
const NO_PRIOR_STATUS = "none";

type UserStatusFields = Omit<Prisma.UserUpdateInput, "subscriptionStatus" | "subscriptionStatusChanges">;

async function logChange(
  client: Client,
  entries: Array<{ userId: string; fromStatus: string; toStatus: string }>,
  source: SubscriptionStatusSource
) {
  const changed = entries.filter((entry) => entry.fromStatus !== entry.toStatus);
  if (changed.length === 0) return;
  await client.subscriptionStatusChange.createMany({
    data: changed.map((entry) => ({ ...entry, source }))
  });
}

/**
 * Set a known user's status and log the transition. Returns the updated user.
 * Pass `client` when already inside a transaction so the log commits atomically with the write.
 */
export async function setUserSubscriptionStatus(input: {
  userId: string;
  /** Omit to update the accompanying fields while leaving status (and the log) untouched. */
  status?: string | null;
  source: SubscriptionStatusSource;
  data?: UserStatusFields;
  client?: Client;
}) {
  const client = input.client ?? prisma;
  const existing = await client.user.findUnique({
    where: { id: input.userId },
    select: { subscriptionStatus: true }
  });

  const updated = await client.user.update({
    where: { id: input.userId },
    data: { ...input.data, subscriptionStatus: input.status ?? undefined }
  });

  if (input.status) {
    await logChange(
      client,
      [
        {
          userId: input.userId,
          fromStatus: existing?.subscriptionStatus ?? NO_PRIOR_STATUS,
          toStatus: input.status
        }
      ],
      input.source
    );
  }

  return updated;
}

/**
 * updateMany-style write for the webhook paths that identify a user by a provider id rather
 * than by our own id. Logs one row per user whose status actually moved.
 */
export async function setSubscriptionStatusWhere(input: {
  where: Prisma.UserWhereInput;
  status: string;
  source: SubscriptionStatusSource;
  data?: Omit<Prisma.UserUpdateManyMutationInput, "subscriptionStatus">;
  client?: Client;
}) {
  const client = input.client ?? prisma;
  const affected = await client.user.findMany({
    where: input.where,
    select: { id: true, subscriptionStatus: true }
  });

  const result = await client.user.updateMany({
    where: input.where,
    data: { ...input.data, subscriptionStatus: input.status }
  });

  await logChange(
    client,
    affected.map((user) => ({
      userId: user.id,
      fromStatus: user.subscriptionStatus,
      toStatus: input.status
    })),
    input.source
  );

  return result;
}

/**
 * Upsert-by-email variant, used by the Stripe checkout path where the user may not exist yet.
 * `status` is optional because some Stripe events carry billing detail without a status change.
 */
export async function upsertUserSubscriptionStatus(input: {
  email: string;
  status?: string | null;
  source: SubscriptionStatusSource;
  update?: UserStatusFields;
  create?: Prisma.UserCreateInput | Record<string, unknown>;
  client?: Client;
}) {
  const client = input.client ?? prisma;
  const email = input.email.trim().toLowerCase();
  const existing = await client.user.findUnique({
    where: { email },
    select: { id: true, subscriptionStatus: true }
  });

  const user = await client.user.upsert({
    where: { email },
    update: { ...input.update, subscriptionStatus: input.status ?? undefined },
    create: { email, ...(input.create as Prisma.UserCreateInput) }
  });

  if (input.status) {
    await logChange(
      client,
      [
        {
          userId: user.id,
          fromStatus: existing?.subscriptionStatus ?? NO_PRIOR_STATUS,
          toStatus: input.status
        }
      ],
      input.source
    );
  }

  return user;
}

export type LatestStatusChange = {
  fromStatus: string;
  toStatus: string;
  source: string;
  createdAt: Date;
};

/**
 * Most recent transition per user, for the admin view. One query for the whole page rather
 * than one per row.
 */
export async function getLatestStatusChanges(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, LatestStatusChange>();

  const rows = await prisma.subscriptionStatusChange.findMany({
    where: { userId: { in: userIds } },
    orderBy: { createdAt: "desc" },
    select: { userId: true, fromStatus: true, toStatus: true, source: true, createdAt: true }
  });

  const latest = new Map<string, LatestStatusChange>();
  for (const row of rows) {
    if (!latest.has(row.userId)) {
      latest.set(row.userId, {
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        source: row.source,
        createdAt: row.createdAt
      });
    }
  }
  return latest;
}
