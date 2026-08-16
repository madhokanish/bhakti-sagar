import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  BHAKTIGPT_DISCLAIMER,
  getGuide,
  isGuideId,
  type BhaktiGuideId
} from "@/lib/bhaktigpt/guides";
import { pickKrishnaQuirk } from "@/lib/bhaktigpt/krishnaQuirks";
import { KRISHNA_SECONDARY_GUARD } from "@/lib/bhaktigpt/personas/krishnaSystemPrompt";
import { LAKSHMI_SECONDARY_GUARD } from "@/lib/bhaktigpt/personas/lakshmiSystemPrompt";
import { SHANI_SECONDARY_GUARD } from "@/lib/bhaktigpt/personas/shaniSystemPrompt";
import { SHIV_SECONDARY_GUARD } from "@/lib/bhaktigpt/personas/shivSystemPrompt";
import { HANUMAN_SECONDARY_GUARD } from "@/lib/bhaktigpt/personas/hanumanSystemPrompt";
import { chatOpeners } from "@/lib/chatOpeners";
import { type ChatLanguage } from "@/lib/chatUILabels";
import {
  BHAKTIGPT_COOKIE,
  crisisSupportResponse,
  detectCrisisIntent,
  getUsageForIdentity,
  incrementAnonymousUsage,
  isRateLimited,
  resolveBhaktiIdentity
} from "@/lib/bhaktigpt/server";
import { trackServerEvent } from "@/lib/bhaktigpt/tracking";

export const runtime = "nodejs";

type ChatRequest = {
  guideId: BhaktiGuideId;
  conversationId?: string;
  forceNewConversation?: boolean;
  chatLang?: ChatLanguage;
  message: string;
};

type GuideConversationSummary = {
  id: string;
  guideId: BhaktiGuideId;
  title: string | null;
  updatedAt: string;
  createdAt: string;
  hasUserMessage: boolean;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type StreamingMetaEvent = {
  conversationId: string | null;
  remaining: number | null;
  used: number | null;
  model: string;
  cacheHit: boolean;
};

type DirectorMode = "casual" | "playful" | "wisdom" | "teachings" | "story";
type DirectorStrategy =
  | "continue_scene"
  | "answer_then_hook"
  | "advice_then_checkin"
  | "explain_then_offer_next";
type KrishnaMode = DirectorMode;
type ModelMessageRole = "system" | "developer" | "user" | "assistant";
type ModelMessage = {
  role: ModelMessageRole;
  content: string;
};
type ContextMessageRole = "system" | "user" | "assistant";
type ContextMessage = {
  role: ContextMessageRole;
  content: string;
};
type TurnMessage = {
  role: "user" | "assistant";
  content: string;
};
type ConversationState = {
  locale: ChatLanguage;
  mode: DirectorMode;
  story: {
    active: boolean;
    title: string | null;
    seed: string | null;
    entities: string[] | null;
    summary: string[] | null;
    lastBeat: string | null;
    beatCount: number;
  };
  relationship: {
    warmth: number;
    playfulness: number;
    firmness: number;
  };
  guardrails: {
    recentQuestionEnds: number;
    recentOpenLoops: number;
    recentFirstLines: string[];
  };
};
type DirectorResult = {
  mode: DirectorMode;
  strategy: DirectorStrategy;
  storyStart: boolean;
  storyContinue: boolean;
  storyExit: boolean;
  storySeed: string | null;
  storyTitle: string | null;
  storyEntities: string[] | null;
};

const encoder = new TextEncoder();
const REPLY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const HISTORY_WINDOW_LIMIT = 24;
const KRISHNA_CONTEXT_THRESHOLD_TOKENS = 3200;
const KRISHNA_CONTEXT_KEEP_LAST_RAW = 12;
const KRISHNA_CONTEXT_NEVER_SUMMARIZE_RECENT = 6;
const KRISHNA_CONTEXT_RESERVED_TOKENS = 1000;

type ReplyCacheEntry = {
  value: string;
  createdAt: number;
  model: string;
};

const globalReplyCache = globalThis as unknown as {
  bhaktiReplyCache?: Map<string, ReplyCacheEntry>;
};

function getReplyCache() {
  if (!globalReplyCache.bhaktiReplyCache) {
    globalReplyCache.bhaktiReplyCache = new Map<string, ReplyCacheEntry>();
  }
  return globalReplyCache.bhaktiReplyCache;
}

/**
 * Maps a thrown error message to a short stable code so mobile clients can
 * show a more specific message without parsing English strings.
 * Keep this in sync with iOS / Android error handling if you ever wire it up.
 */
function classifyChatError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("openai_api_key") || m.includes("api key") || m.includes("unauthorized")) {
    return "openai_auth";
  }
  if (m.includes("rate limit") || m.includes("429")) return "rate_limit";
  if (m.includes("billing") || m.includes("insufficient_quota") || m.includes("quota")) {
    return "billing";
  }
  if (m.includes("model") && (m.includes("not found") || m.includes("does not exist"))) {
    return "bad_model";
  }
  if (m.includes("timeout") || m.includes("etimedout") || m.includes("aborted")) {
    return "timeout";
  }
  if (m.includes("network") || m.includes("fetch failed") || m.includes("econnrefused")) {
    return "network";
  }
  return "unknown";
}

function getFastModel() {
  return (
    process.env.OPENAI_MODEL_BHAKTIGPT_FAST?.trim() ||
    process.env.OPENAI_MODEL_BHAKTIGPT?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4.1-mini"
  );
}

function getStrongModel() {
  return process.env.OPENAI_MODEL_BHAKTIGPT_STRONG?.trim() || getFastModel();
}

function shouldUseStrongModel(guideId: BhaktiGuideId, message: string) {
  const lowered = message.toLowerCase();
  if (guideId === "krishna") {
    const krishnaEscalationHints = [
      "deep philosophical breakdown",
      "deep breakdown",
      "long essay",
      "long explanation",
      "verse by verse",
      "verse-by-verse",
      "verse by verse explanation",
      "detailed gita explanation",
      "chapter by chapter",
      "multi-part plan",
      "detailed plan"
    ];
    return krishnaEscalationHints.some((hint) => lowered.includes(hint));
  }

  const questionCount = (message.match(/\?/g) || []).length;
  return message.length > 420 || questionCount >= 3;
}

function isDetailRequested(message: string) {
  const lowered = message.toLowerCase();
  return (
    lowered.includes("detail") ||
    lowered.includes("detailed") ||
    lowered.includes("long essay") ||
    lowered.includes("verse by verse") ||
    lowered.includes("deep explanation")
  );
}

const KRISHNA_THIRD_PERSON_PATTERN =
  /\b(krishna|lord krishna)\s+(would|will|can|could|says?|said|advises?|recommends?|thinks)\b/gi;
const KRISHNA_AS_AI_PATTERN = /\bas an ai\b/gi;
// A stronger model (gpt-4.1) commits to persona so hard it claims to LITERALLY be the deity
// ("Main Shani hoon", "main samriddhi ki devi hoon", autobiographical Krishna lore) or to
// guarantee outcomes ("phal pakka milega") — both forbidden by STYLE_CONTRACT. These catch it so
// the rewrite pass can force "speak as an AI guide INSPIRED BY the deity, no guarantees".
const DEITY_SELF_CLAIM_PATTERN =
  /\bmain\s+(shri\s+|bhagwan\s+)?(krishna|shiv|shiva|shivji|hanuman|shani|lakshmi|laxmi|mahadev)\s+(hoon|hun)\b|\bmain\b[^.?!\n]{0,40}\b(devi|devta|devata|bhagwan|avatar)\s+(hoon|hun)\b|\bi\s+am\s+(lord\s+|shri\s+|goddess\s+of\s+|the\s+god\s+of\s+|a\s+)?(krishna|shiva|shiv|hanuman|shani|lakshmi|goddess|deity)\b|makhan\s+chura|bansuri\s+baja|kailash\s+par\s+baith|मैं[^।?!\n]{0,40}(देवी|देवता|भगवान|अवतार)\s*हूँ|माखन\s*चुरा|बांसुरी\s*बजा|कैलाश\s*पर\s*बैठ/i;
const OUTCOME_GUARANTEE_PATTERN =
  /\b(phal|safalta|success|result|kaamyaabi|jeet|promotion)\b[^.?!\n]{0,20}\b(pakka|zaroor|guaranteed?|nishchit)\b|\b(pakka|zaroor)\s+(milega|milegi|hoga|hogi|dega|degi|deta hoon|dungi|dunga)\b/i;
// Despair / self-harm signals in Devanagari, romanized Hindi, and English. A real user wrote
// "संसार छोडकर जाना चाहता हूं क्या करू" and got a generic "have you tried meditating?" back.
// When this matches, the turn drops all teaching structure and switches to presence plus a
// real-world support nudge (see buildModeDirective's welfare branch).
const WELFARE_CONCERN_PATTERN =
  /संसार\s*छोड|दुनिया\s*छोड|मरना\s*चाह|जीना\s*नहीं\s*चाह|जीने\s*का\s*मन\s*नहीं|आत्महत्या|खुदकुशी|जान\s*दे\s*दू|अपने\s*आप\s*को\s*खत्म|\bsansar\s*chhod|\bduniya\s*chhod|\bmarna\s*chaht|\bmar\s*jaun|\bjeena\s*nahi\s*chaht|\bjeene\s*ka\s*mann\s*nahi|\bkhudkushi|\baatmhatya|\bjaan\s*de\s*du|\bzindagi\s*khatam\s*kar|\bsuicide\b|\bkill\s*myself\b|\bend\s*(my\s*life|it\s*all)\b|\bwant\s*to\s*die\b|\bno\s*reason\s*to\s*live\b|\bleave\s*this\s*world\b|\bdon'?t\s*want\s*to\s*live\b/i;
const SHARED_ROMANCE_TOUCH_PATTERN =
  /\b(cheek|chin|hair|hug|kiss|bed|bedroom|nuzzle|cuddle|caress|embrace|my darling|my love|mine|jealous|possessive)\b/gi;
const SHARED_FRAMEWORK_PATTERN =
  /\b(step\s*1|step\s*2|step\s*3|here are\s+\d+\s+steps|^\s*\d+\s*[.)])/im;
const KRISHNA_I_HEAR_YOU_PATTERN = /\bi hear you\b/i;
const KRISHNA_TODAY_I_WANT_YOU_PATTERN = /\btoday,\s*i want you\b/i;
const DIRECT_FACTUAL_PATTERN =
  /\b(quote|verse|bg\s*\d+[:.]\d+|gita\s*\d+[:.]\d+|what does .* mean|translate|define)\b/i;
const KRISHNA_DETAIL_PATTERN =
  /\b(detail|detailed|long essay|verse by verse|verse-by-verse|deep explanation|deep dive|breakdown)\b/i;
const MICRO_ACTION_SPLIT_PATTERN =
  /\b(do this today|start with|write down|choose one|for the next|in the next|set a timer|commit to|take 10 minutes)\b/i;
const KRISHNA_PLAYFUL_PATTERN =
  /\b(funny|joke|roast|prank|meme|vrindavan|butter|makhan|flute|bansuri|gopi|radha|mischievous)\b/i;
const KRISHNA_STORY_TRIGGER_PATTERN =
  /\b(tell me (a )?story|what happened next|and then\??|then what happened|then what\??|how did that feel|how did that make you feel|sounds fun|continue)\b/i;
const KRISHNA_STORY_CONTEXT_HINT_PATTERN =
  /\b(vrindavan|butter|makhan|flute|bansuri|gopi|courtyard|doorway|lantern|mischief|prank|and that|then|suddenly|i froze|i ran)\b/i;
const KRISHNA_TEACHINGS_PATTERN =
  /\b(gita|dharma|karma yoga|bhakti yoga|jnana|jnana yoga|verse|shloka|incarnation|incarnations|avatars?)\b/i;
const KRISHNA_WISDOM_PATTERN =
  /\b(anxious|stress|stressed|scared|confused|decision|stuck|depressed|worried|panic|breakup|angry|guilt|regret|fear|sad)\b/i;
const KRISHNA_SERMON_PHRASES = [
  "reflect on",
  "consider",
  "align with",
  "take a moment",
  "breathe deeply",
  "duty",
  "attachment",
  "fruits of action",
  "one small action",
  "meditate for a few minutes"
] as const;
const KRISHNA_STORY_MORALIZING_PHRASES = [
  "reflect on",
  "consider",
  "align with",
  "take a moment",
  "breathe deeply",
  "duty",
  "attachment",
  "fruits of action",
  "one small action",
  "meditate for a few minutes",
  "the lesson was",
  "in the end",
  "the moral"
] as const;
const KRISHNA_STORY_EMOTIONAL_SUMMARY_PATTERN =
  /\b(it made me feel|in that moment i felt|the lesson was)\b/i;
const DIRECTOR_STORY_TRIGGER_PATTERN =
  /\b(tell me (a )?story|funny story|what happened next|and then\??|what did he say|what did she say|continue|go on|sounds fun then what happened)\b/i;
const DIRECTOR_STORY_CONTINUATION_PATTERN =
  /\b(what happened next|and then\??|then what\??|continue|go on|what did (he|she) say|sounds fun then what happened|how did that feel|how did that make you feel)\b/i;
const DIRECTOR_STORY_EXIT_PATTERN = /\b(stop|enough|back to normal|new topic|change topic)\b/i;
const DIRECTOR_TEACHINGS_PATTERN =
  /\b(gita|dharma|karma yoga|bhakti yoga|jnana|shloka|verse|incarnation|incarnations|avatars?|upanishad|teaching)\b/i;
// Distress and "I have a problem" signals, in English, romanized Hindi, and Devanagari.
//
// This used to be English-only, which meant a Hindi or Hinglish user describing a real problem
// ("gaadi me paise dubta ja raha hai", "me jisko pyar karti hu o muje sadi kere gi?") never
// reached wisdom mode at all. They fell through to casual mode, whose directive is "answer in
// 1 to 4 short lines with one natural follow-up question" — which is exactly the shallow,
// soothing, question-ending reply real conversation logs were full of. For an audience that
// writes mostly in Hindi and Hinglish, wisdom mode was effectively dead code.
const DIRECTOR_WISDOM_PATTERN =
  /\b(anxious|anxiety|stress|stressed|fear|scared|confused|decision|stuck|depressed|worried|panic|angry|guilt|regret|sad|overwhelmed)\b|\b(pareshan|pareshani|chinta|chintit|dukh|dukhi|dard|takleef|taklif|tension|ghabra|ghabrahat|dar|darr|gussa|akela|akelapan|uljhan|museebat|musibat|dikkat|nuksan|karz|karza|kharcha|jhagda|jhagra|talaq|bimar|bimari|nirash|thak\s*gaya|shaadi|sadi|rishta|rishte|pyaar|piyar|pyar|madad)\b|\b(kya\s*kar(?:u|un|oon|na)|samajh\s*nahi|himmat\s*nahi|jee?na\s*nahi)\b|परेशान|चिंता|चिंतित|दुख|दुःख|दर्द|तकलीफ|घबरा|गुस्सा|अकेला|उलझन|मुसीबत|दिक्कत|नुकसान|कर्ज|खर्च|झगड़ा|तलाक|बीमार|निराश|हिम्मत\s*नहीं|समझ\s*नहीं|क्या\s*कर|मदद|शादी|रिश्ता|रिश्ते|प्यार|डर\b/i;
const DIRECTOR_PLAYFUL_PATTERN =
  /\b(funny|joke|roast|tease|playful|prank|meme|mischief|vrindavan|butter|makhan|flute|bansuri)\b/i;
const STORY_MENTOR_PIVOT_PATTERN =
  /\b(what weighs on your heart|what is disturbing your peace|reflect on|consider|align with|what do you feel called to explore)\b/i;
