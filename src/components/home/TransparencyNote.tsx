import { getTranslations } from "next-intl/server";

export default async function TransparencyNote() {
  const t = await getTranslations();
  return (
    <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/88 p-5 shadow-sagar-soft md:p-6">
      <h2 className="text-2xl font-serif text-sagar-ink">{t("home_transparency_title")}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sagar-ink/76">
        {t("home_transparency_text")}
      </p>
    </section>
  );
}
