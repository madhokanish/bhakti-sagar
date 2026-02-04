import Link from "next/link";
import Logo from "@/components/Logo";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-sagar-amber/20 bg-sagar-cream/80 backdrop-blur">
      <div className="container flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-sagar-ink/80 md:flex">
            <Link href="/aartis" className="hover:text-sagar-saffron">Aartis</Link>
            <Link href="/categories" className="hover:text-sagar-saffron">Categories</Link>
            <Link href="/pooja" className="hover:text-sagar-saffron">Pooja</Link>
            <Link href="/deity" className="hover:text-sagar-saffron">Deities</Link>
            <Link href="/festival" className="hover:text-sagar-saffron">Festivals</Link>
            <Link href="/about" className="hover:text-sagar-saffron">About</Link>
          </nav>
        </div>
        <nav className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/70 md:hidden">
          <Link href="/aartis" className="hover:text-sagar-saffron">Aartis</Link>
          <Link href="/categories" className="hover:text-sagar-saffron">Categories</Link>
          <Link href="/pooja" className="hover:text-sagar-saffron">Pooja</Link>
          <Link href="/deity" className="hover:text-sagar-saffron">Deities</Link>
          <Link href="/festival" className="hover:text-sagar-saffron">Festivals</Link>
          <Link href="/about" className="hover:text-sagar-saffron">About</Link>
        </nav>
        <form action="/aartis" className="flex w-full max-w-md items-center gap-2 rounded-full border border-sagar-amber/30 bg-white px-4 py-2 shadow-sagar-soft md:w-auto">
          <input
            name="q"
            placeholder="Search aarti or deity"
            className="w-full bg-transparent text-sm outline-none placeholder:text-sagar-ink/50"
          />
          <button className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            Search
          </button>
        </form>
      </div>
    </header>
  );
}
