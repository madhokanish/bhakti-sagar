#!/usr/bin/env node
//
// LLM token/spend report, straight from LlmUsage.
//
//   node scripts/llm-spend.mjs [days]     (default 30)
//
// Read-only. Answers, without an OpenAI Admin key: how many completions ran, on which model,
// from which code path, and how many input vs output tokens each burned.
//
// Prices are OpenAI list prices per 1M tokens. They are denormalized here because the model
// is env-tunable (OPENAI_MODEL) and old rows must stay costed at whatever they actually ran on.
// UPDATE THESE when OpenAI's pricing changes — verify at platform.openai.com/pricing.
const PRICES = {
  "gpt-4o-mini":  { in: 0.15, out: 0.60 },
  "gpt-4.1-mini": { in: 0.40, out: 1.60 },
  "gpt-4.1":      { in: 2.00, out: 8.00 }
};

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

const days = Number(process.argv[2] ?? 30);
const since = new Date(Date.now() - days * 86400000);

const rows = await prisma.llmUsage.groupBy({
  by: ["model", "callSite"],
  where: { createdAt: { gte: since } },
  _count: true,
  _sum: { promptTokens: true, completionTokens: true }
});

if (rows.length === 0) {
  console.log(`No LlmUsage rows in the last ${days} days.`);
  console.log("If the app is live, confirm the migration ran and the route is deployed.");
  await prisma.$disconnect();
  process.exit(0);
}

let grandCost = 0;
let unpriced = new Set();
console.log(`\nLLM spend, last ${days} days\n`);
console.log("model            call site        calls     input tok    output tok      est $");
console.log("-".repeat(80));
for (const r of rows.sort((a, b) => b._count - a._count)) {
  const inTok = r._sum.promptTokens ?? 0;
  const outTok = r._sum.completionTokens ?? 0;
  const price = PRICES[r.model];
  if (!price) unpriced.add(r.model);
  const cost = price ? (inTok / 1e6) * price.in + (outTok / 1e6) * price.out : 0;
  grandCost += cost;
  console.log(
    r.model.padEnd(16) + r.callSite.padEnd(17) +
    String(r._count).padStart(5) +
    String(inTok).padStart(13) + String(outTok).padStart(14) +
    (price ? ("$" + cost.toFixed(2)).padStart(11) : "     unpriced")
  );
}
console.log("-".repeat(80));
console.log("estimated total".padEnd(63) + ("$" + grandCost.toFixed(2)).padStart(11));
if (unpriced.size) console.log(`\nNo price entry for: ${[...unpriced].join(", ")} — add to PRICES.`);
// Per-user spend. Priced per (user, model) pair rather than on a blended rate, so a user
// who happens to sit on the pricier model is not flattened into the average.
const byUserModel = await prisma.llmUsage.groupBy({
  by: ["rateKey", "model"],
  where: { createdAt: { gte: since } },
  _count: true,
  _sum: { promptTokens: true, completionTokens: true }
});

const users = new Map();
for (const row of byUserModel) {
  const key = row.rateKey ?? "(anonymous)";
  const price = PRICES[row.model];
  const inTok = row._sum.promptTokens ?? 0;
  const outTok = row._sum.completionTokens ?? 0;
  const cost = price ? (inTok / 1e6) * price.in + (outTok / 1e6) * price.out : 0;
  const u = users.get(key) ?? { calls: 0, inTok: 0, outTok: 0, cost: 0 };
  u.calls += row._count; u.inTok += inTok; u.outTok += outTok; u.cost += cost;
  users.set(key, u);
}

const ranked = [...users].sort((a, b) => b[1].cost - a[1].cost);
console.log(`\nTop chat spenders  (${users.size} users)\n`);
console.log("user                          calls     input tok    output tok      est $");
console.log("-".repeat(76));
for (const [key, u] of ranked.slice(0, 20)) {
  console.log(
    key.slice(0, 28).padEnd(30) +
    String(u.calls).padStart(5) +
    u.inTok.toLocaleString().padStart(14) +
    u.outTok.toLocaleString().padStart(14) +
    ("$" + u.cost.toFixed(3)).padStart(11)
  );
}
if (ranked.length) {
  const top = ranked.slice(0, 5).reduce((a, [, u]) => a + u.cost, 0);
  const all = ranked.reduce((a, [, u]) => a + u.cost, 0);
  if (all > 0) {
    console.log(`\nTop 5 users = ${((top / all) * 100).toFixed(0)}% of chat spend`);
  }
}

console.log("\nNote: covers chat completions only. Realtime voice and image generation are");
console.log("billed separately and are not recorded in this table.\n");

await prisma.$disconnect();
