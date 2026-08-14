// Aggregate results into a human-readable markdown scorecard + raw JSON.
// The point of the report is not the average score — it's the "Scopes for improvement"
// section, which clusters the judge's `fix` fields so you know what to change next.

import { writeFileSync, mkdirSync } from "node:fs";
import { DIMENSIONS } from "./rubric.mjs";

function avg(nums) {
  const xs = nums.filter((n) => typeof n === "number");
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

function fmt(n) {
  return n === null ? "—" : n.toFixed(2);
}

function pct(part, total) {
  return total ? `${Math.round((part / total) * 100)}%` : "—";
}

function passRate(results, predicate = () => true) {
  const subset = results.filter(predicate);
  const passed = subset.filter((r) => r.judge?.overall_verdict === "pass").length;
  return { passed, total: subset.length, label: pct(passed, subset.length) };
}

export function buildReport(results, meta) {
  const lines = [];
  const total = results.length;
  const errored = results.filter((r) => r.runError || r.judgeError);

  lines.push(`# Bhakti Chat — LLM-as-judge eval report`);
  lines.push("");
  lines.push(`- **Run:** ${meta.startedAt}`);
  lines.push(`- **Target:** \`${meta.baseUrl}\` · model under test reported as \`${meta.modelSeen || "?"}\``);
  lines.push(`- **Judge model:** \`${meta.judgeModel}\``);
  lines.push(`- **Cases:** ${total}  ·  **Errors:** ${errored.length}`);
  const overall = passRate(results);
  lines.push(`- **Overall pass rate:** ${overall.label} (${overall.passed}/${overall.total})`);
  lines.push("");

  // Pass rate by guide
  lines.push(`## Pass rate by guide`);
  lines.push("");
  lines.push(`| Guide | Pass | Cases | Avg overall |`);
  lines.push(`| --- | --- | --- | --- |`);
  for (const guide of [...new Set(results.map((r) => r.guideId))]) {
    const g = results.filter((r) => r.guideId === guide);
    const pr = passRate(results, (r) => r.guideId === guide);
    lines.push(`| ${guide} | ${pr.label} | ${g.length} | ${fmt(avg(g.map((r) => r.judge?.overall_score)))} |`);
  }
  lines.push("");

  // Pass rate by category
  lines.push(`## Pass rate by category`);
  lines.push("");
  lines.push(`| Category | Pass | Cases |`);
  lines.push(`| --- | --- | --- |`);
  for (const cat of [...new Set(results.map((r) => r.category))]) {
    const pr = passRate(results, (r) => r.category === cat);
    lines.push(`| ${cat} | ${pr.label} | ${pr.total} |`);
  }
  lines.push("");

  // Average score per dimension
  lines.push(`## Average score by dimension (1–5)`);
  lines.push("");
  lines.push(`| Dimension | Avg | Fails |`);
  lines.push(`| --- | --- | --- |`);
  for (const d of DIMENSIONS) {
    const scores = results.map((r) => r.judge?.dimensions?.[d.key]?.score);
    const fails = results.filter((r) => r.judge?.dimensions?.[d.key]?.verdict === "fail").length;
    lines.push(`| ${d.label} | ${fmt(avg(scores))} | ${fails} |`);
  }
  lines.push("");

  // Failures with evidence
  const failures = results.filter((r) => r.judge?.overall_verdict === "fail" || r.runError || r.judgeError);
  lines.push(`## Failures & weak spots (${failures.length})`);
  lines.push("");
  if (!failures.length) lines.push("_None — clean run._");
  for (const r of failures) {
    lines.push(`### \`${r.id}\` · ${r.guideId} · ${r.category}`);
    if (r.runError) {
      lines.push(`- ⚠️ **Run error:** ${r.runError}`);
      lines.push("");
      continue;
    }
    if (r.judgeError) {
      lines.push(`- ⚠️ **Judge error:** ${r.judgeError}`);
      lines.push("");
      continue;
    }
    lines.push(`- **User need:** ${r.intent || "—"}`);
    lines.push(`- **Headline:** ${r.judge.headline}`);
    lines.push(`- **Met user need:** ${r.judge.met_user_need ? "yes" : "**no**"}`);
    if (r.checks?.flags?.length) lines.push(`- **Auto-flags:** ${r.checks.flags.join(", ")}`);
    for (const d of DIMENSIONS) {
      const dim = r.judge.dimensions?.[d.key];
      if (dim && dim.verdict === "fail") {
        lines.push(`  - **${d.label} (${dim.score}/5):** ${dim.fix}  \n    _evidence:_ "${dim.evidence}"`);
      }
    }
    lines.push(`- **Final reply:** ${(r.final || "").replace(/\n+/g, " ⏎ ").slice(0, 400)}`);
    lines.push("");
  }

  // Scopes for improvement — cluster all non-"none" fixes by dimension
  lines.push(`## Scopes for improvement`);
  lines.push("");
  for (const d of DIMENSIONS) {
    const fixes = results
      .map((r) => ({ id: r.id, fix: r.judge?.dimensions?.[d.key]?.fix }))
      .filter((x) => x.fix && x.fix.toLowerCase() !== "none");
    if (!fixes.length) continue;
    lines.push(`### ${d.label}`);
    for (const x of fixes) lines.push(`- (\`${x.id}\`) ${x.fix}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function writeReport(results, meta, outDir) {
  mkdirSync(outDir, { recursive: true });
  const stamp = meta.startedAt.replace(/[:.]/g, "-");
  const mdPath = `${outDir}/report-${stamp}.md`;
  const jsonPath = `${outDir}/results-${stamp}.json`;
  writeFileSync(mdPath, buildReport(results, meta), "utf8");
  writeFileSync(jsonPath, JSON.stringify({ meta, results }, null, 2), "utf8");
  return { mdPath, jsonPath };
}
