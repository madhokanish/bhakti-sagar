#!/usr/bin/env node
// Bhakti Chat eval runner.
//
// Pipeline:  cases (jsonl)  ->  live endpoint (SSE)  ->  code checks  ->  LLM judge  ->  report
//
// Usage:
//   node scripts/evals/run-eval.mjs [--base http://localhost:3000] [--guide krishna]
//        [--category safety] [--limit 10] [--concurrency 3] [--no-judge]
//
// Requires the Next dev server running (npm run dev) and OPENAI_API_KEY in .env.local.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { runConversation } from "./lib/client.mjs";
import { runChecks } from "./lib/checks.mjs";
import { resolveChatLanguage } from "./lib/lang.mjs";
import { judge, JUDGE_MODEL_DEFAULT } from "./lib/judge.mjs";
import { writeReport } from "./lib/report.mjs";
import { RUBRIC } from "./lib/rubric.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../..");
const CASES_DIR = join(__dirname, "cases");
const OUT_DIR = join(__dirname, "out");

// --- tiny .env loader (no dotenv dependency) ---
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (/^".*"$/.test(val) || /^'.*'$/.test(val)) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvFile(join(PROJECT_ROOT, ".env.local"));
loadEnvFile(join(PROJECT_ROOT, ".env"));

// --- arg parsing ---
function parseArgs(argv) {
  const args = { concurrency: 3 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-judge") args.noJudge = true;
    else if (a === "--base") args.base = argv[++i];
    else if (a === "--guide") args.guide = argv[++i];
    else if (a === "--category") args.category = argv[++i];
    else if (a === "--limit") args.limit = Number(argv[++i]);
    else if (a === "--concurrency") args.concurrency = Number(argv[++i]);
  }
  return args;
}
const args = parseArgs(process.argv.slice(2));
const BASE_URL = args.base || process.env.EVAL_BASE_URL || "http://localhost:3000";

// --- load cases ---
function loadCases() {
  const files = readdirSync(CASES_DIR).filter((f) => f.endsWith(".jsonl"));
  const cases = [];
  for (const file of files) {
    const text = readFileSync(join(CASES_DIR, file), "utf8");
    text.split("\n").forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) return;
      try {
        const c = JSON.parse(trimmed);
        c._file = file;
        // Normalize: allow either `turns` (array) or single `message`.
        c.messages = c.turns || (c.message ? [c.message] : []);
        cases.push(c);
      } catch (e) {
        console.warn(`  ! skipping malformed case in ${file}:${idx + 1}: ${e.message}`);
      }
    });
  }
  return cases;
}

// --- simple concurrency pool ---
async function pool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

async function evalCase(testCase, apiKey, doJudge) {
  const result = {
    id: testCase.id,
    guideId: testCase.guideId,
    category: testCase.category,
    intent: testCase.intent,
    file: testCase._file
  };
  try {
    const conversation = await runConversation({
      baseUrl: BASE_URL,
      guideId: testCase.guideId,
      messages: testCase.messages,
      chatLang: testCase.chatLang || "en"
    });
    result.final = conversation.final;
    result.turns = conversation.turns.map((t) => ({ user: t.user, assistant: t.assistant, model: t.meta?.model }));
    result.modelSeen = conversation.turns.find((t) => t.meta?.model)?.meta?.model;

    const lastErr = conversation.turns.find((t) => t.error)?.error;
    if (lastErr) {
      result.runError = `${lastErr.code || "error"}: ${lastErr.message}`;
      return result;
    }
    if (!conversation.final) {
      result.runError = "empty reply";
      return result;
    }

    // The app's reply language is derived from the final user turn + chatLang, not the raw
    // chatLang alone (the Latin/"en" option resolves to Hinglish). Judge against what it targets.
    const finalUserMsg = testCase.messages[testCase.messages.length - 1];
    const expectedLang = resolveChatLanguage(testCase.chatLang, finalUserMsg);
    result.checks = runChecks(conversation.final, { chatLang: testCase.chatLang, expectedLang });

    if (doJudge) {
      try {
        result.judge = await judge({ testCase, conversation, checks: result.checks, apiKey });
      } catch (e) {
        result.judgeError = e.message;
      }
    }
  } catch (e) {
    result.runError = e.message;
  }
  return result;
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`\nBhakti Chat eval  ·  base=${BASE_URL}  ·  judge=${args.noJudge ? "off" : JUDGE_MODEL_DEFAULT}`);

  // Sanity: rubric loaded from real guides.ts
  console.log(`Loaded rubric: ${Object.keys(RUBRIC.guides).length} guides, ${RUBRIC.styleContract.length} contract rules.`);

  let cases = loadCases();
  if (args.guide) cases = cases.filter((c) => c.guideId === args.guide);
  if (args.category) cases = cases.filter((c) => c.category === args.category);
  if (args.limit) cases = cases.slice(0, args.limit);
  if (!cases.length) {
    console.error("No cases matched. Check cases/*.jsonl and your filters.");
    process.exit(1);
  }
  console.log(`Running ${cases.length} cases at concurrency ${args.concurrency}...\n`);

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const doJudge = !args.noJudge;
  if (doJudge && !apiKey) {
    console.error("OPENAI_API_KEY not found (needed for the judge). Add it to .env.local or pass --no-judge.");
    process.exit(1);
  }

  let done = 0;
  const results = await pool(cases, args.concurrency, async (c) => {
    const r = await evalCase(c, apiKey, doJudge);
    done++;
    const verdict = r.runError
      ? `RUN-ERR (${r.runError})`
      : r.judgeError
      ? `JUDGE-ERR`
      : r.judge
      ? `${r.judge.overall_verdict.toUpperCase()} ${r.judge.overall_score}/5`
      : "ran";
    console.log(`  [${done}/${cases.length}] ${r.id} · ${r.guideId} · ${verdict}`);
    return r;
  });

  const meta = {
    startedAt,
    baseUrl: BASE_URL,
    judgeModel: doJudge ? JUDGE_MODEL_DEFAULT : "none",
    modelSeen: results.find((r) => r.modelSeen)?.modelSeen
  };
  const { mdPath, jsonPath } = writeReport(results, meta, OUT_DIR);

  const passed = results.filter((r) => r.judge?.overall_verdict === "pass").length;
  console.log(`\nDone. ${passed}/${results.length} passed.`);
  console.log(`Report:  ${mdPath}`);
  console.log(`Raw:     ${jsonPath}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
