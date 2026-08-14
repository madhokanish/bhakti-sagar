#!/usr/bin/env node
// Render a results-*.json into a self-contained HTML report (question + graded answer +
// per-dimension scores + why each dimension failed). Emits an Artifact-ready HTML fragment
// (inline <style>/<script>, no <html>/<head>/<body> wrappers).
//
// Usage: node scripts/evals/render-report.mjs [results.json] [out.html]

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { DIMENSIONS } from "./lib/rubric.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "out");

function latestResults() {
  const files = readdirSync(OUT_DIR)
    .filter((f) => f.startsWith("results-") && f.endsWith(".json"))
    .sort()
    .reverse();
  if (!files.length) throw new Error("No results-*.json found in out/. Run the eval first.");
  return join(OUT_DIR, files[0]);
}

const inPath = process.argv[2] ? resolve(process.argv[2]) : latestResults();
const outPath = process.argv[3] ? resolve(process.argv[3]) : inPath.replace(/results-(.*)\.json$/, "report-$1.html");

const { meta, results } = JSON.parse(readFileSync(inPath, "utf8"));

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const GUIDE_LABEL = {
  krishna: "Shri Krishna",
  shiv: "Shiv Ji",
  hanuman: "Hanuman Ji",
  shani: "Shani Dev",
  lakshmi: "Lakshmi Ji"
};
const CAT_LABEL = {
  in_scope: "in scope",
  out_of_scope: "out of scope",
  safety: "safety",
  adversarial: "adversarial",
  multilingual: "multilingual",
  multi_turn: "multi-turn"
};

// ---- aggregate stats ----
const total = results.length;
const passed = results.filter((r) => r.judge?.overall_verdict === "pass").length;
const failed = total - passed;

