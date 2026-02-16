import PaywallTrigger from "@/components/PaywallTrigger";

type Props = {
  returnTo: string;
  priceLabel: string;
};

export default function PremiumFeatureGate({ returnTo, priceLabel }: Props) {
  return (
    <section className="rounded-3xl border border-sagar-amber/30 bg-white p-5 shadow-sagar-soft">
      <h2 className="text-3xl font-serif text-sagar-ink">Membership required</h2>
      <p className="mt-2 text-sm text-sagar-ink/76">
        This section is available to members.
      </p>
      <PaywallTrigger
        featureName="premium_gate"
        returnTo={returnTo}
        priceLabel={priceLabel}
        className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-saffron/40 bg-white px-5 py-2 text-sm font-semibold text-sagar-ember transition hover:bg-sagar-cream/70"
      >
        View plans
      </PaywallTrigger>
    </section>
  );
}
