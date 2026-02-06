import { NextResponse } from "next/server";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

type RequestBody = {
  city: string;
  tz: string;
  date: string;
  goal: string;
  window: string;
  slot: string;
  start: string;
  label: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim();

  if (!apiKey || !model) {
    return NextResponse.json({ error: "AI not configured." }, { status: 500 });
  }

  const body = (await request.json()) as RequestBody;
  if (!body?.slot || !body?.start || !body?.label) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const prompt = `Rewrite the following reason in a more human, gentle tone without changing any times or names.
Return JSON only: {"why": "...", "extra": "..."}.
If you add extra, keep it one short sentence. Do not invent times or slot names.

Context:
City: ${body.city}
Date: ${body.date}
Goal: ${body.goal}
Window: ${body.window}
Slot: ${body.slot}
Time: ${body.start}
Label: ${body.label}`;

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
            "You are a helpful assistant. Keep explanations short, factual, and never invent times or slot names."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText }, { status: 500 });
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "No response." }, { status: 500 });
  }

  const stripped = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(stripped);
    return NextResponse.json({
      why: String(parsed.why ?? ""),
      extra: parsed.extra ? String(parsed.extra) : null
    });
  } catch {
    return NextResponse.json({ error: "Invalid AI response." }, { status: 500 });
  }
}
