import Image from "next/image";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { BRAND_LOGO_PATH } from "@/lib/brand";
import { HOME_COPY, HOME_LANG_COOKIE, resolveHomeLang } from "@/lib/homeCopy";

export default function Footer() {
  const cookieStore = cookies();
  const requestPath = headers().get("x-pathname") ?? "";

  const isHindiHomepage = requestPath === "/hi";
  const isDefaultHomepage = requestPath === "/";
  const selectedLang = isHindiHomepage
    ? "hi"
    : isDefaultHomepage
      ? resolveHomeLang(cookieStore.get(HOME_LANG_COOKIE)?.value, "en")
      : "en";
  const copy = HOME_COPY[selectedLang];

  return (
    <footer className="mt-16 border-t border-sagar-amber/20 bg-[#fff7ee]/78 backdrop-blur">
      <div className="container grid gap-8 py-11 text-sm text-sagar-ink/74 md:grid-cols-[1.55fr_1fr]">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="relative h-11 w-11 shrink-0">
              <Image src={BRAND_LOGO_PATH} alt="Bhakti Chat" fill className="object-contain" sizes="40px" />
            </div>
            <div>
              <p className="text-lg font-semibold text-sagar-ink">{copy.footer_brand}</p>
              <p className="text-[11px] leading-tight tracking-[0.02em] text-sagar-ink/65">{copy.footer_tagline}</p>
            </div>
          </div>
          <p className="mt-3 max-w-md leading-relaxed">{copy.footer_desc_1}</p>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-sagar-ink/65">{copy.footer_desc_2}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sagar-rose">{copy.footer_links_label}</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/about" className="w-fit hover:text-sagar-saffron">
              {copy.footer_link_about}
            </Link>
            <Link href="/support" className="w-fit hover:text-sagar-saffron">
              {copy.footer_link_support}
            </Link>
            <Link href="/contact" className="w-fit hover:text-sagar-saffron">
              {copy.footer_link_contact}
            </Link>
            <Link href="/privacy" className="w-fit hover:text-sagar-saffron">
              {copy.footer_link_privacy}
            </Link>
            <Link href="/terms" className="w-fit hover:text-sagar-saffron">
              {copy.footer_link_terms}
            </Link>
            <Link href="/aartis" className="w-fit hover:text-sagar-saffron">
              {copy.footer_link_aarti_collection}
            </Link>
            <Link href="/choghadiya" className="w-fit hover:text-sagar-saffron">
              {copy.footer_link_choghadiya}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
