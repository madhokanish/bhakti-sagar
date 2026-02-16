"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const navItems = [
    { href: "/aartis", label: "Aartis" },
    { href: "/choghadiya", label: "Choghadiya" },
    { href: "/online-puja", label: "Online Puja" },
    { href: "/live", label: "Live Darshan" }
  ] as const;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{ top: "var(--promo-ribbon-height, 0px)" }}
      className={`sticky z-40 border-b border-sagar-amber/18 bg-white/90 backdrop-blur transition-shadow ${
        scrolled ? "shadow-[0_10px_30px_-24px_rgba(44,20,10,0.5)]" : "shadow-none"
      }`}
    >
      <div className="container relative flex items-center justify-between gap-4 py-2.5">
        <Logo />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 text-sm font-semibold text-sagar-ink/85 md:absolute md:left-1/2 md:flex md:-translate-x-1/2"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sagar-ink/80 transition hover:text-sagar-ember"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden h-9 w-9 md:block" aria-hidden="true" />

        <div className="md:hidden">
          <details>
            <summary className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 bg-white text-sagar-ink/70">
              <span className="sr-only">Open menu</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute right-6 mt-2 w-44 rounded-2xl border border-sagar-amber/20 bg-white p-3 text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/75 shadow-sagar-soft">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-2 py-2 transition hover:bg-sagar-cream/70 hover:text-sagar-ember"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
