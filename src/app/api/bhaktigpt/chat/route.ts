import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BHAKTIGPT_DISCLAIMER,
  getGuide,
  isGuideId,
  type BhaktiGuideId
} from "@/lib/bhaktigpt/guides";
import { getKrishnaOpenerForConversation } from "@/lib/bhaktigpt/krishnaOpeners";
import { KRISHNA_SECONDARY_GUARD } from "@/lib/bhaktigpt/personas/krishnaSystemPrompt";
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
const KRISHNA_DENYLIST_PATTERN =
  /\b(cheek|chin|hair|hug|kiss|bed|bedroom|nuzzle|cuddle|caress|embrace|my darling|my love|mine\b|jealous|possessive|seduce|seduction|flirt|romantic)\b/gi;
const KRISHNA_FRAMEWORK_PATTERN = /\b(step\s*1|step\s*2|here are\s+\d+\s+steps)\b/i;
const KRISHNA_DIRECT_ANSWER_PATTERN =
  /\b(quote|verse|bg\s*\d+[:.]\d+|gita\s*\d+[:.]\d+|what does .* mean|translate|define)\b/i;
const KRISHNA_DETAIL_PATTERN =
  /\b(detail|detailed|long essay|verse by verse|verse-by-verse|deep explanation|deep dive|breakdown)\b/i;

function hasPattern(text: string, pattern: RegExp) {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

function truncateWords(text: string, maxWords: number) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ").trim();
}

type KrishnaSanitizeResult = {
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
    hasPattern(params.text, KRISHNA_DENYLIST_PATTERN) ||
    (hasPattern(params.text, KRISHNA_FRAMEWORK_PATTERN) &&
      !/\b(step|steps|numbered)\b/i.test(params.userMessage))
  );
}

