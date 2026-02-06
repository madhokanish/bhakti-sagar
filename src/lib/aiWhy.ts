type AiWhyPayload = {
  city: string;
  tz: string;
  date: string;
  goal: string;
  window: string;
  slot: string;
  start: string;
  label: string;
};

export async function fetchAiWhy(payload: AiWhyPayload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch("/api/choghadiya/ai-why", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!res.ok) throw new Error("AI unavailable");
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}
