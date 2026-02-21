import Image from "next/image";
import { HOMEPAGE_TRUST_CONFIG } from "@/lib/homepageConfig";
import { BRAND_LOGO_PATH, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export default function Footer() {
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
            A calm devotional platform centered on Bhakti Chat, daily reflection, and trusted spiritual content.
          </p>
          <p className="mt-2 max-w-md text-xs text-sagar-ink/65">
            Bhakti Chat chats are built for private reflection and respectful guidance.
          </p>
          <a
            href={HOMEPAGE_TRUST_CONFIG.bhaktiSagarTvUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full border border-sagar-amber/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/80 transition hover:border-sagar-saffron/50"
          >
            BhaktiSagarTV · {HOMEPAGE_TRUST_CONFIG.bhaktiSagarTvSubscribers}
          </a>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">Links</p>
          <div className="mt-3 flex flex-col gap-2">
            <a href="/about" className="hover:text-sagar-saffron">About</a>
            <a href="/contact" className="hover:text-sagar-saffron">Contact</a>
            <a href="/privacy" className="hover:text-sagar-saffron">Privacy Policy</a>
            <a href="/terms" className="hover:text-sagar-saffron">Terms</a>
            <a href="/aartis" className="hover:text-sagar-saffron">Aarti Collection</a>
            <a href="/choghadiya" className="hover:text-sagar-saffron">Choghadiya</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
