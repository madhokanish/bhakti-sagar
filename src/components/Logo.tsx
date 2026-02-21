import Link from "next/link";
import Image from "next/image";
import { BRAND_LOGO_PATH, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 md:gap-4">
      <div className="relative h-12 w-12 overflow-hidden md:h-16 md:w-16">
        <Image
          src={BRAND_LOGO_PATH}
          alt="Bhakti Chat"
          fill
          className="object-contain object-center"
          sizes="(max-width: 768px) 48px, 64px"
          quality={100}
          priority
        />
      </div>
      <div className="leading-tight">
        <p className="text-xl font-serif text-sagar-ink md:text-2xl">{BRAND_NAME}</p>
        <p className="mt-0.5 max-w-[16rem] text-[10px] leading-tight text-sagar-ink/65 max-[360px]:hidden sm:text-[11px] md:text-xs">
          {BRAND_TAGLINE}
        </p>
      </div>
    </Link>
  );
}
