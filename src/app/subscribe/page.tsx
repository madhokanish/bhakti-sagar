import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getCurrencyForRequest } from "@/lib/subscription";
import { DEITY_NAMES } from "@/lib/terminology";
import SubscribeCheckoutPanel from "@/components/online-puja/SubscribeCheckoutPanel";

export const metadata: Metadata = buildMetadata({
  title: "Weekly Puja Membership Checkout",
  description:
    `Start ${DEITY_NAMES.ganesh.heading} or ${DEITY_NAMES.shani.heading} Weekly Puja Membership with clear deliverables and self-serve cancellation.`,
  pathname: "/subscribe"
});

type SearchParams = {
  plan?: string;
  email?: string;
  name?: string;
  family?: string;
  gotra?: string;
  intention?: string;
  wa?: string;
  returnTo?: string;
};

export default function SubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const initialCurrency = getCurrencyForRequest();
  const initialPlan = searchParams.plan === "shani" ? "shani" : "ganesh";

  return (
    <div className="container py-8 md:py-12">
      <section className="mb-6 rounded-[2rem] border border-sagar-amber/20 bg-gradient-to-br from-white via-sagar-cream/60 to-sagar-sand/65 p-6 shadow-sagar-soft md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Weekly Puja Membership</p>
        <h1 className="mt-2 text-4xl font-serif text-sagar-ink md:text-5xl">Join weekly membership</h1>
        <p className="mt-3 max-w-3xl text-sm text-sagar-ink/74 md:text-base">
          Complete your details once and continue with secure checkout. Membership includes weekly sankalp with your
          name and gotra, plus live access, replay, and certificate updates.
        </p>
      </section>

      <SubscribeCheckoutPanel
        initialPlan={initialPlan}
        initialCurrency={initialCurrency}
        prefill={{
          email: searchParams.email,
          fullName: searchParams.name,
          familyNames: searchParams.family,
          gotra: searchParams.gotra,
          intention: searchParams.intention,
          whatsappOptIn: searchParams.wa === "1",
          returnTo: searchParams.returnTo
        }}
      />
    </div>
  );
}
