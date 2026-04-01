import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sitemapHubsPath = path.join(process.cwd(), "src/app/sitemap-hubs.xml/route.ts");
const robotsPath = path.join(process.cwd(), "src/app/robots.ts");
const schemaPath = path.join(process.cwd(), "src/lib/schema.ts");
const bhaktigptHubPath = path.join(process.cwd(), "src/app/bhaktigpt/page.tsx");

test("hub sitemap source includes BhaktiGPT landing pages", () => {
  const source = fs.readFileSync(sitemapHubsPath, "utf8");
  assert.match(source, /"\/bhaktigpt"/);
  assert.match(source, /"\/bhaktigpt\/krishna"/);
  assert.match(source, /"\/bhaktigpt\/lakshmi"/);
  assert.match(source, /"\/bhaktigpt\/shani-dev"/);
});

test("robots source disallows api and auth routes", () => {
  const source = fs.readFileSync(robotsPath, "utf8");
  assert.match(source, /"\/api\/"/);
  assert.match(source, /"\/signin"/);
  assert.match(source, /"\/account"/);
});

test("schema source contains structured data helpers used by BhaktiGPT pages", () => {
  const schemaSource = fs.readFileSync(schemaPath, "utf8");
  const hubSource = fs.readFileSync(bhaktigptHubPath, "utf8");

  assert.match(schemaSource, /export function webPageJsonLd/);
  assert.match(schemaSource, /export function faqJsonLd/);
  assert.match(schemaSource, /export function breadcrumbJsonLd/);
  assert.match(hubSource, /buildMetadata/);
  assert.match(hubSource, /keywords/);
});
