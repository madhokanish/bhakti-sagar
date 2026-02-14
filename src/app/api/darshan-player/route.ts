import { NextResponse } from "next/server";
import {
  DarshanPlayerPayload,
  getDarshanPlayerPayload,
  resolveChannelIdFromUrl
} from "@/lib/liveDarshan";

export const runtime = "nodejs";

type CacheEntry = {
  expiresAt: number;
  data: DarshanPlayerPayload;
};

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelIdParam = searchParams.get("channelId")?.trim();
  const channelUrl = searchParams.get("channelUrl")?.trim();
  let channelId = channelIdParam || null;

  if (!channelId && channelUrl) {
    channelId = await resolveChannelIdFromUrl(channelUrl);
  }

  if (!channelId) {
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

  const cached = cache.get(channelId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
      }
    });
  }

  const data = await getDarshanPlayerPayload(channelId);
  cache.set(channelId, { data, expiresAt: Date.now() + TTL_MS });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
    }
  });
}
