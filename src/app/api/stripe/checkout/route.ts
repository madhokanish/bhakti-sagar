import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getCurrencyForRequest, upsertUserSubscription, type SupportedCurrency } from "@/lib/subscription";

export const runtime = "nodejs";

type CheckoutBody = {
  email?: string;
  returnUrl?: string;
  currency?: SupportedCurrency;
};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getAppUrl() {
  return process.env.APP_URL?.trim() || "http://localhost:3000";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const priceId = process.env.STRIPE_PRICE_ID_MONTHLY?.trim();
  if (!priceId) {
    return NextResponse.json(
      { error: "Payment is not configured yet. Please contact support." },
      { status: 503 }
    );
  }

  const currency = body.currency || getCurrencyForRequest(request.headers);
  const returnUrl = body.returnUrl?.startsWith("/") ? body.returnUrl : "/";
  const appUrl = getAppUrl();

  await upsertUserSubscription({
    email,
    currency
  });

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    subscription_data: {
      trial_period_days: 14
    },
    payment_method_collection: "always",
    allow_promotion_codes: true,
    customer_email: email,
    success_url: `${appUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}&returnTo=${encodeURIComponent(
      returnUrl
    )}`,
    cancel_url: `${appUrl}/subscribe?returnTo=${encodeURIComponent(returnUrl)}&cancelled=1`,
    metadata: {
      requested_currency: currency,
      return_url: returnUrl
    }
  });

  return NextResponse.json({ url: session.url });
}
