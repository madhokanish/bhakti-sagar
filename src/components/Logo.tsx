import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-4">
      <div className="relative h-16 w-16 overflow-hidden md:h-20 md:w-20">
        <Image
          src="/brand/bh-logo.png"
          alt="Bhakti Sagar logo"
          fill
          className="object-contain object-center"
          sizes="80px"
          quality={100}
          priority
        />
      </div>
      <div className="leading-tight">
        <p className="text-2xl font-serif text-sagar-ink md:text-3xl">Bhakti Sagar</p>
      </div>
    </Link>
  );
}
