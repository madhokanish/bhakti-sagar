type Props = {
  templeName: string;
  city: string;
  state: string;
  details: string[];
};

export default function PujaTempleCard({ templeName, city, state, details }: Props) {
  return (
    <div className="rounded-2xl border border-sagar-amber/20 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Temple Details</p>
      <h3 className="mt-2 text-xl font-serif text-sagar-ink">{templeName}</h3>
      <p className="mt-1 text-sm text-sagar-ink/70">{city}, {state}</p>
      <div className="mt-4 space-y-2 text-sm leading-relaxed text-sagar-ink/80">
        {details.map((detail) => (
          <p key={detail}>{detail}</p>
        ))}
      </div>
    </div>
  );
}

