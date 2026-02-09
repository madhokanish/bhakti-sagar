type Props = {
  benefits: string[];
};

export default function PujaBenefitCards({ benefits }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {benefits.map((benefit) => (
        <article key={benefit} className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <p className="text-sm leading-relaxed text-sagar-ink/80">{benefit}</p>
        </article>
      ))}
    </div>
  );
}

