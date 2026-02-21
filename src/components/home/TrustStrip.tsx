import { getTranslations } from "next-intl/server";

export default async function TrustStrip() {
  const t = await getTranslations();
  const trustItems = [
    {
      title: t("trust_line_1"),
      description: t("trust_private_desc"),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M12 3l7 3v5c0 5.2-3.4 8.9-7 10-3.6-1.1-7-4.8-7-10V6l7-3zM9.8 12.1l1.8 1.9 3.6-3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    },
    {
      title: t("trust_line_2"),
      description: t("trust_reflection_desc"),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M12 20s-6-3.8-6-9a3.5 3.5 0 016-2.2A3.5 3.5 0 0118 11c0 5.2-6 9-6 9z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    },
    {
      title: t("trust_digital_india_title"),
      description: t("trust_digital_india_text"),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M12 3v4M12 17v4M4.2 7.2l2.8 2.1M17 14.7l2.8 2.1M3 12h4M17 12h4M4.2 16.8l2.8-2.1M17 9.3l2.8-2.1M12 16a4 4 0 100-8 4 4 0 000 8z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    }
  ];
  return (
    <section className="mt-5 rounded-2xl border border-sagar-amber/20 bg-white/92 px-3 py-3 shadow-sagar-soft md:px-4">
      <div className="grid gap-3 md:grid-cols-3">
        {trustItems.map((item) => (
          <article
            key={item.title}
            className="flex items-start gap-3 rounded-xl border border-sagar-amber/18 bg-sagar-cream/35 px-3 py-3"
          >
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sagar-amber/30 bg-white text-sagar-ember">
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-sagar-ink">{item.title}</p>
              <p className="mt-1 text-xs text-sagar-ink/72">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
