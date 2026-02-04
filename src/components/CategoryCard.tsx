import Link from "next/link";
import type { Category } from "@/lib/data";
export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft transition hover:-translate-y-1 hover:border-sagar-rose/50"
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-sagar-amber/20 bg-sagar-cream/60">
          <img
            src={category.imageUrl}
            alt={`${category.name} devotional art`}
            className="h-40 w-full object-cover"
            style={{ objectPosition: "50% 20%" }}
            loading="lazy"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{category.name}</p>
          <p className="mt-3 text-sm text-sagar-ink/70">{category.description}</p>
        </div>
      </div>
    </Link>
  );
}
