import Link from "next/link";

type Props = {
  title: string;
  description: string;
  returnTo: string;
};

export default function PremiumFeatureGate({ title, description, returnTo }: Props) {
  return (
    <section className="rounded-3xl border border-sagar-amber/30 bg-white p-5 shadow-sagar-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Premium access</p>
      <h2 className="mt-2 text-3xl font-serif text-sagar-ink">{title}</h2>
      <p className="mt-2 text-sm text-sagar-ink/76">{description}</p>
      <p className="mt-2 text-sm font-semibold text-sagar-ink">14 day free trial · then £3.99/month · cancel anytime</p>
      <Link
        href={`/subscribe?returnTo=${encodeURIComponent(returnTo)}`}
        className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-5 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember"
      >
        Start free trial
      </Link>
    </section>
  );
}
