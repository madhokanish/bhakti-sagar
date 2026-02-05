"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const cleanPath = pathname.replace(/^\/(en|hi)(?=\/|$)/, "");
  const enPath = `/en${cleanPath === "/" ? "" : cleanPath}`;
  const hiPath = `/hi${cleanPath === "/" ? "" : cleanPath}`;

  return (
    <div className="flex items-center gap-2 rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">
      <Link href={enPath} className="rounded-full px-2 py-1 hover:text-sagar-saffron">
        EN
      </Link>
      <span className="h-3 w-px bg-sagar-amber/30" />
      <Link href={hiPath} className="rounded-full px-2 py-1 hover:text-sagar-saffron">
        HI
      </Link>
    </div>
  );
}
