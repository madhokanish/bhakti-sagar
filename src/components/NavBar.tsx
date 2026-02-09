import Link from "next/link";
import Logo from "@/components/Logo";

export default function NavBar() {
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/aartis", label: "Aartis" },
    { href: "/online-puja", label: "Online Puja" },
    { href: "/choghadiya", label: "Choghadiya" }
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-sagar-amber/20 bg-sagar-cream">
      <div className="container flex items-center justify-between gap-4 py-2">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-sagar-ink/80 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.href === "/online-puja"
                  ? "font-bold text-sagar-ink underline decoration-sagar-saffron/70 underline-offset-4 hover:text-sagar-saffron"
                  : "hover:text-sagar-saffron"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="md:hidden">
          <details>
            <summary className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 bg-white text-sagar-ink/60">
              <span className="sr-only">Open menu</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute right-6 mt-2 w-44 rounded-2xl border border-sagar-amber/20 bg-white p-3 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/70 shadow-sagar-soft">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    item.href === "/online-puja"
                      ? "block py-2 font-bold text-sagar-ink hover:text-sagar-saffron"
                      : "block py-2 hover:text-sagar-saffron"
                  }
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
