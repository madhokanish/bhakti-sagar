import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BHAKTIGPT_DISCLAIMER,
  getGuide,
  isGuideId,
  type BhaktiGuideId
} from "@/lib/bhaktigpt/guides";
import { getKrishnaOpenerForConversation } from "@/lib/bhaktigpt/krishnaOpeners";
import { pickKrishnaQuirk } from "@/lib/bhaktigpt/krishnaQuirks";
import { getLakshmiOpenerForConversation } from "@/lib/bhaktigpt/lakshmiOpeners";
import { getShaniOpenerForConversation } from "@/lib/bhaktigpt/shaniOpeners";
import { KRISHNA_SECONDARY_GUARD } from "@/lib/bhaktigpt/personas/krishnaSystemPrompt";
import { LAKSHMI_SECONDARY_GUARD } from "@/lib/bhaktigpt/personas/lakshmiSystemPrompt";
import { SHANI_SECONDARY_GUARD } from "@/lib/bhaktigpt/personas/shaniSystemPrompt";
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
  message: string;
};

type GuideConversationSummary = {
  id: string;
  guideId: BhaktiGuideId;
  title: string | null;
  updatedAt: string;
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

type KrishnaMode = "casual" | "playful" | "wisdom" | "teachings";

const encoder = new TextEncoder();
const REPLY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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
  return "What is one duty-aligned step you will take today?";
}

