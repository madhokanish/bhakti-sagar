export const authors = [
  {
    slug: "anish-madhok",
    name: "Anish Madhok",
    role: "Editor",
    bio: "Anish curates Bhakti Sagar’s devotional library with a focus on accurate lyrics, accessible meanings, and respectful presentation."
  }
];

export function getAuthorBySlug(slug: string) {
  return authors.find((author) => author.slug === slug);
}
