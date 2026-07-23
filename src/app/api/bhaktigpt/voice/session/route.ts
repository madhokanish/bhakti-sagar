import { NextResponse } from "next/server";
import { isGuideId } from "@/lib/bhaktigpt/guides";
import { getVoicePersona } from "@/lib/bhaktigpt/voicePersonas";
import {
  BHAKTIGPT_COOKIE,
  isRateLimited,
  isVoiceDailyCapReached,
  resolveBhaktiIdentity
} from "@/lib/bhaktigpt/server";
import { pickVariantByRollout } from "@/lib/bhaktigpt/rollout";
import { trackServerEvent } from "@/lib/bhaktigpt/tracking";

export const runtime = "nodejs";

const OPENAI_CLIENT_SECRETS_ENDPOINT = "https://api.openai.com/v1/realtime/client_secrets";

// Voice Mode is a bigger cost/risk surface than text chat (real-time speech-to-speech,
// no post-hoc safety rewrite pass — see voicePersonas.ts) — gated independently of any
// other feature flag in this codebase.
//   VOICE_MODE_ENABLED       "false" disables Voice Mode entirely (hard kill switch).
//   VOICE_MODE_ROLLOUT_PCT   0..100, default 0 — this ships OFF until deliberately
//                            dialed up; text chat's DIVINE_IMAGE_* flags default to 100
//                            because that feature already graduated out of A/B, voice
//                            mode has not.
function isEligibleForVoiceMode(userKey: string | undefined, requestId: string): boolean {
  if (process.env.VOICE_MODE_ENABLED?.trim().toLowerCase() === "false") {
    return false;
  }
  const rolloutRaw = process.env.VOICE_MODE_ROLLOUT_PCT?.trim();
  const rolloutPct = rolloutRaw ? Number(rolloutRaw) : 0;
  return pickVariantByRollout(rolloutPct, userKey, requestId) === "treatment";
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Attaches the identity cookie on every exit path, not just success — otherwise a
 *  request that errors/gates-out before the happy path never stabilizes an anonymous
 *  session, and the next request gets bucketed under a brand-new session id instead
 *  of the same one (breaks rate limiting / the daily voice cap across retries). */
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

type VoiceSessionRequestBody = {
  guideId?: string;
  requestId?: string;
};

export async function POST(request: Request) {
  const identity = await resolveBhaktiIdentity();

  try {
    const body = (await request.json()) as Partial<VoiceSessionRequestBody>;

    if (!body?.guideId || !isGuideId(body.guideId)) {
      return withIdentityCookie(badRequest("Invalid guideId."), identity);
    }

    const rateKey = identity.userId || identity.anonSessionId || "anonymous";
    const requestId = body.requestId?.trim() || crypto.randomUUID();

    if (isRateLimited(`voice-session:${rateKey}`, 5, 60_000)) {
      return withIdentityCookie(
        NextResponse.json(
          { error: "Too many voice session requests. Please wait and try again." },
          { status: 429 }
        ),
        identity
      );
    }

    if (!isEligibleForVoiceMode(identity.userId ?? identity.anonSessionId ?? undefined, requestId)) {
      return withIdentityCookie(
        NextResponse.json({ error: "voice_mode_not_available" }, { status: 403 }),
        identity
      );
    }

    if (isVoiceDailyCapReached(rateKey)) {
      trackServerEvent("voice_daily_cap_reached", { guideId: body.guideId, rateKey });
      return withIdentityCookie(
        NextResponse.json({ error: "voice_daily_cap_reached" }, { status: 429 }),
        identity
      );
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const persona = getVoicePersona(body.guideId);
    const model = process.env.OPENAI_REALTIME_MODEL?.trim() || "gpt-realtime";

    const openAiResponse = await fetch(OPENAI_CLIENT_SECRETS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model,
          instructions: persona.instructions,
          audio: {
            input: {
              turn_detection: { type: "server_vad" },
              transcription: { model: "whisper-1" }
            },
            output: {
              voice: persona.voicePresetId
            }
          }
        }
      })
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text().catch(() => "");
      console.error("[Bhakti Voice][session] OpenAI client_secrets call failed.", openAiResponse.status, errorText);
      return withIdentityCookie(
        NextResponse.json({ error: "voice_session_failed" }, { status: 502 }),
        identity
      );
    }

    const payload = (await openAiResponse.json()) as {
      value?: string;
      client_secret?: { value?: string; expires_at?: number };
      expires_at?: number;
    };

    // Confirmed directly against the live API (2026-07-23): the ephemeral key comes back
    // as a top-level `value` field, not nested under `client_secret`. The fallback below
    // is kept in case a future API revision moves it — re-verify if this starts logging
    // "Unexpected client_secrets response shape" below.
    const ephemeralKey = payload.client_secret?.value ?? payload.value;
    const expiresAt = payload.client_secret?.expires_at ?? payload.expires_at ?? null;

    if (!ephemeralKey) {
      console.error("[Bhakti Voice][session] Unexpected client_secrets response shape.", payload);
      return withIdentityCookie(
        NextResponse.json({ error: "voice_session_failed" }, { status: 502 }),
        identity
      );
    }

    trackServerEvent("voice_session_started", { guideId: body.guideId, rateKey });

    return withIdentityCookie(
      NextResponse.json({
        ephemeralKey,
        model,
        expiresAt,
        voicePresetId: persona.voicePresetId
      }),
      identity
    );
  } catch (error) {
    console.error("[Bhakti Voice][session][POST] Unexpected error.", error);
    return withIdentityCookie(
      NextResponse.json({ error: "voice_session_failed" }, { status: 500 }),
      identity
    );
  }
}
