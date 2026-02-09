"use client";

import Link from "next/link";

export default function MobileQuickNav() {
  return (
    <div className="fixed bottom-3 left-1/2 z-40 w-[92%] -translate-x-1/2 rounded-full border border-sagar-amber/20 bg-white px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-sagar-ink/60 shadow-sagar-soft md:hidden">
      <div className="flex items-center justify-between">
        <Link href="/aartis" className="hover:text-sagar-saffron">Aartis</Link>
        <Link href="/deity" className="hover:text-sagar-saffron">Deities</Link>
        <Link href="/choghadiya" className="hover:text-sagar-saffron">Choghadiya</Link>
        <Link href="/pooja" className="hover:text-sagar-saffron">Pooja</Link>
        <Link href="/online-puja" className="hover:text-sagar-saffron">Online</Link>
      </div>
    </div>
  );
}
