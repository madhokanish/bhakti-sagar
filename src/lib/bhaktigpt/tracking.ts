import "server-only";

// Server-side PostHog capture.
//
// This used to be a stub that only console.info'd outside production, which meant every
// server event (voice sessions, quota hits) was silently dropped in prod — the reason
// image/voice spend was invisible on the OpenAI invoice while chat, which is recorded in
// Postgres, was fully accountable.
//
// Uses PostHog's HTTP capture API directly rather than posthog-node: one fetch, no new
// dependency, and nothing to flush/shut down in a serverless function.
//
//   POSTHOG_API_KEY   project API key (the write-only "phc_..." one, safe server-side)
//   POSTHOG_HOST      defaults to the EU cloud, matching the Android client's
//                     local.properties (posthog.host=https://eu.i.posthog.com)
//
// Unset POSTHOG_API_KEY disables capture entirely, so local/preview runs stay silent
// instead of polluting the project.

const DEFAULT_HOST = "https://eu.i.posthog.com";
const CAPTURE_TIMEOUT_MS = 3_000;

/**
 * Sends one event to PostHog. Never throws and never rejects: analytics must not be able
 * to fail a user-facing request. Awaited by callers rather than fire-and-forget, because a
 * serverless function can be frozen the moment it responds, which drops in-flight requests.
 */
export async function trackServerEvent(
  eventName: string,
  properties: Record<string, unknown>,
  distinctId?: string
): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info("[Bhakti Chat event]", eventName, properties);
  }

  const apiKey = process.env.POSTHOG_API_KEY?.trim();
  if (!apiKey) return;

  const host = (process.env.POSTHOG_HOST?.trim() || DEFAULT_HOST).replace(/\/$/, "");

  // Prefer an explicit id, then the identifiers callers already put in the payload, so
  // existing call sites (voice passes `rateKey`) attribute to a person rather than to a
  // single shared bucket.
  const resolvedDistinctId =
    distinctId ||
    (typeof properties.userKey === "string" ? properties.userKey : undefined) ||
    (typeof properties.rateKey === "string" ? properties.rateKey : undefined) ||
    "server";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CAPTURE_TIMEOUT_MS);

    const response = await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event: eventName,
        distinct_id: resolvedDistinctId,
        properties: { ...properties, $lib: "bhaktichat-server" },
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("[Bhakti Chat event] PostHog capture failed.", eventName, response.status);
    }
  } catch (error) {
    console.error("[Bhakti Chat event] PostHog capture threw.", eventName, error);
  }
}
