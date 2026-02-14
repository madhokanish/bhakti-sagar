"use client";

import { useEffect, useMemo, useState } from "react";

type PlayerStatus = "live" | "recording" | "latest" | "none";

type PlayerResponse = {
  status: PlayerStatus;
  videoId: string | null;
  embedUrl: string | null;
  title: string | null;
  publishedAt: string | null;
};

const LABEL_BY_STATUS: Record<PlayerStatus, string> = {
  live: "Live now",
  recording: "Last live recording",
  latest: "Latest video",
  none: "Not live right now"
};

const TONE_BY_STATUS: Record<PlayerStatus, string> = {
  live: "bg-emerald-100 text-emerald-800",
  recording: "bg-sky-100 text-sky-800",
  latest: "bg-sagar-sand text-sagar-ink",
  none: "bg-slate-100 text-slate-700"
};

export default function DarshanPlayer({
  channelId,
  channelUrl
}: {
  channelId: string | null;
  channelUrl?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlayerResponse | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const loadPlayer = async () => {
      try {
        const query = channelId
          ? `channelId=${encodeURIComponent(channelId)}`
          : `channelUrl=${encodeURIComponent(channelUrl ?? "")}`;
        const response = await fetch(`/api/darshan-player?${query}`);
        if (!response.ok) {
          throw new Error("Failed to fetch player.");
        }
        const payload = (await response.json()) as PlayerResponse;
        if (!active) return;
        setData(payload);
        setError(null);
      } catch {
        if (!active) return;
        setError("Unable to load darshan right now.");
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    void loadPlayer();
    timer = setInterval(loadPlayer, 60_000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [channelId, channelUrl]);

  const status = useMemo<PlayerStatus>(() => data?.status ?? "none", [data?.status]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-sagar-amber/25 bg-white p-4 shadow-sagar-soft">
        <div className="h-5 w-28 animate-pulse rounded-full bg-sagar-cream" />
        <div className="mt-3 aspect-video w-full animate-pulse rounded-2xl bg-sagar-cream" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-sagar-amber/25 bg-white p-4 text-sm text-sagar-rose shadow-sagar-soft">
        {error}
      </div>
    );
  }

  if (!data?.embedUrl) {
    return (
      <div className="rounded-3xl border border-sagar-amber/25 bg-white p-4 shadow-sagar-soft">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${TONE_BY_STATUS[status]}`}
        >
          {LABEL_BY_STATUS[status]}
        </span>
        <p className="mt-3 text-sm text-sagar-ink/75">
          No stream available right now. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-sagar-amber/25 bg-white p-4 shadow-sagar-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${TONE_BY_STATUS[status]}`}
        >
          {LABEL_BY_STATUS[status]}
        </span>
        {data.publishedAt ? (
          <span className="text-xs text-sagar-ink/60">
            {new Intl.DateTimeFormat("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit"
            }).format(new Date(data.publishedAt))}
          </span>
        ) : null}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-sagar-amber/20">
        <iframe
          src={data.embedUrl}
          title={data.title ?? "Live darshan player"}
          loading="lazy"
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      {data.title ? <p className="mt-3 text-sm text-sagar-ink/80">{data.title}</p> : null}
    </div>
  );
}
