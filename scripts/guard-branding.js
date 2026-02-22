const fs = require("node:fs");
const path = require("node:path");

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

function assertContains(haystack, needle, errorMessage) {
  if (!haystack.includes(needle)) {
    throw new Error(errorMessage);
  }
}

function main() {
  const brand = read("src/lib/brand.ts");
  const seo = read("src/lib/seo.ts");

  assertContains(
    brand,
    'export const BRAND_NAME = "Bhakti Chat";',
    "Brand guard failed: BRAND_NAME must be 'Bhakti Chat'."
  );
  assertContains(
    brand,
    'export const BRAND_LOGO_PATH = "/brand/bhakti-chat-logo.png";',
    "Brand guard failed: BRAND_LOGO_PATH must point to '/brand/bhakti-chat-logo.png'."
  );
  assertContains(
    seo,
    'url: "https://bhaktichat.com"',
    "Brand guard failed: siteConfig.url must be 'https://bhaktichat.com'."
  );

  console.log("Branding guard passed.");
}

main();
