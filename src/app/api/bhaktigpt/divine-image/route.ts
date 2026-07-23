import { NextResponse } from "next/server";
import { pickVariantByRollout } from "@/lib/bhaktigpt/rollout";

export const runtime = "nodejs";

// gpt-image-1 generations can take 60-120s. Give the function room so a slow
// generation isn't killed by the platform's default timeout (Vercel caps this to
// your plan's max; a lower plan limit still applies). Prevents "slow, then fails".
export const maxDuration = 300;

const OPENAI_GENERATE_ENDPOINT = "https://api.openai.com/v1/images/generations";
const OPENAI_EDIT_ENDPOINT = "https://api.openai.com/v1/images/edits";

/* -------------------------------------------------------------------------- */
/* A/B test config                                                            */
/* -------------------------------------------------------------------------- */
//
// Variants:
//  - "control"   = pre-overhaul config: size 1024x1024, default quality, no
//                  input_fidelity. Faithful reproduction of the old behavior.
//  - "treatment" = the new realism stack: size 1024x1536, quality "high",
//                  input_fidelity "high" (edit endpoint only), output png.
//
// Knobs (env):
//  - DIVINE_IMAGE_VARIANT          force "control" or "treatment" for all
//                                  requests (override, useful for incidents
//                                  or post-launch full rollout).
//  - DIVINE_IMAGE_TREATMENT_PCT    rollout percentage 0..100 (default 100).
//  - DIVINE_IMAGE_AB_ENABLED       set to "false" to disable A/B entirely
//                                  and always return "treatment".
//
// Bucketing is deterministic by `userKey` (falls back to a request-id hash)
// so a single user always sees the same variant across retries. This avoids
// flicker if the user generates multiple images during the trial week.
//
// All assignments + outcomes are emitted as structured `[divine-ab]` log
// lines so they can be picked up by Vercel logs / Datadog / any log
// aggregator and compared at the end of the week.
//

type DivineVariant = "control" | "treatment";

type DivineImageRequestBody = {
  mode?: string;
  prompt?: string;
  inputImageDataUrl?: string;
  /** Stable anonymous-or-account id from the client. */
  userKey?: string;
  /** Optional client-supplied request id for correlating logs. */
  requestId?: string;
};

type ParsedDataUrl = {
  mimeType: string;
  bytes: Uint8Array;
};

type DivineConfig = {
  size: string;
  quality?: string;
  output_format?: string;
  input_fidelity?: string;
};

const CONTROL_CONFIG: DivineConfig = {
  size: "1024x1024"
  // intentionally no quality, output_format, or input_fidelity — this matches
  // the pre-overhaul behavior we want to compare against.
};

// Speed vs quality is env-tunable so it can be dialed in Vercel without a redeploy.
// Defaults favor speed: quality "medium" is ~2x faster than "high" with still-strong
// results, while input_fidelity stays "high" so the uploaded face is preserved (the
// core value). To go faster set DIVINE_IMAGE_QUALITY=low; to restore max quality set
// DIVINE_IMAGE_QUALITY=high. Square (1024x1024) is faster than portrait (1024x1536).
const TREATMENT_CONFIG: DivineConfig = {
  size: process.env.DIVINE_IMAGE_SIZE?.trim() || "1024x1536",
  quality: process.env.DIVINE_IMAGE_QUALITY?.trim() || "medium",
  output_format: process.env.DIVINE_IMAGE_OUTPUT_FORMAT?.trim() || "png",
  input_fidelity: process.env.DIVINE_IMAGE_INPUT_FIDELITY?.trim() || "high" // /edits only
};

function getImageModel() {
  // Default upgraded to gpt-image-1.5 — the newest model that still supports the
  // input_fidelity knob our face preservation relies on. gpt-image-2 is newer but does
  // NOT support input_fidelity; set OPENAI_IMAGE_MODEL=gpt-image-2 to try it (the edit
  // path auto-drops input_fidelity for unsupported models — see modelSupportsInputFidelity).
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1.5";
}

// input_fidelity is accepted by gpt-image-1 / gpt-image-1-mini / gpt-image-1.5, but NOT by
// gpt-image-2+ or chatgpt-image-latest. Sending it to a model that rejects it 400s the whole
// request, so we only attach it when the active model supports it.
function modelSupportsInputFidelity(model: string): boolean {
  return model.trim().toLowerCase().startsWith("gpt-image-1");
}

function pickVariant(userKey: string | undefined, requestId: string): DivineVariant {
  // Kill switch: full rollout of the treatment.
  if (process.env.DIVINE_IMAGE_AB_ENABLED?.trim().toLowerCase() === "false") {
    return "treatment";
  }

  // Force override (per-deploy, useful during incidents).
  const forced = process.env.DIVINE_IMAGE_VARIANT?.trim().toLowerCase();
  if (forced === "control" || forced === "treatment") return forced as DivineVariant;

  // Rollout percentage of treatment. Default 100% — the realism stack
  // (input_fidelity=high, quality=high, 1024x1536) is now the standard path for
  // everyone. Set DIVINE_IMAGE_TREATMENT_PCT below 100 only to re-open an A/B.
  const rolloutRaw = process.env.DIVINE_IMAGE_TREATMENT_PCT?.trim();
  const parsed = rolloutRaw ? Number(rolloutRaw) : 100;

  return pickVariantByRollout(parsed, userKey, requestId);
}

