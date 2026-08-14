// Register / naturalness helper.
//
// The judge does the real grading of "does this sound like a normal person or a Sanskrit
// scholar", but a small, deliberately CONSERVATIVE watchlist of genuinely hard tatsama /
// literary words gives the judge concrete evidence and surfaces offenders in the report.
// This is a hint, never a hard fail — core devotional words (dharma, karma, seva, bhakti,
// shanti) are intentionally NOT here; only words an average user would stumble on.

const HARD_WORDS_ROMAN = [
  "pratinidhitva",
  "sthitipragya",
  "sthitpragya",
  "svadharma",
  "swadharma",
  "samatva",
  "abhilasha",
  "kritagyata",
  "krtagyata",
  "nishkama",
  "nishkam",
  "visheshagya",
  "antaratma",
  "paramatma",
  "sakshatkar",
  "tatvagyan",
  "grihastha",
  "anveshan",
  "paripurna",
  "chittavritti"
];

const HARD_WORDS_DEVANAGARI = [
  "प्रतिनिधित्व",
  "स्थितप्रज्ञ",
  "स्वधर्म",
  "समत्व",
  "अभिलाषा",
  "कृतज्ञता",
  "निष्काम",
  "विशेषज्ञ",
  "अंतरात्मा",
  "परमात्मा",
  "साक्षात्कार",
  "तत्वज्ञान",
  "गृहस्थ",
  "अन्वेषण",
  "परिपूर्ण",
  "चित्तवृत्ति"
];

// Return the distinct hard words that appear in the reply (for judge evidence + report).
export function detectHardWords(text) {
  const t = text || "";
  const lower = t.toLowerCase();
  const hits = new Set();
  for (const w of HARD_WORDS_ROMAN) {
    if (new RegExp(`\\b${w}\\b`, "i").test(lower)) hits.add(w);
  }
  for (const w of HARD_WORDS_DEVANAGARI) {
    if (t.includes(w)) hits.add(w);
  }
  return [...hits];
}
