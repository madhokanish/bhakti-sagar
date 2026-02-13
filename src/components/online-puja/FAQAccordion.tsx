import type { PujaFaq } from "@/lib/onlinePujaDetailConfig";

type Props = {
  items: PujaFaq[];
};

export default function FAQAccordion({ items }: Props) {
  return (
    <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7" id="faq">
      <h2 className="text-3xl text-sagar-ink md:text-4xl">FAQ</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-4">
            <summary className="cursor-pointer list-none text-base font-semibold text-sagar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron">
              {item.question}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-sagar-ink/75">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
