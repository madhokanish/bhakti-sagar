import { NextResponse } from "next/server";

type RequestBody = {
  title: string;
  lyrics: string[];
  question: string;
};

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

function buildPrompt(title: string, lyrics: string[], question: string) {
  const clipped = lyrics.slice(0, 120).join("\n");
  return `You are a respectful devotional assistant.\n\nAarti: ${title}\nLyrics:\n${clipped}\n\nUser question: ${question}\n\nAnswer in simple, devotional English. Keep it concise and helpful.`;
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

  if (!body?.title || !Array.isArray(body.lyrics) || !body.question) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const prompt = buildPrompt(body.title, body.lyrics, body.question);

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

  return NextResponse.json({ answer: content });
}
