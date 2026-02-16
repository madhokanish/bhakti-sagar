export default function BenefitTiles() {
  const items = [
    {
      title: "Weekly ritual, handled for you",
      description: "A consistent devotional rhythm without rebooking every week."
    },
    {
      title: "One intention, included every week",
      description: "Your sankalp details carry forward for each scheduled seva."
    },
    {
      title: "Replay when you miss live",
      description: "Stay connected even when the live timing does not suit your day."
    },
    {
      title: "Manage and cancel anytime",
      description: "Self-serve membership controls with transparent billing."
    },
    {
      title: "Support on email",
      description: "Help is available for schedule and sankalp updates."
    }
  ];

  return (
    <section className="mt-10" id="why-membership">
      <h2 className="text-2xl font-serif text-sagar-ink md:text-3xl">Why membership works better</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <article key={item.title} className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
            <h3 className="text-sm font-semibold text-sagar-ink">{item.title}</h3>
            <p className="mt-2 text-sm text-sagar-ink/72">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
