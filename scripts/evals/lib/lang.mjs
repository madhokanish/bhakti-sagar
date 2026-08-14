// Mirror of the app's real language contract (src/app/api/bhaktigpt/chat/route.ts).
//
// IMPORTANT: the app deliberately has NO textbook-English reply mode. The Latin picker
// option is labelled "en" but resolves to Hinglish, and Hinglish is the primary/default
// language. So the eval must judge replies against the language the app actually targets,
// not against the literal `chatLang` string. Keep this in sync with resolveChatLanguage
// and detectLanguageFromText in route.ts.

const DEVANAGARI = /[ऀ-ॿ]/;
const HINDI_MODE_LATIN_WORD_ALLOWANCE = 2;

// Devanagari => hi; 2+ Latin words => hinglish; otherwise no signal.
export function detectLanguageFromText(text) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;
  if (DEVANAGARI.test(trimmed)) return "hi";
  const latinWords = trimmed.match(/[A-Za-z]{2,}/g) ?? [];
  if (latinWords.length >= 2) return "hinglish";
  return null;
}

// The language the app will actually reply in for a given turn.
export function resolveChatLanguage(preferredValue, userMessage) {
  const fromMessage = detectLanguageFromText(userMessage);
  if (fromMessage) return fromMessage;
  const preferred = (preferredValue ?? "").toLowerCase();
  if (preferred === "hi" || preferred === "hinglish") return preferred;
  if (preferred === "en") return "hinglish"; // Latin option is Hinglish here.
  return "hinglish";
}

// The app's own regeneration rule for a wrong-script reply, mirrored for the eval.
export function hasLanguageModeViolation(text, expectedLang) {
  if (expectedLang === "en" || expectedLang === "hinglish") {
    return DEVANAGARI.test(text || "");
  }
  // hi: a couple of Latin words are proper nouns (BhaktiChat, UPI); more is real drift.
  const latinWords = (text || "").match(/[A-Za-z]{2,}/g) ?? [];
  return latinWords.length > HINDI_MODE_LATIN_WORD_ALLOWANCE;
}

export function languageLabel(lang) {
  if (lang === "hi") return "Hindi (Devanagari script)";
  if (lang === "hinglish" || lang === "en") return "Hinglish (Roman/Latin Hindi, WhatsApp-style)";
  return lang;
}
