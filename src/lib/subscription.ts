import "server-only";

import type { User } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SUBSCRIPTION_SESSION_COOKIE,
  buildSessionPayload,
  verifySignedSessionToken,
  type SubscriptionSessionPayload
} from "@/lib/session";

const ENTITLED_STATUSES = new Set(["trialing", "active"]);

const COUNTRY_TO_CURRENCY: Record<string, "GBP" | "USD" | "EUR"> = {
  GB: "GBP",
  US: "USD",
  IE: "EUR",
  FR: "EUR",
  DE: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  BE: "EUR",
  PT: "EUR",
  AT: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR"
};

const PRICE_BY_CURRENCY = {
  GBP: 3.99,
  USD: 4.99,
  EUR: 4.99
} as const;

export type SupportedCurrency = keyof typeof PRICE_BY_CURRENCY;

export function hasSubscriptionEntitlement(status: string | null | undefined) {
  if (!status) return false;
  return ENTITLED_STATUSES.has(status);
}

export function resolveCurrencyFromCountry(country: string | null | undefined): SupportedCurrency {
  const normalized = country?.toUpperCase() ?? "";
  return COUNTRY_TO_CURRENCY[normalized] ?? "GBP";
}

export function getCurrencyForRequest(requestHeaders?: Headers): SupportedCurrency {
  const hdrs = requestHeaders ?? headers();
  const country = hdrs.get("x-vercel-ip-country");
  return resolveCurrencyFromCountry(country);
}

export function getRenewalPrice(currency: SupportedCurrency) {
  return PRICE_BY_CURRENCY[currency];
}

export function formatRenewalPrice(currency: SupportedCurrency) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(getRenewalPrice(currency));
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  return prisma.user.findUnique({
    where: { stripeCustomerId }
  });
}

export async function upsertUserSubscription(input: {
  email: string;
  stripeCustomerId?: string | null;
  subscriptionStatus?: string | null;
  currency?: string | null;
  trialEnd?: Date | null;
  currentPeriodEnd?: Date | null;
}) {
  const email = input.email.trim().toLowerCase();
  return prisma.user.upsert({
    where: { email },
    update: {
      stripeCustomerId: input.stripeCustomerId ?? undefined,
      subscriptionStatus: input.subscriptionStatus ?? undefined,
      currency: input.currency ?? undefined,
      trialEnd: input.trialEnd ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd ?? undefined
    },
    create: {
      email,
      stripeCustomerId: input.stripeCustomerId ?? null,
      subscriptionStatus: input.subscriptionStatus ?? "inactive",
      currency: input.currency ?? "GBP",
      trialEnd: input.trialEnd ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null
    }
  });
}

export async function updateSubscriptionByCustomerId(input: {
  stripeCustomerId: string;
  subscriptionStatus: string;
  trialEnd?: Date | null;
  currentPeriodEnd?: Date | null;
}) {
  return prisma.user.updateMany({
    where: { stripeCustomerId: input.stripeCustomerId },
    data: {
      subscriptionStatus: input.subscriptionStatus,
      trialEnd: input.trialEnd ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null
    }
  });
}

export function toSubscriptionSessionPayload(user: User): SubscriptionSessionPayload {
  return buildSessionPayload({
    userId: user.id,
    email: user.email,
    status: user.subscriptionStatus,
    entitled: hasSubscriptionEntitlement(user.subscriptionStatus)
  });
}

export async function getSessionUserFromCookies() {
  const token = cookies().get(SUBSCRIPTION_SESSION_COOKIE)?.value;
  const session = verifySignedSessionToken(token);
  if (!session) return { session: null, user: null };
  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });
  if (!user) return { session, user: null };
  return { session, user };
}

export async function getRequestEntitlement() {
  const { user } = await getSessionUserFromCookies();
  if (!user) {
    return {
      isEntitled: false,
      user: null,
      currency: getCurrencyForRequest()
    };
  }
  return {
    isEntitled: hasSubscriptionEntitlement(user.subscriptionStatus),
    user,
    currency: (user.currency as SupportedCurrency) || getCurrencyForRequest()
  };
}