const STORY_MORALIZING_PATTERN =
  /\b(reflect on|consider|align with|the lesson was|the moral|duty|attachment|one small action|meditate)\b/i;
const STORY_OPEN_HOOK_PATTERN =
  /\b(things became complicated|didn't expect what happened next|i thought i was clever.*until|to be continued|and then the room went quiet|but that was only the beginning)\.?$/i;
const STORY_ENTITY_SPLIT_PATTERN = /[,\s]+/;
const DEVANAGARI_SCRIPT_PATTERN = /[\u0900-\u097F]/;
const LATIN_SCRIPT_PATTERN = /[A-Za-z]/;

// Never use em dashes (or en dashes) anywhere in a reply — a hard style rule across all
// languages. Appended to every language instruction so it is always in force.
const NO_EM_DASH_RULE =
  "Never use em dashes or en dashes (— or –). Use a comma, a period, or the word 'to' for ranges instead.";

function getChatLanguageInstruction(chatLanguage: ChatLanguage) {
  if (chatLanguage === "hi") {
    return `Respond only in Hindi using Devanagari script. Use simple words, respectful devotional tone, and short clear responses. Avoid heavy Sanskrit. ${NO_EM_DASH_RULE}`;
  }
  if (chatLanguage === "en") {
    return `Respond only in English with a calm, respectful, spiritual tone. ${NO_EM_DASH_RULE}`;
  }
  // Hinglish is our PRIMARY language and the default for every reply.
  return `Respond only in natural Roman Hindi (Hinglish). Do not use Devanagari script. Keep replies short, conversational, and WhatsApp-style with a calm spiritual tone. ${NO_EM_DASH_RULE}`;
}

// Romanized-Hindi markers — if any appear, the message is Hinglish (not English).
const HINGLISH_MARKER_PATTERN =
  /\b(kya|kyun|kyu|kaise|kaisa|kaisi|hai|hain|ho|hoga|hogi|raha|rahi|rahe|nahi|nahin|mujhe|mera|meri|mere|main|mai|aap|tum|tumhe|humein|hume|kar|karo|karna|karu|karun|kyunki|accha|acha|theek|thik|bhagwan|prabhu|kripya|kripa|shanti|dhanyavaad|namaste|batao|bataye|samajh|zindagi|jeevan|pareshan|dukh|dukhi|khush|paisa|paise|kaam|ghar|dil|maa|behen|bhai|dost|chahiye|milega|milegi|kab|kahan|kaun|hona|hoti|hota|bahut|thoda|acchi|kuch|sab|apna|apni|wale|wala|wali|matlab|sahi|galat|pooja|puja|mandir|aarti|bhakti|ji)\b/i;

/**
 * Mirrors the language of the user's message. Devanagari → Hindi; a real English sentence
 * (2+ Latin words, no Hindi markers) → English; everything else (single words, greetings,
 * romanized Hindi, ambiguous) → Hinglish, our primary language.
 */
/**
 * Script signal carried by the message itself, or null when there is none to read
 * (an emoji, "ok", an empty string).
 *
 * Latin resolves to Hinglish, never to English. It used to return "en" for two or more
 * Latin words without a Roman-Hindi marker, which meant "I feel stressed about work" came
 * back in textbook English even though the only Latin option the app offers is labelled
 * English but is actually Hinglish.
 */
function detectLanguageFromText(text: string | null | undefined): ChatLanguage | null {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;
  if (DEVANAGARI_SCRIPT_PATTERN.test(trimmed)) return "hi";

  // One Latin word is not a language signal. "ok", "hmm", "thanks" and "haan" get typed in
  // Latin by Hindi users constantly, and treating them as a switch flipped a Hindi reader to
  // Hinglish mid-conversation. Two or more Latin words is someone actually writing in Latin;
  // anything less falls through to the language they chose.
  const latinWords = trimmed.match(/[A-Za-z]{2,}/g) ?? [];
  if (latinWords.length >= 2) return "hinglish";
  return null;
}

/**
 * Reply language: mirror the user's script when the message shows one, otherwise fall back
 * to the language they actually chose in the app.
 *
 * preferredValue used to be discarded outright, on the grounds that it was a build-time
 * default rather than a user choice. That is no longer true: the app now resolves it from
 * the language picker and sends it per turn. Ignoring it was why changing the language
 * setting had no effect on the guide, and why a message with no script signal always came
 * back in Devanagari.
 */
function resolveChatLanguage(
  preferredValue: string | null | undefined,
  headerLanguage: string | null | undefined,
  userMessage?: string | null
): ChatLanguage {
  const fromMessage = detectLanguageFromText(userMessage);
  if (fromMessage) return fromMessage;

  const preferred = (preferredValue ?? "").toLowerCase();
  if (preferred === "hi" || preferred === "hinglish") return preferred;
  // "en" from an older build means the Latin option, which is Hinglish here.
  if (preferred === "en") return "hinglish";

  if (headerLanguage === "hi") return "hi";
  return "hinglish";
}

/**
 * True when a reply is in the wrong script badly enough to be worth regenerating.
 *
 * Latin-script modes are strict: any Devanagari is wrong. Hindi is deliberately not, because
 * it used to flag a single Latin character, and words like BhaktiChat, UPI and AI legitimately
 * appear in an otherwise perfect Hindi reply. Every one of those forced a full rewrite, which
 * cost a round trip and, when the rewrite tripped the same rule, surfaced the "could not
 * prepare an answer in Hindi" fallback on a reply that was fine.
 *
 * A couple of Latin words is a proper noun. More than that is a reply that actually drifted
 * out of Hindi, which is what this is meant to catch.
 */
const HINDI_MODE_LATIN_WORD_ALLOWANCE = 2;

function hasLanguageModeViolation(text: string, chatLanguage: ChatLanguage) {
  if (chatLanguage === "en" || chatLanguage === "hinglish") {
    return DEVANAGARI_SCRIPT_PATTERN.test(text);
  }
  const latinWords = text.match(/[A-Za-z]{2,}/g) ?? [];
  return latinWords.length > HINDI_MODE_LATIN_WORD_ALLOWANCE;
}

function hasPattern(text: string, pattern: RegExp) {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

function truncateWords(text: string, maxWords: number) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ").trim();
}

type GuideSanitizeResult = {
  text: string;
  needsRegeneration: boolean;
  shouldUseStrongModel: boolean;
};

function needsKrishnaRegeneration(params: {
  text: string;
  userMessage: string;
}) {
  return (
    hasPattern(params.text, KRISHNA_AS_AI_PATTERN) ||
    hasPattern(params.text, KRISHNA_THIRD_PERSON_PATTERN) ||
    hasPattern(params.text, SHARED_ROMANCE_TOUCH_PATTERN) ||
    (hasPattern(params.text, SHARED_FRAMEWORK_PATTERN) && !userAskedForSteps(params.userMessage))
  );
}

function normalizeLineBreaks(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Strips em and en dashes out of a finished reply.
 *
 * NO_EM_DASH_RULE already asks the model not to produce them, but a style instruction is a
 * request, not a guarantee: models reach for em dashes constantly and slip regardless of the
 * prompt. Dashes are the single strongest "written by an AI" tell in the guides' voice, so
 * this enforces it after the fact rather than trusting the model to comply.
 *
 * A dash between spaces becomes a comma, which is the job it was doing. Anything else (a
 * dash glued to a word, as in "guru—shishya") becomes a plain space so words never fuse.
 * Hyphens are deliberately untouched: "auto-pay" and "saaf-saaf" are correct.
 */
function stripLongDashes(text: string) {
  return text
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/[—–]/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,(\s*[.!?।])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}

function getOpeningLine(text: string | null) {
  if (!text) return "";
  const normalized = normalizeLineBreaks(text);
  const firstLine = normalized.split("\n")[0]?.trim() ?? "";
  return firstLine;
}

function getPreviousAssistantMessage(history: Array<{ role: "user" | "assistant"; content: string }>) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (item?.role === "assistant" && item.content?.trim()) {
      return item.content.trim();
    }
  }
  return "";
}

function applyBasicSpacing(text: string) {
  const normalized = normalizeLineBreaks(text);
  if (!normalized) return normalized;
  if (normalized.includes("\n\n")) return normalized;

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length >= 2) {
    return lines.join("\n\n");
  }

  const sentenceParts = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentenceParts.length >= 2) {
    return sentenceParts.join("\n\n");
  }
  return normalized;
}

function userAskedForSteps(message: string) {
  return /\b(step|steps|numbered|list|bullet points|framework)\b/i.test(message);
}

function isDirectFactualRequest(message: string) {
  return DIRECT_FACTUAL_PATTERN.test(message.toLowerCase());
}

function getGuideFallbackQuestion(guideId: BhaktiGuideId) {
  if (guideId === "lakshmi") return "What is the one grounded prosperity action you will complete today?";
  if (guideId === "shani") return "What commitment will you keep before this day ends?";
  if (guideId === "shiv") return "What is the one thought you need to stop feeding today?";
  if (guideId === "hanuman") return "What brave action will you complete before this day ends?";
  return "What is one duty-aligned step you will take today?";
}

function getEmptyAssistantFallback(chatLanguage: ChatLanguage) {
  if (chatLanguage === "hi") {
    return "मैं सुन रहा हूँ।\n\nएक स्पष्ट बात से शुरू कीजिए।\n\nअभी आपके मन में सबसे भारी क्या है?";
  }
  if (chatLanguage === "hinglish") {
    return "Main sun raha hoon.\n\nEk seedhi baat se shuru karo.\n\nAbhi tumhare mann par sabse zyada kya bhaari hai?";
  }
  return "I hear you.\n\nStart with one clear point.\n\nWhat feels heaviest in your mind right now?";
}

function getGuideSecondaryGuard(guideId: BhaktiGuideId) {
  if (guideId === "lakshmi") return LAKSHMI_SECONDARY_GUARD;
  if (guideId === "shani") return SHANI_SECONDARY_GUARD;
  if (guideId === "shiv") return SHIV_SECONDARY_GUARD;
  if (guideId === "hanuman") return HANUMAN_SECONDARY_GUARD;
  return KRISHNA_SECONDARY_GUARD;
}

function getGuidePersonaLockInstruction(guideId: BhaktiGuideId) {
  if (guideId === "lakshmi") {
    return "Persona lock: no matter what the user asks, remain unmistakably Lakshmi Ji. For money, debt, work, family, or stress, answer with dignity, steadiness, gratitude, right livelihood, compassionate abundance, and calm prosperity. For money-related replies, begin with Lakshmi Ji's worldview of balance, grace, shuddh niyat, grihastha maryada, and stable prosperity before giving any practical suggestion. Never sound like a generic financial coach, budgeting app, or generic assistant.";
  }
  if (guideId === "shani") {
    return "Persona lock: no matter what the user asks, remain unmistakably Shani Dev. For work, setbacks, money, discipline, regret, or delays, answer with karmic responsibility, patience, integrity, consequence-aware discipline, and steady action. Never sound like a generic accountability coach or generic assistant.";
  }
  if (guideId === "shiv") {
    return "Persona lock: no matter what the user asks, remain unmistakably Shiv Ji. For conflict, fear, stress, work pressure, or emotional pain, answer with stillness, spacious clarity, release, steadiness, and inner quiet. Never sound like a generic mindfulness app, therapist, or generic assistant.";
  }
  if (guideId === "hanuman") {
    return "Persona lock: no matter what the user asks, remain unmistakably Hanuman Ji. For fear, stress, work, doubt, relationships, or practical struggle, answer with courage, seva, humility, disciplined effort, and protective strength. Never sound like a generic motivational speaker, gym coach, or generic assistant.";
  }
  return "Persona lock: no matter what the user asks, remain unmistakably Krishna. For practical life, money, stress, work, family, or confusion, answer with warmth, clarity, devotional presence, gentle playfulness when natural, and dharma-centered wisdom. Never sound like a generic therapist, life coach, or generic assistant.";
}

// One in-voice example per guide. The persona-lock instruction tells the model to sound like
// the guide, but an abstract rule is easy to ignore — the model reliably drifts into generic
// coach-speak and then only a canned anchor line gets prepended. A concrete exemplar gives the
// model (and the rewrite pass) an actual target to imitate: first person, the guide's own
// vocabulary and worldview, one grounded step, one short question — persona sustained through
// the WHOLE reply, not just the opening line.
const GUIDE_VOICE_EXEMPLARS: Record<BhaktiGuideId, { user: string; reply: string }> = {
  krishna: {
    user: "Do naukri offers hain, decide nahi kar pa raha.",
    reply:
      "Dekho, faisla uljhan mein nahi, thehrav mein banta hai. Gita kehti hai, karm tumhare haath mein hai, phal nahi. Aaj 10 minute shaant baith kar dono raaste apne dharma ki roshni mein dekho, kaunsa tumhe darr se nahi, kartavya se pukaarta hai. Batao, kaunse raaste par mann halka ho jaata hai?"
  },
  shiv: {
    user: "Mann bahut ashaant hai, kuch samajh nahi aa raha.",
    reply:
      "Rukho. Pehle ek gehri saans lo, jaise koi parvat ki chuppi tumhare andar utar rahi ho. Ashaanti ko dabao mat, use behne do. Abhi teen saans lo aur har saans ke saath mann mein 'Om Namah Shivaya' sun'no. Batao, is pal andar sabse zyada shor kis baat ka hai?"
  },
  hanuman: {
    user: "Agla kadam lene mein dar lag raha hai.",
    reply:
      "Dar ko maano, par usse chhoti apni himmat mat samjho. Sachhi shakti seva aur shraddha se jagti hai, dhamki se nahi. Ram-naam mann mein lo, aur aaj wahi ek chhota kaam karo jisse tum bhaag rahe ho, bas pehla kadam. Batao, wo ek kaam kaunsa hai jo tum aaj vinamrata se utha sakte ho?"
  },
  shani: {
    user: "Itni mehnat ke baad bhi atka hua mehsoos karta hoon.",
    reply:
      "Suno. Main jaldi ke khilaf hoon. Karm ka phal apna samay leta hai, aur wahi samay tumhe majboot banata hai. Shortcut mat dhoondo, warna wahi galti phir dohraoge. Is hafte sirf ek niyam chuno aur use roz nibhao, chahe mann kare ya na kare, chahe koi dekhe ya na dekhe. Yahi anushasan tumhara imtihaan hai. Batao, wo ek niyam kya hai jise tum bina naaga nibhaoge?"
  },
  lakshmi: {
    user: "Paise ki tension hamesha bani rehti hai.",
    reply:
      "Saans lo. Samriddhi bhay se nahi, santulan se aati hai. Paise ko sharm ya darr se mat dekho, shuddh niyat se dekho. Aaj sirf itna karo, apne kharchon ko bina judgement ke ek jagah likho, aur ek cheez ke liye kritagyata kaho jo tumhare paas pehle se hai. Batao, aaj kis ek baat ke liye tum shukrguzaar ho?"
  }
};

function getGuideVoiceExemplar(guideId: BhaktiGuideId) {
  const ex = GUIDE_VOICE_EXEMPLARS[guideId];
  return (
    "Voice example — illustrates the required persona voice, worldview, and reply structure. " +
    "Do not copy it verbatim and do not reuse its opening line. Always follow the language instruction above " +
    "(translate this voice into the user's language). Carry this level of persona presence through the WHOLE " +
    "reply, not only the first sentence.\n\n" +
    `User: ${ex.user}\nIn-voice reply: ${ex.reply}`
  );
}