function normalizeLineBreaks(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function enforceQuestionPolicy(params: {
  text: string;
  userMessage: string;
  fallbackQuestion: string;
}) {
  const normalized = normalizeLineBreaks(params.text);
  const isDirectAnswer = KRISHNA_DIRECT_ANSWER_PATTERN.test(params.userMessage.toLowerCase());
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

function sanitizeKrishnaResponse(rawText: string, userMessage: string): KrishnaSanitizeResult {
  let text = rawText.trim();
  let needsRegeneration = false;
  const shouldUseStrongModel = KRISHNA_DETAIL_PATTERN.test(userMessage.toLowerCase());
  needsRegeneration = needsKrishnaRegeneration({ text, userMessage });

  text = text.replace(new RegExp(KRISHNA_AS_AI_PATTERN.source, "gi"), "I");
  text = text.replace(new RegExp(KRISHNA_THIRD_PERSON_PATTERN.source, "gi"), "I");
  text = text.replace(/\bI can’t\b/gi, "I cannot");
  text = text.replace(/\bI can't\b/gi, "I cannot");
  text = text.replace(new RegExp(KRISHNA_DENYLIST_PATTERN.source, "gi"), "");
  text = normalizeLineBreaks(text);

  if (!isDetailRequested(userMessage)) {
    text = truncateWords(text, 140);
  }

  text = enforceQuestionPolicy({
    text,
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
    "I can hear the restlessness beneath your words.",
    "Your mind is running ahead of your breath.",
    "You are carrying pressure that has not yet become clarity."
  ],
  angry: [
    "There is fire in what you are saying.",
    "I hear the heat under your frustration.",
    "Your anger is asking to become direction."
  ],
  indecision: [
    "You are not confused. You are divided.",
    "You want certainty, but life is asking for courage.",
    "You already sense the right move, but fear is negotiating."
  ],
  general: [
    "I hear more truth in your words than you realize.",
    "You are closer to clarity than you think.",
    "There is one honest step hidden inside this moment."
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
  if (cadence > 62) {
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
  insertKrishnaOpener?: boolean;
}) {
  const conversation = await prisma.bhaktiGptConversation.create({
    data: {
      guideId: params.guideId,
      title: params.title ?? null,
      userId: params.userId,
      sessionId: params.userId ? null : params.sessionId
    }
  });

  if (params.guideId === "krishna" && params.insertKrishnaOpener) {
    const opener = getKrishnaOpenerForConversation(conversation.id);
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
    take: 12,
    select: { role: true, content: true }
  });

  return rows
    .filter((item) => item.role === "user" || item.role === "assistant")
    .map((item) => ({ role: item.role as "user" | "assistant", content: item.content }));
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
      ...(params.guideId === "krishna"
        ? [
            {
              role: "developer" as const,
              content: KRISHNA_SECONDARY_GUARD
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
        ...(params.guideId === "krishna"
          ? [
              {
                role: "developer" as const,
                content: KRISHNA_SECONDARY_GUARD
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

      if (!activeConversationId && guideId && (forceNewConversation || (guideId === "krishna" && conversations.length === 0))) {
        const created = await createGuideConversation({
          guideId,
          userId: identity.userId,
          sessionId: identity.anonSessionId,
          title: "New chat",
          insertKrishnaOpener: guideId === "krishna"
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
      }
    } catch (error) {
      console.error("[BhaktiGPT][GET] Falling back to empty chat data.", error);
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
          insertKrishnaOpener: body.guideId === "krishna"
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
    }

    const guideId = body.guideId;
    const normalizedCacheKey = buildCacheKey(guideId, userMessage);
    const cached = getCachedReply(normalizedCacheKey);
    const isCrisis = detectCrisisIntent(userMessage);
    const selectedModel = shouldUseStrongModel(guideId, userMessage) ? getStrongModel() : getFastModel();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let assistantText = "";
        let ttftMs: number | null = null;
        let completionTokens: number | null = null;
        let cacheHit = false;
        let modelUsed = selectedModel;
        const streamRawTokens = guideId !== "krishna";
        const krishnaPresencePrefix = guideId === "krishna" ? pickKrishnaPresencePrefix(userMessage) : null;
        const krishnaTurnInstruction =
          guideId === "krishna" && krishnaPresencePrefix
            ? `For this response, begin with this exact one-line presence cue if it fits naturally: "${krishnaPresencePrefix}". Keep it subtle and not theatrical.`
            : null;

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
            for (const token of chunkTextForStream(assistantText, 26)) {
              streamSseEvent(controller, "token", { text: token });
            }
          } else if (cached) {
            cacheHit = true;
            modelUsed = cached.model;
            ttftMs = Date.now() - startedAt;
            for (const token of chunkTextForStream(cached.value, 20)) {
              assistantText += token;
              streamSseEvent(controller, "token", { text: token });
            }
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

            if (assistantText.trim()) {
              setCachedReply(normalizedCacheKey, assistantText.trim(), selectedModel);
            }
          }

          if (guideId === "krishna" && assistantText.trim()) {
            let sanitized = sanitizeKrishnaResponse(assistantText, userMessage);
            const shouldForceRewrite =
              sanitized.needsRegeneration ||
              (hasPattern(assistantText, KRISHNA_FRAMEWORK_PATTERN) &&
                !/\b(step|steps|numbered)\b/i.test(userMessage));

            if (shouldForceRewrite) {
              try {
                const rewritten = await createOpenAiText({
                  guideId: "krishna",
                  model: sanitized.shouldUseStrongModel ? getStrongModel() : selectedModel,
                  additionalDeveloperInstruction:
                    "Rewrite without romance or physical touch. Keep sacred mentor tone. No numbered steps unless user asked.",
                  messages: [
                    {
                      role: "user",
                      content: `Rewrite this Krishna reply so it sounds alive, calm, devotional, and first-person. React first, guide second, include one micro-action, and end with one reflective question unless the user asked a direct factual quote. Remove any romance, touch language, or robotic framework style.\n\nUser message: ${userMessage}\n\nDraft reply: ${assistantText}`
                    }
                  ]
                });
                modelUsed = sanitized.shouldUseStrongModel ? getStrongModel() : selectedModel;
                completionTokens = rewritten.completionTokens;
                sanitized = sanitizeKrishnaResponse(rewritten.text, userMessage);
              } catch (error) {
                console.error("[BhaktiGPT][POST] Krishna regeneration failed.", error);
              }
            }

            assistantText = applyKrishnaPresencePrefix(sanitized.text, krishnaPresencePrefix);
            setCachedReply(normalizedCacheKey, assistantText.trim(), modelUsed);
          }

          if (!assistantText.trim()) {
            assistantText =
              "I hear you. I want to support you with one clear next step right now. Tell me the exact situation you want me to focus on.";
            if (ttftMs === null) {
              ttftMs = Date.now() - startedAt;
            }
            if (streamRawTokens) {
              streamSseEvent(controller, "token", { text: assistantText });
            }
          }

          if (!streamRawTokens) {
            if (ttftMs === null) {
              ttftMs = Date.now() - startedAt;
            }
            for (const token of chunkTextForStream(assistantText, 20)) {
              streamSseEvent(controller, "token", { text: token });
            }
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
