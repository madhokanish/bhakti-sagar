import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BHAKTIGPT_DISCLAIMER,
  getGuide,
  isGuideId,
  type BhaktiGuideId
} from "@/lib/bhaktigpt/guides";
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

function shouldUseStrongModel(message: string) {
  const lowered = message.toLowerCase();
  const questionCount = (message.match(/\?/g) || []).length;
  const detailedHints = [
    "detailed",
    "in detail",
    "step by step",
    "full plan",
    "checklist",
    "roadmap",
    "compare",
    "pros and cons",
    "long explanation"
  ];

  if (message.length > 400 || questionCount >= 2) return true;
  return detailedHints.some((hint) => lowered.includes(hint));
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
      temperature: 0.5,
      max_tokens: 420,
      stream: true,
      stream_options: {
        include_usage: true
      },
      messages: [
        {
          role: "system",
          content: `${guide.systemPrompt}\n\nMandatory disclaimer for user-facing context:\n${BHAKTIGPT_DISCLAIMER}`
        },
        ...params.history
      ]
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

      if (!activeConversationId && conversations.length > 0) {
        activeConversationId = conversations[0].id;
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
        !body.conversationId &&
        (await findLatestGuideConversation({
          userId: identity.userId,
          sessionId: identity.anonSessionId,
          guideId: body.guideId
        }));

      const conversation =
        existing ||
        latestForGuide ||
        (await prisma.bhaktiGptConversation.create({
          data: {
            guideId: body.guideId,
            title: conversationTitle,
            userId: identity.userId,
            sessionId: identity.userId ? null : identity.anonSessionId
          }
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
    const selectedModel = shouldUseStrongModel(userMessage) ? getStrongModel() : getFastModel();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let assistantText = "";
        let ttftMs: number | null = null;
        let completionTokens: number | null = null;
        let cacheHit = false;
        let modelUsed = selectedModel;

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
              model: selectedModel
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
                streamSseEvent(controller, "token", { text: token });
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

          if (!assistantText.trim()) {
            assistantText =
              "I hear you. I want to support you with one clear next step right now. Tell me the exact situation you want me to focus on.";
            if (ttftMs === null) {
              ttftMs = Date.now() - startedAt;
            }
            streamSseEvent(controller, "token", { text: assistantText });
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
