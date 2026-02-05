"use client";

import Link from "next/link";

export default function MobileQuickNav() {
  return (
    <div className="fixed bottom-3 left-1/2 z-40 w-[92%] -translate-x-1/2 rounded-full border border-sagar-amber/20 bg-white px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sagar-ink/60 shadow-sagar-soft md:hidden">
      <div className="flex items-center justify-between">
        <Link href="/aartis" className="hover:text-sagar-saffron">Aartis</Link>
        <Link href="/deity" className="hover:text-sagar-saffron">Deities</Link>
        <Link href="/pooja" className="hover:text-sagar-saffron">Pooja</Link>
        <Link href="/aartis" className="hover:text-sagar-saffron">Search</Link>
      </div>
    </div>
  );
}
