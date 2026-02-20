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

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function getModel() {
  return process.env.OPENAI_MODEL_BHAKTIGPT?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
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

async function findConversationForIdentity(params: {
  conversationId: string;
  userId: string | null;
  sessionId: string | null;
}) {
  const conversation = await prisma.bhaktiGptConversation.findUnique({
    where: { id: params.conversationId }
  });

  if (!conversation) return null;

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

async function fetchAssistantMessage(params: {
  guideId: BhaktiGuideId;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const guide = getGuide(params.guideId);
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: getModel(),
      temperature: 0.4,
      max_tokens: 480,
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

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Empty response from model.");
  }

  return content;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");
    const identity = await resolveBhaktiIdentity();

    const baseWhere = identity.userId
      ? { userId: identity.userId }
      : identity.anonSessionId
        ? { sessionId: identity.anonSessionId }
        : null;

    const usage = await getUsageForIdentity(identity);

    if (!baseWhere) {
      const response = NextResponse.json({
        conversations: [],
        messages: [],
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

    const conversations = await prisma.bhaktiGptConversation.findMany({
      where: baseWhere,
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        guideId: true,
        title: true,
        updatedAt: true
      }
    });

    let messages: Array<{ id: string; role: string; content: string; createdAt: string }> = [];

    if (conversationId) {
      const conversation = await findConversationForIdentity({
        conversationId,
        userId: identity.userId,
        sessionId: identity.anonSessionId
      });

      if (conversation) {
        const dbMessages = await prisma.bhaktiGptMessage.findMany({
          where: { conversationId: conversation.id },
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
    }

    const response = NextResponse.json({
      conversations,
      messages,
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
    const rateKey = identity.userId || identity.anonSessionId || "anonymous";
    if (isRateLimited(`bhaktigpt:${rateKey}`)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429 }
      );
    }

    const usage = await getUsageForIdentity(identity);

    if (!identity.isAuthenticated && usage.limitReached) {
      trackServerEvent("hit_gate", { reason: "free_limit", guideId: body.guideId });
      const gateResponse = NextResponse.json({
        limitReached: true,
        remaining: 0,
        conversationId: body.conversationId ?? null,
        disclaimer: BHAKTIGPT_DISCLAIMER
      });

      if (identity.needsCookieSet && identity.cookieValue) {
        setBhaktiCookie(gateResponse, identity.cookieValue);
      }

      return gateResponse;
    }

    const isCrisis = detectCrisisIntent(userMessage);

    const existing = body.conversationId
      ? await findConversationForIdentity({
          conversationId: body.conversationId,
          userId: identity.userId,
          sessionId: identity.anonSessionId
        })
      : null;

    const conversation =
      existing ||
      (await prisma.bhaktiGptConversation.create({
        data: {
          guideId: body.guideId,
          title: userMessage.slice(0, 80),
          userId: identity.userId,
          sessionId: identity.userId ? null : identity.anonSessionId
        }
      }));

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

    let nextRemaining = usage.remaining;
    if (!identity.isAuthenticated && identity.anonSessionId) {
      const count = await incrementAnonymousUsage(identity.anonSessionId);
      nextRemaining = Math.max(3 - count, 0);
    }

    const historyRows = await prisma.bhaktiGptMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: {
        role: true,
        content: true
      }
    });

    const history = historyRows
      .filter((item) => item.role === "user" || item.role === "assistant")
      .map((item) => ({ role: item.role as "user" | "assistant", content: item.content }));

    const assistantMessage = isCrisis
      ? crisisSupportResponse()
      : await fetchAssistantMessage({
          guideId: body.guideId,
          history
        });

    await prisma.bhaktiGptMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: assistantMessage
      }
    });

    await prisma.bhaktiGptConversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date(),
        title: conversation.title || userMessage.slice(0, 80)
      }
    });

    trackServerEvent("sent_message", {
      guideId: body.guideId,
      isAuthenticated: identity.isAuthenticated,
      crisisHandled: isCrisis
    });

    const response = NextResponse.json({
      assistantMessage,
      conversationId: conversation.id,
      limitReached: false,
      remaining: identity.isAuthenticated ? null : nextRemaining,
      used: identity.isAuthenticated ? null : 3 - nextRemaining,
      disclaimer: BHAKTIGPT_DISCLAIMER
    });

    if (identity.needsCookieSet && identity.cookieValue) {
      setBhaktiCookie(response, identity.cookieValue);
    }

    return response;
  } catch (error) {
    console.error("[BhaktiGPT][POST] failed", error);
    return NextResponse.json(
      {
        error:
          "Unable to process your message right now. If this continues, database migration may still be pending."
      },
      { status: 500 }
    );
  }
}