function getGuideSecondaryGuard(guideId: BhaktiGuideId) {
  if (guideId === "lakshmi") return LAKSHMI_SECONDARY_GUARD;
  if (guideId === "shani") return SHANI_SECONDARY_GUARD;
  return KRISHNA_SECONDARY_GUARD;
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

function classifyKrishnaMode(message: string): KrishnaMode {
  const lowered = message.toLowerCase();
  if (KRISHNA_TEACHINGS_PATTERN.test(lowered)) return "teachings";
  if (KRISHNA_WISDOM_PATTERN.test(lowered)) return "wisdom";
  if (KRISHNA_PLAYFUL_PATTERN.test(lowered)) return "playful";
  return "casual";
}

function getKrishnaModeInstruction(params: { mode: KrishnaMode; quirk: string | null }) {
  if (params.mode === "casual") {
    return "Answer like a normal person. Be brief. No unsolicited advice. No mandatory question.";
  }

  if (params.mode === "playful") {
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
  text = maybeInjectKrishnaQuirk({
    text,
    mode: params.mode,
    quirk: params.quirk,
    recentAssistantMessages: params.recentAssistantMessages
  });

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

  return prisma.bhaktiGptConversation.findFirst({
    where: {
      ...where,
      guideId: params.guideId
    },
    orderBy: { updatedAt: "desc" }
  });
}

async function createGuideConversation(params: {
  guideId: BhaktiGuideId;
  userId: string | null;
  sessionId: string | null;
  title?: string | null;
  insertGuideOpener?: boolean;
}) {
  const conversation = await prisma.bhaktiGptConversation.create({
    data: {
      guideId: params.guideId,
      title: params.title ?? null,
      userId: params.userId,
      sessionId: params.userId ? null : params.sessionId
    }
  });

  if (params.insertGuideOpener) {
    const opener = getGuideOpenerForConversation(params.guideId, conversation.id);
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

async function fetchGuideHistory(conversationId: string) {
  const rows = await prisma.bhaktiGptMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 24,
    select: { role: true, content: true }
  });

  return rows
    .filter((item) => item.role === "user" || item.role === "assistant")
    .map((item) => ({ role: item.role as "user" | "assistant", content: item.content }));
}

function getGuideOpenerForConversation(guideId: BhaktiGuideId, conversationId?: string) {
  if (guideId === "lakshmi") return getLakshmiOpenerForConversation(conversationId);
  if (guideId === "shani") return getShaniOpenerForConversation(conversationId);
  return getKrishnaOpenerForConversation(conversationId);
}

async function ensureGuideConversationOpener(params: {
  conversationId: string;
  guideId: BhaktiGuideId;
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

  const opener = getGuideOpenerForConversation(params.guideId, params.conversationId);
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
  history: Array<{ role: "user" | "assistant"; content: string }>;
  model: string;
  additionalDeveloperInstruction?: string | null;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const guide = getGuide(params.guideId);
  const messages: Array<{ role: "system" | "developer" | "user" | "assistant"; content: string }> =
    [
      {
        role: "system",
        content: `${guide.systemPrompt}\n\nMandatory disclaimer for user-facing context:\n${BHAKTIGPT_DISCLAIMER}`
      },
      {
        role: "developer" as const,
        content: getGuideSecondaryGuard(params.guideId)
      },
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
  messages: Array<{ role: "system" | "developer" | "user" | "assistant"; content: string }>;
  additionalDeveloperInstruction?: string | null;
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
          role: "developer" as const,
          content: getGuideSecondaryGuard(params.guideId)
        },
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
            choices?: Array<{ delta?: { content?: string } }>;
            usage?: { completion_tokens?: number };
          };

          if (parsed.usage) {
            usage = parsed.usage;
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
    completionTokens: usage?.completion_tokens ?? null
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
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
          updatedAt: true
        }
      });

      const typedConversations = dbConversations.filter(
        (item): item is typeof item & { guideId: BhaktiGuideId } => isGuideId(item.guideId)
      );

      conversations = typedConversations.map((item) => ({
        id: item.id,
        guideId: item.guideId,
        title: item.title,
        updatedAt: item.updatedAt.toISOString()
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
          title: "New chat",
          insertGuideOpener: true
        });
        activeConversationId = created.id;
        conversations = [
          {
            id: created.id,
            guideId,
            title: created.title,
            updatedAt: created.updatedAt.toISOString()
          },
          ...conversations
        ];
      }

      if (!activeConversationId && conversations.length > 0) {
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
            conversationId: activeConversationId
          });
          messages = [openerMessage];
        }
      }
    } catch (error) {
      console.error("[BhaktiGPT][GET] Falling back to empty chat data.", error);
      if (guideId && messages.length === 0) {
        messages = [
          {
            id: `${guideId}-opener-fallback`,
            role: "assistant",
            content: getGuideOpenerForConversation(guideId, `${guideId}-fallback`),
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
    console.error("[BhaktiGPT][GET] failed", error);
    return NextResponse.json(
      { error: "Unable to load chat right now. Please refresh and try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
          insertGuideOpener: true
        }));

      conversationId = conversation.id;
      conversationTitle = conversation.title || conversationTitle;
      persistConversation = true;

      if (conversation.guideId !== body.guideId) {
        await prisma.bhaktiGptConversation.update({
          where: { id: conversation.id },
          data: { guideId: body.guideId }
        });
      }

      await prisma.bhaktiGptMessage.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: userMessage
        }
      });

      history = await fetchGuideHistory(conversation.id);
    } catch (error) {
      persistConversation = false;
      console.error("[BhaktiGPT][POST] Falling back to stateless mode.", error);
      history = [
        {
          role: "assistant",
          content: getGuideOpenerForConversation(body.guideId, `${body.guideId}-fallback`)
        },
        { role: "user", content: userMessage }
      ];
    }

    const guideId = body.guideId;
    const krishnaMode: KrishnaMode | null =
      guideId === "krishna" ? classifyKrishnaMode(userMessage) : null;
    const krishnaRecentAssistantMessages =
      guideId === "krishna" ? getAssistantMessages(history).slice(-10) : [];
    const krishnaRecentFirstLines =
      guideId === "krishna" ? getRecentAssistantFirstLines(history) : [];
    const krishnaSelectedQuirk =
      guideId === "krishna" && krishnaMode === "playful"
        ? pickKrishnaQuirk({
            seed: `${conversationId ?? "new"}:${userMessage}:${krishnaRecentAssistantMessages.length}`,
            recentAssistantMessages: krishnaRecentAssistantMessages,
            injectionRate: 0.3
          })
        : null;
    const krishnaTurnInstruction =
      guideId === "krishna" && krishnaMode
        ? getKrishnaModeInstruction({ mode: krishnaMode, quirk: krishnaSelectedQuirk })
        : null;
    const suppressKrishnaQuestionEnding =
      guideId === "krishna"
        ? shouldSuppressKrishnaQuestionEnding({
            history,
            userMessage
          })
        : false;
    const skipKrishnaCache = guideId === "krishna" && krishnaMode === "playful";
    const normalizedCacheKey = buildCacheKey(guideId, userMessage);
    const cached = skipKrishnaCache ? null : getCachedReply(normalizedCacheKey);
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
            assistantText = crisisSupportResponse();
            ttftMs = Date.now() - startedAt;
          } else if (cached) {
            cacheHit = true;
            modelUsed = cached.model;
            ttftMs = Date.now() - startedAt;
            assistantText = cached.value;
          } else {
            const reader = await createOpenAiStream({
              guideId,
              history,
              model: selectedModel,
              additionalDeveloperInstruction: krishnaTurnInstruction
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
            if (!assistantText.trim()) {
              assistantText = openAiResult.fullText;
            }

            if (assistantText.trim() && !skipKrishnaCache) {
              setCachedReply(normalizedCacheKey, assistantText.trim(), selectedModel);
            }
          }

          if (assistantText.trim()) {
            if (guideId === "krishna" && krishnaMode) {
              assistantText = sanitizeKrishnaByMode({
                rawText: assistantText,
                userMessage,
                mode: krishnaMode,
                quirk: krishnaSelectedQuirk,
                suppressQuestionEnding: suppressKrishnaQuestionEnding,
                recentAssistantMessages: krishnaRecentAssistantMessages
              });

              const sermonHits =
                krishnaMode === "casual" || krishnaMode === "playful"
                  ? countKrishnaSermonPhrases(assistantText)
                  : 0;
              const repeatedFirstLine = hasKrishnaRepeatedFirstLine(assistantText, krishnaRecentFirstLines);
              const shouldRewriteForSermon =
                (krishnaMode === "casual" || krishnaMode === "playful") && sermonHits >= 2;
              const violatesFramework =
                hasPattern(assistantText, SHARED_FRAMEWORK_PATTERN) && !userAskedForSteps(userMessage);
              const hasSafetyViolation =
                hasPattern(assistantText, KRISHNA_AS_AI_PATTERN) ||
                hasPattern(assistantText, KRISHNA_THIRD_PERSON_PATTERN) ||
                hasPattern(assistantText, SHARED_ROMANCE_TOUCH_PATTERN);

              const shouldForceRewrite =
                shouldRewriteForSermon || repeatedFirstLine || violatesFramework || hasSafetyViolation;

              if (shouldForceRewrite && !regenerationUsed) {
                try {
                  const rewriteDirectives = [
                    getKrishnaModeInstruction({ mode: krishnaMode, quirk: krishnaSelectedQuirk }),
                    "Rewrite respectfully, no romance, no physical touch, keep spacing with blank lines.",
                    "No numbered steps unless the user explicitly asked for steps."
                  ];
                  if (shouldRewriteForSermon) {
                    rewriteDirectives.push(
                      "Rewrite in casual/playful mode. Answer directly. No advice language."
                    );
                  }
                  if (repeatedFirstLine) {
                    rewriteDirectives.push("Avoid repeating earlier phrasing.");
                  }
                  if (suppressKrishnaQuestionEnding && !userAskedDirectQuestion(userMessage)) {
                    rewriteDirectives.push("Do not end this reply with a question.");
                  }

                  const rewritten = await createOpenAiText({
                    guideId,
                    model: selectedModel,
                    additionalDeveloperInstruction: rewriteDirectives.join(" "),
                    messages: [
                      {
                        role: "user",
                        content: `Rewrite this Krishna reply with the requested mode and tone.\n\nUser message: ${userMessage}\n\nDraft reply: ${assistantText}`
                      }
                    ]
                  });
                  modelUsed = selectedModel;
                  completionTokens = rewritten.completionTokens;
                  assistantText = sanitizeKrishnaByMode({
                    rawText: rewritten.text,
                    userMessage,
                    mode: krishnaMode,
                    quirk: krishnaSelectedQuirk,
                    suppressQuestionEnding: suppressKrishnaQuestionEnding,
                    recentAssistantMessages: krishnaRecentAssistantMessages
                  });
                  regenerationUsed = true;
                } catch (error) {
                  console.error("[BhaktiGPT][POST] Krishna rewrite failed.", error);
                }
              }
            } else {
              let sanitized = sanitizeGuideResponse({
                guideId,
                rawText: assistantText,
                userMessage
              });
              const shouldForceRewrite =
                sanitized.needsRegeneration ||
                (hasPattern(assistantText, SHARED_FRAMEWORK_PATTERN) && !userAskedForSteps(userMessage));

              if (shouldForceRewrite && !regenerationUsed) {
                try {
                  const rewritten = await createOpenAiText({
                    guideId,
                    model: sanitized.shouldUseStrongModel ? getStrongModel() : selectedModel,
                    additionalDeveloperInstruction:
                      "Rewrite respectfully, no romance, no physical touch, keep it grounded, keep spacing with blank lines. No numbered steps unless the user explicitly asked for steps.",
                    messages: [
                      {
                        role: "user",
                        content: `Rewrite this ${guideId} reply so it is devotional-safe, concise, practical, and formatted as short spaced blocks.\n\nUser message: ${userMessage}\n\nDraft reply: ${assistantText}`
                      }
                    ]
                  });
                  modelUsed = sanitized.shouldUseStrongModel ? getStrongModel() : selectedModel;
                  completionTokens = rewritten.completionTokens;
                  sanitized = sanitizeGuideResponse({
                    guideId,
                    rawText: rewritten.text,
                    userMessage
                  });
                  regenerationUsed = true;
                } catch (error) {
                  console.error("[BhaktiGPT][POST] rewrite failed.", error);
                }
              }

              assistantText = sanitized.text;
            }

            if (!skipKrishnaCache) {
              setCachedReply(normalizedCacheKey, assistantText.trim(), modelUsed);
            }
          }

          if (!assistantText.trim()) {
            assistantText =
              "I see what you mean.\n\nStart with one concrete fact I can work with.\n\nWhat exactly is weighing on you right now?";
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
                  title: conversationTitle || userMessage.slice(0, 80)
                }
              });
            } catch (error) {
              console.error("[BhaktiGPT][POST] Could not persist assistant message.", error);
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

          console.error("[BhaktiGPT][POST] streaming failed", error);
          streamSseEvent(controller, "error", {
            message: "Unable to process your message right now. Please try again in a few seconds."
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
    console.error("[BhaktiGPT][POST] failed", error);
    return NextResponse.json(
      { error: "Unable to process your message right now. Please try again in a few seconds." },
      { status: 500 }
    );
  }
}