function avg(nums) {
  const xs = nums.filter((n) => typeof n === "number");
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

const dimStats = DIMENSIONS.map((d) => ({
  ...d,
  avg: avg(results.map((r) => r.judge?.dimensions?.[d.key]?.score)),
  fails: results.filter((r) => r.judge?.dimensions?.[d.key]?.verdict === "fail").length
}));

const guides = [...new Set(results.map((r) => r.guideId))];
const guideStats = guides
  .map((g) => {
    const sub = results.filter((r) => r.guideId === g);
    return {
      g,
      pass: sub.filter((r) => r.judge?.overall_verdict === "pass").length,
      total: sub.length,
      avg: avg(sub.map((r) => r.judge?.overall_score))
    };
  })
  .sort((a, b) => a.pass / a.total - b.pass / b.total);

const cats = [...new Set(results.map((r) => r.category))];
const catStats = cats
  .map((c) => {
    const sub = results.filter((r) => r.category === c);
    return { c, pass: sub.filter((r) => r.judge?.overall_verdict === "pass").length, total: sub.length };
  })
  .sort((a, b) => a.pass / a.total - b.pass / b.total);

// ---- render helpers ----
function meter(score, verdict) {
  // 5-dot meter coloured by pass/fail
  const dots = [1, 2, 3, 4, 5]
    .map((n) => `<span class="dot ${n <= score ? (verdict === "fail" ? "on fail" : "on pass") : "off"}"></span>`)
    .join("");
  return `<span class="meter" title="${score}/5">${dots}</span>`;
}

function dimRow(r) {
  return DIMENSIONS.map((d) => {
    const dim = r.judge?.dimensions?.[d.key];
    if (!dim) return "";
    const cls = dim.verdict === "fail" ? "fail" : "pass";
    return `<div class="dim ${cls}">
      <span class="dim-label">${esc(d.label)}</span>
      ${meter(dim.score, dim.verdict)}
      <span class="dim-score ${cls}">${dim.score}/5</span>
    </div>`;
  }).join("");
}

function failReasons(r) {
  const rows = DIMENSIONS.map((d) => {
    const dim = r.judge?.dimensions?.[d.key];
    if (!dim || dim.verdict !== "fail") return "";
    const ev = dim.evidence && dim.evidence.toLowerCase() !== "none" ? esc(dim.evidence) : "";
    const fix = dim.fix && dim.fix.toLowerCase() !== "none" ? esc(dim.fix) : "";
    return `<div class="reason">
      <div class="reason-head"><span class="x">✕</span> ${esc(d.label)} <span class="reason-score">${dim.score}/5</span></div>
      ${ev ? `<blockquote class="evidence">${ev}</blockquote>` : ""}
      ${fix ? `<div class="fix"><span class="fix-tag">fix</span> ${fix}</div>` : ""}
    </div>`;
  }).join("");
  return rows;
}

function turnsBlock(r) {
  if (r.turns.length > 1) {
    return r.turns
      .map(
        (t, i) => `<div class="turn">
        <div class="qa q"><span class="qa-tag">user · turn ${i + 1}</span><p>${esc(t.user)}</p></div>
        <div class="qa a ${i === r.turns.length - 1 ? "graded" : ""}"><span class="qa-tag">reply${
          i === r.turns.length - 1 ? " · graded" : ""
        }</span><p>${esc(t.assistant || "—")}</p></div>
      </div>`
      )
      .join("");
  }
  const t = r.turns[0] || { user: "", assistant: r.final };
  return `<div class="qa q"><span class="qa-tag">question</span><p>${esc(t.user)}</p></div>
    <div class="qa a graded"><span class="qa-tag">answer · graded</span><p>${esc(r.final || t.assistant || "—")}</p></div>`;
}

function caseCard(r) {
  const v = r.judge?.overall_verdict || "error";
  const score = r.judge?.overall_score ?? "?";
  const met = r.judge?.met_user_need;
  const flags = (r.checks?.flags || []).filter((f) => !f.startsWith("language_mismatch") || true);
  const langNote =
    r.checks?.expectedLang && r.checks.expectedLang !== "en"
      ? `<span class="chip lang">reply lang: ${esc(r.checks.expectedLang)}</span>`
      : "";
  return `<article class="case" data-verdict="${v}" data-guide="${esc(r.guideId)}" data-category="${esc(r.category)}" data-score="${score}">
    <div class="case-head">
      <div class="case-id">
        <span class="verdict ${v}">${v === "pass" ? "PASS" : v === "fail" ? "FAIL" : "ERR"} · ${score}/5</span>
        <code>${esc(r.id)}</code>
      </div>
      <div class="case-tags">
        <span class="chip guide">${esc(GUIDE_LABEL[r.guideId] || r.guideId)}</span>
        <span class="chip cat">${esc(CAT_LABEL[r.category] || r.category)}</span>
        <span class="chip need ${met ? "yes" : "no"}">${met ? "met need" : "missed need"}</span>
        ${langNote}
      </div>
    </div>
    ${r.intent ? `<div class="intent">User came for: <strong>${esc(r.intent.replace(/_/g, " "))}</strong></div>` : ""}
    ${r.judge?.headline ? `<div class="headline">${esc(r.judge.headline)}</div>` : ""}
    <div class="exchange">${turnsBlock(r)}</div>
    ${flags.length ? `<div class="autoflags">auto-checks: ${flags.map((f) => `<span class="flag">${esc(f)}</span>`).join("")}</div>` : ""}
    <div class="dims">${dimRow(r)}</div>
    ${v === "fail" ? `<div class="reasons"><div class="reasons-title">Why it failed</div>${failReasons(r)}</div>` : ""}
  </article>`;
}

// fails first (lowest score first), then passes
const ordered = [...results].sort((a, b) => {
  const va = a.judge?.overall_verdict === "pass" ? 1 : 0;
  const vb = b.judge?.overall_verdict === "pass" ? 1 : 0;
  if (va !== vb) return va - vb;
  return (a.judge?.overall_score ?? 0) - (b.judge?.overall_score ?? 0);
});

const runDate = new Date(meta.startedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

const html = `<style>
  :root{
    --paper:#f6f3ee; --card:#fffdf9; --ink:#241d15; --ink-soft:#6f6252; --ink-faint:#98897658;
    --line:#e6dccf; --accent:#c9741a; --maroon:#7c1f2b;
    --pass:#2f7d4f; --pass-bg:#eaf3ec; --fail:#c0392b; --fail-bg:#f8ecea; --warn:#a9791a;
    --q-bg:#f0ece3; --a-bg:#fbf7ef; --code:#3a2f22;
    --shadow:0 1px 2px rgba(60,40,20,.05),0 8px 24px rgba(60,40,20,.05);
    --mono:ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace;
    --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  }
  @media (prefers-color-scheme:dark){
    :root{
      --paper:#16120e; --card:#201a14; --ink:#ede4d5; --ink-soft:#a89a86; --ink-faint:#e9dcc733;
      --line:#332a20; --accent:#e59a45; --maroon:#c98a92;
      --pass:#54c184; --pass-bg:#16281d; --fail:#e77163; --fail-bg:#2b1917; --warn:#d6a63a;
      --q-bg:#241d16; --a-bg:#1c1710; --code:#d9cbb4; --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 30px rgba(0,0,0,.35);
    }
  }
  :root[data-theme="light"]{
    --paper:#f6f3ee; --card:#fffdf9; --ink:#241d15; --ink-soft:#6f6252; --line:#e6dccf; --accent:#c9741a; --maroon:#7c1f2b;
    --pass:#2f7d4f; --pass-bg:#eaf3ec; --fail:#c0392b; --fail-bg:#f8ecea; --warn:#a9791a;
    --q-bg:#f0ece3; --a-bg:#fbf7ef; --code:#3a2f22; --ink-faint:#98897658;
  }
  :root[data-theme="dark"]{
    --paper:#16120e; --card:#201a14; --ink:#ede4d5; --ink-soft:#a89a86; --line:#332a20; --accent:#e59a45; --maroon:#c98a92;
    --pass:#54c184; --pass-bg:#16281d; --fail:#e77163; --fail-bg:#2b1917; --warn:#d6a63a;
    --q-bg:#241d16; --a-bg:#1c1710; --code:#d9cbb4; --ink-faint:#e9dcc733;
  }

  *{box-sizing:border-box}
  .report{background:var(--paper);color:var(--ink);font-family:var(--sans);line-height:1.5;
    -webkit-font-smoothing:antialiased;padding:0 20px 80px;max-width:1000px;margin:0 auto;}
  .report a{color:var(--accent)}

  .masthead{padding:44px 0 24px;border-bottom:2px solid var(--ink);margin-bottom:4px}
  .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
  .masthead h1{font-family:var(--serif);font-weight:600;font-size:clamp(28px,5vw,44px);line-height:1.05;letter-spacing:-.01em;text-wrap:balance;margin:0 0 14px}
  .run-meta{display:flex;flex-wrap:wrap;gap:8px;font-family:var(--mono);font-size:12px;color:var(--ink-soft)}
  .run-meta span{border:1px solid var(--line);border-radius:999px;padding:3px 10px;background:var(--card)}
  .run-meta b{color:var(--ink)}

  .summary{display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:center;padding:26px 0;border-bottom:1px solid var(--line)}
  @media(max-width:640px){.summary{grid-template-columns:1fr}}
  .bigstat{text-align:center}
  .bigstat .pct{font-family:var(--serif);font-size:56px;line-height:1;font-weight:600}
  .bigstat .frac{font-family:var(--mono);font-size:13px;color:var(--ink-soft);margin-top:6px}
  .bigstat .barwrap{width:150px;height:8px;border-radius:999px;background:var(--fail-bg);overflow:hidden;margin:12px auto 0;border:1px solid var(--line)}
  .bigstat .barfill{height:100%;background:var(--pass)}
  .dimbars{display:grid;gap:9px}
  .dimbar{display:grid;grid-template-columns:150px 1fr 74px;align-items:center;gap:12px;font-size:13px}
  @media(max-width:640px){.dimbar{grid-template-columns:120px 1fr 64px}}
  .dimbar .track{height:9px;background:var(--ink-faint);border-radius:999px;overflow:hidden}
  .dimbar .val{height:100%;border-radius:999px}
  .dimbar .num{font-family:var(--mono);color:var(--ink-soft);text-align:right}
  .dimbar .num b{color:var(--ink)}

  .tables{display:grid;grid-template-columns:1fr 1fr;gap:28px;padding:24px 0;border-bottom:1px solid var(--line)}
  @media(max-width:640px){.tables{grid-template-columns:1fr}}
  .tbl h3{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin:0 0 10px}
  .tbl table{width:100%;border-collapse:collapse;font-size:13px}
  .tbl td{padding:5px 0;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}
  .tbl td:last-child{text-align:right;font-family:var(--mono)}
  .tbl .rate{display:inline-block;min-width:38px}
  .rate.low{color:var(--fail)} .rate.mid{color:var(--warn)} .rate.high{color:var(--pass)}

  .controls{position:sticky;top:0;z-index:5;background:var(--paper);padding:16px 0;margin-bottom:6px;border-bottom:1px solid var(--line);
    display:flex;flex-wrap:wrap;gap:14px;align-items:center}
  .fgroup{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  .fgroup .lbl{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);margin-right:2px}
  .chipbtn{font:inherit;font-size:12px;cursor:pointer;border:1px solid var(--line);background:var(--card);color:var(--ink-soft);
    padding:4px 11px;border-radius:999px;transition:.12s}
  .chipbtn:hover{border-color:var(--accent);color:var(--ink)}
  .chipbtn[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  .chipbtn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .count{margin-left:auto;font-family:var(--mono);font-size:12px;color:var(--ink-soft)}

  .cases{display:flex;flex-direction:column;gap:16px;padding-top:16px}
  .case{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 18px 16px;box-shadow:var(--shadow)}
  .case[data-verdict="fail"]{border-left:4px solid var(--fail)}
  .case[data-verdict="pass"]{border-left:4px solid var(--pass)}
  .case.hidden{display:none}
  .case-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center}
  .case-id{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .case-id code{font-family:var(--mono);font-size:13px;color:var(--code)}
  .verdict{font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.04em;padding:3px 9px;border-radius:6px}
  .verdict.pass{background:var(--pass-bg);color:var(--pass)}
  .verdict.fail{background:var(--fail-bg);color:var(--fail)}
  .case-tags{display:flex;gap:6px;flex-wrap:wrap}
  .chip{font-size:11px;font-family:var(--mono);padding:2px 9px;border-radius:999px;border:1px solid var(--line);color:var(--ink-soft);white-space:nowrap}
  .chip.guide{border-color:var(--accent);color:var(--accent)}
  .chip.need.no{color:var(--fail);border-color:var(--fail)}
  .chip.need.yes{color:var(--pass);border-color:var(--pass)}
  .intent{font-size:13px;color:var(--ink-soft);margin-top:12px}
  .intent strong{color:var(--ink)}
  .headline{font-size:14.5px;font-weight:600;margin-top:6px;text-wrap:pretty}

  .exchange{margin-top:14px;display:flex;flex-direction:column;gap:8px}
  .turn{display:flex;flex-direction:column;gap:8px;padding-bottom:8px;border-bottom:1px dashed var(--line)}
  .turn:last-child{border-bottom:none;padding-bottom:0}
  .qa{border-radius:10px;padding:10px 13px}
  .qa .qa-tag{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:4px}
  .qa p{margin:0;white-space:pre-wrap;font-size:14px}
  .qa.q{background:var(--q-bg)}
  .qa.a{background:var(--a-bg);border:1px solid var(--line)}
  .qa.a.graded{border-color:var(--accent)}
  .qa.a.graded .qa-tag{color:var(--accent)}

  .autoflags{margin-top:12px;font-family:var(--mono);font-size:11px;color:var(--ink-soft)}
  .flag{display:inline-block;background:var(--fail-bg);color:var(--fail);padding:2px 8px;border-radius:6px;margin-left:6px}

  .dims{margin-top:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px 18px}
  .dim{display:flex;align-items:center;gap:8px;font-size:12.5px}
  .dim-label{color:var(--ink-soft);flex:1}
  .dim.fail .dim-label{color:var(--ink)}
  .meter{display:inline-flex;gap:2px}
  .dot{width:7px;height:7px;border-radius:50%}
  .dot.off{background:var(--ink-faint)}
  .dot.on.pass{background:var(--pass)} .dot.on.fail{background:var(--fail)}
  .dim-score{font-family:var(--mono);font-size:11px;width:30px;text-align:right}
  .dim-score.pass{color:var(--pass)} .dim-score.fail{color:var(--fail)}

  .reasons{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:12px}
  .reasons-title{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--fail)}
  .reason-head{font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:8px}
  .reason-head .x{color:var(--fail)}
  .reason-score{font-family:var(--mono);font-size:11px;color:var(--fail);font-weight:400}
  .evidence{margin:7px 0 0;padding:7px 12px;border-left:3px solid var(--ink-faint);background:var(--q-bg);
    font-size:13px;font-style:italic;color:var(--ink-soft);border-radius:0 8px 8px 0;white-space:pre-wrap}
  .fix{margin-top:7px;font-size:13px;color:var(--ink)}
  .fix-tag{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;background:var(--accent);color:#fff;padding:2px 7px;border-radius:5px;margin-right:6px}
  @media (prefers-color-scheme:dark){.fix-tag{color:#1a1409}}
  :root[data-theme="dark"] .fix-tag{color:#1a1409}

  .empty{text-align:center;color:var(--ink-soft);padding:40px;font-size:14px}
</style>

<div class="report">
  <header class="masthead">
    <div class="eyebrow">LLM-as-judge evaluation</div>
    <h1>Bhakti Chat — AI answer review</h1>
    <div class="run-meta">
      <span><b>${total}</b> cases</span>
      <span>judge <b>${esc(meta.judgeModel)}</b></span>
      <span>model under test <b>${esc(meta.modelSeen || "?")}</b></span>
      <span>target <b>${esc((meta.baseUrl || "").replace(/^https?:\/\//, ""))}</b></span>
      <span>${esc(runDate)}</span>
    </div>
  </header>

  <section class="summary">
    <div class="bigstat">
      <div class="pct">${Math.round((passed / total) * 100)}%</div>
      <div class="frac">${passed} / ${total} passed</div>
      <div class="barwrap"><div class="barfill" style="width:${(passed / total) * 100}%"></div></div>
    </div>
    <div class="dimbars">
      ${dimStats
        .map((d) => {
          const w = (d.avg / 5) * 100;
          const color = d.avg >= 4 ? "var(--pass)" : d.avg >= 3 ? "var(--warn)" : "var(--fail)";
          return `<div class="dimbar">
            <span>${esc(d.label)}</span>
            <span class="track"><span class="val" style="width:${w}%;background:${color}"></span></span>
            <span class="num"><b>${d.avg.toFixed(2)}</b>/5 · ${d.fails}✕</span>
          </div>`;
        })
        .join("")}
    </div>
  </section>

  <section class="tables">
    <div class="tbl">
      <h3>Pass rate by guide</h3>
      <table>${guideStats
        .map((s) => {
          const rate = Math.round((s.pass / s.total) * 100);
          const cls = rate < 40 ? "low" : rate < 70 ? "mid" : "high";
          return `<tr><td>${esc(GUIDE_LABEL[s.g] || s.g)}</td><td><span class="rate ${cls}">${rate}%</span> ${s.pass}/${s.total} · avg ${s.avg.toFixed(2)}</td></tr>`;
        })
        .join("")}</table>
    </div>
    <div class="tbl">
      <h3>Pass rate by category</h3>
      <table>${catStats
        .map((s) => {
          const rate = Math.round((s.pass / s.total) * 100);
          const cls = rate < 40 ? "low" : rate < 70 ? "mid" : "high";
          return `<tr><td>${esc(CAT_LABEL[s.c] || s.c)}</td><td><span class="rate ${cls}">${rate}%</span> ${s.pass}/${s.total}</td></tr>`;
        })
        .join("")}</table>
    </div>
  </section>

  <div class="controls">
    <div class="fgroup" data-filter="verdict">
      <span class="lbl">Show</span>
      <button class="chipbtn" data-val="fail" aria-pressed="true">Failures (${failed})</button>
      <button class="chipbtn" data-val="all" aria-pressed="false">All (${total})</button>
      <button class="chipbtn" data-val="pass" aria-pressed="false">Passes (${passed})</button>
    </div>
    <div class="fgroup" data-filter="guide">
      <span class="lbl">Guide</span>
      <button class="chipbtn" data-val="all" aria-pressed="true">all</button>
      ${guides.map((g) => `<button class="chipbtn" data-val="${esc(g)}" aria-pressed="false">${esc(g)}</button>`).join("")}
    </div>
    <span class="count" id="count"></span>
  </div>

  <main class="cases" id="cases">
    ${ordered.map(caseCard).join("\n")}
    <div class="empty hidden" id="empty">No cases match these filters.</div>
  </main>
</div>

<script>
(function(){
  var state={verdict:"fail",guide:"all"};
  var cases=Array.prototype.slice.call(document.querySelectorAll(".case"));
  var count=document.getElementById("count");
  var empty=document.getElementById("empty");
  function apply(){
    var shown=0;
    cases.forEach(function(c){
      var okV=state.verdict==="all"||c.dataset.verdict===state.verdict;
      var okG=state.guide==="all"||c.dataset.guide===state.guide;
      var vis=okV&&okG;
      c.classList.toggle("hidden",!vis);
      if(vis)shown++;
    });
    count.textContent=shown+" shown";
    empty.classList.toggle("hidden",shown>0);
  }
  document.querySelectorAll(".fgroup").forEach(function(group){
    var key=group.dataset.filter;
    group.querySelectorAll(".chipbtn").forEach(function(btn){
      btn.addEventListener("click",function(){
        state[key]=btn.dataset.val;
        group.querySelectorAll(".chipbtn").forEach(function(b){b.setAttribute("aria-pressed",b===btn?"true":"false");});
        apply();
      });
    });
  });
  apply();
})();
</script>`;

writeFileSync(outPath, html, "utf8");
console.log("Wrote", outPath, `(${(html.length / 1024).toFixed(0)} KB)`);
