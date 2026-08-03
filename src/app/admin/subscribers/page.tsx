import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasSubscriptionEntitlement } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Subscribers | BhaktiChat",
  robots: { index: false, follow: false }
};

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

export default async function SubscribersAdminPage() {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect("/?auth=1&callbackUrl=/admin/subscribers");
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [{ razorpaySubscriptionId: { not: null } }, { stripeCustomerId: { not: null } }]
    },
    select: {
      id: true,
      email: true,
      subscriptionStatus: true,
      razorpaySubscriptionId: true,
      stripeCustomerId: true,
      trialEnd: true,
      currentPeriodEnd: true,
      updatedAt: true
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="container py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Internal</p>
      <h1 className="mt-2 text-3xl font-serif text-sagar-ink">Subscribers</h1>
      <p className="mt-2 text-sm text-sagar-ink/70">
        Backend subscription state — separate from Razorpay&apos;s dashboard, which only shows raw
        transactions. A refund here does not mean cancelled; check the mandate status directly if in
        doubt.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-sagar-amber/20 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-sagar-amber/20 bg-sagar-cream/40 text-xs uppercase tracking-wide text-sagar-ink/60">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Entitled</th>
              <th className="px-4 py-3">Trial end</th>
              <th className="px-4 py-3">Renews / period end</th>
              <th className="px-4 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-sagar-amber/10 last:border-0">
                <td className="px-4 py-3 font-medium text-sagar-ink">{user.email ?? "—"}</td>
                <td className="px-4 py-3 text-sagar-ink/75">
                  {user.razorpaySubscriptionId ? "Razorpay" : user.stripeCustomerId ? "Stripe" : "—"}
                </td>
                <td className="px-4 py-3 text-sagar-ink/75">{user.subscriptionStatus}</td>
                <td className="px-4 py-3">
                  {hasSubscriptionEntitlement(user.subscriptionStatus) ? (
                    <span className="rounded-full bg-sagar-saffron px-2 py-0.5 text-xs font-bold uppercase text-white">
                      Yes
                    </span>
                  ) : (
                    <span className="text-sagar-ink/50">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sagar-ink/75">{formatDate(user.trialEnd)}</td>
                <td className="px-4 py-3 text-sagar-ink/75">{formatDate(user.currentPeriodEnd)}</td>
                <td className="px-4 py-3 text-sagar-ink/60">{formatDate(user.updatedAt)}</td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sagar-ink/60">
                  No subscribers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