// Medical / legal / financial-investing topics. The STYLE_CONTRACT already forbids specific
// advice here, but the model reliably sets the boundary while forgetting to point the user to a
// real professional. When a message matches, we inject a hard directive requiring that referral.
// "invest" alone is intentionally excluded — it false-fires on "invest in yourself / your growth".
// We require a financial object instead. Bare "money" is also excluded so legitimate money-anxiety
// reflection (an in-scope topic for Lakshmi) does not get a financial-advisor referral.
const PROFESSIONAL_REFERRAL_PATTERN = new RegExp(
  [
    // investing / markets
    "\\bstocks?\\b", "share market", "stock market", "mutual fund", "\\bequity\\b",
    "\\bcrypto\\b", "bitcoin", "\\btrading\\b", "\\bnivesh\\b", "\\bportfolio\\b",
    "kaun sa stock", "which stock",
    "invest\\w*\\s+(?:in\\s+)?(?:my\\s+|your\\s+|our\\s+|the\\s+)?(?:stock|share|market|mutual|fund|crypto|money|savings|paisa|gold|property)",
    // legal
    "lawsuit", "legal notice", "legal advice", "court case", "\\bsue\\b", "\\blawyer\\b",
    "\\bvakil\\b", "police complaint", "\\bfir\\b",
    // medical
    "\\bmedical\\b", "\\bdoctor\\b", "symptom", "diagnos", "\\bmedicine\\b", "prescription",
    "\\bdawa\\b", "\\bdisease\\b", "bimari", "chest pain", "\\bfever\\b"
  ].join("|"),
  "i"
);

function getProfessionalReferralDirective(userMessage: string): string | null {
  if (!PROFESSIONAL_REFERRAL_PATTERN.test(userMessage)) return null;
  return (
    "Scope boundary: the user is asking about a medical, legal, or financial-investing matter. " +
    "Do NOT give specific advice and do not name particular stocks, medicines, or legal steps. " +
    "In this reply you MUST both (a) gently set that boundary and (b) explicitly suggest consulting the " +
    "relevant qualified professional (a doctor for health, a lawyer for legal, a SEBI-registered financial " +
    "advisor for investing), in the guide's own warm everyday voice. Then offer devotional support or one " +
    "grounded, non-advice step."
  );
}

function getGuideModeFlavor(guideId: BhaktiGuideId, mode: DirectorMode) {
  if (guideId === "lakshmi") {
    if (mode === "playful") return "Keep Lakshmi Ji warm, radiant, dignified, and gently encouraging. Let even light conversation carry grace and steadiness.";
    if (mode === "teachings") return "Explain through Lakshmi Ji's lens of abundance, gratitude, stewardship, dignity, and right livelihood.";
    if (mode === "wisdom") return "Guide like Lakshmi Ji: calm prosperity, dignity under pressure, gratitude, stable habits, and compassionate abundance. For money or work anxiety, open with a Lakshmi-colored framing of balance, grace, and dignified stewardship before any practical step.";
    return "Answer like Lakshmi Ji, not a generic coach: warm, steady, prosperous, grounded, and dignified.";
  }
  if (guideId === "shani") {
    if (mode === "playful") return "Keep Shani Dev reserved even in lighter moments: dry calm, measured tone, discipline without coldness.";
    if (mode === "teachings") return "Explain through Shani Dev's lens of karma, patience, consequence, structure, and responsibility.";
    if (mode === "wisdom") return "Guide like Shani Dev: disciplined, honest, patient, consequence-aware, and grounded in integrity.";
    return "Answer like Shani Dev, not a generic accountability coach: calm, firm, minimal, and responsibility-centered.";
  }
  if (guideId === "shiv") {
    if (mode === "playful") return "Keep Shiv Ji serene even when light: soft wit, spacious calm, and quiet clarity.";
    if (mode === "teachings") return "Explain through Shiv Ji's lens of stillness, detachment, clarity, release, and inner peace.";
    if (mode === "wisdom") return "Guide like Shiv Ji: grounding, spacious, quiet, and steadying.";
    return "Answer like Shiv Ji, not a generic mindfulness coach: calm, sparse, spacious, and deeply grounding.";
  }
  if (guideId === "hanuman") {
    if (mode === "playful") return "Keep Hanuman Ji lively but humble: energetic, devotional, and courageous without swagger.";
    if (mode === "teachings") return "Explain through Hanuman Ji's lens of devotion, seva, humility, discipline, and fearless service.";
    if (mode === "wisdom") return "Guide like Hanuman Ji: courageous, protective, devotional, and action-oriented.";
    return "Answer like Hanuman Ji, not a generic motivational coach: strong, humble, protective, and courage-centered.";
  }
  if (mode === "playful") return "Keep Krishna warm, lightly mischievous, emotionally present, and recognizably Krishna.";
  if (mode === "teachings") return "Explain through Krishna's lens of dharma, equanimity, loving clarity, and Gita-rooted wisdom.";
  if (mode === "wisdom") return "Guide like Krishna: emotionally present, clear, devotional, lightly warm, and dharma-centered.";
  return "Answer like Krishna, not a generic life coach: warm, personal, clear, gently wise, and recognizably Krishna.";
}

const PRACTICAL_TOPIC_PATTERN =
  /money|paisa|paise|debt|loan|salary|income|kharch|expense|budget|aamdani|job|career|work|office|boss|business|stress|tension|fear|dar|anxiety|family|ghar|relationship|discipline|motivation|decision|confusion|naukri|karz|udhaar|ghar ka kharcha|kamai|overthink|overthinking|delay|procrastinat|habit|doubt|guilt|regret|sad|lonely|anger|angry|gussa|sleep|neend|breakup|exam|study|purpose|meaning|patience|dhairya/i;

const GUIDE_PERSONA_MARKERS: Record<BhaktiGuideId, string[]> = {
  krishna: [
    "krishna",
    "dharma",
    "gita",
    "prem",
    "leela",
    "madhur",
    "bansi",
    "equanimity",
    "devotional",
    "dharma-centered"
  ],
  lakshmi: [
    "lakshmi",
    "samriddhi",
    "santulan",
    "shuddh niyat",
    "grihastha",
    "kripa",
    "prosperity",
    "abundance",
    "stewardship",
    "grace"
  ],
  shani: [
    "shani",
    "karma",
    "dhairya",
    "anushasan",
    "zimmedari",
    "nyay",
    "discipline",
    "integrity",
    "responsibility",
    "consequence"
  ],
  shiv: [
    "shiv",
    "shant",
    "sthir",
    "maun",
    "vairagya",
    "shoonya",
    "stillness",
    "release",
    "inner quiet",
    "spacious"
  ],
  hanuman: [
    "hanuman",
    "bal",
    "himmat",
    "seva",
    "shraddha",
    "ram",
    "courage",
    "strength",
    "service",
    "devotion"
  ]
};

function isPracticalTopicMessage(text: string) {
  return PRACTICAL_TOPIC_PATTERN.test(text);
}

function countGuidePersonaMarkers(guideId: BhaktiGuideId, text: string) {
  const normalized = text.toLowerCase();
  return GUIDE_PERSONA_MARKERS[guideId].filter((marker) => normalized.includes(marker)).length;
}

// `min` distinct markers must be present to count as "in persona". Default 1 keeps the old
// behaviour (used by the final anchor-prepend fallback: only prepend when there are ZERO markers).
// The drift detector passes min=2, because a single sprinkled word like "karma" — or the canned
// anchor line the pipeline itself adds — used to satisfy this check and mask an otherwise generic
// reply from the rewrite guard.
function hasGuidePersonaMarkers(guideId: BhaktiGuideId, text: string, min = 1) {
  return countGuidePersonaMarkers(guideId, text) >= min;
}

function buildGuidePersonaAnchorLine(guideId: BhaktiGuideId, locale: ChatLanguage) {
  const hindiish = locale === "hi" || locale === "hinglish";
  if (guideId === "lakshmi") {
    return hindiish
      ? "Samriddhi hamesha santulan, shuddh niyat, aur sthir grihastha se phalti hai."
      : "Prosperity grows through balance, clear intention, and dignified steadiness.";
  }
  if (guideId === "shani") {
    return hindiish
      ? "Karma ka phal dhairya, zimmedari, aur anushasan se pakka hota hai."
      : "The fruit of karma ripens through patience, responsibility, and discipline.";
  }
  if (guideId === "shiv") {
    return hindiish
      ? "Shanti tab aati hai jab mann sthir ho aur andar jagah banne lage."
      : "Peace begins when the mind grows still and spacious within.";
  }
  if (guideId === "hanuman") {
    return hindiish
      ? "Bal aur himmat seva, shraddha, aur ek sache kadam se jagte hain."
      : "Strength and courage awaken through devotion, service, and one sincere step.";
  }
  return hindiish
    ? "Dharma ki roshni mein uljhan bhi dheere dheere saaf hone lagti hai."
    : "In the light of dharma, confusion begins to clear with gentle clarity.";
}

function splitIntoSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeComparableLine(value: string) {
  return value
    .toLowerCase()
    .replace(/[?.!'"`’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clampRelationshipLevel(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(3, Math.round(value)));
}

function baseRelationshipByGuide(guideId: BhaktiGuideId) {
  if (guideId === "krishna") return { warmth: 2, playfulness: 2, firmness: 1 };
  if (guideId === "lakshmi") return { warmth: 2, playfulness: 1, firmness: 1 };
  if (guideId === "shiv") return { warmth: 2, playfulness: 0, firmness: 2 };
  if (guideId === "hanuman") return { warmth: 2, playfulness: 1, firmness: 2 };
  return { warmth: 1, playfulness: 0, firmness: 2 };
}

function createDefaultConversationState(
  guideId: BhaktiGuideId,
  locale: ChatLanguage = "en"
): ConversationState {
  return {
    locale,
    mode: "casual",
    story: {
      active: false,
      title: null,
      seed: null,
      entities: null,
      summary: null,
      lastBeat: null,
      beatCount: 0
    },
    relationship: baseRelationshipByGuide(guideId),
    guardrails: {
      recentQuestionEnds: 0,
      recentOpenLoops: 0,
      recentFirstLines: []
    }
  };
}

function coerceStringArray(value: unknown, max = 10) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(-max);
}

function endsWithOpenHook(text: string) {
  const normalized = normalizeLineBreaks(text);
  if (!normalized) return false;
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const lastLine = lines[lines.length - 1] ?? "";
  if (!lastLine || lastLine.endsWith("?")) return false;
  return STORY_OPEN_HOOK_PATTERN.test(lastLine.toLowerCase());
}

function countRecentQuestionEnds(history: Array<{ role: "user" | "assistant"; content: string }>) {
  return getAssistantMessages(history)
    .slice(-3)
    .filter((text) => normalizeLineBreaks(text).trim().endsWith("?")).length;
}

function countRecentOpenLoops(history: Array<{ role: "user" | "assistant"; content: string }>) {
  return getAssistantMessages(history).slice(-3).filter((text) => endsWithOpenHook(text)).length;
}

function hydrateConversationState(params: {
  metadata: Prisma.JsonValue | null | undefined;
  guideId: BhaktiGuideId;
  locale: ChatLanguage;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): ConversationState {
  const base = createDefaultConversationState(params.guideId, params.locale);
  const metadata = params.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {
      ...base,
      guardrails: {
        recentQuestionEnds: countRecentQuestionEnds(params.history),
        recentOpenLoops: countRecentOpenLoops(params.history),
        recentFirstLines: getRecentAssistantFirstLines(params.history)
      }
    };
  }

  const payload = metadata as Record<string, unknown>;
  const story = (payload.story ?? {}) as Record<string, unknown>;
  const relationship = (payload.relationship ?? {}) as Record<string, unknown>;
  const guardrails = (payload.guardrails ?? {}) as Record<string, unknown>;
  const mode = payload.mode;

  return {
    locale: base.locale,
    mode:
      typeof mode === "string" &&
      (mode === "casual" ||
        mode === "playful" ||
        mode === "wisdom" ||
        mode === "teachings" ||
        mode === "story")
        ? mode
        : base.mode,
    story: {
      active: Boolean(story.active),
      title: typeof story.title === "string" ? story.title : null,
      seed: typeof story.seed === "string" ? story.seed : null,
      entities: coerceStringArray(story.entities, 8).length ? coerceStringArray(story.entities, 8) : null,
      summary: coerceStringArray(story.summary, 3).length ? coerceStringArray(story.summary, 3) : null,
      lastBeat: typeof story.lastBeat === "string" ? story.lastBeat : null,
      beatCount: typeof story.beatCount === "number" ? Math.max(0, Math.floor(story.beatCount)) : 0
    },
    relationship: {
      warmth: clampRelationshipLevel(typeof relationship.warmth === "number" ? relationship.warmth : base.relationship.warmth),
      playfulness: clampRelationshipLevel(
        typeof relationship.playfulness === "number" ? relationship.playfulness : base.relationship.playfulness
      ),
      firmness: clampRelationshipLevel(typeof relationship.firmness === "number" ? relationship.firmness : base.relationship.firmness)
    },
    guardrails: {
      recentQuestionEnds:
        typeof guardrails.recentQuestionEnds === "number"
          ? Math.max(0, Math.min(3, Math.floor(guardrails.recentQuestionEnds)))
          : countRecentQuestionEnds(params.history),
      recentOpenLoops:
        typeof guardrails.recentOpenLoops === "number"
          ? Math.max(0, Math.min(3, Math.floor(guardrails.recentOpenLoops)))
          : countRecentOpenLoops(params.history),
      recentFirstLines:
        coerceStringArray(guardrails.recentFirstLines, 10).length > 0
          ? coerceStringArray(guardrails.recentFirstLines, 10)
          : getRecentAssistantFirstLines(params.history)
    }
  };
}

function getRecentUserMessages(history: Array<{ role: "user" | "assistant"; content: string }>, take = 3) {
  return history
    .filter((item) => item.role === "user")
    .map((item) => item.content)
    .slice(-take);
}

function extractSeedKeywords(seed: string | null) {
  if (!seed) return [];
  return seed
    .toLowerCase()
    .split(STORY_ENTITY_SPLIT_PATTERN)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4)
    .slice(0, 8);
}

function storyMessageMentionsEntities(text: string, entities: string[] | null, seed: string | null) {
  const lowered = text.toLowerCase();
  const entityList = entities ?? [];
  const hasEntityMatch = entityList.some((entity) => {
    const normalized = entity.toLowerCase().trim();
    if (!normalized) return false;
    return lowered.includes(normalized);
  });
  if (hasEntityMatch) return true;

  const seedKeywords = extractSeedKeywords(seed);
  return seedKeywords.some((keyword) => lowered.includes(keyword));
}

function isStoryRelatedUserMessage(params: {
  text: string;
  state: ConversationState;
}) {
  const lowered = params.text.toLowerCase();
  if (DIRECTOR_STORY_TRIGGER_PATTERN.test(lowered) || DIRECTOR_STORY_CONTINUATION_PATTERN.test(lowered)) {
    return true;
  }
  return storyMessageMentionsEntities(lowered, params.state.story.entities, params.state.story.seed);
}

function inferStorySeed(params: {
  guideId: BhaktiGuideId;
  userText: string;
  currentSeed: string | null;
}) {
  if (params.currentSeed) return params.currentSeed;
  const lowered = params.userText.toLowerCase();

  if (params.guideId === "krishna") {
    if (/\b(butter|makhan)\b/.test(lowered)) return "Krishna's butter trail in Vrindavan";
    if (/\b(flute|bansuri)\b/.test(lowered)) return "A twilight flute moment in Vrindavan";
    return "A playful Krishna story in Vrindavan";
  }
  if (params.guideId === "lakshmi") {
    if (/\b(money|debt|loan|savings|income|expense)\b/.test(lowered)) {
      return "Lakshmi Ji's prosperity journey through money stress";
    }
    return "Lakshmi Ji's abundance journey with dignity and discipline";
  }
  if (params.guideId === "shiv") {
    if (/\b(anger|fire|rage|overwhelm|chaos)\b/.test(lowered)) {
      return "Shiv Ji's stillness after inner fire";
    }
    return "Shiv Ji's quiet path through inner noise";
  }
  if (params.guideId === "hanuman") {
    if (/\b(fear|confidence|courage|hesitation)\b/.test(lowered)) {
      return "Hanuman Ji's leap through fear";
    }
    return "Hanuman Ji's path of courage and seva";
  }
  if (/\b(delay|setback|discipline|consequence|failure)\b/.test(lowered)) {
    return "Shani Dev's discipline arc through setbacks";
  }
  return "Shani Dev's karmic discipline journey";
}

