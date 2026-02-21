import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HOMEPAGE_TRUST_CONFIG } from "@/lib/homepageConfig";
import { BRAND_LOGO_PATH, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { getRequestLanguage } from "@/lib/seo";

export default async function Footer() {
  const t = await getTranslations();
  const locale = getRequestLanguage();
  const localePrefix = `/${locale}`;

  return (
    <footer className="mt-16 border-t border-sagar-amber/20 bg-sagar-cream/70">
      <div className="container grid gap-8 py-10 text-sm text-sagar-ink/72 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0">
              <Image src={BRAND_LOGO_PATH} alt="Bhakti Chat" fill className="object-contain" sizes="40px" />
            </div>
            <div>
              <p className="font-serif text-lg text-sagar-ink">{BRAND_NAME}</p>
              <p className="text-[11px] leading-tight text-sagar-ink/65">{BRAND_TAGLINE}</p>
            </div>
          </div>
          <p className="mt-2 max-w-md">
            {t("footer_about_platform")}
          </p>
          <p className="mt-2 max-w-md text-xs text-sagar-ink/65">
            {t("footer_about_privacy")}
          </p>
          <a
            href={HOMEPAGE_TRUST_CONFIG.bhaktiSagarTvUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full border border-sagar-amber/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/80 transition hover:border-sagar-saffron/50"
          >
            {t("footer_bhaktitv_label")} · {HOMEPAGE_TRUST_CONFIG.bhaktiSagarTvSubscribers}
          </a>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">{t("footer_links")}</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href={`${localePrefix}/about`} className="hover:text-sagar-saffron">{t("footer_about")}</Link>
            <Link href={`${localePrefix}/contact`} className="hover:text-sagar-saffron">{t("footer_contact")}</Link>
            <Link href={`${localePrefix}/privacy`} className="hover:text-sagar-saffron">{t("footer_privacy")}</Link>
            <Link href={`${localePrefix}/terms`} className="hover:text-sagar-saffron">{t("footer_terms")}</Link>
            <Link href={`${localePrefix}/aartis`} className="hover:text-sagar-saffron">{t("footer_aartis")}</Link>
            <Link href={`${localePrefix}/choghadiya`} className="hover:text-sagar-saffron">{t("footer_choghadiya")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
