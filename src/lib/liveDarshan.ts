import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type DarshanStatus = "live" | "recording" | "latest" | "none";

export type DarshanPlayerPayload = {
  status: DarshanStatus;
  videoId: string | null;
  embedUrl: string | null;
  title: string | null;
  publishedAt: string | null;
};

type SearchResponse = {
  items?: Array<{
    id?: {
      channelId?: string;
      videoId?: string;
    };
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelTitle?: string;
    };
  }>;
};

type VideosResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string;
    };
    snippet?: {
      title?: string;
      publishedAt?: string;
    };
  }>;
};

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const RESOLVER_CACHE_PATH = path.join(process.cwd(), "src/data/live-channel-cache.json");
const RUNTIME_CACHE_PATH = "/tmp/live-channel-cache.json";
const MIN_VIDEO_SECONDS = 10 * 60;

const handleCache = new Map<string, string>();
let cacheReady = false;
let cacheLoadPromise: Promise<void> | null = null;

function getApiKey() {
  const key = process.env.YT_API_KEY?.trim();
  if (!key) {
    throw new Error("YT_API_KEY is missing.");
  }
  return key;
}

function normalizeHandle(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

function compact(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function readHandleCacheFile(filePath: string) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.entries(parsed).filter((entry) => entry[0] && entry[1]);
  } catch {
    return [] as Array<[string, string]>;
  }
}

async function ensureHandleCacheLoaded() {
  if (cacheReady) return;
  if (cacheLoadPromise) {
    await cacheLoadPromise;
    return;
  }

  cacheLoadPromise = (async () => {
    const staticEntries = await readHandleCacheFile(RESOLVER_CACHE_PATH);
    const runtimeEntries = await readHandleCacheFile(RUNTIME_CACHE_PATH);

    for (const [handle, channelId] of [...staticEntries, ...runtimeEntries]) {
      handleCache.set(normalizeHandle(handle), channelId);
    }
    cacheReady = true;
  })();

  await cacheLoadPromise;
  cacheLoadPromise = null;
}

async function persistHandleCache() {
  const payload = JSON.stringify(Object.fromEntries(handleCache), null, 2);

  await Promise.allSettled([
    writeFile(RUNTIME_CACHE_PATH, payload, "utf8"),
    writeFile(RESOLVER_CACHE_PATH, payload, "utf8")
  ]);
}

async function youtubeGet<T>(endpoint: string, params: Record<string, string>) {
  const key = getApiKey();
  const searchParams = new URLSearchParams({ ...params, key });
  const response = await fetch(`${YT_BASE}/${endpoint}?${searchParams.toString()}`, {
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`YouTube API failed (${response.status}).`);
  }

  return (await response.json()) as T;
}

function scoreChannelCandidate(
  item: NonNullable<SearchResponse["items"]>[number],
  handle: string
) {
  const target = compact(handle);
  const title = compact(item.snippet?.channelTitle ?? "");
  const description = (item.snippet?.description ?? "").toLowerCase();
  let score = 0;

  if (title === target) score += 10;
  if (title.includes(target)) score += 6;
  if (description.includes(`@${handle}`)) score += 4;
  if (item.id?.channelId?.startsWith("UC")) score += 1;

  return score;
}

async function searchChannelsByHandle(handle: string) {
  const normalized = normalizeHandle(handle);
  await ensureHandleCacheLoaded();

  const cached = handleCache.get(normalized);
  if (cached) return cached;

  const search = await youtubeGet<SearchResponse>("search", {
    part: "snippet",
    type: "channel",
    q: `@${normalized}`,
    maxResults: "5"
  });

  let items = search.items ?? [];
  if (items.length === 0) {
    const fallback = await youtubeGet<SearchResponse>("search", {
      part: "snippet",
      type: "channel",
      q: normalized,
      maxResults: "5"
    });
    items = fallback.items ?? [];
  }
  if (items.length === 0) return null;

  const best = [...items].sort(
    (a, b) => scoreChannelCandidate(b, normalized) - scoreChannelCandidate(a, normalized)
  )[0];

  const channelId = best?.id?.channelId ?? null;
  if (!channelId) return null;

  handleCache.set(normalized, channelId);
  await persistHandleCache();
  return channelId;
}

async function resolveHandleFromPublicPage(handle: string) {
  const normalized = normalizeHandle(handle);
  try {
    const response = await fetch(`https://www.youtube.com/@${normalized}`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const matched = html.match(/"channelId":"(UC[\w-]+)"/);
    return matched?.[1] ?? null;
  } catch {
    return null;
  }
}

export function extractChannelIdFromUrl(channelUrl: string) {
  const match = channelUrl.match(/\/channel\/(UC[\w-]+)/i);
  return match?.[1] ?? null;
}

export function extractHandleFromUrl(channelUrl: string) {
  const match = channelUrl.match(/\/@([A-Za-z0-9._-]+)/);
  return match?.[1] ?? null;
}

export async function resolveChannelIdFromUrl(channelUrl: string) {
  const direct = extractChannelIdFromUrl(channelUrl);
  if (direct) return direct;

  const handle = extractHandleFromUrl(channelUrl);
  if (!handle) return null;

  try {
    const viaApi = await searchChannelsByHandle(handle);
    if (viaApi) return viaApi;
    const viaPublicPage = await resolveHandleFromPublicPage(handle);
    if (viaPublicPage) {
      handleCache.set(normalizeHandle(handle), viaPublicPage);
      await persistHandleCache();
    }
    return viaPublicPage;
  } catch {
    const viaPublicPage = await resolveHandleFromPublicPage(handle);
    if (viaPublicPage) {
      handleCache.set(normalizeHandle(handle), viaPublicPage);
      await persistHandleCache();
    }
    return viaPublicPage;
  }
}

function toEmbedUrl(videoId: string, autoplay = false) {
  if (autoplay) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
  }
  return `https://www.youtube.com/embed/${videoId}`;
}