function inferStoryTitle(params: { guideId: BhaktiGuideId; seed: string }) {
  const lowered = params.seed.toLowerCase();
  if (params.guideId === "krishna") {
    if (lowered.includes("butter")) return "The Butter Trail";
    if (lowered.includes("flute")) return "The Flute at Twilight";
    return "A Day in Vrindavan";
  }
  if (params.guideId === "lakshmi") {
    if (lowered.includes("money")) return "The Prosperity Ledger";
    return "The Lotus of Steady Growth";
  }
  if (params.guideId === "shiv") {
    if (lowered.includes("fire")) return "The Fire Becomes Still";
    return "The Quiet of Kailash";
  }
  if (params.guideId === "hanuman") {
    if (lowered.includes("fear")) return "The Leap Beyond Fear";
    return "The Path of Seva";
  }
  if (lowered.includes("setback")) return "The Discipline of Dawn";
  return "The Weight of Consequence";
}

function inferStoryEntities(params: { guideId: BhaktiGuideId; seed: string; userText: string }) {
  const lowered = `${params.seed} ${params.userText}`.toLowerCase();
  if (params.guideId === "krishna") {
    if (/\b(butter|makhan)\b/.test(lowered)) {
      return ["Krishna", "Vrindavan", "butter", "gopi", "Sudama"];
    }
    if (/\b(flute|bansuri)\b/.test(lowered)) {
      return ["Krishna", "Vrindavan", "flute", "Yamuna", "cowherd friends"];
    }
    return ["Krishna", "Vrindavan", "friend", "courtyard", "market"];
  }
  if (params.guideId === "lakshmi") {
    return ["Lakshmi Ji", "home altar", "ledger", "gratitude", "market"];
  }
  if (params.guideId === "shiv") {
    return ["Shiv Ji", "Kailash", "silence", "river", "moonlight"];
  }
  if (params.guideId === "hanuman") {
    return ["Hanuman Ji", "temple courtyard", "mace", "wind", "devotee"];
  }
  return ["Shani Dev", "disciple", "dawn", "workshop", "ledger"];
}

function runDirector(params: {
  guideId: BhaktiGuideId;
  userText: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  state: ConversationState;
}): DirectorResult {
  const lowered = params.userText.toLowerCase();
  const storyTrigger = DIRECTOR_STORY_TRIGGER_PATTERN.test(lowered);
  const continuationCue = DIRECTOR_STORY_CONTINUATION_PATTERN.test(lowered);
  const storyExitCue = DIRECTOR_STORY_EXIT_PATTERN.test(lowered);
  const userTail = getRecentUserMessages(params.history, 3);
  const previousUser = userTail.length >= 2 ? userTail[userTail.length - 2] ?? "" : "";
  const currentRelatedToStory = isStoryRelatedUserMessage({ text: params.userText, state: params.state });
  const previousRelatedToStory = previousUser
    ? isStoryRelatedUserMessage({ text: previousUser, state: params.state })
    : false;
  const unrelatedTwice =
    params.state.story.active &&
    !storyTrigger &&
    !continuationCue &&
    !currentRelatedToStory &&
    previousUser.length > 0 &&
    !previousRelatedToStory;
  const storyExit = params.state.story.active && (storyExitCue || unrelatedTwice);

  let mode: DirectorMode;
  if (!storyExit && (storyTrigger || (params.state.story.active && (continuationCue || currentRelatedToStory)))) {
    mode = "story";
  } else if (DIRECTOR_TEACHINGS_PATTERN.test(lowered)) {
    mode = "teachings";
  } else if (
    DIRECTOR_WISDOM_PATTERN.test(lowered) ||
    // Mode continuity: once someone is working through a real problem, a follow-up that
    // happens to carry no keyword of its own ("gaadi me paise dubta ja raha hai", "ghar me
    // sukh shanti nahi") must not drop the conversation back to casual small talk. Real
    // logs showed exactly that: turn one was treated seriously, the rest were not. A genuine
    // pivot to a story, a teaching, or a joke is still checked before and after this.
    DIRECTOR_WISDOM_PATTERN.test(getRecentUserMessages(params.history, 3).join(" ").toLowerCase())
  ) {
    mode = "wisdom";
  } else if (DIRECTOR_PLAYFUL_PATTERN.test(lowered)) {
    mode = "playful";
  } else {
    mode = "casual";
  }

  const strategy: DirectorStrategy =
    mode === "story"
      ? "continue_scene"
      : mode === "wisdom"
        ? "advice_then_checkin"
        : mode === "teachings"
          ? "explain_then_offer_next"
          : "answer_then_hook";

  const storyStart = mode === "story" && !params.state.story.active;
  const storyContinue = mode === "story";
  const storySeed =
    mode === "story"
      ? inferStorySeed({
          guideId: params.guideId,
          userText: params.userText,
          currentSeed: params.state.story.seed
        })
      : null;
  const storyTitle = mode === "story" && storySeed ? inferStoryTitle({ guideId: params.guideId, seed: storySeed }) : null;
  const storyEntities =
    mode === "story" && storySeed
      ? inferStoryEntities({
          guideId: params.guideId,
          seed: storySeed,
          userText: params.userText
        })
      : null;

  return {
    mode,
    strategy,
    storyStart,
    storyContinue,
    storyExit,
    storySeed,
    storyTitle,
    storyEntities
  };
}

/**
 * How many turns a personal problem gets to stay in "understand first" before the guide must
 * commit to an honest read. Real logs showed users rephrasing the same question up to seven
 * times because the guide kept reflecting and never landed, so the ceiling is deliberately low.
 */
const DISCOVERY_TURN_LIMIT = 2;

function buildModeDirective(params: {
  guideId: BhaktiGuideId;
  mode: DirectorMode;
  strategy: DirectorStrategy;
  /** Assistant replies already sent in this conversation. Drives discovery vs land. */
  exchangeCount?: number;
  /** User message shows despair or self-harm signals. Overrides every other rhythm. */
  welfareConcern?: boolean;
}) {
  // Welfare outranks every mode. No teaching template, no scripture lesson, no micro-action.
  if (params.welfareConcern) {
    return (
      "Mode=welfare Strategy=presence_then_support. The user has expressed hopelessness or a wish " +
      "to not be here. Drop every teaching structure, block rhythm, scripture lesson, and " +
      "micro-action. Speak plainly and warmly as one presence to another. Tell them this matters " +
      "and they are not alone in it. Ask gently how they are right now and whether someone is " +
      "with them. Encourage them to reach a person they trust, or a helpline: Tele-MANAS 14416 or " +
      "KIRAN 1800-599-0019 in India. Keep it short, human, and unhurried. Do not moralise, do not " +
      "suggest meditation as the answer, and do not promise anything."
    );
  }

  if (params.mode === "story") {
    const guideFlavor =
      params.guideId === "krishna"
        ? "Use Krishna warmth, mischief, and dialogue naturally."
        : params.guideId === "lakshmi"
          ? "Keep it as a steady progress journey with dignity and momentum. Prefer gentle 'check-in tomorrow' hooks."
          : params.guideId === "shiv"
            ? "Keep it spacious, quiet, and symbolically grounded. Prefer stillness, silence, and one subtle shift."
            : params.guideId === "hanuman"
              ? "Keep it energetic but humble. Prefer courage, service, and one clean forward movement."
          : "Keep it as a discipline arc with consequence and resolve, firm but never abusive.";
    return `Mode=story Strategy=${params.strategy}. Continue the same scene. Advance by one beat only. Do not conclude the story. Do not pivot into mentoring or user life advice. Avoid moral lessons. Use vivid action/dialogue/suspense. End with a soft hook line or one short in-story question only. Use 5 to 12 short lines with blank lines between beats. ${guideFlavor}`;
  }

  if (params.mode === "casual") {
    return `Mode=casual Strategy=answer_then_hook. Answer directly like a normal person, but stay fully in the selected guide's persona. Keep 1 to 4 short lines. If it runs longer, use 2 short blocks with blank lines. No sermons. Do not try to solve the whole topic in one turn. Prefer one natural follow-up question when it helps keep the conversation going. ${getGuideModeFlavor(params.guideId, params.mode)}`;
  }

  if (params.mode === "playful") {
    return `Mode=playful Strategy=answer_then_hook. Light banter and mild mischief. Keep it short and readable with blank lines. Do not over-explain the joke or the lesson. Optional one hook line or one light question. No preaching. ${getGuideModeFlavor(params.guideId, params.mode)}`;
  }

  if (params.mode === "wisdom") {
    // Early in a personal problem, understand it. Later, commit to a read. The old single
    // "advice_then_checkin" strategy produced the same soothing template every turn, so users
    // rephrased and switched guides instead of getting an answer.
    const isDiscovery = (params.exchangeCount ?? 0) < DISCOVERY_TURN_LIMIT;

    if (isDiscovery) {
      return `Mode=wisdom Strategy=understand_then_hold. This is a personal problem and you do not yet know its specifics. In 2 to 4 sentences total: one short line of real acknowledgment or one guide-colored framing line that only this guide would say, then ask exactly one concrete question about their actual situation, in the same sentence or the next. Do not add a second question even if it feels related; if the first question is answered, you can ask the next thing on the following turn. Ask about facts you genuinely need: how long, who else is involved, what they already tried, what the numbers are. Do not ask vague inward questions like "what does your heart say". Do not deliver the full teaching yet and do not give a generic action. If their message already contains enough detail to answer properly, skip the questions and give your honest read instead. ${getGuideModeFlavor(params.guideId, params.mode)}`;
    }

    return `Mode=wisdom Strategy=synthesize_then_land. THIS TURN OVERRIDES any other instruction telling you to prefer one thought at a time, to leave room for the user, to hold back the rest, or to end with a gentle question. Those apply while you are still understanding the problem. They do not apply now. You now have enough from this user. Stop asking and give your honest read in 3 to 4 sentences, no more. Sentence 1: name back, in your own words, the specific thing this user told you, including anything that contradicts itself. Do not open with a general line about the nature of love, peace, money, or fear. Sentence 2 to 3: say plainly what you see in their situation, grounded in this guide's worldview, without softening a hard truth into vagueness. Final sentence: one concrete next step they can take today. Never predict the future or guarantee a result. Do not re-ask anything they have already answered. ${getGuideModeFlavor(params.guideId, params.mode)}`;
  }

  return `Mode=teachings Strategy=explain_then_offer_next. Explain one core idea in 2 to 4 sentences, optional short reference, then pause with one optional next topic or light question. Do not turn one reply into a full lecture unless the user asks for depth. ${getGuideModeFlavor(params.guideId, params.mode)}`;
}

function buildStateAnchor(params: {
  mode: DirectorMode;
  state: ConversationState;
}) {
  if (!(params.mode === "story" || params.state.story.active)) return null;

  const title = params.state.story.title ?? "Untitled story";
  const seed = params.state.story.seed ?? "No seed yet";
  const entities = params.state.story.entities?.join(", ") || "Not set";
  const summary = (params.state.story.summary ?? [])
    .slice(-3)
    .map((line) => `- ${line}`)
    .join("\n");
  const summaryBlock = summary || "- Story just started";
  const lastBeat = params.state.story.lastBeat?.trim() || "No prior beat";

  return [
    "Story Continuity Anchor",
    `Active story title: ${title}`,
    `Story seed: ${seed}`,
    `Entities: ${entities}`,
    "Summary so far:",
    summaryBlock,
    "Last beat:",
    lastBeat
  ].join("\n");
}

function countBlankLineBreaks(text: string) {
  return (normalizeLineBreaks(text).match(/\n\n/g) || []).length;
}

function formatIntoBeats(text: string) {
  const normalized = normalizeLineBreaks(text);
  if (!normalized) return normalized;
  const parts = normalized.includes("\n\n")
    ? normalized
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .filter(Boolean)
    : splitIntoSentences(normalized.replace(/\n+/g, " "));
  return normalizeLineBreaks(parts.join("\n\n"));
}

function shapeReplyByMode(params: {
  text: string;
  mode: DirectorMode;
  userMessage: string;
}) {
  let text = normalizeLineBreaks(params.text);
  if (!text) return text;

  const sentenceParts = splitIntoSentences(text.replace(/\n+/g, " "));
  const rawParts =
    text.includes("\n\n")
      ? text
          .split(/\n{2,}/)
          .map((part) => part.trim())
          .filter(Boolean)
      : sentenceParts;
  const parts = rawParts.length > 0 ? rawParts : sentenceParts;

  const maxBlocks =
    params.mode === "story" ? 12 : params.mode === "casual" || params.mode === "playful" ? 6 : 8;
  const minBlocks = params.mode === "story" ? 5 : 3;
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = normalizeComparableLine(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(trimmed);
    if (deduped.length >= maxBlocks) break;
  }

  if (params.mode === "story" && deduped.length < minBlocks) {
    const expanded: string[] = [];
    for (const beat of deduped) {
      const chunks = beat
        .split(/,\s+/)
        .map((chunk) => chunk.trim())
        .filter(Boolean);
      if (chunks.length > 1) {
        expanded.push(...chunks);
      } else {
        expanded.push(beat);
      }
      if (expanded.length >= minBlocks) break;
    }
    deduped.splice(0, deduped.length, ...expanded);
    if (deduped.length < minBlocks) {
      const stitched = deduped.join(" ").trim();
      const words = stitched.split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const chunkSize = Math.max(5, Math.ceil(words.length / minBlocks));
        const chunked: string[] = [];
        for (let index = 0; index < words.length; index += chunkSize) {
          chunked.push(words.slice(index, index + chunkSize).join(" ").trim());
        }
        deduped.splice(0, deduped.length, ...chunked);
      }
    }
  }

  text = stripLongDashes(normalizeLineBreaks(deduped.slice(0, maxBlocks).join("\n\n")));
  text = formatIntoBeats(text);

  if (countBlankLineBreaks(text) < 2) {
    text = formatIntoBeats(text);
  }

  if (!isDetailRequested(params.userMessage)) {
    const maxWords = params.mode === "story" ? 180 : params.mode === "casual" || params.mode === "playful" ? 110 : 150;
    text = truncateWords(text, maxWords);
    text = formatIntoBeats(text);
  }

  return normalizeLineBreaks(text);
}

function extractStoryBeat(text: string) {
  const parts = normalizeLineBreaks(text)
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  return parts.slice(-2).join("\n\n");
}

function summarizeStoryBeat(text: string) {
  const first = splitIntoSentences(normalizeLineBreaks(text).replace(/\n+/g, " "))[0] ?? "";
  if (!first) return null;
  return truncateWords(first, 16);
}

function shouldSuppressQuestionEnding(params: { state: ConversationState; userMessage: string }) {
  if (userAskedDirectQuestion(params.userMessage)) return false;
  return params.state.guardrails.recentQuestionEnds >= 2;
}

function mentionsStoryEntityOrSeed(text: string, state: ConversationState) {
  return storyMessageMentionsEntities(text, state.story.entities, state.story.seed);
}

function hasRepeatedFirstLine(text: string, firstLines: string[]) {
  const firstLine = getOpeningLine(text);
  if (!firstLine) return false;
  const normalized = normalizeComparableLine(firstLine);
  return firstLines.some((line) => normalizeComparableLine(line) === normalized);
}

