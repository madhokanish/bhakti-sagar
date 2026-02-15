import { NextResponse } from "next/server";
import {
  DarshanPlayerPayload,
  getDarshanPlayerPayload,
  resolveChannelIdFromUrl
} from "@/lib/liveDarshan";
import { verifySignedSessionToken, SUBSCRIPTION_SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

type CacheEntry = {
  expiresAt: number;
  data: DarshanPlayerPayload;
};

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 1000;

function getCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((item) => item.trim());
  const matched = parts.find((part) => part.startsWith(`${key}=`));
  if (!matched) return null;
  return decodeURIComponent(matched.slice(key.length + 1));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelIdParam = searchParams.get("channelId")?.trim();
  const channelUrl = searchParams.get("channelUrl")?.trim();
  const previewMode = searchParams.get("preview") === "1";
  let channelId = channelIdParam || null;

  const sessionToken = getCookieValue(request.headers.get("cookie"), SUBSCRIPTION_SESSION_COOKIE);
  const session = verifySignedSessionToken(sessionToken);
  const isEntitled = Boolean(session?.entitled);

  if (!isEntitled && !previewMode) {
    return NextResponse.json({ error: "Subscription required." }, { status: 402 });
  }

  if (!channelId && channelUrl) {
    channelId = await resolveChannelIdFromUrl(channelUrl);
  }

  if (!channelId) {
    console.info("[darshan-player]", {
      status: "none",
      reason: "channel_not_resolved",
      channelIdParam: channelIdParam ?? null,
      channelUrl: channelUrl ?? null
    });
    return NextResponse.json(
      {
        status: "none",
        videoId: null,
        embedUrl: null,
        title: null,
        publishedAt: null
      } satisfies DarshanPlayerPayload,
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
        }
      }
    );
  }

  const cacheKey = `${channelId}:${!isEntitled && previewMode ? "preview" : "full"}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
      }
    });
  }

  const data = await getDarshanPlayerPayload(channelId);
  const responseData =
    !isEntitled && previewMode
      ? {
          ...data,
          embedUrl: null
        }
      : data;
  cache.set(cacheKey, { data: responseData, expiresAt: Date.now() + TTL_MS });

  return NextResponse.json(responseData, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
    }
  });
}
