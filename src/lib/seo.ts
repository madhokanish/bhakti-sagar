export const siteConfig = {
  name: "Bhakti Sagar",
  description: "A calm, devotional home for aartis and bhajans in English and Hindi.",
  url: "https://bhakti-sagar.com",
  ogImage: "/brand/bhakti-sagar-logo.png"
};

export function toTitle(title: string) {
  return `${title} | ${siteConfig.name}`;
}

export function toDescription(description?: string) {
  return description ?? siteConfig.description;
}
