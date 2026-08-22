#!/usr/bin/env node
//
// Realtime-voice spend report, straight from VoiceTurnUsage.
//
//   node scripts/voice-spend.mjs [days]     (default 30)
//
// Read-only.
//
// IMPORTANT — this is an ESTIMATE, unlike llm-spend.mjs and image-spend.mjs.
// The app holds the realtime connection to OpenAI directly (ephemeral client secret over
// WebRTC), so the server never sees the audio token counts. All we can observe is duration,
// so cost is derived from an assumed spend-per-audio-minute.
//
// To make this exact, the client would need to forward the `response.done` usage payload
// (input_audio_tokens / output_audio_tokens) to /api/bhaktigpt/voice/turn-complete, and those
// columns added to VoiceTurnUsage.
//
// UPDATE THIS when OpenAI's realtime pricing changes — verify at platform.openai.com/pricing.
// Blended $/minute assuming roughly balanced input and output audio in a conversation.
const USD_PER_MINUTE = {
  "gpt-realtime": 0.30
};
const FALLBACK_USD_PER_MINUTE = 0.30;

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
const where = { createdAt: { gte: since } };

const turns = await prisma.voiceTurnUsage.count({ where });
if (turns === 0) {
  console.log(`No VoiceTurnUsage rows in the last ${days} days.`);
  console.log("If voice is live, confirm the migration ran and the route is deployed.");
  await prisma.$disconnect();
  process.exit(0);
}

const byModel = await prisma.voiceTurnUsage.groupBy({
  by: ["model"], where, _count: true, _sum: { durationSeconds: true }
});
const byGuide = await prisma.voiceTurnUsage.groupBy({
  by: ["guideId"], where, _count: true, _sum: { durationSeconds: true }
});

const rows = await prisma.voiceTurnUsage.findMany({
  where, select: { rateKey: true, conversationId: true, durationSeconds: true }
});
const users = new Set(rows.map((r) => r.rateKey));
const convos = new Set(rows.map((r) => r.conversationId ?? r.rateKey));

let total = 0;
console.log(`\nRealtime voice spend, last ${days} days   (ESTIMATE — see header)\n`);
console.log("model                turns      minutes        est $");
console.log("-".repeat(56));
for (const m of byModel.sort((a, b) => (b._sum.durationSeconds ?? 0) - (a._sum.durationSeconds ?? 0))) {
  const mins = (m._sum.durationSeconds ?? 0) / 60;
  const cost = mins * (USD_PER_MINUTE[m.model] ?? FALLBACK_USD_PER_MINUTE);
  total += cost;
  console.log(m.model.padEnd(20) + String(m._count).padStart(5) +
              mins.toFixed(1).padStart(13) + ("$" + cost.toFixed(2)).padStart(13));
}
console.log("-".repeat(56));
console.log("estimated total".padEnd(38) + ("$" + total.toFixed(2)).padStart(18));

const totalMins = rows.reduce((a, r) => a + r.durationSeconds, 0) / 60;
console.log(`\nusers: ${users.size}   conversations: ${convos.size}   turns: ${turns}`);
console.log(`avg minutes/user: ${(totalMins / users.size).toFixed(1)}   avg turn: ${(totalMins * 60 / turns).toFixed(0)}s`);

console.log("\nBy guide:");
for (const g of byGuide.sort((a, b) => (b._sum.durationSeconds ?? 0) - (a._sum.durationSeconds ?? 0))) {
  console.log(`  ${g.guideId.padEnd(12)} ${String(g._count).padStart(5)} turns  ${((g._sum.durationSeconds ?? 0)/60).toFixed(1).padStart(8)} min`);
}

// Per-user spend. Voice is the rail where one heavy user can dominate the invoice, so this
// is the view that matters most.
const byUser = await prisma.voiceTurnUsage.groupBy({
  by: ["rateKey"],
  where,
  _count: true,
  _sum: { durationSeconds: true }
});
const rankedUsers = byUser
  .map((u) => {
    const mins = (u._sum.durationSeconds ?? 0) / 60;
    return { key: u.rateKey, turns: u._count, mins, cost: mins * FALLBACK_USD_PER_MINUTE };
  })
  .sort((a, b) => b.mins - a.mins);

console.log(`\nTop voice spenders  (${rankedUsers.length} users)\n`);
console.log("user                          turns      minutes        est $");
console.log("-".repeat(64));
for (const u of rankedUsers.slice(0, 20)) {
  console.log(
    u.key.slice(0, 28).padEnd(30) +
    String(u.turns).padStart(5) +
    u.mins.toFixed(1).padStart(13) +
    ("$" + u.cost.toFixed(2)).padStart(13)
  );
}
const allMins = rankedUsers.reduce((a, u) => a + u.mins, 0);
if (allMins > 0) {
  const top5 = rankedUsers.slice(0, 5).reduce((a, u) => a + u.mins, 0);
  console.log(`\nTop 5 users = ${((top5 / allMins) * 100).toFixed(0)}% of voice minutes`);
}

// The whole point of the cap is that no one exceeds it. Surface anyone who did.
const cap = Number(process.env.VOICE_DAILY_MINUTES_CAP ?? 20);
if (Number.isFinite(cap) && cap > 0) {
  const overCap = await prisma.voiceUsageDaily.findMany({
    where: { minutesUsed: { gt: cap } }, orderBy: { minutesUsed: "desc" }, take: 10
  });
  console.log(`\nOver the ${cap} min/day cap: ${overCap.length === 0 ? "none" : ""}`);
  for (const r of overCap) console.log(`  ${r.day}  ${r.rateKey.slice(0, 24).padEnd(26)} ${r.minutesUsed.toFixed(1)} min`);
}
console.log("");
await prisma.$disconnect();
