import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LiveMandir } from "@/data/liveMandirs";

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

type ChannelsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
    };
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
};

type PlaylistItemsResponse = {
  nextPageToken?: string;
  items?: Array<{
    snippet?: {
      title?: string;
      publishedAt?: string;
      resourceId?: {
        videoId?: string;
      };
    };
  }>;
};

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const RESOLVER_CACHE_PATH = path.join(process.cwd(), "src/data/live-channel-cache.json");
const RUNTIME_CACHE_PATH = "/tmp/live-channel-cache.json";
const MIN_VIDEO_SECONDS = 10 * 60;
const MANDIR_PROFILE_TTL_MS = 24 * 60 * 60 * 1000;

const handleCache = new Map<string, string>();
const mandirProfileCache = new Map<string, { expiresAt: number; value: ResolvedLiveMandir }>();
let cacheReady = false;
let cacheLoadPromise: Promise<void> | null = null;

export type ResolvedLiveMandir = LiveMandir & {
  slug: string;
  aliases: string[];
  channelId?: string;
  channelTitle?: string;
  displayName: string;
};

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

async function resolveHandleFromPublicPage(handle: string, originalUrl?: string) {
  const normalized = normalizeHandle(handle);
  await ensureHandleCacheLoaded();

  const cached = handleCache.get(normalized);
  if (cached) return cached;

  const candidates = [
    originalUrl,
    `https://www.youtube.com/@${normalized}`,
    `https://www.youtube.com/@${normalized}/featured`,
    `https://www.youtube.com/@${normalized}/videos`
  ].filter(Boolean) as string[];

  const extractFromHtml = (html: string) => {
    const patterns = [
      /"channelId":"(UC[\w-]+)"/,
      /"externalId":"(UC[\w-]+)"/,
      /"browseId":"(UC[\w-]+)"/,
      /\/channel\/(UC[\w-]+)/
    ];
    for (const pattern of patterns) {
      const matched = html.match(pattern);
      if (matched?.[1]) return matched[1];
    }
    return null;
  };

  try {
    for (const candidate of candidates) {
      const response = await fetch(candidate, { next: { revalidate: 60 } });
      if (!response.ok) continue;
      const html = await response.text();
      const resolved = extractFromHtml(html);
      if (resolved) {
        handleCache.set(normalized, resolved);
        await persistHandleCache();
        return resolved;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveHandleViaApi(handle: string) {
  const normalized = normalizeHandle(handle);
  await ensureHandleCacheLoaded();
  const cached = handleCache.get(normalized);
  if (cached) return cached;

  try {
    const channels = await youtubeGet<ChannelsResponse>("channels", {
      part: "id",
      forHandle: normalized,
      maxResults: "1"
    });
    const channelId = channels.items?.[0]?.id ?? null;
    if (channelId) {
      handleCache.set(normalized, channelId);
      await persistHandleCache();
      return channelId;
    }
  } catch {
    // fall back to public page parse
  }
  return null;
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

  const viaApi = await resolveHandleViaApi(handle);
  if (viaApi) return viaApi;
  return resolveHandleFromPublicPage(handle, channelUrl);
}

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanChannelTitle(title: string) {
  let value = title.replace(/\s+/g, " ").trim();
  if (!value) return value;

  value = value.replace(
    /\s*(?:[-:\u2022]\s*)?(?:official(?:\s+channel)?|live(?:\s+tv)?|tv)\s*$/i,
    ""
  );

  value = value.replace(/\s+/g, " ").trim();
  return value || title.replace(/\s+/g, " ").trim();
}

async function getChannelTitleById(channelId: string) {
  try {
    const channels = await youtubeGet<ChannelsResponse>("channels", {
      part: "snippet",
      id: channelId,
      maxResults: "1"
    });
    return channels.items?.[0]?.snippet?.title?.trim() ?? null;
  } catch {
    return null;
  }
}

function buildMandirAliases(mandir: LiveMandir, channelId: string | undefined, slug: string) {
  const aliases = new Set<string>();
  aliases.add(slug.toLowerCase());
  aliases.add(mandir.id.toLowerCase());
  aliases.add(mandir.id);

  if (channelId) {
    aliases.add(channelId.toLowerCase());
    aliases.add(channelId);
  }

  return [...aliases];
}

export async function resolveLiveMandir(mandir: LiveMandir): Promise<ResolvedLiveMandir> {
  const cacheKey = mandir.channelId ?? mandir.channelUrl;
  const cached = mandirProfileCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const resolvedChannelId =
    mandir.channelId ?? (await resolveChannelIdFromUrl(mandir.channelUrl)) ?? undefined;
  const channelTitle = resolvedChannelId ? await getChannelTitleById(resolvedChannelId) : null;
  const displayName = cleanChannelTitle(channelTitle ?? mandir.name);
  const slug = slugifyName(displayName) || slugifyName(mandir.name) || mandir.id.toLowerCase();

  const resolved: ResolvedLiveMandir = {
    ...mandir,
    slug,
    aliases: buildMandirAliases(mandir, resolvedChannelId, slug),
    channelId: resolvedChannelId,
    channelTitle: channelTitle ?? undefined,
    displayName
  };

  mandirProfileCache.set(cacheKey, { value: resolved, expiresAt: Date.now() + MANDIR_PROFILE_TTL_MS });
  return resolved;
}

export async function resolveLiveMandirs(mandirs: LiveMandir[]) {
  return Promise.all(mandirs.map((mandir) => resolveLiveMandir(mandir)));
}

export function findResolvedMandirByIdentifier(
  mandirs: ResolvedLiveMandir[],
  identifier: string
) {
  const key = identifier.toLowerCase();
  return mandirs.find((mandir) => mandir.aliases.some((alias) => alias.toLowerCase() === key));
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
  maxPages = 10,
  eventType
}: {
  channelId: string;
  minSeconds?: number;
  maxPages?: number;
  eventType?: "completed";
}) {
  let pageToken: string | undefined;

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
    if (items.length === 0) break;

    const ids = items.map((item) => item.id?.videoId).filter(Boolean) as string[];
    const durations = await getVideosByIds(ids);
    const longId = ids.find((id) => (durations.get(id)?.durationSeconds ?? 0) > minSeconds);
    if (longId) {
      const longItem = items.find((item) => item.id?.videoId === longId) ?? null;
      return { item: longItem };
    }

    pageToken = payload.nextPageToken;
    if (!pageToken) break;
  }

  return { item: null };
}

async function getUploadsPlaylistId(channelId: string) {
  const channels = await youtubeGet<ChannelsResponse>("channels", {
    part: "contentDetails",
    id: channelId,
    maxResults: "1"
  });
  return channels.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

async function findLongVideoFromUploadsPlaylist({
  channelId,
  minSeconds = MIN_VIDEO_SECONDS,
  maxPages = 10
}: {
  channelId: string;
  minSeconds?: number;
  maxPages?: number;
}) {
  const playlistId = await getUploadsPlaylistId(channelId);
  if (!playlistId) return null;

  let pageToken: string | undefined;
  for (let page = 0; page < maxPages; page += 1) {
    const payload = await youtubeGet<PlaylistItemsResponse>("playlistItems", {
      part: "snippet",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {})
    });

    const items = payload.items ?? [];
    if (items.length === 0) break;

    const ids = items
      .map((item) => item.snippet?.resourceId?.videoId)
      .filter(Boolean) as string[];
    const durations = await getVideosByIds(ids);
    const longId = ids.find((id) => (durations.get(id)?.durationSeconds ?? 0) > minSeconds);

    if (longId) {
      const item = items.find((entry) => entry.snippet?.resourceId?.videoId === longId) ?? null;
      if (!item?.snippet) return null;
      return {
        id: longId,
        title: item.snippet.title ?? null,
        publishedAt: item.snippet.publishedAt ?? null
      };
    }

    pageToken = payload.nextPageToken;
    if (!pageToken) break;
  }

  return null;
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
  const log = {
    channelId,
    status: "none" as DarshanStatus,
    videoId: null as string | null,
    details: [] as string[]
  };

  try {
    const liveItems = await searchVideos({
      channelId,
      eventType: "live",
      maxResults: "1"
    });
    const live = liveItems[0];
    const liveVideoId = live?.id?.videoId ?? null;

    if (liveVideoId) {
      log.status = "live";
      log.videoId = liveVideoId;
      log.details.push("Matched eventType=live");
      console.info("[darshan-player]", log);
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
    if (!completedVideoId) {
      log.details.push("No completed livestream found with duration > 10 minutes");
    }

    if (completedVideoId) {
      log.status = "recording";
      log.videoId = completedVideoId;
      log.details.push("Matched eventType=completed with duration > 10 minutes");
      console.info("[darshan-player]", log);
      return {
        status: "recording",
        videoId: completedVideoId,
        embedUrl: toEmbedUrl(completedVideoId),
        title: completed?.snippet?.title ?? null,
        publishedAt: completed?.snippet?.publishedAt ?? null
      };
    }

    const latest = await findLongVideoFromUploadsPlaylist({
      channelId,
      minSeconds: MIN_VIDEO_SECONDS
    });
    if (!latest?.id) {
      log.details.push("No upload found with duration > 10 minutes in uploads playlist scan");
    }

    if (!latest?.id) {
      console.info("[darshan-player]", log);
      return {
        status: "none",
        videoId: null,
        embedUrl: null,
        title: null,
        publishedAt: null
      };
    }

    log.status = "latest";
    log.videoId = latest.id;
    log.details.push("Matched uploads playlist video with duration > 10 minutes");
    console.info("[darshan-player]", log);
    return {
      status: "latest",
      videoId: latest.id,
      embedUrl: toEmbedUrl(latest.id),
      title: latest.title,
      publishedAt: latest.publishedAt
    };
  } catch {
    log.details.push("Unexpected error while fetching YouTube API data");
    console.info("[darshan-player]", log);
    return {
      status: "none",
      videoId: null,
      embedUrl: null,
      title: null,
      publishedAt: null
    };
  }
}
