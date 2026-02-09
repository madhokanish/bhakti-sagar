"use client";

import Link from "next/link";

export default function MobileQuickNav() {
  return (
    <div className="fixed bottom-3 left-1/2 z-40 w-[92%] -translate-x-1/2 rounded-full border border-sagar-amber/20 bg-white px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-sagar-ink/60 shadow-sagar-soft md:hidden">
      <div className="flex items-center justify-between">
        <Link href="/" className="hover:text-sagar-saffron">Home</Link>
        <Link href="/aartis" className="hover:text-sagar-saffron">Aartis</Link>
        <Link href="/online-puja" className="font-bold text-sagar-ink hover:text-sagar-saffron">Online</Link>
        <Link href="/choghadiya" className="hover:text-sagar-saffron">Choghadiya</Link>
      </div>
    </div>
  );
}
