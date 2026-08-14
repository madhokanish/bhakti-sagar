// LLM-as-judge. Uses a strong OpenAI model (default gpt-5) to score one model output
// against the guide's own contract. It scores the FIVE dimensions from rubric.mjs,
// each with an explicit verdict, a verbatim evidence quote, and a concrete fix — the
// fix fields are what roll up into "scopes for improvement" in the report.
//
// Judge model is intentionally stronger than the model under test (gpt-4.1-mini) to
// reduce lenient self-grading. Override with EVAL_JUDGE_MODEL.

import { DIMENSIONS, styleContractText, guideRubricText } from "./rubric.mjs";
import { languageLabel } from "./lang.mjs";

const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL?.trim() || "gpt-5";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
// gpt-5 is a reasoning model: hidden reasoning tokens are billed against max_completion_tokens
// and are produced BEFORE the visible JSON. Too small a budget => reasoning eats it all and
// content comes back empty (finish_reason "length"). Give generous headroom, and keep reasoning
// light since grading against a fixed rubric doesn't need deep deliberation.
const JUDGE_MAX_TOKENS = Number(process.env.EVAL_JUDGE_MAX_TOKENS) || 6000;
const JUDGE_REASONING_EFFORT = process.env.EVAL_JUDGE_REASONING_EFFORT?.trim() || "low";

function buildSystemPrompt(guideId) {
  return [
    "You are a rigorous, skeptical QA evaluator for a Hindu devotional AI product called Bhakti Chat.",
    "You are NOT the assistant and you are NOT devotional — you are grading another model's reply.",
    "Grade ONLY against the contract below. Do not invent standards. Be strict: reward genuine",
    "need-fit and persona fidelity, and penalize generic-assistant flattening, scope violations,",
    "predictions/doom, and format sloppiness. Quote the reply verbatim as evidence for every finding.",
    "",
    "LANGUAGE: This product's primary language is Hinglish (Roman/Latin-script Hindi). A reply",
    "in Hinglish is CORRECT and must NOT be penalized for 'not being English'. Judge language only",
    "against the 'Expected reply language' given below, and trust the deterministic languageMatches flag.",
    "",
    "NATURALNESS (language_naturalness dimension): grade how the reply READS to an ordinary user,",
    "separately from which language it is in. Replies must sound like a warm real person texting on",
    "WhatsApp — simple, everyday, conversational — NOT like a Sanskrit scholar, a scripture translation,",
    "or a school textbook. Penalize: hard/obscure tatsama-Sanskrit words, over-formal 'shuddh' Hindi,",
    "literary or idealistic grammar, and stilted constructions no one actually speaks. Examples of TOO",
    "HARD -> NATURAL: 'pratinidhitva karta hoon' -> 'main tumhare saath hoon'; 'svadharma ka anusaran' ->",
    "'apna farz'; 'kritagyata' -> 'shukar/shukrguzaari'; 'sthitipragya bano' -> 'shaant mann se socho';",
    "'abhilasha' -> 'chaahat'; 'visheshagya' -> 'expert'. The deterministic checks include a 'hardWords'",
    "list — treat any entries as evidence of an unnatural register. IMPORTANT TENSION: persona vocabulary",
    "is good, but a reply that achieves persona ONLY by using hard Sanskrit should still score persona",
    "on its merits while scoring language_naturalness LOW. Simple everyday words in the guide's voice is",
    "the target — natural first, ornate never.",
    "",
    "=== GLOBAL STYLE CONTRACT (applies to every guide) ===",
    styleContractText(),
    "",
    "=== SELECTED GUIDE SCOPE ===",
    guideRubricText(guideId),
    "",
    "=== DIMENSIONS TO SCORE (1=fails badly, 5=exemplary) ===",
    ...DIMENSIONS.map((d) => `- ${d.key} (${d.label}): ${d.describe}`),
    "",
    "Return STRICT JSON only, matching exactly this shape:",
    "{",
    '  "dimensions": {',
    ...DIMENSIONS.map(
      (d, i) =>
        `    "${d.key}": { "score": 1-5, "verdict": "pass"|"fail", "evidence": "<short verbatim quote or \\"none\\">", "fix": "<one concrete improvement, or \\"none\\">" }${
          i < DIMENSIONS.length - 1 ? "," : ""
        }`
    ),
    "  },",
    '  "overall_score": 1-5,',
    '  "overall_verdict": "pass"|"fail",',
    '  "met_user_need": true|false,',
    '  "headline": "<one-sentence summary of the single most important issue, or \\"clean\\">"',
    "}"
  ].join("\n");
}

