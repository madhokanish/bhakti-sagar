import { NextResponse } from "next/server";
import { getOnlinePujaBySlug } from "@/lib/onlinePuja";
import { SUBSCRIPTION_SESSION_COOKIE, verifySignedSessionToken } from "@/lib/session";

type Payload = {
  pujaSlug: string;
  name: string;
  email: string;
  phoneOrWhatsapp?: string;
  intention?: string;
  devoteeNames?: string;
  notes?: string;
  timezoneUser?: string;
};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createOrderId() {
  return `BS-${Date.now()}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
}

function getCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((item) => item.trim());
  const matched = parts.find((part) => part.startsWith(`${key}=`));
  if (!matched) return null;
  return decodeURIComponent(matched.slice(key.length + 1));
}

export async function POST(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), SUBSCRIPTION_SESSION_COOKIE);
  const session = verifySignedSessionToken(token);
  if (!session?.entitled) {
    return NextResponse.json({ error: "Subscription required." }, { status: 402 });
  }

  const body = (await request.json()) as Payload;

  if (!body?.pujaSlug || !body?.name?.trim() || !body?.email?.trim()) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!validEmail(body.email.trim())) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const puja = getOnlinePujaBySlug(body.pujaSlug);
  if (!puja || !puja.isActive) {
    return NextResponse.json({ error: "Seva not found." }, { status: 404 });
  }

  if (!puja.booking.isPaymentEnabled) {
    return NextResponse.json(
      { error: "Payment is currently disabled for this seva. Use booking request flow." },
      { status: 409 }
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    return NextResponse.json(
      {
        error:
          "Payment gateway is not configured yet. Please use reservation request or contact support."
      },
      { status: 503 }
    );
  }

  const orderId = createOrderId();

  // Payment provider integration should create a checkout session URL here.
  // This fallback ensures UX remains graceful until Stripe is configured.
  return NextResponse.json({
    orderId,
    status: "pending_payment",
    checkoutUrl: null
  });
}
