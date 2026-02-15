import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-sagar-amber/20 bg-white md:h-12 md:w-12">
        <Image
          src="/brand/bh-logo.png"
          alt="Bhakti Sagar logo"
          fill
          className="object-cover object-center scale-125"
          sizes="48px"
          priority
        />
      </div>
      <div className="leading-tight">
        <p className="text-2xl font-serif text-sagar-ink">Bhakti Sagar</p>
      </div>
    </Link>
  );
}