function parseDataUrl(value: string): ParsedDataUrl | null {
  const match = value.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64 = match[2];
  try {
    return {
      mimeType,
      bytes: Uint8Array.from(Buffer.from(base64, "base64"))
    };
  } catch {
    return null;
  }
}

function extractImagePayload(data: unknown) {
  const first = (data as { data?: Array<{ b64_json?: string; url?: string }> })?.data?.[0];
  if (!first) return null;
  if (typeof first.b64_json === "string" && first.b64_json.length > 0) {
    return { imageBase64: first.b64_json, mimeType: "image/png" as const };
  }
  if (typeof first.url === "string" && first.url.length > 0) {
    return { imageUrl: first.url };
  }
  return null;
}

function logAbEvent(event: Record<string, unknown>) {
  // Single structured line, easy to grep / parse in any log backend.
  console.info("[divine-ab]", JSON.stringify({ ...event, ts: new Date().toISOString() }));
}

async function generateFromPrompt(
  apiKey: string,
  model: string,
  prompt: string,
  config: DivineConfig
) {
  const body: Record<string, unknown> = {
    model,
    prompt,
    size: config.size
  };
  if (config.quality) body.quality = config.quality;
  if (config.output_format) body.output_format = config.output_format;

  const response = await fetch(OPENAI_GENERATE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      (data as { error?: { message?: string } })?.error?.message ||
        `OpenAI generation failed (${response.status})`
    );
  }
  return data;
}

async function generateFromImageEdit(
  apiKey: string,
  model: string,
  prompt: string,
  inputImage: ParsedDataUrl,
  config: DivineConfig
) {
  const imageBuffer = Buffer.from(inputImage.bytes);
  const formData = new FormData();
  formData.append("model", model);
  formData.append("prompt", prompt);
  formData.append("size", config.size);
  if (config.quality) formData.append("quality", config.quality);
  if (config.output_format) formData.append("output_format", config.output_format);
  if (config.input_fidelity && modelSupportsInputFidelity(model)) {
    formData.append("input_fidelity", config.input_fidelity);
  }
  formData.append(
    "image",
    new Blob([imageBuffer], { type: inputImage.mimeType }),
    "input-image.png"
  );

  const response = await fetch(OPENAI_EDIT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      (data as { error?: { message?: string } })?.error?.message ||
        `OpenAI image edit failed (${response.status})`
    );
  }
  return data;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = getImageModel();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  let body: DivineImageRequestBody;
  try {
    body = (await request.json()) as DivineImageRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const requestId =
    body.requestId?.trim() ||
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `req_${Date.now()}_${Math.floor(Math.random() * 1e6)}`);

  const userKey = body.userKey?.trim() || undefined;
  const variant = pickVariant(userKey, requestId);
  const config = variant === "treatment" ? TREATMENT_CONFIG : CONTROL_CONFIG;
  const usedEditEndpoint =
    !!body.inputImageDataUrl && body.inputImageDataUrl.trim().length > 0;

  logAbEvent({
    event: "divine_image.request",
    requestId,
    variant,
    mode: body.mode,
    endpoint: usedEditEndpoint ? "edit" : "generate",
    hasUserKey: !!userKey,
    model,
    size: config.size,
    quality: config.quality ?? null,
    inputFidelity:
      usedEditEndpoint && modelSupportsInputFidelity(model)
        ? config.input_fidelity ?? null
        : null,
    promptChars: prompt.length
  });

  const startedAt = Date.now();

  try {
    const parsedDataUrl =
      body.inputImageDataUrl && body.inputImageDataUrl.trim().length > 0
        ? parseDataUrl(body.inputImageDataUrl.trim())
        : null;

    const openAiData = parsedDataUrl
      ? await generateFromImageEdit(apiKey, model, prompt, parsedDataUrl, config)
      : await generateFromPrompt(apiKey, model, prompt, config);

    const payload = extractImagePayload(openAiData);
    const durationMs = Date.now() - startedAt;

    if (!payload) {
      logAbEvent({
        event: "divine_image.failure",
        requestId,
        variant,
        reason: "no_image_payload",
        durationMs
      });
      return NextResponse.json(
        { error: "OpenAI returned no image data.", variant, requestId },
        { status: 502 }
      );
    }

    logAbEvent({
      event: "divine_image.success",
      requestId,
      variant,
      durationMs
    });

    // The client persists `variant` + `requestId` with the creation so we can
    // correlate user feedback later.
    return NextResponse.json({ ...payload, variant, requestId, durationMs });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "Image generation failed.";
    logAbEvent({
      event: "divine_image.failure",
      requestId,
      variant,
      reason: message.slice(0, 200),
      durationMs
    });
    return NextResponse.json(
      { error: message, variant, requestId },
      { status: 500 }
    );
  }
}
