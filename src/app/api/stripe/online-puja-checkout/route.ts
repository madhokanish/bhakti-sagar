import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getCurrencyForRequest, type SupportedCurrency } from "@/lib/subscription";

type CheckoutBody = {
  email?: string;
  plan?: "ganesh" | "shani";
  fullName?: string;
  familyNames?: string;
  gotra?: string;
  intention?: string;
  whatsappOptIn?: boolean;
  returnTo?: string;
  currency?: SupportedCurrency;
};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getAppUrl() {
  return process.env.APP_URL?.trim() || "http://localhost:3000";
}

function getTrialDays() {
  const raw = Number.parseInt(process.env.ONLINE_PUJA_TRIAL_DAYS?.trim() || "7", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 7;
}

function getPlanPriceId(plan: "ganesh" | "shani") {
  const envKey =
    plan === "ganesh"
      ? "STRIPE_PRICE_ID_GANESH_MONTHLY"
      : "STRIPE_PRICE_ID_SHANI_MONTHLY";

  return process.env[envKey]?.trim() || "";
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const email = body.email?.trim().toLowerCase() || "";
  const plan = body.plan === "shani" ? "shani" : "ganesh";

  if (!validEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  if (!body.fullName?.trim()) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }

  const priceId = getPlanPriceId(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: "Checkout is not configured for this plan yet." },
      { status: 503 }
    );
  }

  const appUrl = getAppUrl();
  const stripe = getStripeClient();
  const returnTo = body.returnTo?.startsWith("/") ? body.returnTo : "/online-puja";
  const currency = body.currency || getCurrencyForRequest(request.headers);

  const metadata = {
    product: "online_puja",
    plan,
    mode: "monthly",
    full_name: body.fullName.trim(),
    family_names: body.familyNames?.trim() || "",
    gotra: body.gotra?.trim() || "",
    intention: body.intention?.trim() || "",
    whatsapp_opt_in: body.whatsappOptIn ? "1" : "0",
    requested_currency: currency,
    return_to: returnTo
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_collection: "always",
    allow_promotion_codes: true,
    customer_email: email,
    metadata,
    subscription_data: {
      trial_period_days: getTrialDays(),
      metadata
    },
    success_url: `${appUrl}/online-puja/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
    cancel_url: `${appUrl}/subscribe?plan=${plan}&cancelled=1`
  });

  return NextResponse.json({ url: session.url });
}
