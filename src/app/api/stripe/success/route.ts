import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import {
  hasSubscriptionEntitlement,
  upsertUserSubscription
} from "@/lib/subscription";
import { buildSessionPayload, setSubscriptionSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

function toDate(timestamp?: number | null) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000);
}

function readSubscriptionTimestamp(
  subscription: Stripe.Subscription | null,
  field: "trial_end" | "current_period_end"
) {
  if (!subscription) return null;
  return (subscription as unknown as Record<string, number | null | undefined>)[field] ?? null;
}

async function resolveSubscription(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<Stripe.Subscription | null> {
  if (!session.subscription) return null;
  if (typeof session.subscription !== "string") return session.subscription;
  return stripe.subscriptions.retrieve(session.subscription);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const returnToParam = searchParams.get("returnTo");
  const returnTo = returnToParam?.startsWith("/") ? returnToParam : "/";

  if (!sessionId) {
    return NextResponse.redirect(new URL(`/subscribe?error=missing_session`, request.url));
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"]
  });

  const email = session.customer_details?.email || session.customer_email;
  if (!email) {
    return NextResponse.redirect(new URL(`/subscribe?error=missing_email`, request.url));
  }

  const subscription = await resolveSubscription(stripe, session);
  const subscriptionStatus = subscription?.status || "active";

  const user = await upsertUserSubscription({
    email,
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    subscriptionStatus,
    currency: session.currency?.toUpperCase(),
    trialEnd: toDate(readSubscriptionTimestamp(subscription, "trial_end")),
    currentPeriodEnd: toDate(readSubscriptionTimestamp(subscription, "current_period_end"))
  });

  const response = NextResponse.redirect(new URL(`${returnTo}?membership=started`, request.url));
  setSubscriptionSessionCookie(
    response,
    buildSessionPayload({
      userId: user.id,
      email: user.email,
      status: hasSubscriptionEntitlement(subscriptionStatus) ? subscriptionStatus : "inactive",
      entitled: hasSubscriptionEntitlement(subscriptionStatus)
    })
  );
  return response;
}
