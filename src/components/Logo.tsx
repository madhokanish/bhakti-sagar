import Link from "next/link";
import Image from "next/image";
import { BRAND_LOGO_PATH, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 md:gap-4">
      <div className="relative h-11 w-11 md:h-14 md:w-14">
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
        <p className="text-[1.18rem] font-serif font-semibold tracking-[0.01em] text-sagar-ink md:text-[1.45rem]">{BRAND_NAME}</p>
        <p className="mt-0.5 max-w-[16rem] text-[10px] leading-tight tracking-[0.02em] text-sagar-ink/65 max-[360px]:hidden sm:text-[11px] md:text-xs">
          {BRAND_TAGLINE}
        </p>
      </div>
    </Link>
  );
}
