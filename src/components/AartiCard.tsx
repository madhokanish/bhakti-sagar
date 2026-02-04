import Link from "next/link";
import { getCategoryLabel } from "@/lib/data";
import type { Aarti } from "@/lib/data";

export default function AartiCard({ aarti }: { aarti: Aarti }) {
  const title = aarti.title.english || aarti.title.hindi;
  const lyricsPreview =
    aarti.lyrics.english.length > 0 ? aarti.lyrics.english : aarti.lyrics.hindi;
  return (
    <Link
      href={`/aartis/${aarti.slug}`}
      className="group rounded-2xl border border-sagar-amber/20 bg-white/80 p-5 shadow-sagar-card transition hover:-translate-y-1 hover:border-sagar-saffron/60"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">
          {getCategoryLabel(aarti.category)}
        </p>
        {aarti.isTop && (
          <span className="rounded-full bg-sagar-saffron/10 px-3 py-1 text-[0.6rem] font-semibold uppercase text-sagar-saffron">
            Top Aarti
          </span>
        )}
      </div>
      <h3 className="mt-4 text-xl font-serif text-sagar-ink group-hover:text-sagar-saffron">
        {title}
      </h3>
      <p className="mt-3 text-sm text-sagar-ink/70">
        {lyricsPreview.slice(0, 2).join(" · ")}…
      </p>
    </Link>
  );
}
