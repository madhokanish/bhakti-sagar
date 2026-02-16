import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getSessionUserFromCookies, getUserByEmail } from "@/lib/subscription";

export const runtime = "nodejs";

type PortalBody = {
  email?: string;
};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getAppUrl() {
  return process.env.APP_URL?.trim() || "http://localhost:3000";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PortalBody;
  const { user } = await getSessionUserFromCookies();
  const fallbackEmail = body.email?.trim().toLowerCase() ?? "";

  let targetUser = user;
  if (!targetUser) {
    if (!validEmail(fallbackEmail)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    targetUser = await getUserByEmail(fallbackEmail);
  }

  if (!targetUser?.stripeCustomerId) {
    return NextResponse.json(
      { error: "We could not find an active subscription for this email." },
      { status: 404 }
    );
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: targetUser.stripeCustomerId,
    return_url: `${getAppUrl()}/subscribe`
  });

  return NextResponse.json({ url: session.url });
}
