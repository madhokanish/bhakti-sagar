import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import {
  updateSubscriptionByCustomerId,
  upsertUserSubscription,
  getUserByStripeCustomerId
} from "@/lib/subscription";

export const runtime = "nodejs";

function toDate(timestamp?: number | null) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000);
}

function readSubscriptionTimestamp(
  subscription: Stripe.Subscription,
  field: "trial_end" | "current_period_end"
) {
  return (subscription as unknown as Record<string, number | null | undefined>)[field] ?? null;
}

async function getCustomerEmail(
  stripe: Stripe,
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
) {
  if (!customerId) return null;
  if (typeof customerId !== "string") {
    if ("deleted" in customerId && customerId.deleted) return null;
    return customerId.email ?? null;
  }
  const customer = await stripe.customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) return null;
  return customer.email ?? null;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook signature missing." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook signature." },
      { status: 400 }
    );
  }

  const existing = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id }
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email || session.customer_email || null;
        if (email) {
          await upsertUserSubscription({
            email,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
            subscriptionStatus: "trialing",
            currency: session.currency?.toUpperCase() || undefined
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id || "";
        if (customerId) {
          const email = await getCustomerEmail(stripe, subscription.customer);
          if (email) {
            await upsertUserSubscription({
              email,
              stripeCustomerId: customerId,
              subscriptionStatus: subscription.status,
              trialEnd: toDate(readSubscriptionTimestamp(subscription, "trial_end")),
              currentPeriodEnd: toDate(readSubscriptionTimestamp(subscription, "current_period_end")),
              currency: subscription.currency?.toUpperCase()
            });
          } else {
            await updateSubscriptionByCustomerId({
              stripeCustomerId: customerId,
              subscriptionStatus: subscription.status,
              trialEnd: toDate(readSubscriptionTimestamp(subscription, "trial_end")),
              currentPeriodEnd: toDate(readSubscriptionTimestamp(subscription, "current_period_end"))
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id || null;
        if (customerId) {
          const existingUser = await getUserByStripeCustomerId(customerId);
          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { subscriptionStatus: "past_due" }
            });
          }
        }
        break;
      }

      default:
        break;
    }

    await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
