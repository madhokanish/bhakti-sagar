import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import CheckoutSuccessTracker from "@/components/online-puja/CheckoutSuccessTracker";

export const metadata: Metadata = buildMetadata({
  title: "Online Puja Checkout Success",
  description: "Your Weekly Puja Membership checkout is complete.",
  pathname: "/online-puja/success"
});

type SearchParams = {
  plan?: string;
  mode?: string;
  session_id?: string;
};

export default function OnlinePujaSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const plan = searchParams.plan === "shani" ? "shani" : "ganesh";
  const mode = searchParams.mode === "once" ? "once" : "monthly";

  return (
    <div className="container py-8 md:py-12">
      <CheckoutSuccessTracker plan={plan} mode={mode} />
      <section className="mx-auto max-w-3xl rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Success</p>
        <h1 className="mt-2 text-3xl font-serif text-sagar-ink md:text-4xl">
          {mode === "monthly" ? "Membership started" : "Booking completed"}
        </h1>
        <p className="mt-3 text-sm text-sagar-ink/74 md:text-base">
          Your {plan === "ganesh" ? "Ganesh" : "Shani"} {mode === "monthly" ? "membership" : "one-time booking"} is confirmed.
          You will receive confirmation details on email.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/manage-subscription"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white hover:bg-sagar-ember"
          >
            Manage subscription
          </Link>
          <Link
            href="/online-puja"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/30 px-6 py-2 text-sm font-semibold text-sagar-ink/75"
          >
            Back to Online Puja
          </Link>
        </div>

        {searchParams.session_id ? (
          <p className="mt-4 text-xs text-sagar-ink/55">Session ID: {searchParams.session_id}</p>
        ) : null}
      </section>
    </div>
  );
}
