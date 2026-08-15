import "server-only";

type RazorpayErrorBody = { error?: { description?: string; code?: string } };

export type RazorpayCustomer = { id: string };
export type RazorpayOrder = { id: string };
export type RazorpayUpiAuthorization = { razorpay_payment_id: string; link: string };
export type RazorpayPayment = {
  id: string;
  status: string;
  method?: string;
  customer_id?: string;
  token_id?: string | null;
};
export type RazorpayToken = {
  id: string;
  method?: string;
  recurring?: boolean;
  recurring_details?: { status?: string | null };
  created_at?: number;
};

export type UpiAutopayConfig = {
  authorizationAmount: number;
  billingAmount: number;
  trialDays: number;
  expiresAt: Date;
};

const RAZORPAY_API = "https://api.razorpay.com/v1";

function positiveInteger(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer in paise.`);
  }
  return value;
}

/**
 * The display already promises ₹5 now, then ₹199/month after three days. These defaults
 * preserve that published offer; deployment can override them in paise without an app
 * release. Razorpay credentials remain server-only.
 */
export function getUpiAutopayConfig(): UpiAutopayConfig {
  const expiresAt = new Date();
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 10);
  return {
    authorizationAmount: positiveInteger("RAZORPAY_UPI_AUTOPAY_AUTHORIZATION_AMOUNT_PAISE", 500),
    billingAmount: positiveInteger("RAZORPAY_UPI_AUTOPAY_MONTHLY_AMOUNT_PAISE", 19900),
    trialDays: positiveInteger("RAZORPAY_UPI_AUTOPAY_TRIAL_DAYS", 3),
    expiresAt
  };
}

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured.");
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export class RazorpayUpiAutopayError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function razorpay<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      Authorization: credentials(),
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });
  const body = (await response.json().catch(() => ({}))) as T & RazorpayErrorBody;
  if (!response.ok) {
    throw new RazorpayUpiAutopayError(
      body.error?.description || "Razorpay could not complete the UPI AutoPay request.",
      response.status
    );
  }
  return body;
}

export function createUpiAutopayCustomer(input: {
  name: string | null;
  email: string;
  contact: string;
  userId: string;
}) {
  return razorpay<RazorpayCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name?.trim() || "BhaktiChat member",
      email: input.email,
      contact: input.contact,
      fail_existing: "0",
      notes: { bhaktichat_user_id: input.userId }
    })
  });
}

export function createUpiMandateOrder(input: {
  customerId: string;
  authorizationAmount: number;
  billingAmount: number;
  expiresAt: Date;
  receipt: string;
  mandateId: string;
}) {
  return razorpay<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.authorizationAmount,
      currency: "INR",
      customer_id: input.customerId,
      method: "upi",
      payment_capture: true,
      receipt: input.receipt,
      token: {
        max_amount: input.billingAmount,
        expire_at: Math.floor(input.expiresAt.getTime() / 1000),
        frequency: "monthly"
      },
      notes: { bhaktichat_mandate_id: input.mandateId, purpose: "BhaktiChat membership" }
    })
  });
}

/** Razorpay's S2S UPI Intent response contains a safe-to-open `upi://mandate` deep link. */
export function createUpiMandateAuthorization(input: {
  orderId: string;
  customerId: string;
  authorizationAmount: number;
  mandateId: string;
}) {
  return razorpay<RazorpayUpiAuthorization>("/payments/create/upi", {
    method: "POST",
    body: JSON.stringify({
      amount: input.authorizationAmount,
      currency: "INR",
      order_id: input.orderId,
      customer_id: input.customerId,
      recurring: "1",
      method: "upi",
      upi: { flow: "intent" },
      notes: { bhaktichat_mandate_id: input.mandateId, purpose: "BhaktiChat membership" }
    })
  });
}

export function fetchRazorpayPayment(paymentId: string) {
  return razorpay<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function findConfirmedUpiToken(customerId: string, createdAfter: Date) {
  const result = await razorpay<{ items?: RazorpayToken[] }>(
    `/customers/${encodeURIComponent(customerId)}/tokens`
  );
  const cutoff = Math.floor(createdAfter.getTime() / 1000) - 60;
  return result.items?.find(
    (token) =>
      token.method === "upi" &&
      token.recurring === true &&
      token.recurring_details?.status === "confirmed" &&
      (token.created_at ?? 0) >= cutoff
  ) ?? null;
}

export function cancelUpiAutopayToken(customerId: string, tokenId: string) {
  return razorpay<{ status?: string }>(
    `/customers/${encodeURIComponent(customerId)}/tokens/${encodeURIComponent(tokenId)}/cancel`,
    { method: "PUT" }
  );
}

export function createScheduledDebitOrder(input: {
  amount: number;
  tokenId: string;
  scheduledFor: Date;
  receipt: string;
  mandateId: string;
}) {
  return razorpay<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: "INR",
      payment_capture: true,
      receipt: input.receipt,
      notification: {
        token_id: input.tokenId,
        payment_after: Math.floor(input.scheduledFor.getTime() / 1000)
      },
      notes: { bhaktichat_mandate_id: input.mandateId, purpose: "BhaktiChat monthly membership" }
    })
  });
}

export function createRecurringUpiDebit(input: {
  orderId: string;
  customerId: string;
  tokenId: string;
  amount: number;
  email: string | null;
  contact: string | null;
  mandateId: string;
}) {
  return razorpay<RazorpayPayment>("/payments/create/recurring", {
    method: "POST",
    body: JSON.stringify({
      ...(input.email ? { email: input.email } : {}),
      ...(input.contact ? { contact: input.contact } : {}),
      amount: input.amount,
      currency: "INR",
      order_id: input.orderId,
      customer_id: input.customerId,
      token: input.tokenId,
      recurring: true,
      description: "BhaktiChat monthly membership",
      notes: { bhaktichat_mandate_id: input.mandateId }
    })
  });
}