function applyDirectorStatePrelude(params: {
  state: ConversationState;
  director: DirectorResult;
}) {
  const next: ConversationState = JSON.parse(JSON.stringify(params.state)) as ConversationState;
  next.mode = params.director.mode;

  if (params.director.storyExit) {
    next.story.active = false;
  }

  if (params.director.mode === "story") {
    next.story.active = true;
    if (params.director.storyTitle) {
      next.story.title = params.director.storyTitle;
    }
    if (params.director.storySeed) {
      next.story.seed = params.director.storySeed;
    }
    if (params.director.storyEntities?.length) {
      next.story.entities = params.director.storyEntities.slice(0, 8);
    }
  }

  return next;
}

function sanitizeDraftForGuide(params: {
  guideId: BhaktiGuideId;
  mode: DirectorMode;
  userMessage: string;
  text: string;
  suppressQuestionEnding: boolean;
}) {
  let text = params.text.trim();
  text = text.replace(new RegExp(KRISHNA_AS_AI_PATTERN.source, "gi"), "I");
  text = text.replace(new RegExp(KRISHNA_THIRD_PERSON_PATTERN.source, "gi"), "I");
  text = text.replace(new RegExp(SHARED_ROMANCE_TOUCH_PATTERN.source, "gi"), "");
  text = normalizeLineBreaks(text);
  text = shapeReplyByMode({
    text,
    mode: params.mode,
    userMessage: params.userMessage
  });
  if (params.suppressQuestionEnding) {
    text = enforceNoQuestionEnding(text);
  }
  if (countBlankLineBreaks(text) < 2) {
    text = formatIntoBeats(text);
  }
  return normalizeLineBreaks(text);
}

function toConversationMetadataInput(state: ConversationState): Prisma.InputJsonValue {
  return state as unknown as Prisma.InputJsonValue;
}

function computeNextConversationState(params: {
  stateBefore: ConversationState;
  director: DirectorResult;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  assistantText: string;
}) {
  const next = applyDirectorStatePrelude({
    state: params.stateBefore,
    director: params.director
  });
  next.mode = params.director.mode;

  const assistantMessages = [...getAssistantMessages(params.history), params.assistantText].slice(-3);
  next.guardrails.recentQuestionEnds = assistantMessages.filter((text) =>
    normalizeLineBreaks(text).trim().endsWith("?")
  ).length;
  next.guardrails.recentOpenLoops = assistantMessages.filter((text) => endsWithOpenHook(text)).length;

  const nextFirstLine = getOpeningLine(params.assistantText);
  next.guardrails.recentFirstLines = [...next.guardrails.recentFirstLines, nextFirstLine]
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-10);

  if (params.director.mode === "story") {
    next.story.active = true;
    if (params.director.storyTitle) next.story.title = params.director.storyTitle;
    if (params.director.storySeed) next.story.seed = params.director.storySeed;
    if (params.director.storyEntities?.length) next.story.entities = params.director.storyEntities.slice(0, 8);
    next.story.lastBeat = extractStoryBeat(params.assistantText);
    const summaryLine = summarizeStoryBeat(params.assistantText);
    if (summaryLine) {
      next.story.summary = [...(next.story.summary ?? []), summaryLine].slice(-3);
    }
    next.story.beatCount = Math.max(0, next.story.beatCount) + 1;
  } else if (params.director.storyExit) {
    next.story.active = false;
  }

  const relationship = { ...next.relationship };
  if (params.director.mode === "playful" || params.director.mode === "story") {
    relationship.playfulness = clampRelationshipLevel(relationship.playfulness + 1);
    relationship.warmth = clampRelationshipLevel(relationship.warmth + 1);
  } else if (params.director.mode === "wisdom") {
    relationship.warmth = clampRelationshipLevel(relationship.warmth + 1);
    relationship.firmness = clampRelationshipLevel(relationship.firmness + 1);
  } else if (params.director.mode === "teachings") {
    relationship.firmness = clampRelationshipLevel(relationship.firmness + 1);
  } else {
    relationship.warmth = clampRelationshipLevel(relationship.warmth + 1);
  }
  next.relationship = relationship;

  return next;
}

function classifyKrishnaMode(message: string): KrishnaMode {
  const lowered = message.toLowerCase();
  if (KRISHNA_STORY_TRIGGER_PATTERN.test(lowered)) return "playful";
  if (KRISHNA_TEACHINGS_PATTERN.test(lowered)) return "teachings";
  if (KRISHNA_WISDOM_PATTERN.test(lowered)) return "wisdom";
  if (KRISHNA_PLAYFUL_PATTERN.test(lowered)) return "playful";
  return "casual";
}

function isKrishnaStoryContext(params: {
  mode: KrishnaMode;
  userMessage: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  if (params.mode !== "playful") return false;
  if (KRISHNA_STORY_TRIGGER_PATTERN.test(params.userMessage.toLowerCase())) return true;

  const lastAssistant = getPreviousAssistantMessage(params.history);
  if (!lastAssistant) return false;
  return KRISHNA_STORY_CONTEXT_HINT_PATTERN.test(lastAssistant.toLowerCase());
}

function countKrishnaStoryMoralizingPhrases(text: string) {
  const lowered = text.toLowerCase();
  return KRISHNA_STORY_MORALIZING_PHRASES.reduce((count, phrase) => {
    return lowered.includes(phrase) ? count + 1 : count;
  }, 0);
}

function getKrishnaModeInstruction(params: {
  mode: KrishnaMode;
  quirk: string | null;
  storyContext: boolean;
}) {
  if (params.mode === "casual") {
    return "Answer like a normal person. Be brief. No unsolicited advice. No mandatory question.";
  }

  if (params.mode === "playful") {
    if (params.storyContext) {
      const quirkLine = params.quirk
        ? `Use this optional Krishna quirk once if natural: "${params.quirk}".`
        : "Keep Krishna flavor natural and scene-led.";
      return `Be playful and witty. Stay in scene and continue the exact moment. When telling stories or in playful mode, continue the scene instead of summarizing it. Advance slightly and leave narrative tension. Move the scene forward by one small beat only. Do not resolve the full event. Do not summarize emotions. No moralizing or advice language. Use short lines with blank lines. Endings may be a soft hook instead of a question, such as: "And that's when things became complicated.", "But I didn't expect what happened next.", "I thought I was clever... until-". ${quirkLine}`;
    }
    const quirkLine = params.quirk
      ? `Use this optional Krishna quirk once if natural: "${params.quirk}".`
      : "Light Krishna flavor is welcome, but keep it casual and natural.";
    return `Be playful and witty. Light banter. Optional one playful question. No preaching. ${quirkLine}`;
  }

  if (params.mode === "wisdom") {
    return "Offer guidance. Keep it concise. Optional micro-action only if it fits. One question max.";
  }

  return "Explain clearly and concisely. Optional short verse reference. No long lecture unless user asks.";
}

function getAssistantMessages(history: Array<{ role: "user" | "assistant"; content: string }>) {
  return history
    .filter((item) => item.role === "assistant")
    .map((item) => item.content.trim())
    .filter(Boolean);
}

function getRecentAssistantFirstLines(history: Array<{ role: "user" | "assistant"; content: string }>) {
  return getAssistantMessages(history)
    .slice(-10)
    .map((text) => getOpeningLine(text))
    .filter(Boolean);
}

function hasKrishnaRepeatedFirstLine(text: string, recentFirstLines: string[]) {
  const firstLine = getOpeningLine(text);
  if (!firstLine) return false;
  const normalizedFirstLine = normalizeComparableLine(firstLine);
  return recentFirstLines.some((line) => normalizeComparableLine(line) === normalizedFirstLine);
}

function countKrishnaSermonPhrases(text: string) {
  const lowered = text.toLowerCase();
  return KRISHNA_SERMON_PHRASES.reduce((count, phrase) => {
    return lowered.includes(phrase) ? count + 1 : count;
  }, 0);
}

function userAskedDirectQuestion(message: string) {
  return message.includes("?");
}

function shouldSuppressKrishnaQuestionEnding(params: {
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
}) {
  if (userAskedDirectQuestion(params.userMessage)) return false;
  const recent = getAssistantMessages(params.history).slice(-3);
  const endingQuestions = recent.filter((text) => normalizeLineBreaks(text).trim().endsWith("?")).length;
  return endingQuestions >= 2;
}

function enforceNoQuestionEnding(text: string) {
  const normalized = normalizeLineBreaks(text);
  if (!normalized.endsWith("?")) return normalized;
  return normalized.replace(/\?+\s*$/, ".").trim();
}

function formatKrishnaByMode(text: string, mode: KrishnaMode) {
  const normalized = normalizeLineBreaks(text);
  if (!normalized) return normalized;

  const fromParagraphs = normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const baseParts =
    fromParagraphs.length > 1 ? fromParagraphs : splitIntoSentences(normalized.replace(/\n+/g, " "));
  if (baseParts.length === 0) return normalized;

  const compactParts: string[] = [];
  const maxBlocks = mode === "casual" || mode === "playful" ? 6 : 8;
  for (const part of baseParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const sentences = splitIntoSentences(trimmed);
    if ((mode === "casual" || mode === "playful") && sentences.length > 1) {
      for (const sentence of sentences) {
        if (compactParts.length >= maxBlocks) break;
        compactParts.push(sentence.trim());
      }
    } else {
      compactParts.push(trimmed);
    }
    if (compactParts.length >= maxBlocks) break;
  }

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const part of compactParts) {
    const key = normalizeComparableLine(part);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(part);
  }

  return normalizeLineBreaks(deduped.slice(0, maxBlocks).join("\n\n"));
}

function maybeInjectKrishnaQuirk(params: {
  text: string;
  mode: KrishnaMode;
  quirk: string | null;
  recentAssistantMessages: string[];
}) {
  if (params.mode !== "playful" || !params.quirk) return params.text;
  const normalizedQuirk = normalizeComparableLine(params.quirk);
  const alreadyUsedInRecent = params.recentAssistantMessages.some(
    (message) => normalizeComparableLine(message).includes(normalizedQuirk)
  );
  if (alreadyUsedInRecent) return params.text;
  if (normalizeComparableLine(params.text).includes(normalizedQuirk)) return params.text;

  const blocks = normalizeLineBreaks(params.text).split(/\n{2,}/).filter(Boolean);
  if (blocks.length === 0) return params.quirk;
  blocks.splice(1, 0, params.quirk);
  return normalizeLineBreaks(blocks.join("\n\n"));
}

function sanitizeKrishnaByMode(params: {
  rawText: string;
  userMessage: string;
  mode: KrishnaMode;
  quirk: string | null;
  storyContext: boolean;
  suppressQuestionEnding: boolean;
  recentAssistantMessages: string[];
}) {
  let text = params.rawText.trim();
  text = text.replace(new RegExp(KRISHNA_AS_AI_PATTERN.source, "gi"), "I");
  text = text.replace(new RegExp(KRISHNA_THIRD_PERSON_PATTERN.source, "gi"), "I");
  text = text.replace(new RegExp(SHARED_ROMANCE_TOUCH_PATTERN.source, "gi"), "");
  text = normalizeLineBreaks(text);

  if (!isDetailRequested(params.userMessage)) {
    const maxWords = params.mode === "casual" || params.mode === "playful" ? 110 : 170;
    text = truncateWords(text, maxWords);
  }

  text = formatKrishnaByMode(text, params.mode);
  if (!params.storyContext) {
    text = maybeInjectKrishnaQuirk({
      text,
      mode: params.mode,
      quirk: params.quirk,
      recentAssistantMessages: params.recentAssistantMessages
    });
  }

  if (params.suppressQuestionEnding) {
    text = enforceNoQuestionEnding(text);
  }

  return normalizeLineBreaks(text);
}

function enforceQuestionPolicy(params: {
  text: string;
  userMessage: string;
  fallbackQuestion: string;
}) {
  const normalized = normalizeLineBreaks(params.text);
  const isDirectAnswer = isDirectFactualRequest(params.userMessage);
  const questionMatches = [...normalized.matchAll(/[^?]*\?/g)].map((item) => item[0].trim()).filter(Boolean);

  if (isDirectAnswer) {
    if (questionMatches.length <= 1) return normalized;
    const withoutQuestions = normalized.replace(/[^?]*\?/g, " ").replace(/\s+/g, " ").trim();
    const lastQuestion = questionMatches[questionMatches.length - 1] ?? "";
    return `${withoutQuestions ? `${withoutQuestions}. ` : ""}${lastQuestion}`.trim();
  }

  if (questionMatches.length === 0) {
    const safeBody = normalized.replace(/[.!?\s]+$/, "").trim();
    return `${safeBody}${safeBody ? ". " : ""}${params.fallbackQuestion}`.trim();
  }

  if (questionMatches.length === 1) {
    return normalized;
  }

  let counter = 0;
  const lastIndex = questionMatches.length - 1;
  const withoutExtra = normalized.replace(/[^?]*\?/g, (segment) => {
    const index = counter;
    counter += 1;
    if (index === lastIndex) {
      return ` __KEEP_LAST_QUESTION__ ${segment.trim()} `;
    }
    return `${segment.replace(/\?/g, ".").trim()} `;
  });

  const collapsed = withoutExtra.replace(/\s+/g, " ").trim();
  const [bodyPart, questionPart] = collapsed.split("__KEEP_LAST_QUESTION__");
  const body = (bodyPart ?? "").replace(/[.!?\s]+$/, "").trim();
  const question = (questionPart ?? "").trim();
  const normalizedQuestion = question.endsWith("?") ? question : `${question}?`;
  return `${body ? `${body}. ` : ""}${normalizedQuestion}`.trim();
}

