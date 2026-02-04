import rawAartis from "@/data/aartis.json";
import rawCategories from "@/data/categories.json";

export type Aarti = {
  id: string;
  title: {
    english: string;
    hindi: string;
  };
  slug: string;
  category: string;
  isTop: boolean;
  youtubeUrl: string;
  lyrics: {
    english: string[];
    hindi: string[];
  };
  tags: string[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageCredit: string;
};

const aartis = rawAartis as Aarti[];
const categories = rawCategories as Category[];

export function getAartis() {
  return aartis;
}

export function getCategories() {
  return categories;
}

export function getCategoryLabel(slug: string) {
  return categories.find((category) => category.slug === slug)?.name ?? slug;
}

export function getTopAartis() {
  return aartis.filter((aarti) => aarti.isTop);
}

export function getAartiBySlug(slug: string) {
  return aartis.find((aarti) => aarti.slug === slug);
}

export function getAartisByCategory(categorySlug: string) {
  if (categorySlug === "other") {
    return aartis.filter((aarti) => aarti.category === "other" || aarti.category === "shakti");
  }
  return aartis.filter((aarti) => aarti.category === categorySlug);
}

export function searchAartis(query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return aartis;
  }
  return aartis.filter((aarti) => {
    const haystack = [
      aarti.title.english,
      aarti.title.hindi,
      aarti.category,
      ...aarti.tags
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(trimmed);
  });
}
