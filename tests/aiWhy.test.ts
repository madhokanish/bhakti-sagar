import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchAiWhy } from "../src/lib/aiWhy.ts";

test("fetchAiWhy returns parsed response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    ({
      ok: true,
      json: async () => ({ why: "Short why", extra: "Extra line" })
    }) as Response) as typeof fetch;

  const res = await fetchAiWhy({
    city: "London",
    tz: "Europe/London",
    date: "2026-02-05",
    goal: "Travel",
    window: "Next 3 hours",
    slot: "Char",
    start: "10:00 AM",
    label: "Neutral"
  });

  assert.equal(res.why, "Short why");
  assert.equal(res.extra, "Extra line");

  globalThis.fetch = originalFetch;
});
