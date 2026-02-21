import DeityGrid from "@/components/home/DeityGrid";
import { getTranslations } from "next-intl/server";

export default async function Hero() {
  const t = await getTranslations();
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-sagar-amber/25 bg-gradient-to-br from-[#fffaf3] via-[#fff3e5] to-[#f6e7cd] px-4 pb-6 pt-6 shadow-sagar-soft md:px-8 md:pb-8 md:pt-8">
      <div className="relative mx-auto max-w-5xl">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-serif text-sagar-ink sm:text-4xl lg:text-5xl lg:whitespace-nowrap">
            {t("hero_title")}
          </h1>
          <p className="mt-3 text-base text-sagar-ink/78 sm:text-lg">
            {t("hero_subtitle")}
          </p>
        </div>

        <div className="mt-5 md:mt-6">
          <DeityGrid />
        </div>
      </div>
    </section>
  );
}
