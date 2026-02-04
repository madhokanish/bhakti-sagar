import { NextResponse } from "next/server";

type RequestBody = {
  title: string;
  lyrics: string[];
  mode: "summary" | "line";
};

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

function buildPrompt(title: string, lyrics: string[], mode: "summary" | "line") {
  if (mode === "summary") {
    return `Explain the meaning of the aarti "${title}" in simple, devotional English. Keep it short and respectful.`;
  }
  return `Provide a line-by-line meaning for the aarti "${title}". Return ONLY a JSON array of strings, one meaning per line in order. Do not include code fences or extra text.\n\nLines:\n${lyrics.map((line, index) => `${index + 1}. ${line}`).join("\n")}`;
}

function normalizeLineMeanings(content: string, expectedLength: number) {
  const stripped = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
  } catch {
    // fall through to heuristic
  }

  const cleaned = stripped
    .split(/\n+/)
    .map((line) => line.replace(/^\d+[\).\-]?\s*/, "").trim())
    .filter(Boolean);

  if (!cleaned.length) {
    return Array.from({ length: expectedLength }, () => "");
  }

  if (cleaned.length >= expectedLength) {
    return cleaned.slice(0, expectedLength);
  }

  return [...cleaned, ...Array.from({ length: expectedLength - cleaned.length }, () => "")];
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim();

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY and OPENAI_MODEL must be set." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as RequestBody;

  if (!body?.title || !Array.isArray(body.lyrics) || !body.mode) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const prompt = buildPrompt(body.title, body.lyrics, body.mode);

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a respectful devotional assistant. Keep explanations gentle, simple, and culturally sensitive."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: `OpenAI error: ${errorText}` },
      { status: 500 }
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    return NextResponse.json({ error: "No response from model." }, { status: 500 });
  }

  if (body.mode === "summary") {
    return NextResponse.json({ summary: content });
  }

  const meanings = normalizeLineMeanings(content, body.lyrics.length);
  return NextResponse.json({ meanings });
}
