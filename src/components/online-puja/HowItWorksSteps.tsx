export default function HowItWorksSteps() {
  const steps = [
    "Choose Lord Ganesh or Shani Dev membership",
    "Add your name, gotra, and intention once",
    "Every week your name and gotra are included automatically",
    "Get replay and confirmation after completion"
  ];

  return (
    <section className="mt-10" id="how-it-works">
      <h2 className="text-2xl font-serif text-sagar-ink md:text-3xl">How it works</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <article key={step} className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Step {index + 1}</p>
            <p className="mt-2 text-sm text-sagar-ink/78">{step}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
