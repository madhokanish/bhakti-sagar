// Thin client for the live chat endpoint. Hits POST /api/bhaktigpt/chat exactly as
// the app does, consumes the SSE stream (event: meta | token | done | error), and
// reassembles the final assistant text. This exercises the REAL runtime path —
// director modes, secondary guards, crisis detection, language handling — not just
// the raw system prompt.

// Extract just the bs_bhaktigpt_session cookie so multi-turn cases share one identity.
function parseSessionCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const m = setCookieHeader.match(/bs_bhaktigpt_session=[^;]+/);
  return m ? m[0] : null;
}

// Parse a single SSE record ("event: x\ndata: {...}") into { event, data }.
function parseSseRecord(record) {
  let event = "message";
  const dataLines = [];
  for (const line of record.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  let data = null;
  if (dataLines.length) {
    try {
      data = JSON.parse(dataLines.join("\n"));
    } catch {
      data = { raw: dataLines.join("\n") };
    }
  }
  return { event, data };
}

/**
 * Send one message and return the fully assembled reply.
 * @returns {Promise<{ text, meta, done, error, cookie, ttfbMs, totalMs }>}
 */
export async function chatOnce({
  baseUrl,
  guideId,
  message,
  conversationId = undefined,
  chatLang = "en",
  cookie = null,
  timeoutMs = 90_000
}) {
  const startedAt = Date.now();
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/bhaktigpt/chat`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify({ guideId, message, conversationId, chatLang }),
    signal: AbortSignal.timeout(timeoutMs)
  });

  const nextCookie = parseSessionCookie(res.headers.get("set-cookie")) || cookie;

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    return {
      text: "",
      meta: null,
      done: null,
      error: { message: `HTTP ${res.status}`, code: "http_error", body: body.slice(0, 500) },
      cookie: nextCookie,
      ttfbMs: null,
      totalMs: Date.now() - startedAt
    };
  }

  let text = "";
  let meta = null;
  let done = null;
  let error = null;
  let ttfbMs = null;
  let buffer = "";

  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const record = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      if (!record.trim()) continue;
      const { event, data } = parseSseRecord(record);
      if (event === "meta") meta = data;
      else if (event === "token") {
        if (ttfbMs === null) ttfbMs = Date.now() - startedAt;
        text += data?.text ?? "";
      } else if (event === "done") done = data;
      else if (event === "error") error = data;
    }
  }

  return { text: text.trim(), meta, done, error, cookie: nextCookie, ttfbMs, totalMs: Date.now() - startedAt };
}

/**
 * Run a full (possibly multi-turn) conversation for one case. Threads conversationId
 * and the session cookie across turns so persona-drift and anti-loop logic get exercised.
 * @returns {Promise<{ turns: Array<{ user, assistant, meta, error }>, final: string }>}
 */
export async function runConversation({ baseUrl, guideId, messages, chatLang = "en", timeoutMs }) {
  let conversationId;
  let cookie = null;
  const turns = [];

  for (const message of messages) {
    const r = await chatOnce({ baseUrl, guideId, message, conversationId, chatLang, cookie, timeoutMs });
    cookie = r.cookie;
    if (r.meta?.conversationId) conversationId = r.meta.conversationId;
    turns.push({
      user: message,
      assistant: r.text,
      meta: r.meta,
      done: r.done,
      error: r.error,
      ttfbMs: r.ttfbMs,
      totalMs: r.totalMs
    });
    if (r.error) break;
  }

  return { turns, final: turns[turns.length - 1]?.assistant ?? "", conversationId };
}
