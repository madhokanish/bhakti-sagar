export default function TestimonialsStrip() {
  // Sample testimonials: replace with verified user testimonials from actual membership members.
  const items = [
    {
      name: "Ritika",
      city: "London",
      text: "The weekly reminder and replay link help me stay consistent even with a busy work schedule."
    },
    {
      name: "Amit",
      city: "Mumbai",
      text: "I prefer membership because my sankalp details are already saved and the flow is very simple."
    },
    {
      name: "Neha",
      city: "Toronto",
      text: "Timezone display is clear and I can still watch replay if I miss the live timing."
    }
  ];

  return (
    <section className="mt-10" id="testimonials">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-2xl font-serif text-sagar-ink md:text-3xl">Devotee experiences</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/45">Sample</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article key={`${item.name}-${item.city}`} className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
            <p className="text-sm text-sagar-ink/78">&quot;{item.text}&quot;</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-sagar-rose">
              {item.name} · {item.city}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
