export default function PujaTrustRow() {
  const items = [
    { label: "Weekly temple ritual", value: "Verified schedule" },
    { label: "Sankalp in your name", value: "Dedicated participation" },
    { label: "Email updates", value: "Clear coordination" }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-sagar-amber/20 bg-white/70 px-4 py-3 text-sm text-sagar-ink/80"
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">{item.label}</p>
          <p className="mt-1 font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

