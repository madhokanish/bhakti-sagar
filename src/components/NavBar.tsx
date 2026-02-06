import Link from "next/link";
import Logo from "@/components/Logo";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-sagar-amber/20 bg-sagar-cream">
      <div className="container flex flex-col gap-2 py-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-sagar-ink/80 md:flex">
            <Link href="/aartis" className="hover:text-sagar-saffron">Aartis</Link>
            <Link href="/categories" className="hover:text-sagar-saffron">Categories</Link>
            <Link href="/choghadiya" className="hover:text-sagar-saffron">Choghadiya</Link>
            <Link href="/pooja" className="hover:text-sagar-saffron">Pooja</Link>
            <Link href="/deity" className="hover:text-sagar-saffron">Deities</Link>
            <Link href="/festival" className="hover:text-sagar-saffron">Festivals</Link>
            <Link href="/about" className="hover:text-sagar-saffron">About</Link>
          </nav>
        </div>
        <nav className="hidden items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/70 md:hidden">
          <Link href="/aartis" className="hover:text-sagar-saffron">Aartis</Link>
          <Link href="/categories" className="hover:text-sagar-saffron">Categories</Link>
          <Link href="/choghadiya" className="hover:text-sagar-saffron">Choghadiya</Link>
          <Link href="/pooja" className="hover:text-sagar-saffron">Pooja</Link>
          <Link href="/deity" className="hover:text-sagar-saffron">Deities</Link>
          <Link href="/festival" className="hover:text-sagar-saffron">Festivals</Link>
          <Link href="/about" className="hover:text-sagar-saffron">About</Link>
        </nav>
        <div className="flex w-full max-w-md items-center gap-3 md:w-auto">
          <form action="/aartis" className="hidden w-full items-center gap-2 rounded-full border border-sagar-amber/30 bg-white px-4 py-2 shadow-sagar-soft md:flex">
            <input
              name="q"
              placeholder="Search aarti or deity"
              className="w-full bg-transparent text-sm outline-none placeholder:text-sagar-ink/50"
            />
            <button className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              Search
            </button>
          </form>
          <Link
            href="/aartis"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 bg-white text-sagar-ink/60 md:hidden"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                d="M15.5 14h-.79l-.28-.27A6 6 0 1 0 14 15.5l.27.28v.79L20 21.5 21.5 20 15.5 14zM10 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
                fill="currentColor"
              />
            </svg>
          </Link>
          <details className="md:hidden">
            <summary className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 bg-white text-sagar-ink/60">
              <span className="sr-only">Open menu</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute right-6 mt-2 w-40 rounded-2xl border border-sagar-amber/20 bg-white p-3 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/70 shadow-sagar-soft">
              <Link href="/aartis" className="block py-2 hover:text-sagar-saffron">Aartis</Link>
              <Link href="/categories" className="block py-2 hover:text-sagar-saffron">Categories</Link>
              <Link href="/choghadiya" className="block py-2 hover:text-sagar-saffron">Choghadiya</Link>
              <Link href="/pooja" className="block py-2 hover:text-sagar-saffron">Pooja</Link>
              <Link href="/deity" className="block py-2 hover:text-sagar-saffron">Deities</Link>
              <Link href="/festival" className="block py-2 hover:text-sagar-saffron">Festivals</Link>
              <Link href="/about" className="block py-2 hover:text-sagar-saffron">About</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
