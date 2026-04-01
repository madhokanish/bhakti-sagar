import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { BHAKTI_GUIDES, type BhaktiGuideId } from "@/lib/bhaktigpt/guides";
import { HOMEPAGE_DEITY_HOOKS } from "@/lib/homepageConfig";
import { buildBhaktiChatHref } from "@/lib/bhaktigpt/chatLinks";

type DeityGridProps = {
  ids?: BhaktiGuideId[];
};

const DEFAULT_IDS: BhaktiGuideId[] = ["krishna", "lakshmi", "shani"];

export default async function DeityGrid({ ids = DEFAULT_IDS }: DeityGridProps) {
  const t = await getTranslations();
  const lang = headers().get("x-lang") === "hi" ? "hi" : "en";
  const localePrefix = `/${lang}`;
  const respectfulNames: Record<BhaktiGuideId, string> = {
    krishna: t("home_card_krishna_title"),
    shiv: "Shiv Ji",
    hanuman: "Hanuman Ji",
    lakshmi: t("home_card_lakshmi_title"),
    shani: t("home_card_shani_title")
  };
  const hooks: Record<BhaktiGuideId, string> = {
    krishna: t("home_card_krishna_subtitle"),
    shiv: "For stillness and emotional reset",
    hanuman: "For courage and focused action",
    lakshmi: t("home_card_lakshmi_subtitle"),
    shani: t("home_card_shani_subtitle")
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ids.map((id, index) => {
        const guide = BHAKTI_GUIDES[id];
        return (
          <Link
            key={id}
            href={`${localePrefix}${buildBhaktiChatHref({ guideId: id })}`}
            className="group relative block h-full min-h-[390px] overflow-hidden rounded-[1.7rem] border border-sagar-amber/22 bg-white/92 shadow-sagar-soft transition duration-200 hover:-translate-y-1 hover:border-sagar-saffron/45 hover:shadow-[0_24px_50px_-26px_rgba(65,30,10,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron/55 sm:min-h-[430px] lg:min-h-[455px]"
          >
            <Image
              src={guide.imageSrc}
              alt={guide.imageAlt}
              fill
              priority={index === 0}
              className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f0d04]/95 via-[#2f1408]/42 to-transparent" />
            {id === "krishna" ? (
              <span className="absolute left-4 top-4 inline-flex rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                {t("home_featured_guide")}
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="rounded-2xl border border-white/20 bg-black/35 px-3 py-2 backdrop-blur-[1px]">
                <p className="whitespace-nowrap text-[1.85rem] font-serif leading-none text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.78)] sm:text-[2.05rem]">
                  {respectfulNames[id]}
                </p>
                <p className="mt-1 text-sm text-white/95 [text-shadow:0_1px_10px_rgba(0,0,0,0.75)] sm:text-[15px]">
                  {hooks[id] ?? HOMEPAGE_DEITY_HOOKS[id]}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
