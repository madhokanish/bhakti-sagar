export const siteConfig = {
  name: "Bhakti Sagar",
  description:
    "Read popular aartis and pooja content with easy Hindi-in-English lyrics, meaning, and YouTube videos. Fast, clean, and mobile friendly.",
  url: "https://bhakti-sagar.com",
  ogImage: "/brand/bhakti-sagar-logo.png"
};

export function toTitle(title: string) {
  return `${title} | ${siteConfig.name}`;
}

export function toDescription(description?: string) {
  return description ?? siteConfig.description;
}