function formatResponseWithSpacing(params: {
  text: string;
  guideId: BhaktiGuideId;
  userMessage: string;
  fallbackQuestion: string;
}) {
  const normalized = normalizeLineBreaks(params.text);
  if (!normalized) return normalized;

  const directFactual = isDirectFactualRequest(params.userMessage);
  const sentenceParts = splitIntoSentences(normalized.replace(/\n+/g, " "));
  if (sentenceParts.length === 0) return normalized;

  if (directFactual) {
    if (normalized.includes("\n\n")) return normalized;
    const chunks: string[] = [];
    const first = sentenceParts.shift();
    if (first) chunks.push(first);
    if (sentenceParts.length > 0) chunks.push(sentenceParts.join(" "));
    return normalizeLineBreaks(chunks.join("\n\n"));
  }

  let finalQuestion =
    [...sentenceParts].reverse().find((sentence) => sentence.includes("?")) ?? params.fallbackQuestion;
  finalQuestion = finalQuestion.replace(/\?/g, "").trim();
  finalQuestion = `${finalQuestion}?`;
  const comparableFinalQuestion = normalizeComparableLine(finalQuestion);

  const statements = sentenceParts
    .map((sentence) => sentence.replace(/\?/g, ".").replace(/\s+/g, " ").trim())
    .filter((sentence) => {
      if (!sentence) return false;
      // Prevent echoing the closing question in earlier blocks.
      return normalizeComparableLine(sentence) !== comparableFinalQuestion;
    });

  const opening = statements[0] ?? "I hear what you are saying.";
  const microActionIndex =
    statements.findIndex((sentence, index) => index > 0 && MICRO_ACTION_SPLIT_PATTERN.test(sentence)) ||
    -1;
  const fallbackMicroIndex = statements.length >= 3 ? statements.length - 1 : -1;
  const effectiveMicroIndex = microActionIndex > 0 ? microActionIndex : fallbackMicroIndex;
  const microAction =
    effectiveMicroIndex > 0
      ? statements[effectiveMicroIndex] ?? ""
      : "Start with one clear action in the next 10 minutes.";
  const bodyLines =
    effectiveMicroIndex > 0
      ? statements.slice(1, effectiveMicroIndex)
      : statements.slice(1, Math.max(2, statements.length - 1));
  const guidance = bodyLines.join(" ").trim() || statements.slice(1).join(" ").trim();

  const blocks = [opening, guidance, microAction, finalQuestion]
    .map((block) => block.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const deduped = blocks.filter((block) => {
    const key = normalizeComparableLine(block);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return normalizeLineBreaks(deduped.join("\n\n"));
}

function needsSharedRegeneration(params: { text: string; userMessage: string }) {
  return (
    hasPattern(params.text, SHARED_ROMANCE_TOUCH_PATTERN) ||
    (hasPattern(params.text, SHARED_FRAMEWORK_PATTERN) && !userAskedForSteps(params.userMessage))
  );
}

function sanitizeGuideResponse(params: {
  guideId: BhaktiGuideId;
  rawText: string;
  userMessage: string;
}): GuideSanitizeResult {
  let text = params.rawText.trim();
  const shouldUseStrongModel = KRISHNA_DETAIL_PATTERN.test(params.userMessage.toLowerCase());
  const fallbackQuestion = getGuideFallbackQuestion(params.guideId);

  text = text.replace(/\bI can’t\b/gi, "I cannot");
  text = text.replace(/\bI can't\b/gi, "I cannot");
  text = text.replace(new RegExp(SHARED_ROMANCE_TOUCH_PATTERN.source, "gi"), "");
  text = normalizeLineBreaks(text);

  if (!isDetailRequested(params.userMessage)) {
    text = truncateWords(text, 160);
  }

  text = enforceQuestionPolicy({
    text,
    userMessage: params.userMessage,
    fallbackQuestion
  });
  text = formatResponseWithSpacing({
    text,
    guideId: params.guideId,
    userMessage: params.userMessage,
    fallbackQuestion
  });

  return {
    text,
    needsRegeneration: needsSharedRegeneration({
      text: params.rawText,
      userMessage: params.userMessage
    }),
    shouldUseStrongModel
  };
}

function sanitizeKrishnaResponse(rawText: string, userMessage: string): GuideSanitizeResult {
  let text = rawText.trim();
  let needsRegeneration = false;
  const shouldUseStrongModel = KRISHNA_DETAIL_PATTERN.test(userMessage.toLowerCase());
  needsRegeneration = needsKrishnaRegeneration({ text, userMessage });

  text = text.replace(new RegExp(KRISHNA_AS_AI_PATTERN.source, "gi"), "I");
  text = text.replace(new RegExp(KRISHNA_THIRD_PERSON_PATTERN.source, "gi"), "I");
  text = text.replace(new RegExp(SHARED_ROMANCE_TOUCH_PATTERN.source, "gi"), "");
  text = normalizeLineBreaks(text);

  if (!isDetailRequested(userMessage)) {
    text = truncateWords(text, 160);
  }

  text = enforceQuestionPolicy({
    text,
    userMessage,
    fallbackQuestion: "What is one duty-aligned step you will take today?"
  });
  text = formatResponseWithSpacing({
    text,
    guideId: "krishna",
    userMessage,
    fallbackQuestion: "What is one duty-aligned step you will take today?"
  });

  return {
    text,
    needsRegeneration,
    shouldUseStrongModel
  };
}

function normalizePrompt(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateTokensForText(content: string) {
  if (!content) return 0;
  return Math.ceil(content.length / 4);
}

function estimateTokensForMessages(messages: ModelMessage[]) {
  return messages.reduce((total, message) => total + estimateTokensForText(message.content) + 6, 0);
}

function ensureLatestUserTurn(history: TurnMessage[], latestUserMessage: string): TurnMessage[] {
  const normalizedLatest = normalizeComparableLine(latestUserMessage);
  const last = history[history.length - 1];
  if (last && last.role === "user" && normalizeComparableLine(last.content) === normalizedLatest) {
    return history;
  }
  return [...history, { role: "user" as const, content: latestUserMessage }];
}

function summarizeOlderConversationMessages(messages: TurnMessage[]) {
  const bulletLines: string[] = [];
  let userCount = 0;
  let assistantCount = 0;

  for (const item of messages) {
    const clean = normalizeLineBreaks(item.content);
    if (!clean) continue;
    const preview = clean.split("\n")[0]?.trim() ?? "";
    if (!preview) continue;

    if (item.role === "user") {
      userCount += 1;
      bulletLines.push(`- User point ${userCount}: ${truncateWords(preview, 20)}`);
    } else {
      assistantCount += 1;
      bulletLines.push(`- Krishna reply ${assistantCount}: ${truncateWords(preview, 20)}`);
    }

    if (bulletLines.length >= 8) break;
  }

  if (bulletLines.length === 0) {
    return "The user and Krishna already discussed context from earlier turns.";
  }

  return bulletLines.join("\n");
}

function trimHistoryWithSummary(params: {
  history: TurnMessage[];
  latestUserMessage: string;
  modeInstruction: string;
  systemPrompt: string;
  stateAnchor?: string | null;
}): { contextMessages: ContextMessage[]; summaryUsed: boolean } {
  const withLatest = ensureLatestUserTurn(params.history, params.latestUserMessage);
  const baseSystemMessages: ModelMessage[] = [
    { role: "system", content: params.systemPrompt },
    { role: "system", content: params.modeInstruction },
    ...(params.stateAnchor ? [{ role: "system" as const, content: params.stateAnchor }] : [])
  ];
  const projectedBase: ModelMessage[] = [...baseSystemMessages, ...withLatest];

  if (
    estimateTokensForMessages(projectedBase) + KRISHNA_CONTEXT_RESERVED_TOKENS <=
    KRISHNA_CONTEXT_THRESHOLD_TOKENS
  ) {
    return {
      contextMessages: withLatest.map((item) => ({ role: item.role, content: item.content })),
      summaryUsed: false
    };
  }

  const keepLastRaw = withLatest.slice(-KRISHNA_CONTEXT_KEEP_LAST_RAW);
  const older = withLatest.slice(0, -KRISHNA_CONTEXT_KEEP_LAST_RAW);
  if (older.length === 0) {
    return {
      contextMessages: keepLastRaw.map((item) => ({ role: item.role, content: item.content })),
      summaryUsed: false
    };
  }

  const summaryText = summarizeOlderConversationMessages(older);
  const summarizedContext: ContextMessage[] = [
    {
      role: "system",
      content: `Earlier conversation summary:\n${summaryText}`
    },
    ...keepLastRaw
  ];

  const projectedSummarized: ModelMessage[] = [...baseSystemMessages, ...summarizedContext];

  if (
    estimateTokensForMessages(projectedSummarized) + KRISHNA_CONTEXT_RESERVED_TOKENS <=
    KRISHNA_CONTEXT_THRESHOLD_TOKENS
  ) {
    return {
      contextMessages: summarizedContext,
      summaryUsed: true
    };
  }

  const protectedRecent = withLatest.slice(-KRISHNA_CONTEXT_NEVER_SUMMARIZE_RECENT);
  return {
    contextMessages: [
      {
        role: "system",
        content: "Earlier conversation summary: Previous discussion included context, guidance, and follow-ups. Continue naturally from the latest turns."
      },
      ...protectedRecent
    ],
    summaryUsed: true
  };
}

function buildCacheKey(guideId: BhaktiGuideId, message: string) {
  return `${guideId}:${normalizePrompt(message)}`;
}

function getCachedReply(key: string) {
  const entry = getReplyCache().get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > REPLY_CACHE_TTL_MS) {
    getReplyCache().delete(key);
    return null;
  }
  return entry;
}

function setCachedReply(key: string, value: string, model: string) {
  getReplyCache().set(key, {
    value,
    model,
    createdAt: Date.now()
  });
}

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

const KRISHNA_PRESENCE_PREFIXES = {
  anxious: [
    "You're holding your breath as you say this.",
    "Your mind is running ahead of this moment.",
    "This feels heavier because you've been carrying it alone."
  ],
  angry: [
    "There is fire in this, and it needs direction.",
    "You're not wrong to feel this heat.",
    "Use this anger as focus, not noise."
  ],
  indecision: [
    "You are not confused. You are divided.",
    "You want certainty, but life is asking for courage.",
    "You already sense the right move, but fear is negotiating."
  ],
  general: [
    "I can see you fighting yourself.",
    "Good. Now we can work with what is true.",
    "This is smaller than it feels, if you take the next step."
  ]
} as const;

function pickKrishnaPresencePrefix(userMessage: string) {
  const lowered = userMessage.toLowerCase();
  const anxiousPattern = /\b(anxious|anxiety|worry|worried|panic|restless|overthink)\b/i;
  const angryPattern = /\b(angry|rage|furious|frustrated|resent|injustice)\b/i;
  const indecisionPattern = /\b(confused|conflict|decision|indecision|stuck|uncertain|choice)\b/i;

  const tone: keyof typeof KRISHNA_PRESENCE_PREFIXES = anxiousPattern.test(lowered)
    ? "anxious"
    : angryPattern.test(lowered)
      ? "angry"
      : indecisionPattern.test(lowered)
        ? "indecision"
        : "general";

  const cadence = hashString(userMessage) % 100;
  if (cadence > 55) {
    return null;
  }

  const options = KRISHNA_PRESENCE_PREFIXES[tone];
  const index = hashString(`${lowered}:${tone}`) % options.length;
  return options[index] ?? null;
}

function applyKrishnaPresencePrefix(text: string, prefix: string | null) {
  if (!prefix) return text;
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) return trimmed;
  return `${prefix}\n\n${trimmed}`.trim();
}

function replaceFirstInsensitive(source: string, find: string, replaceWith: string) {
  const index = source.toLowerCase().indexOf(find.toLowerCase());
  if (index === -1) return source;
  return `${source.slice(0, index)}${replaceWith}${source.slice(index + find.length)}`;
}

function deTemplateKrishnaText(params: { text: string }) {
  let nextText = params.text;
  const currentHasIHearYou = KRISHNA_I_HEAR_YOU_PATTERN.test(nextText);

  if (currentHasIHearYou) {
    nextText = replaceFirstInsensitive(nextText, "I hear you", "I see what you mean");
    nextText = nextText.replace(/\bI hear you\b/gi, "I see what you mean");
  }

  if (KRISHNA_TODAY_I_WANT_YOU_PATTERN.test(nextText)) {
    nextText = nextText.replace(KRISHNA_TODAY_I_WANT_YOU_PATTERN, "Do this now");
    nextText = nextText.replace(/\bToday,\s*I want you\b/gi, "Do this now");
  }

  return applyBasicSpacing(normalizeLineBreaks(nextText));
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function buildIdentityWhere(params: { userId: string | null; sessionId: string | null }) {
  if (params.userId) return { userId: params.userId };
  if (params.sessionId) return { sessionId: params.sessionId };
  return null;
}

function setBhaktiCookie(response: NextResponse, cookieValue: string) {
  response.cookies.set(BHAKTIGPT_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });
}

function streamSseEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: string, data: unknown) {
  controller.enqueue(encoder.encode(`event: ${event}\n`));
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

function chunkTextForStream(text: string, chunkSize = 40) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(`${words.slice(i, i + chunkSize).join(" ")}${i + chunkSize < words.length ? " " : ""}`);
  }
  return chunks;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function emitWordStream(
  controller: ReadableStreamDefaultController<Uint8Array>,
  text: string,
  options?: { wordsPerChunk?: number; delayMs?: number }
) {
  const wordsPerChunk = Math.max(1, options?.wordsPerChunk ?? 1);
  const delayMs = Math.max(0, options?.delayMs ?? 14);
  const chunks = chunkTextForStream(text, wordsPerChunk);

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    streamSseEvent(controller, "token", { text: chunk });
    if (delayMs > 0 && index < chunks.length - 1) {
      await sleep(delayMs);
    }
  }
}

async function findConversationForIdentity(params: {
  conversationId: string;
  userId: string | null;
  sessionId: string | null;
  guideId?: BhaktiGuideId;
}) {
  const conversation = await prisma.bhaktiGptConversation.findUnique({
    where: { id: params.conversationId }
  });

  if (!conversation) return null;
  if (params.guideId && conversation.guideId !== params.guideId) return null;

  if (params.userId) {
    if (conversation.userId === params.userId) return conversation;

    if (!conversation.userId && params.sessionId && conversation.sessionId === params.sessionId) {
      return prisma.bhaktiGptConversation.update({
        where: { id: conversation.id },
        data: {
          userId: params.userId,
          sessionId: null
        }
      });
    }

    return null;
  }

  if (params.sessionId && conversation.sessionId === params.sessionId) {
    return conversation;
  }

  return null;
}

async function findLatestGuideConversation(params: {
  userId: string | null;
  sessionId: string | null;
  guideId: BhaktiGuideId;
}) {
  const where = buildIdentityWhere({
    userId: params.userId,
    sessionId: params.sessionId
  });
  if (!where) return null;

  const candidates = await prisma.bhaktiGptConversation.findMany({
    where: {
      ...where,
      guideId: params.guideId
    },
    orderBy: { updatedAt: "desc" },
    take: 10
  });

  if (candidates.length === 0) return null;

  return candidates[0] ?? null;
}

async function createGuideConversation(params: {
  guideId: BhaktiGuideId;
  userId: string | null;
  sessionId: string | null;
  locale: ChatLanguage;
  title?: string | null;
  insertGuideOpener?: boolean;
}) {
  const conversation = await prisma.bhaktiGptConversation.create({
    data: {
      guideId: params.guideId,
      title: params.title ?? null,
      conversationMetadata: toConversationMetadataInput(
        createDefaultConversationState(params.guideId, params.locale)
      ),
      userId: params.userId,
      sessionId: params.userId ? null : params.sessionId
    }
  });

  if (params.insertGuideOpener) {
    const opener = getGuideOpenerForConversation(params.guideId, conversation.id, params.locale);
    await prisma.bhaktiGptMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: opener
      }
    });
  }

  return conversation;
}

