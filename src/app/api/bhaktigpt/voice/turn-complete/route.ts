import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isGuideId, type BhaktiGuideId } from "@/lib/bhaktigpt/guides";
import { BHAKTIGPT_COOKIE, recordVoiceMinutesUsed, resolveBhaktiIdentity } from "@/lib/bhaktigpt/server";
import { auditVoiceTurnTranscript } from "@/lib/bhaktigpt/voiceSafetyAudit";

export const runtime = "nodejs";

// Voice mode deliberately does not reuse chat/route.ts's conversation-state machinery
// (director mode, story continuation, state-anchor) — voice sessions use a single
// upfront system prompt with no per-turn mode switching (see voicePersonas.ts), so
// there is no equivalent state to compute or persist here. This keeps text chat's
// existing, heavily-tuned route completely untouched by this new feature.

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Attaches the identity cookie on every exit path, not just success — otherwise a
 *  request that errors before reaching the happy path never stabilizes an anonymous
 *  session, and the next request (e.g. a retry) gets bucketed under a brand-new
 *  session id instead of the same one (breaks rate limiting / the daily voice cap). */
function withIdentityCookie(
  response: NextResponse,
  identity: { needsCookieSet: boolean; cookieValue: string | null }
): NextResponse {
  if (identity.needsCookieSet && identity.cookieValue) {
    response.cookies.set(BHAKTIGPT_COOKIE, identity.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90
    });
  }
  return response;
}

async function findOwnedConversation(params: {
  conversationId: string;
  userId: string | null;
  sessionId: string | null;
  guideId: BhaktiGuideId;
}) {
  const conversation = await prisma.bhaktiGptConversation.findUnique({
    where: { id: params.conversationId }
  });
  if (!conversation || conversation.guideId !== params.guideId) return null;

  if (params.userId) {
    return conversation.userId === params.userId ? conversation : null;
  }
  return conversation.sessionId && conversation.sessionId === params.sessionId ? conversation : null;
}

type TurnCompleteRequestBody = {
  guideId?: string;
  conversationId?: string;
  userTranscript?: string;
  assistantTranscript?: string;
  durationSeconds?: number;
};

export async function POST(request: Request) {
  const identity = await resolveBhaktiIdentity();

  try {
    const body = (await request.json()) as Partial<TurnCompleteRequestBody>;

    if (!body?.guideId || !isGuideId(body.guideId)) {
      return withIdentityCookie(badRequest("Invalid guideId."), identity);
    }
    const userTranscript = body.userTranscript?.trim();
    const assistantTranscript = body.assistantTranscript?.trim();
    if (!userTranscript || !assistantTranscript) {
      return withIdentityCookie(badRequest("userTranscript and assistantTranscript are required."), identity);
    }

    const rateKey = identity.userId || identity.anonSessionId || "anonymous";

    if (typeof body.durationSeconds === "number" && body.durationSeconds > 0) {
      recordVoiceMinutesUsed(rateKey, body.durationSeconds / 60);
    }

    let conversation = body.conversationId
      ? await findOwnedConversation({
          conversationId: body.conversationId,
          userId: identity.userId,
          sessionId: identity.anonSessionId,
          guideId: body.guideId
        })
      : null;

    if (!conversation) {
      conversation = await prisma.bhaktiGptConversation.create({
        data: {
          guideId: body.guideId,
          title: userTranscript.slice(0, 80),
          userId: identity.userId,
          sessionId: identity.userId ? null : identity.anonSessionId
        }
      });
    }

    await prisma.bhaktiGptMessage.create({
      data: { conversationId: conversation.id, role: "user", content: userTranscript }
    });
    await prisma.bhaktiGptMessage.create({
      data: { conversationId: conversation.id, role: "assistant", content: assistantTranscript }
    });
    await prisma.bhaktiGptConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // Fire-and-forget — never blocks the response, and can't undo audio already played.
    auditVoiceTurnTranscript({
      guideId: body.guideId,
      conversationId: conversation.id,
      assistantTranscript
    });

    return withIdentityCookie(NextResponse.json({ conversationId: conversation.id }), identity);
  } catch (error) {
    console.error("[Bhakti Voice][turn-complete][POST] Unexpected error.", error);
    return withIdentityCookie(
      NextResponse.json({ error: "voice_turn_persist_failed" }, { status: 500 }),
      identity
    );
  }
}
