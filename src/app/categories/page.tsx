import CategoryCard from "@/components/CategoryCard";
import { getCategories } from "@/lib/data";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Browse Aartis by Deity",
    description: "Choose a deity to explore related aartis, chalisas, and bhajans.",
    pathname: "/categories"
  })
};

export default function CategoriesPage() {
  const categories = getCategories();
  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Categories", url: "https://bhakti-sagar.com/categories" }
  ]);

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Categories</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">Browse by deity</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        Choose a deity to explore related aartis and bhajans.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </div>
  );
}
