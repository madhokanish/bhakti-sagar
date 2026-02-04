import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sagar-saffron/15 text-lg font-serif text-sagar-ink shadow-sagar-soft md:h-11 md:w-11">
        भ
      </div>
      <div className="leading-tight">
        <p className="text-2xl font-serif text-sagar-ink">Bhakti Sagar</p>
        <p className="text-[0.6rem] uppercase tracking-[0.25em] text-sagar-saffron">Aarti · Bhajan · Bhakti</p>
      </div>
    </Link>
  );
}
