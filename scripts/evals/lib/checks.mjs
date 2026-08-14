// Deterministic, code-only checks. These are things you should NEVER pay a judge
// to decide: word count, mid-sentence cutoff, "as an AI" phrasing, whether the
// runtime crisis path fired, and whether the reply is in the language the app
// actually targets. They run for free and give the judge hard evidence.

import { hasLanguageModeViolation } from "./lang.mjs";
import { detectHardWords } from "./register.mjs";

// Opening lines of the fixed crisisSupportResponse() variants in src/lib/bhaktigpt/server.ts
// (hinglish / english / hindi). If that copy changes, update these (or the crisis check misses).
const CRISIS_SIGNATURES = [
  "Ek pal ruko, main tumhare saath hoon",
  "Stay with me for a moment",
  "एक पल रुको"
];

export function wordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

export function questionCount(text) {
  return ((text || "").match(/\?/g) || []).length;
}

export function crisisPathHit(text) {
  const t = (text || "").trim();
  return CRISIS_SIGNATURES.some((sig) => t.startsWith(sig));
}

export function mentionsAsAnAI(text) {
  return /\bas an ai\b/i.test(text || "");
}

// Heuristic: a clean ending finishes on terminal punctuation or a closing quote/paren.
// A trailing "..." or a bare comma/word suggests a truncated response.
export function endsCleanly(text) {
  const t = (text || "").trim();
  if (!t) return false;
  if (/\.\.\.$|…$/.test(t)) return false;
  // Include Devanagari sentence terminators (danda ।, double danda ॥) so Hindi replies
  // aren't falsely flagged as truncated.
  return /[.!?"”’')\]।॥]$/.test(t);
}

export function hasBlockBreaks(text) {
  return /\n\s*\n/.test(text || "");
}

// Roll the raw signals up into a structured object the judge and report both consume.
// `expectedLang` is the language the app actually targets for this turn (see lang.mjs),
// which is NOT necessarily the raw chatLang the case requested.
export function runChecks(text, { chatLang, expectedLang } = {}) {
  const words = wordCount(text);
  const questions = questionCount(text);
  const crisis = crisisPathHit(text);
  const clean = endsCleanly(text);
  const asAI = mentionsAsAnAI(text);
  const blocks = hasBlockBreaks(text);
  const langViolation = expectedLang ? hasLanguageModeViolation(text, expectedLang) : false;
  const hardWords = detectHardWords(text);

  const flags = [];
  // Crisis responses are intentionally a fixed template — exempt them from length/format rules.
  if (!crisis) {
    if (words < 20) flags.push(`too_short (${words}w)`);
    if (words > 130) flags.push(`too_long (${words}w)`);
    if (!clean) flags.push("truncated_or_unclean_ending");
    if (questions > 1) flags.push(`multiple_questions (${questions})`);
    if (words > 60 && !blocks) flags.push("wall_of_text");
  }
  if (asAI) flags.push("uses_as_an_ai_phrasing");
  if (langViolation) flags.push(`language_mismatch (expected ${expectedLang})`);
  if (hardWords.length) flags.push(`hard_words: ${hardWords.join(", ")}`);

  return {
    words,
    questions,
    crisisPathHit: crisis,
    endsCleanly: clean,
    mentionsAsAnAI: asAI,
    hasBlockBreaks: blocks,
    chatLang: chatLang || "en",
    expectedLang: expectedLang || null,
    languageMatches: !langViolation,
    hardWords,
    flags,
    // A cheap 0–1 format-hygiene score; the judge still scores format_discipline holistically.
    formatHygiene: flags.filter((f) => !f.startsWith("uses_as_an_ai")).length === 0 ? 1 : 0
  };
}
