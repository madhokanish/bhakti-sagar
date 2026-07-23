export type Variant = "control" | "treatment";

/** Deterministic 0..99 bucket from a string key (FNV-1a) — same key always yields the same bucket. */
export function hashToBucket(key: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 100;
}

/**
 * Deterministically buckets a user/request into "control" or "treatment" at the given
 * rollout percentage (0..100, treatment share). The same bucketKey always yields the
 * same variant, so a single user's assignment stays stable across retries.
 */
export function pickVariantByRollout(
  rolloutPct: number,
  userKey: string | undefined,
  requestId: string
): Variant {
  const clamped = Number.isFinite(rolloutPct) ? Math.max(0, Math.min(100, rolloutPct)) : 100;
  const bucketKey = (userKey && userKey.trim()) || requestId;
  const bucket = hashToBucket(bucketKey);
  return bucket < clamped ? "treatment" : "control";
}