function parseDurationSeconds(duration?: string) {
  if (!duration) return 0;
  const matched = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matched) return 0;

  const hours = Number(matched[1] ?? 0);
  const minutes = Number(matched[2] ?? 0);
  const seconds = Number(matched[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

async function searchVideos(params: Record<string, string>) {
  const search = await youtubeGet<SearchResponse>("search", {
    part: "snippet",
    type: "video",
    ...params
  });
  return search.items ?? [];
}

async function findLongVideoInSearchPages({
  channelId,
  minSeconds = MIN_VIDEO_SECONDS,
  maxPages = 3,
  eventType
}: {
  channelId: string;
  minSeconds?: number;
  maxPages?: number;
  eventType?: "completed";
}) {
  let pageToken: string | undefined;
  let firstItem: NonNullable<SearchResponse["items"]>[number] | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const key = getApiKey();
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      channelId,
      order: "date",
      maxResults: "25",
      key
    });
    if (eventType) params.set("eventType", eventType);
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(`${YT_BASE}/search?${params.toString()}`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) break;
    const payload = (await response.json()) as SearchResponse & { nextPageToken?: string };
    const items = payload.items ?? [];
    if (!firstItem) firstItem = items[0] ?? null;
    if (items.length === 0) break;

    const ids = items.map((item) => item.id?.videoId).filter(Boolean) as string[];
    const durations = await getVideosByIds(ids);
    const longId = ids.find((id) => (durations.get(id)?.durationSeconds ?? 0) >= minSeconds);
    if (longId) {
      const longItem = items.find((item) => item.id?.videoId === longId) ?? null;
      return { item: longItem, firstItem };
    }

    pageToken = payload.nextPageToken;
    if (!pageToken) break;
  }

  return { item: null, firstItem };
}

async function getVideosByIds(ids: string[]) {
  if (ids.length === 0) return new Map<string, { durationSeconds: number }>();

  const videos = await youtubeGet<VideosResponse>("videos", {
    part: "contentDetails,snippet",
    id: ids.join(",")
  });

  const map = new Map<string, { durationSeconds: number }>();
  for (const item of videos.items ?? []) {
    const videoId = item.id;
    if (!videoId) continue;
    map.set(videoId, {
      durationSeconds: parseDurationSeconds(item.contentDetails?.duration)
    });
  }
  return map;
}

/**
 * Mandatory selection order:
 * 1) current live stream
 * 2) last completed livestream
 * 3) latest upload excluding Shorts (<=60s) when possible
 * 4) none
 */
export async function getDarshanPlayerPayload(channelId: string): Promise<DarshanPlayerPayload> {
  try {
    const liveItems = await searchVideos({
      channelId,
      eventType: "live",
      maxResults: "1"
    });
    const live = liveItems[0];
    const liveVideoId = live?.id?.videoId ?? null;

    if (liveVideoId) {
      return {
        status: "live",
        videoId: liveVideoId,
        embedUrl: toEmbedUrl(liveVideoId, true),
        title: live.snippet?.title ?? null,
        publishedAt: live.snippet?.publishedAt ?? null
      };
    }

    const completedSearch = await findLongVideoInSearchPages({
      channelId,
      eventType: "completed",
      minSeconds: MIN_VIDEO_SECONDS
    });
    const completed = completedSearch.item;
    const completedVideoId = completed?.id?.videoId ?? null;

    if (completedVideoId) {
      return {
        status: "recording",
        videoId: completedVideoId,
        embedUrl: toEmbedUrl(completedVideoId),
        title: completed?.snippet?.title ?? null,
        publishedAt: completed?.snippet?.publishedAt ?? null
      };
    }

    const latestSearch = await findLongVideoInSearchPages({
      channelId,
      minSeconds: MIN_VIDEO_SECONDS
    });
    const latest = latestSearch.item ?? latestSearch.firstItem;

    if (!latest) {
      return {
        status: "none",
        videoId: null,
        embedUrl: null,
        title: null,
        publishedAt: null
      };
    }

    const selectedId = latest.id?.videoId ?? null;
    const selectedItem = latest;

    if (!selectedId) {
      return {
        status: "none",
        videoId: null,
        embedUrl: null,
        title: null,
        publishedAt: null
      };
    }

    return {
      status: "latest",
      videoId: selectedId,
      embedUrl: toEmbedUrl(selectedId),
      title: selectedItem?.snippet?.title ?? null,
      publishedAt: selectedItem?.snippet?.publishedAt ?? null
    };
  } catch {
    return {
      status: "none",
      videoId: null,
      embedUrl: null,
      title: null,
      publishedAt: null
    };
  }
}
