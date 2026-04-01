import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENAI_GENERATE_ENDPOINT = "https://api.openai.com/v1/images/generations";
const OPENAI_EDIT_ENDPOINT = "https://api.openai.com/v1/images/edits";

type DivineImageRequestBody = {
  mode?: string;
  prompt?: string;
  inputImageDataUrl?: string;
};

type ParsedDataUrl = {
  mimeType: string;
  bytes: Uint8Array;
};

function getImageModel() {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
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

async function generateFromPrompt(
  apiKey: string,
  model: string,
  prompt: string
) {
  const response = await fetch(OPENAI_GENERATE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024"
    })
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
  inputImage: ParsedDataUrl
) {
  const imageBuffer = Buffer.from(inputImage.bytes);
  const formData = new FormData();
  formData.append("model", model);
  formData.append("prompt", prompt);
  formData.append("size", "1024x1024");
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

  try {
    const parsedDataUrl =
      body.inputImageDataUrl && body.inputImageDataUrl.trim().length > 0
        ? parseDataUrl(body.inputImageDataUrl.trim())
        : null;

    const openAiData = parsedDataUrl
      ? await generateFromImageEdit(apiKey, model, prompt, parsedDataUrl)
      : await generateFromPrompt(apiKey, model, prompt);

    const payload = extractImagePayload(openAiData);
    if (!payload) {
      return NextResponse.json(
        { error: "OpenAI returned no image data." },
        { status: 502 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
