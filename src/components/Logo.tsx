import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-sagar-amber/20 bg-white md:h-11 md:w-11">
        <Image
          src="/brand/bh-logo.png"
          alt="Bhakti Sagar logo"
          fill
          className="object-cover object-center scale-110"
          sizes="44px"
          priority
        />
      </div>
      <div className="leading-tight">
        <p className="text-2xl font-serif text-sagar-ink">Bhakti Sagar</p>
      </div>
    </Link>
  );
}
