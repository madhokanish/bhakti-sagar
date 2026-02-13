type Props = {
  items: string[];
};

export default function TrustChipsRow({ items }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-xl border border-sagar-amber/25 bg-sagar-cream/45 px-2.5 py-2 text-center text-[0.68rem] font-semibold tracking-[0.02em] text-sagar-ink/82"
        >
          {item}
        </div>
      ))}
    </div>
  );
}
