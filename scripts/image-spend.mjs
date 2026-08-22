#!/usr/bin/env node
//
// Divine-image spend report, straight from DivineImageGeneration.
//
//   node scripts/image-spend.mjs [days]     (default 30)
//
// Read-only. Answers, without touching the OpenAI invoice: how many images were
// generated, by whom, on what config, and what it cost.
//
// Prices are OpenAI list prices per generated image, verified Aug 2026. They are
// denormalized here rather than inferred because the route's model/size/quality are
// env-tunable — each row stores the config it actually used, so old rows stay costed
// correctly after a knob moves. UPDATE THESE when OpenAI's pricing changes.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  // Fine in deployed environments, where DATABASE_URL is already in the environment.
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

// $ per generated image at 1024x1024. Non-square sizes bill ~1.5x (more pixels).
const SQUARE_PRICE = {
  "gpt-image-1.5": { low: 0.009, medium: 0.034, high: 0.133 },
  "gpt-image-1-mini": { low: 0.005, medium: 0.011, high: 0.036 }
};
// Extra image-input tokens when input_fidelity=high on the /edits path.
const HIGH_FIDELITY_SURCHARGE = { "gpt-image-1.5": 0.03, "gpt-image-1-mini": 0.012 };
const DEFAULT_QUALITY = "medium";

function priceOf(row) {
  const table = SQUARE_PRICE[row.model] ?? SQUARE_PRICE["gpt-image-1.5"];
  let price = table[row.quality ?? DEFAULT_QUALITY] ?? table[DEFAULT_QUALITY];
  if (row.size && row.size !== "1024x1024") price *= 1.5;
  if (row.inputFidelity === "high") {
    price += HIGH_FIDELITY_SURCHARGE[row.model] ?? HIGH_FIDELITY_SURCHARGE["gpt-image-1.5"];
  }
  return price;
}

const days = Number(process.argv[2] || 30);
const since = new Date(Date.now() - days * 86_400_000);

const rows = await prisma.divineImageGeneration.findMany({
  where: { createdAt: { gte: since } },
  orderBy: { createdAt: "asc" }
});

if (!rows.length) {
  console.log(`No divine-image records in the last ${days} days.`);
  console.log("If the app is live, confirm the migration ran and the route is deployed.");
  await prisma.$disconnect();
  process.exit(0);
}

const byDay = new Map();
const byUser = new Map();
const byConfig = new Map();
let total = 0;
let failures = 0;

for (const row of rows) {
  const cost = priceOf(row);
  total += cost;
  if (row.status === "failure") failures++;

  const day = row.createdAt.toISOString().slice(0, 10);
  const d = byDay.get(day) ?? { count: 0, cost: 0, users: new Set() };
  d.count++;
  d.cost += cost;
  if (row.userKey) d.users.add(row.userKey);
  byDay.set(day, d);

  const key = row.userKey ?? "(no userKey)";
  const u = byUser.get(key) ?? { count: 0, cost: 0 };
  u.count++;
  u.cost += cost;
  byUser.set(key, u);

  const cfg = `${row.model} ${row.size} ${row.quality ?? "-"}${row.inputFidelity === "high" ? " +hifi" : ""} (${row.endpoint})`;
  const c = byConfig.get(cfg) ?? { count: 0, cost: 0 };
  c.count++;
  c.cost += cost;
  byConfig.set(cfg, c);
}

console.log(`\n=== DIVINE IMAGE SPEND — last ${days} days ===`);
console.log(`${rows.length} generations · ${failures} failed · $${total.toFixed(2)} estimated\n`);

console.log("date          images   users    $");
for (const [day, d] of [...byDay].sort()) {
  console.log(
    `${day}  ${String(d.count).padStart(7)} ${String(d.users.size).padStart(7)}  ${d.cost.toFixed(2).padStart(7)}`
  );
}

console.log("\n=== BY CONFIG ===");
for (const [cfg, c] of [...byConfig].sort((a, b) => b[1].cost - a[1].cost)) {
  console.log(`  $${c.cost.toFixed(2).padStart(8)}  ${String(c.count).padStart(5)} imgs  ${cfg}  ($${(c.cost / c.count).toFixed(3)}/img)`);
}

// The free tier is 3 images per install. Anyone materially above it either reinstalled,
// cleared app data, or is calling the endpoint directly — the client-side quota cannot
// see any of those, which is the whole reason this table exists.
// Matches EntitlementStore.FREE_IMAGE_QUOTA in the Android app — keep the two in step.
const FREE_IMAGE_QUOTA = 1;
const overQuota = [...byUser]
  .filter(([key, u]) => key !== "(no userKey)" && u.count > FREE_IMAGE_QUOTA)
  .sort((a, b) => b[1].count - a[1].count);

console.log(`\n=== USERS OVER THE ${FREE_IMAGE_QUOTA}-IMAGE FREE QUOTA ===`);
if (!overQuota.length) {
  console.log("  None — the client-side gate is holding.");
} else {
  const wasted = overQuota.reduce((sum, [, u]) => sum + u.cost * ((u.count - FREE_IMAGE_QUOTA) / u.count), 0);
  console.log(`  ${overQuota.length} of ${byUser.size} users · ~$${wasted.toFixed(2)} beyond quota\n`);
  for (const [key, u] of overQuota.slice(0, 15)) {
    console.log(`    ${key.slice(0, 24).padEnd(26)} ${String(u.count).padStart(4)} imgs  $${u.cost.toFixed(2)}`);
  }
}

console.log(`\nAvg per user: ${(rows.length / byUser.size).toFixed(1)} images · $${(total / byUser.size).toFixed(3)}`);
await prisma.$disconnect();
