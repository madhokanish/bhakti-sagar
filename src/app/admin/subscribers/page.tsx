import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasSubscriptionEntitlement, isEntitlementStale } from "@/lib/subscription";
import { getLatestStatusChanges } from "@/lib/subscriptionStatus";

export const metadata: Metadata = {
  title: "Subscribers | BhaktiChat",
  robots: { index: false, follow: false }
};

// Membership state changes outside this page's control (webhooks, the nightly billing cron),
// so it must never be served from a cached render.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAdmin(email: string | null | undefined) {
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowlist.includes(email.toLowerCase()));
}

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function formatRelative(value: Date, now: Date) {
  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, secondsPerUnit] of units) {
    if (Math.abs(seconds) >= secondsPerUnit) {
      return formatter.format(Math.round(seconds / secondsPerUnit), unit);
    }
  }
  return "just now";
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function SubscribersAdminPage() {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect("/?auth=1&callbackUrl=/admin/subscribers");
  }

  const now = new Date();

  // UPI AutoPay members never get a `razorpaySubscriptionId` — that rail records a
  // RazorpayAutopayMandate instead — so filtering on the provider id columns alone hid every
  // Indian subscriber from this page. The mandate relation is the third arm of the filter.
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { razorpaySubscriptionId: { not: null } },
        { stripeCustomerId: { not: null } },
        { razorpayAutopayMandates: { some: {} } }
      ]
    },
    select: {
      id: true,
      email: true,
      phone: true,
      subscriptionStatus: true,
      razorpaySubscriptionId: true,
      stripeCustomerId: true,
      trialEnd: true,
      currentPeriodEnd: true,
      cancellationRequestedAt: true,
      updatedAt: true,
      razorpayAutopayMandates: {
        select: { status: true, cancellationRequestedAt: true },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const latestChanges = await getLatestStatusChanges(users.map((user) => user.id));

  const recentChanges = await prisma.subscriptionStatusChange.findMany({
    where: { createdAt: { gte: new Date(now.getTime() - THIRTY_DAYS_MS) } },
    select: { fromStatus: true, toStatus: true }
  });
  const churnedLast30 = recentChanges.filter(
    (change) => hasSubscriptionEntitlement(change.fromStatus) && !hasSubscriptionEntitlement(change.toStatus)
  ).length;

  const entitledCount = users.filter((user) => hasSubscriptionEntitlement(user.subscriptionStatus)).length;
  // Cancelled but still inside the paid period — churn that has already happened but has not
  // yet shown up in the status column.
  const cancellingCount = users.filter(
    (user) => hasSubscriptionEntitlement(user.subscriptionStatus) && user.cancellationRequestedAt
  ).length;
  const staleCount = users.filter((user) => isEntitlementStale(user, now)).length;

  function railFor(user: (typeof users)[number]) {
    if (user.razorpayAutopayMandates.length > 0) return "UPI AutoPay";
    if (user.razorpaySubscriptionId) return "Razorpay Sub";
    if (user.stripeCustomerId) return "Stripe";
    return "—";
  }

  return (
    <div className="container py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Internal</p>
      <h1 className="mt-2 text-3xl font-serif text-sagar-ink">Subscribers</h1>
      <p className="mt-2 text-sm text-sagar-ink/70">
        Backend subscription state — separate from Razorpay&apos;s dashboard, which only shows raw
        transactions. A refund here does not mean cancelled; check the mandate status directly if in
        doubt.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Tracked", value: users.length },
          { label: "Entitled now", value: entitledCount },
          { label: "Cancelling", value: cancellingCount },
          { label: "Churned (30d)", value: churnedLast30 },
          { label: "Stale", value: staleCount }
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-sagar-amber/20 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-sagar-ink/60">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-sagar-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {staleCount > 0 ? (
        <p className="mt-4 rounded-2xl border border-sagar-rose/30 bg-sagar-rose/5 px-4 py-3 text-sm text-sagar-ink/80">
          <strong>{staleCount}</strong> {staleCount === 1 ? "row claims" : "rows claim"} entitlement past
          the paid period — the provider event that should have ended it never arrived. Access is{" "}
          <em>not</em> revoked automatically; verify against the provider dashboard before acting.
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-sagar-amber/20 bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-sagar-amber/20 bg-sagar-cream/40 text-xs uppercase tracking-wide text-sagar-ink/60">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Rail</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Entitled</th>
              <th className="px-4 py-3">Last change</th>
              <th className="px-4 py-3">Trial end</th>
              <th className="px-4 py-3">Renews / period end</th>
              <th className="px-4 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const entitled = hasSubscriptionEntitlement(user.subscriptionStatus);
              const stale = isEntitlementStale(user, now);
              const change = latestChanges.get(user.id);
              const lostAccess =
                change && hasSubscriptionEntitlement(change.fromStatus) && !hasSubscriptionEntitlement(change.toStatus);

              return (
                <tr key={user.id} className="border-b border-sagar-amber/10 last:border-0">
                  <td className="px-4 py-3 font-medium text-sagar-ink">
                    {/* Phone-OTP accounts carry no email (phone and Google sign-ins are never
                        linked), so phone is the only identifier those members will ever have. */}
                    {user.email ?? user.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sagar-ink/75">{railFor(user)}</td>
                  <td className="px-4 py-3 text-sagar-ink/75">
                    {user.subscriptionStatus}
                    {entitled && user.cancellationRequestedAt ? (
                      <span
                        className="mt-1 block text-xs font-semibold uppercase tracking-wide text-sagar-rose"
                        title={`Cancellation requested ${formatDate(user.cancellationRequestedAt)}. Access runs to the end of the paid period.`}
                      >
                        Cancelling — ends {formatDate(user.currentPeriodEnd)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {entitled ? (
                      <span className="rounded-full bg-sagar-saffron px-2 py-0.5 text-xs font-bold uppercase text-white">
                        Yes
                      </span>
                    ) : (
                      <span className="text-sagar-ink/50">No</span>
                    )}
                    {stale ? (
                      <span
                        className="ml-2 rounded-full bg-sagar-rose/15 px-2 py-0.5 text-xs font-bold uppercase text-sagar-rose"
                        title="Status still says entitled but the paid period has already ended — likely a missed provider event."
                      >
                        Stale
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sagar-ink/75">
                    {change ? (
                      <>
                        <span className={lostAccess ? "font-semibold text-sagar-rose" : undefined}>
                          {change.fromStatus} → {change.toStatus}
                        </span>
                        <span className="block text-xs text-sagar-ink/50">
                          {formatRelative(change.createdAt, now)} · {change.source}
                        </span>
                      </>
                    ) : (
                      <span className="text-sagar-ink/40">no change logged</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sagar-ink/75">{formatDate(user.trialEnd)}</td>
                  <td className="px-4 py-3 text-sagar-ink/75">{formatDate(user.currentPeriodEnd)}</td>
                  <td className="px-4 py-3 text-sagar-ink/60">{formatDate(user.updatedAt)}</td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sagar-ink/60">
                  No subscribers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-sagar-ink/50">
        &ldquo;Last change&rdquo; only covers transitions recorded from 19 Aug 2026 onward, when the
        change log was added. Rows predating it show no history until their next status change.
      </p>
    </div>
  );
}
