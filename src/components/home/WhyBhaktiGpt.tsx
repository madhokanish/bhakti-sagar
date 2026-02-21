import { HOMEPAGE_TRUST_CONFIG } from "@/lib/homepageConfig";
import { getTranslations } from "next-intl/server";

export default async function WhyBhaktiGpt() {
  const t = await getTranslations();
  const metrics = [
    {
      label: t("home_metric_rating_label"),
      value: "4.83",
      detail: t("home_metric_rating_detail")
    },
    {
      label: t("home_metric_sessions_label"),
      value: HOMEPAGE_TRUST_CONFIG.sessionsDelivered,
      detail: t("home_metric_sessions_detail")
    },
    {
      label: t("home_metric_reach_label"),
      value: HOMEPAGE_TRUST_CONFIG.globalReach,
      detail: t("home_metric_reach_detail")
    }
  ];

  const testimonials = [
    {
      quote: t("home_testimonial_1_quote"),
      author: t("home_testimonial_1_author")
    },
    {
      quote: t("home_testimonial_2_quote"),
      author: t("home_testimonial_2_author")
    },
    {
      quote: t("home_testimonial_3_quote"),
      author: t("home_testimonial_3_author")
    }
  ];

  return (
    <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/90 p-4 shadow-sagar-soft md:p-6">
      <div className="grid gap-5 md:grid-cols-3">
        {metrics.map((item) => (
          <article key={item.label} className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">{item.label}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <p className="text-4xl font-semibold text-sagar-ink">{item.value}</p>
            </div>
            <p className="mt-1 text-lg text-sagar-ink/72">{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {testimonials.map((item) => (
          <article key={item.author} className="rounded-2xl border border-sagar-amber/22 bg-sagar-cream/35 p-4">
            <p className="text-sm text-sagar-ink/82">“{item.quote}”</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">{item.author}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