function buildUserPrompt({ testCase, conversation, checks }) {
  const transcript = conversation.turns
    .map((t, i) => `USER (turn ${i + 1}): ${t.user}\nASSISTANT (turn ${i + 1}): ${t.assistant || "<empty>"}`)
    .join("\n\n");

  const expect = testCase.expect || {};
  return [
    `CASE ID: ${testCase.id}`,
    `CATEGORY: ${testCase.category}`,
    `USER'S UNDERLYING NEED / INTENT: ${testCase.intent || "(unspecified)"}`,
    `EXPECTED REPLY LANGUAGE: ${languageLabel(checks.expectedLang || "hinglish")} (languageMatches=${checks.languageMatches})`,
    testCase.notes ? `TESTER NOTES: ${testCase.notes}` : "",
    "",
    expect.must?.length ? `The reply MUST: ${expect.must.map((x) => `"${x}"`).join("; ")}` : "",
    expect.must_not?.length ? `The reply MUST NOT: ${expect.must_not.map((x) => `"${x}"`).join("; ")}` : "",
    "",
    "=== DETERMINISTIC CHECKS ALREADY RUN ON THE FINAL REPLY (trust these facts) ===",
    JSON.stringify(checks),
    "",
    "=== FULL CONVERSATION ===",
    transcript,
    "",
    "Judge the FINAL assistant reply primarily, but consider the whole conversation for persona drift and repetition.",
    "Respond with the strict JSON object now."
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJson(content) {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(content.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function judge({ testCase, conversation, checks, apiKey, model = JUDGE_MODEL, timeoutMs = 90_000 }) {
  const guideId = testCase.guideId;
  const isReasoningModel = /^(gpt-5|o\d)/i.test(model);
  const body = {
    model,
    messages: [
      { role: "system", content: buildSystemPrompt(guideId) },
      { role: "user", content: buildUserPrompt({ testCase, conversation, checks }) }
    ],
    response_format: { type: "json_object" },
    // max_completion_tokens (not max_tokens) is what gpt-5 / o-series accept; gpt-4.1 accepts it too.
    max_completion_tokens: JUDGE_MAX_TOKENS,
    // reasoning_effort is only valid on reasoning models; sending it to gpt-4.1 would 400.
    ...(isReasoningModel ? { reasoning_effort: JUDGE_REASONING_EFFORT } : {})
  };

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Judge API ${res.status} (model=${model}): ${errText.slice(0, 400)}`);
  }

  const json = await res.json();
  const choice = json?.choices?.[0];
  const content = choice?.message?.content ?? "";
  if (!content && choice?.finish_reason === "length") {
    throw new Error(
      `Judge hit token limit before producing output (model=${model}, reasoning ate the budget). Raise EVAL_JUDGE_MAX_TOKENS (currently ${JUDGE_MAX_TOKENS}).`
    );
  }
  const parsed = extractJson(content);
  if (!parsed || !parsed.dimensions) {
    throw new Error(`Judge returned unparseable output (model=${model}): ${content.slice(0, 300)}`);
  }
  return { model, ...parsed };
}

export const JUDGE_MODEL_DEFAULT = JUDGE_MODEL;
