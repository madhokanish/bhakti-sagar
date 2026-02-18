import { NextResponse } from "next/server";
import { youtubeTrust } from "../../../../../content/onlinePuja/socialProof";

type YoutubeStatsPayload = {
  subscribersLabel: string;
  videosLabel: string;
  updatedAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
let cached: { expiresAt: number; payload: YoutubeStatsPayload } | null = null;

function formatCompactCount(value: string) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: numericValue >= 1_000_000 ? 2 : 1
  })
    .format(numericValue)
    .toUpperCase();
}

function getFallbackPayload(): YoutubeStatsPayload {
  return {
    subscribersLabel: youtubeTrust.subscribersLabel,
    videosLabel: youtubeTrust.videosLabel,
    updatedAt: new Date().toISOString()
  };
}

export async function GET() {
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.payload);
  }

  const apiKey = process.env.YT_API_KEY?.trim();
  if (!apiKey) {
    const payload = getFallbackPayload();
    cached = { expiresAt: now + DAY_MS, payload };
    return NextResponse.json(payload);
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=BhaktiSagarTV&key=${apiKey}`,
      { next: { revalidate: 60 * 60 * 24 } }
    );

    if (!response.ok) {
      throw new Error(`YouTube API request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      items?: Array<{ statistics?: { subscriberCount?: string; videoCount?: string } }>;
    };

    const stats = data.items?.[0]?.statistics;
    if (!stats?.subscriberCount || !stats?.videoCount) {
      throw new Error("YouTube API missing statistics payload");
    }

    const payload: YoutubeStatsPayload = {
      subscribersLabel: `${formatCompactCount(stats.subscriberCount)} subscribers`,
      videosLabel: `${formatCompactCount(stats.videoCount)} videos`,
      updatedAt: new Date().toISOString()
    };
    cached = { expiresAt: now + DAY_MS, payload };
    return NextResponse.json(payload);
  } catch {
    const payload = getFallbackPayload();
    cached = { expiresAt: now + DAY_MS, payload };
    return NextResponse.json(payload);
  }
}
