import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative h-12 w-12 overflow-hidden md:h-14 md:w-14">
        <Image
          src="/brand/bh-logo.png"
          alt="Bhakti Sagar logo"
          fill
          className="object-contain object-center"
          sizes="56px"
          quality={100}
          priority
        />
      </div>
      <div className="leading-tight">
        <p className="text-2xl font-serif text-sagar-ink">Bhakti Sagar</p>
      </div>
    </Link>
  );
}
