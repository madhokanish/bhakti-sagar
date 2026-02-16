"use client";
import type { PujaFaq } from "@/lib/onlinePujaDetailConfig";
import { trackEvent } from "@/lib/analytics";

type Props = {
  items: (PujaFaq & { id?: string })[];
  title?: string;
  sectionId?: string;
};

export default function FAQAccordion({ items, title = "FAQ", sectionId = "faq" }: Props) {
  return (
    <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7" id={sectionId}>
      <h2 className="text-3xl text-sagar-ink md:text-4xl">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <details
            key={item.id || item.question}
            className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-4"
            onToggle={(event) => {
              if ((event.currentTarget as HTMLDetailsElement).open) {
                trackEvent("faq_expand", { question_id: item.id || item.question });
              }
            }}
          >
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