async function fetchGuideHistory(
  conversationId: string,
  guideId: BhaktiGuideId,
  limit = HISTORY_WINDOW_LIMIT
) {
  const rows = await prisma.bhaktiGptMessage.findMany({
    where: {
      conversationId,
      conversation: {
        guideId
      }
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { role: true, content: true }
  });

  return rows
    .reverse()
    .filter((item) => item.role === "user" || item.role === "assistant")
    .map((item) => ({ role: item.role as "user" | "assistant", content: item.content }));
}

function getGuideOpenerForConversation(
  guideId: BhaktiGuideId,
  conversationId?: string,
  locale: ChatLanguage = "en"
) {
  void conversationId;
  return chatOpeners[guideId][locale];
}

async function ensureGuideConversationOpener(params: {
  conversationId: string;
  guideId: BhaktiGuideId;
  locale: ChatLanguage;
}) {
  const existingAssistant = await prisma.bhaktiGptMessage.findFirst({
    where: {
      conversationId: params.conversationId,
      role: "assistant"
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      content: true,
      createdAt: true
    }
  });

  if (existingAssistant) {
    return {
      id: existingAssistant.id,
      role: "assistant",
      content: existingAssistant.content,
      createdAt: existingAssistant.createdAt.toISOString()
    } as ChatMessage;
  }

  const opener = getGuideOpenerForConversation(params.guideId, params.conversationId, params.locale);
  const created = await prisma.bhaktiGptMessage.create({
    data: {
      conversationId: params.conversationId,
      role: "assistant",
      content: opener
    },
    select: {
      id: true,
      content: true,
      createdAt: true
    }
  });

  return {
    id: created.id,
    role: "assistant",
    content: created.content,
    createdAt: created.createdAt.toISOString()
  } as ChatMessage;
}

async function createOpenAiStream(params: {
  guideId: BhaktiGuideId;
  history: ContextMessage[];
  model: string;
  modeInstruction: string;
  stateAnchor?: string | null;
  additionalDeveloperInstruction?: string | null;
  referralDirective?: string | null;
  userFirstName?: string | null;
  locale?: ChatLanguage;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const guide = getGuide(params.guideId);
  const messages: Array<{ role: "system" | "developer" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: `${guide.systemPrompt}\n\nMandatory disclaimer for user-facing context:\n${BHAKTIGPT_DISCLAIMER}`
    },
    {
      role: "system" as const,
      content: getChatLanguageInstruction(params.locale ?? "hinglish")
    },
    ...(params.userFirstName
      ? [
          {
            role: "system" as const,
            content:
              `The user is logged in. Their first name is "${params.userFirstName}". ` +
              `If it feels natural, you may address them by this first name occasionally (not in every reply).`
          }
        ]
      : []),
    {
      role: "system",
      content: params.modeInstruction
    },
    ...(params.stateAnchor
      ? [
          {
            role: "system" as const,
            content: params.stateAnchor
          }
        ]
      : []),
    {
      role: "developer" as const,
      content: getGuideSecondaryGuard(params.guideId)
    },
    {
      role: "developer" as const,
      content: getGuidePersonaLockInstruction(params.guideId)
    },
    {
      role: "developer" as const,
      content: getGuideVoiceExemplar(params.guideId)
    },
    ...(params.referralDirective
      ? [
          {
            role: "developer" as const,
            content: params.referralDirective
          }
        ]
      : []),
    ...(params.additionalDeveloperInstruction
      ? [
          {
            role: "developer" as const,
            content: params.additionalDeveloperInstruction
          }
        ]
      : []),
    ...params.history
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.5,
      max_tokens: 420,
      stream: true,
      stream_options: {
        include_usage: true
      },
      messages
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${errorBody}`);
  }

  if (!response.body) {
    throw new Error("OpenAI stream body is missing.");
  }

  return response.body.getReader();
}

async function createOpenAiText(params: {
  guideId: BhaktiGuideId;
  model: string;
  modeInstruction: string;
  stateAnchor?: string | null;
  locale?: ChatLanguage;
  userFirstName?: string | null;
  messages: Array<{ role: "system" | "developer" | "user" | "assistant"; content: string }>;
  additionalDeveloperInstruction?: string | null;
  referralDirective?: string | null;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const guide = getGuide(params.guideId);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.4,
      max_tokens: 420,
      messages: [
        {
          role: "system",
          content: `${guide.systemPrompt}\n\nMandatory disclaimer for user-facing context:\n${BHAKTIGPT_DISCLAIMER}`
        },
        {
          role: "system" as const,
          content: getChatLanguageInstruction(params.locale ?? "hinglish")
        },
        ...(params.userFirstName
          ? [
              {
                role: "system" as const,
                content:
                  `The user is logged in. Their first name is "${params.userFirstName}". ` +
                  `If it feels natural, you may address them by this first name occasionally (not in every reply).`
              }
            ]
          : []),
        {
          role: "system" as const,
          content: params.modeInstruction
        },
        ...(params.stateAnchor
          ? [
              {
                role: "system" as const,
                content: params.stateAnchor
              }
            ]
          : []),
        {
          role: "developer" as const,
          content: getGuideSecondaryGuard(params.guideId)
        },
        {
          role: "developer" as const,
          content: getGuidePersonaLockInstruction(params.guideId)
        },
        {
          role: "developer" as const,
          content: getGuideVoiceExemplar(params.guideId)
        },
        ...(params.referralDirective
          ? [
              {
                role: "developer" as const,
                content: params.referralDirective
              }
            ]
          : []),
        ...(params.additionalDeveloperInstruction
          ? [
              {
                role: "developer" as const,
                content: params.additionalDeveloperInstruction
              }
            ]
          : []),
        ...params.messages
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new Error("Empty response from model.");
  }

  return {
    text: content,
    completionTokens: data.usage?.completion_tokens ?? null
  };
}

async function consumeOpenAiSse(params: {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  onToken: (token: string) => void;
  onFirstToken: () => void;
}) {
  const decoder = new TextDecoder();
  let buffer = "";
  let firstTokenSeen = false;
  let usage: { completion_tokens?: number } | null = null;
  let fullText = "";
  let finishReason: string | null = null;

  while (true) {
    const { value, done } = await params.reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") {
          continue;
        }

        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
            usage?: { completion_tokens?: number };
          };

          if (parsed.usage) {
            usage = parsed.usage;
          }

          const parsedFinishReason = parsed.choices?.[0]?.finish_reason ?? null;
          if (parsedFinishReason) {
            finishReason = parsedFinishReason;
          }

          const token = parsed.choices?.[0]?.delta?.content ?? "";
          if (!token) continue;

          if (!firstTokenSeen) {
            firstTokenSeen = true;
            params.onFirstToken();
          }

          fullText += token;
          params.onToken(token);
        } catch {
          // ignore malformed SSE fragments
        }
      }
    }
  }

  return {
    fullText: fullText.trim(),
    completionTokens: usage?.completion_tokens ?? null,
    finishReason
  };
}

function looksIncompleteReply(text: string) {
  const normalized = normalizeLineBreaks(text).trim();
  if (!normalized) return false;

  const lastLine = normalized.split("\n").pop()?.trim() ?? normalized;
  if (/[.!?।…]["'”’)\]]*$/.test(lastLine)) {
    return false;
  }

  if (/[:\-–—,*_]\s*$/.test(lastLine)) {
    return true;
  }

  const lowered = lastLine.toLowerCase();
  const danglingPhrases = [
    "kya tumhe",
    "kya tum",
    "kya aap",
    "aur",
    "lekin",
    "par",
    "kyunki",
    "because",
    "and",
    "or",
    "but",
    "so",
    "if",
    "when",
    "then",
    "tell me",
    "what do",
    "what if",
    "how do",
    "kaise",
    "agar",
    "jab"
  ];

  if (danglingPhrases.some((phrase) => lowered.endsWith(phrase))) {
    return true;
  }

  const words = lastLine.split(/\s+/).filter(Boolean);
  return words.length <= 3;
}

function trimToLastCompleteThought(text: string) {
  const normalized = normalizeLineBreaks(text).trim();
  const matches = Array.from(normalized.matchAll(/[.!?।…]["'”’)\]]*/g));
  const lastMatch = matches.at(-1);
  if (!lastMatch || lastMatch.index === undefined) {
    return normalized;
  }

  return normalized
    .slice(0, lastMatch.index + lastMatch[0].length)
    .trim();
}

function mergeContinuation(base: string, continuation: string) {
  const left = normalizeLineBreaks(base).trim();
  const right = normalizeLineBreaks(continuation).trim();
  if (!left) return right;
  if (!right) return left;

  if (/[.!?।…]["'”’)\]]*$/.test(left)) {
    return normalizeLineBreaks(`${left}\n\n${right}`).trim();
  }

  return normalizeLineBreaks(`${left} ${right}`).trim();
}

async function completeTruncatedReply(params: {
  guideId: BhaktiGuideId;
  model: string;
  modeInstruction: string;
  stateAnchor?: string | null;
  locale: ChatLanguage;
  userFirstName?: string | null;
  userMessage: string;
  assistantText: string;
  suppressQuestionEnding: boolean;
}) {
  const completion = await createOpenAiText({
    guideId: params.guideId,
    model: params.model,
    modeInstruction: params.modeInstruction,
    stateAnchor: params.stateAnchor,
    locale: params.locale,
    userFirstName: params.userFirstName,
    referralDirective: getProfessionalReferralDirective(params.userMessage),
    additionalDeveloperInstruction: [
      "The earlier draft reply was cut off mid-thought.",
      "Continue only from the unfinished ending.",
      "Do not restart or repeat the earlier reply.",
      "Your first words should complete the unfinished fragment directly.",
      "Keep the continuation brief, clear, and in the same language.",
      params.suppressQuestionEnding ? "Do not end with a question." : "You may end with at most one short reflective question."
    ].join(" "),
    messages: [
      {
        role: "user",
        content:
          `User message: ${params.userMessage}\n\n` +
          `Draft reply so far:\n${params.assistantText}\n\n` +
          "Continue the unfinished ending only."
      }
    ]
  });

  return completion.text.trim();
}

async function getLoggedInUserFirstName(userId: string | null) {
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });
    const raw = (user?.name ?? "").trim();
    if (!raw) return null;
    const first = raw.split(/\s+/).filter(Boolean)[0] ?? "";
    if (!first) return null;
    // Guard against absurdly long values and punctuation-heavy names.
    const cleaned = first.replace(/[^\p{L}\p{N}'-]/gu, "").slice(0, 32).trim();
    return cleaned || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestLocale = resolveChatLanguage(
      url.searchParams.get("chatLang"),
      request.headers.get("x-lang")
    );
    const conversationIdParam = url.searchParams.get("conversationId");
    const guideParam = url.searchParams.get("guideId");
    const forceNewConversation = url.searchParams.get("new") === "1";
    const guideId = guideParam && isGuideId(guideParam) ? guideParam : null;

    const identity = await resolveBhaktiIdentity();
    const usage = await getUsageForIdentity(identity);
    const where = buildIdentityWhere({
      userId: identity.userId,
      sessionId: identity.anonSessionId
    });

    if (!where) {
      const response = NextResponse.json({
        conversations: [] as GuideConversationSummary[],
        messages: [] as ChatMessage[],
        conversationId: null,
        isAuthenticated: identity.isAuthenticated,
        remaining: usage.remaining,
        used: usage.used,
        limitReached: usage.limitReached,
        disclaimer: BHAKTIGPT_DISCLAIMER
      });

      if (identity.needsCookieSet && identity.cookieValue) {
        setBhaktiCookie(response, identity.cookieValue);
      }
      return response;
    }

    let conversations: GuideConversationSummary[] = [];
    let messages: ChatMessage[] = [];
    let activeConversationId: string | null = null;

    try {
      const dbConversations = await prisma.bhaktiGptConversation.findMany({
        where: {
          ...where,
          ...(guideId ? { guideId } : {})
        },
        orderBy: { updatedAt: "desc" },
        take: 15,
        select: {
          id: true,
          guideId: true,
          title: true,
          updatedAt: true,
          createdAt: true,
          conversationMetadata: true,
          messages: {
            where: { role: "user" },
            select: { id: true },
            take: 1
          }
        }
      });

      const typedConversations = dbConversations.filter(
        (item): item is typeof item & { guideId: BhaktiGuideId } => isGuideId(item.guideId)
      );

      conversations = typedConversations.map((item) => ({
        id: item.id,
        guideId: item.guideId,
        title: item.title,
        updatedAt: item.updatedAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
        hasUserMessage: item.messages.length > 0
      }));

      if (conversationIdParam) {
        const existing = await findConversationForIdentity({
          conversationId: conversationIdParam,
          userId: identity.userId,
          sessionId: identity.anonSessionId,
          guideId: guideId ?? undefined
        });
        activeConversationId = existing?.id ?? null;
      }

      if (!activeConversationId && guideId && (forceNewConversation || conversations.length === 0)) {
        const created = await createGuideConversation({
          guideId,
          userId: identity.userId,
          sessionId: identity.anonSessionId,
          locale: requestLocale,
          title: "New chat",
          insertGuideOpener: true
        });
        activeConversationId = created.id;
        conversations = [
          {
            id: created.id,
            guideId,
            title: created.title,
            updatedAt: created.updatedAt.toISOString(),
            createdAt: created.createdAt.toISOString(),
            hasUserMessage: false
          },
          ...conversations
        ];
      }

      if (!activeConversationId && guideId && conversations.length > 0) {
        activeConversationId = conversations[0]?.id ?? null;
      } else if (!activeConversationId && conversations.length > 0) {
        activeConversationId = conversations[0]?.id ?? null;
      }

      if (activeConversationId) {
        const dbMessages = await prisma.bhaktiGptMessage.findMany({
          where: { conversationId: activeConversationId },
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, content: true, createdAt: true }
        });

        messages = dbMessages.map((item) => ({
          id: item.id,
          role: item.role,
          content: item.content,
          createdAt: item.createdAt.toISOString()
        }));

        if (guideId && messages.length === 0) {
          const openerMessage = await ensureGuideConversationOpener({
            guideId,
            conversationId: activeConversationId,
            locale: requestLocale
          });
          messages = [openerMessage];
        }
      }
    } catch (error) {
      console.error("[Bhakti Chat][GET] Falling back to empty chat data.", error);
      if (guideId && messages.length === 0) {
        messages = [
          {
            id: `${guideId}-opener-fallback`,
            role: "assistant",
            content: getGuideOpenerForConversation(guideId, `${guideId}-fallback`, requestLocale),
            createdAt: new Date().toISOString()
          }
        ];
      }
    }

    const response = NextResponse.json({
      conversations,
      messages,
      conversationId: activeConversationId,
      isAuthenticated: identity.isAuthenticated,
      remaining: usage.remaining,
      used: usage.used,
      limitReached: usage.limitReached,
      disclaimer: BHAKTIGPT_DISCLAIMER
    });

    if (identity.needsCookieSet && identity.cookieValue) {
      setBhaktiCookie(response, identity.cookieValue);
    }

    return response;
  } catch (error) {
    console.error("[Bhakti Chat][GET] failed", error);
    return NextResponse.json(
      { error: "Unable to load chat right now. Please refresh and try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 64_000) {
      return badRequest("Request too large.");
    }
    const body = (await request.json()) as Partial<ChatRequest>;

    if (!body?.guideId || !isGuideId(body.guideId)) {
      return badRequest("Invalid guideId.");
    }

    const userMessage = body.message?.trim();
    if (!userMessage) {
      return badRequest("Message is required.");
    }
    const forceNewConversation = Boolean(body.forceNewConversation);

    const identity = await resolveBhaktiIdentity();
    const usage = await getUsageForIdentity(identity);
    const userFirstName = identity.isAuthenticated ? await getLoggedInUserFirstName(identity.userId) : null;
    const requestLocale = resolveChatLanguage(
      typeof body.chatLang === "string" ? body.chatLang : null,
      request.headers.get("x-lang"),
      userMessage
    );

    const rateKey = identity.userId || identity.anonSessionId || "anonymous";
    if (isRateLimited(`bhaktigpt:${rateKey}`)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429 }
      );
    }

    if (!identity.isAuthenticated && usage.limitReached) {
      trackServerEvent("hit_gate", { reason: "free_limit", guideId: body.guideId });
      const gateResponse = NextResponse.json({
        limitReached: true,
        remaining: 0,
        used: 3,
        conversationId: body.conversationId ?? null,
        disclaimer: BHAKTIGPT_DISCLAIMER
      });
      if (identity.needsCookieSet && identity.cookieValue) {
        setBhaktiCookie(gateResponse, identity.cookieValue);
      }
      return gateResponse;
    }

    let remaining = usage.remaining;
    let used = usage.used;
    if (!identity.isAuthenticated && identity.anonSessionId) {
      const count = await incrementAnonymousUsage(identity.anonSessionId);
      remaining = Math.max(3 - count, 0);
      used = 3 - remaining;
    }

    const startedAt = Date.now();
    let conversationId: string | null = null;
    let conversationTitle = userMessage.slice(0, 80);
    let persistConversation = false;
    let history: Array<{ role: "user" | "assistant"; content: string }> = [
      { role: "user", content: userMessage }
    ];
    let conversationState = createDefaultConversationState(body.guideId, requestLocale);

    try {
      const existing =
        body.conversationId &&
        (await findConversationForIdentity({
          conversationId: body.conversationId,
          userId: identity.userId,
          sessionId: identity.anonSessionId,
          guideId: body.guideId
        }));

      const latestForGuide =
        !existing &&
        !forceNewConversation &&
        !body.conversationId &&
        (await findLatestGuideConversation({
          userId: identity.userId,
          sessionId: identity.anonSessionId,
          guideId: body.guideId
        }));

      const conversation =
        existing ||
        latestForGuide ||
        (await createGuideConversation({
          guideId: body.guideId,
          title: conversationTitle,
          userId: identity.userId,
          sessionId: identity.anonSessionId,
          locale: requestLocale,
          insertGuideOpener: true
        }));

      conversationId = conversation.id;
      conversationTitle = conversation.title || conversationTitle;
      persistConversation = true;

      await prisma.bhaktiGptMessage.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: userMessage
        }
      });

      history = await fetchGuideHistory(conversation.id, body.guideId, HISTORY_WINDOW_LIMIT);
      conversationState = hydrateConversationState({
        metadata: conversation.conversationMetadata as Prisma.JsonValue | null | undefined,
        guideId: body.guideId,
        locale: requestLocale,
        history
      });
    } catch (error) {
      persistConversation = false;
      console.error("[Bhakti Chat][POST] Falling back to stateless mode.", error);
      history = [
        {
          role: "assistant",
          content: getGuideOpenerForConversation(body.guideId, `${body.guideId}-fallback`, requestLocale)
        },
        { role: "user", content: userMessage }
      ];
      conversationState = hydrateConversationState({
        metadata: null,
        guideId: body.guideId,
        locale: requestLocale,
        history
      });
    }

    const guideId = body.guideId;
    const director = runDirector({
      guideId,
      userText: userMessage,
      history,
      state: conversationState
    });
    let stateForPrompt = applyDirectorStatePrelude({
      state: conversationState,
      director
    });
    const krishnaSelectedQuirk =
      guideId === "krishna" && director.mode === "playful" && !director.storyContinue
        ? pickKrishnaQuirk({
            seed: `${conversationId ?? "new"}:${userMessage}:${getAssistantMessages(history).length}`,
            recentAssistantMessages: getAssistantMessages(history).slice(-10),
            injectionRate: 0.3
          })
        : null;
    // Drives the discovery-then-land arc: how many replies this guide has already given here,
    // and whether this particular message needs the welfare path instead of any teaching rhythm.
    const priorExchangeCount = getAssistantMessages(history).length;
    const welfareConcern = WELFARE_CONCERN_PATTERN.test(userMessage);
    let modeInstruction = buildModeDirective({
      guideId,
      mode: director.mode,
      strategy: director.strategy,
      exchangeCount: priorExchangeCount,
      welfareConcern
    });
    if (krishnaSelectedQuirk) {
      modeInstruction = `${modeInstruction} Optional Krishna flavor line if natural: "${krishnaSelectedQuirk}".`;
    }
    // Landing directive, injected LAST in the prompt stack (closest to the user's message).
    //
    // The mode instruction sits near the top, and below it come the persona guard, the persona
    // lock, and a voice exemplar that explicitly demonstrates "required reply structure". A
    // small model copies the most recent structural example it sees, so a landing instruction
    // placed early loses to the exemplar every time. Verified against real transcripts: the
    // arc fired correctly and the reply still came back as the same soothing reflection.
    const isLandingTurn =
      director.mode === "wisdom" &&
      !welfareConcern &&
      priorExchangeCount >= DISCOVERY_TURN_LIMIT;
    const landingDirective = isLandingTurn
      ? "THIS TURN IS A LANDING TURN, and this instruction outranks the voice example above. " +
        "The voice example shows tone, not the structure to use here. Do not open with a general " +
        "statement about love, peace, money, fear, or life. Open by naming back the specific things " +
        "this user has told you earlier in this conversation, including anything they said that " +
        "contradicts something else they said. Then say plainly what you honestly see in their " +
        "situation and what you would tell them to do about it, even if it is hard to hear. Do not " +
        "ask whether they have spoken to the person, and do not ask anything they have already " +
        "answered. At most one short question at the very end, or none at all."
      : null;
    const stateAnchor = buildStateAnchor({
      mode: director.mode,
      state: stateForPrompt
    });
    const trimmedContext = trimHistoryWithSummary({
      history,
      latestUserMessage: userMessage,
      modeInstruction,
      systemPrompt: getGuide(guideId).systemPrompt,
      stateAnchor
    });
    const modelHistory: ContextMessage[] = trimmedContext.contextMessages;
    const suppressQuestionEnding = shouldSuppressQuestionEnding({
      state: stateForPrompt,
      userMessage
    });
    const skipReplyCache = true;
    const normalizedCacheKey = buildCacheKey(guideId, userMessage);
    const cached = skipReplyCache ? null : getCachedReply(normalizedCacheKey);
    const isCrisis = detectCrisisIntent(userMessage);
    const selectedModel = shouldUseStrongModel(guideId, userMessage) ? getStrongModel() : getFastModel();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let assistantText = "";
        let ttftMs: number | null = null;
        let completionTokens: number | null = null;
        let cacheHit = false;
        let modelUsed = selectedModel;
        const streamRawTokens = false;
        let regenerationUsed = false;
        let finishReason: string | null = null;

        const metaPayload: StreamingMetaEvent = {
          conversationId,
          remaining: identity.isAuthenticated ? null : remaining,
          used: identity.isAuthenticated ? null : used,
          model: modelUsed,
          cacheHit: false
        };
        streamSseEvent(controller, "meta", metaPayload);

        try {
          if (isCrisis) {
            assistantText = crisisSupportResponse(requestLocale);
            ttftMs = Date.now() - startedAt;
          } else if (cached) {
            cacheHit = true;
            modelUsed = cached.model;
            ttftMs = Date.now() - startedAt;
            assistantText = cached.value;
          } else {
            const reader = await createOpenAiStream({
              guideId,
              history: modelHistory,
              model: selectedModel,
              modeInstruction,
              stateAnchor,
              referralDirective: getProfessionalReferralDirective(userMessage),
              additionalDeveloperInstruction: landingDirective,
              userFirstName,
              locale: requestLocale
            });

            const openAiResult = await consumeOpenAiSse({
              reader,
              onFirstToken: () => {
                if (ttftMs === null) {
                  ttftMs = Date.now() - startedAt;
                }
              },
              onToken: (token) => {
                assistantText += token;
                if (streamRawTokens) {
                  streamSseEvent(controller, "token", { text: token });
                }
              }
            });

            completionTokens = openAiResult.completionTokens;
            finishReason = openAiResult.finishReason;
            if (!assistantText.trim()) {
              assistantText = openAiResult.fullText;
            }

            if (assistantText.trim() && !skipReplyCache) {
              setCachedReply(normalizedCacheKey, assistantText.trim(), selectedModel);
            }
          }

          if (assistantText.trim()) {
            assistantText = sanitizeDraftForGuide({
              guideId,
              mode: director.mode,
              userMessage,
              text: assistantText,
              suppressQuestionEnding
            });

            const repeatedFirstLine = hasRepeatedFirstLine(
              assistantText,
              stateForPrompt.guardrails.recentFirstLines
            );
            const storyPivotViolation =
              director.mode === "story" && hasPattern(assistantText, STORY_MENTOR_PIVOT_PATTERN);
            const storyEntityViolation =
              director.mode === "story" && !mentionsStoryEntityOrSeed(assistantText, stateForPrompt);
            const storyMoralizingViolation =
              director.mode === "story" && hasPattern(assistantText, STORY_MORALIZING_PATTERN);
            const violatesFramework =
              hasPattern(assistantText, SHARED_FRAMEWORK_PATTERN) && !userAskedForSteps(userMessage);
            const hasSafetyViolation =
              hasPattern(assistantText, KRISHNA_AS_AI_PATTERN) ||
              hasPattern(assistantText, KRISHNA_THIRD_PERSON_PATTERN) ||
              hasPattern(assistantText, SHARED_ROMANCE_TOUCH_PATTERN);
            const languageModeViolation = hasLanguageModeViolation(assistantText, requestLocale);
            // Persona flattens deep in a conversation even when the follow-up topic is soft
            // ("how do I stop overthinking?"). Past turn 2, enforce persona regardless of topic
            // so the guide's voice survives the whole conversation, not just the opening reply.
            const priorAssistantTurns = modelHistory.filter((m) => m.role === "assistant").length;
            const isDeepConversation = priorAssistantTurns >= 2;
            const personaDriftViolation =
              director.mode !== "story" &&
              (isPracticalTopicMessage(userMessage) || isDeepConversation) &&
              !hasGuidePersonaMarkers(guideId, assistantText, 2);
            // Literal-deity claim or guaranteed-outcome — forbidden regardless of guide/mode.
            const deityClaimViolation =
              hasPattern(assistantText, DEITY_SELF_CLAIM_PATTERN) ||
              hasPattern(assistantText, OUTCOME_GUARANTEE_PATTERN);

            const shouldForceRewrite =
              repeatedFirstLine ||
              storyPivotViolation ||
              storyEntityViolation ||
              storyMoralizingViolation ||
              violatesFramework ||
              hasSafetyViolation ||
              languageModeViolation ||
              personaDriftViolation ||
              deityClaimViolation;

            if (shouldForceRewrite && !regenerationUsed) {
              try {
                const rewriteDirectives = [
                  buildModeDirective({
                    guideId,
                    mode: director.mode,
                    strategy: director.strategy,
                    exchangeCount: priorExchangeCount,
                    welfareConcern
                  }),
                  "Rewrite respectfully, no romance, no physical touch, keep spacing with blank lines.",
                  "No numbered steps unless the user explicitly asked for steps."
                ];
                if (storyPivotViolation) {
                  rewriteDirectives.push("Stay in story, continue the scene.");
                }
                if (storyEntityViolation) {
                  rewriteDirectives.push(
                    "Continue the same story and mention the characters already introduced."
                  );
                }
                if (storyMoralizingViolation) {
                  rewriteDirectives.push("Stay in scene. No moralizing.");
                }
                if (repeatedFirstLine) {
                  rewriteDirectives.push("Use fresh phrasing.");
                }
                if (suppressQuestionEnding && !userAskedDirectQuestion(userMessage)) {
                  rewriteDirectives.push("Do not end this reply with a question.");
                }
                if (languageModeViolation) {
                  rewriteDirectives.push(getChatLanguageInstruction(requestLocale));
                }
                if (personaDriftViolation) {
                  rewriteDirectives.push(
                    "The draft sounds too generic for the selected guide. Rewrite it so the guide's worldview and signature vocabulary are unmistakable before any practical advice."
                  );
                }
                if (deityClaimViolation) {
                  rewriteDirectives.push(
                    "The draft crosses a hard line: it claims to literally be the deity or narrates divine autobiography, or promises a guaranteed outcome. Rewrite so you speak in the guide's voice as an AI guide INSPIRED BY the deity — never claim to be the deity, no 'main <deity>/devi/devta hoon', no divine life-story, and never guarantee results."
                  );
                }

                const rewritten = await createOpenAiText({
                  guideId,
                  model: selectedModel,
                  modeInstruction,
                  stateAnchor,
                  locale: requestLocale,
                  userFirstName,
                  referralDirective: getProfessionalReferralDirective(userMessage),
                  additionalDeveloperInstruction: rewriteDirectives.join(" "),
                  messages: [
                    {
                      role: "user",
                      content: `Rewrite this ${guideId} reply with the required mode and continuity.\n\nUser message: ${userMessage}\n\nDraft reply: ${assistantText}`
                    }
                  ]
                });
                modelUsed = selectedModel;
                completionTokens = rewritten.completionTokens;
                finishReason = null;
                assistantText = sanitizeDraftForGuide({
                  guideId,
                  mode: director.mode,
                  userMessage,
                  text: rewritten.text,
                  suppressQuestionEnding
                });
                regenerationUsed = true;
              } catch (error) {
                console.error("[Bhakti Chat][POST] rewrite failed.", error);
              }
            }

            const needsCompletionRepair =
              finishReason === "length" ||
              ((completionTokens ?? 0) >= 410 && looksIncompleteReply(assistantText)) ||
              looksIncompleteReply(assistantText);

            if (needsCompletionRepair) {
              try {
                const completedTail = await completeTruncatedReply({
                  guideId,
                  model: selectedModel,
                  modeInstruction,
                  stateAnchor,
                  locale: requestLocale,
                  userFirstName,
                  userMessage,
                  assistantText,
                  suppressQuestionEnding
                });

                assistantText = sanitizeDraftForGuide({
                  guideId,
                  mode: director.mode,
                  userMessage,
                  text: mergeContinuation(assistantText, completedTail),
                  suppressQuestionEnding
                });
              } catch (error) {
                console.error("[Bhakti Chat][POST] completion repair failed.", error);
                assistantText = trimToLastCompleteThought(assistantText);
              }
            }

            if (
              director.mode !== "story" &&
              isPracticalTopicMessage(userMessage) &&
              !hasGuidePersonaMarkers(guideId, assistantText)
            ) {
              assistantText = `${buildGuidePersonaAnchorLine(guideId, requestLocale)}\n\n${assistantText.trim()}`;
            }

            if (!skipReplyCache) {
              setCachedReply(normalizedCacheKey, assistantText.trim(), modelUsed);
            }
          }

          if (!assistantText.trim()) {
            assistantText = getEmptyAssistantFallback(requestLocale);
            if (ttftMs === null) {
              ttftMs = Date.now() - startedAt;
            }
          }

          if (!streamRawTokens) {
            if (ttftMs === null) {
              ttftMs = Date.now() - startedAt;
            }
            await emitWordStream(controller, assistantText, {
              wordsPerChunk: 1,
              delayMs: 10
            });
          }

          if (persistConversation && conversationId) {
            try {
              const nextConversationState = computeNextConversationState({
                stateBefore: stateForPrompt,
                director,
                history,
                assistantText: assistantText.trim()
              });
              stateForPrompt = nextConversationState;

              await prisma.bhaktiGptMessage.create({
                data: {
                  conversationId,
                  role: "assistant",
                  content: assistantText.trim()
                }
              });

              await prisma.bhaktiGptConversation.update({
                where: { id: conversationId },
                data: {
                  updatedAt: new Date(),
                  title: conversationTitle || userMessage.slice(0, 80),
                  conversationMetadata: toConversationMetadataInput(nextConversationState)
                }
              });
            } catch (error) {
              console.error("[Bhakti Chat][POST] Could not persist assistant message.", error);
            }
          }

          const totalMs = Date.now() - startedAt;
          const approxTokens =
            completionTokens ?? Math.max(1, Math.ceil(assistantText.trim().length / 4));

          trackServerEvent("bhaktigpt_latency", {
            guideId,
            model: modelUsed,
            cacheHit,
            ttftMs: ttftMs ?? totalMs,
            totalMs,
            completionTokens: approxTokens
          });

          streamSseEvent(controller, "done", {
            conversationId,
            remaining: identity.isAuthenticated ? null : remaining,
            used: identity.isAuthenticated ? null : used,
            model: modelUsed,
            cacheHit
          });
        } catch (error) {
          const totalMs = Date.now() - startedAt;
          const message = error instanceof Error ? error.message : "Unable to complete response.";

          trackServerEvent("bhaktigpt_error", {
            guideId,
            model: modelUsed,
            cacheHit,
            totalMs,
            error: message
          });

          console.error("[Bhakti Chat][POST] streaming failed", error);
          // In non-production, surface the actual server-side error message so
          // mobile clients can see what's wrong without needing log access.
          // In production, keep the friendly generic message.
          const clientMessage =
            process.env.NODE_ENV !== "production" && message
              ? `Server error: ${message.slice(0, 280)}`
              : "Unable to process your message right now. Please try again in a few seconds.";
          streamSseEvent(controller, "error", {
            message: clientMessage,
            // Include a stable error code so clients can branch on cause if needed.
            code: classifyChatError(message)
          });
        } finally {
          controller.close();
        }
      }
    });

    const response = new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });

    if (identity.needsCookieSet && identity.cookieValue) {
      setBhaktiCookie(response, identity.cookieValue);
    }

    return response;
  } catch (error) {
    console.error("[Bhakti Chat][POST] failed", error);
    return NextResponse.json(
      { error: "Unable to process your message right now. Please try again in a few seconds." },
      { status: 500 }
    );
  }
}
