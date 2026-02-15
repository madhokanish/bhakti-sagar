"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LiveDarshanCard = {
  id: string;
  name: string;
  location: string;
  channelUrl: string;
  channelId?: string;
  thumbnail: string;
  slug: string;
  displayName: string;
};

type PlayerStatus = "live" | "recording" | "latest" | "none";

type PlayerResponse = {
  status: PlayerStatus;
};

const STATUS_ORDER: Record<PlayerStatus, number> = {
  live: 0,
  recording: 1,
  latest: 2,
  none: 3
};

const STATUS_LABEL: Record<PlayerStatus, string> = {
  live: "Live now",
  recording: "Last live recording",
  latest: "Latest video",
  none: "Not live right now"
};

const STATUS_CLASS: Record<PlayerStatus, string> = {
  live: "bg-emerald-100 text-emerald-800",
  recording: "bg-sky-100 text-sky-800",
  latest: "bg-sagar-sand text-sagar-ink",
  none: "bg-slate-100 text-slate-700"
};

export default function LiveDarshanGrid({ mandirs }: { mandirs: LiveDarshanCard[] }) {
  const [statusById, setStatusById] = useState<Record<string, PlayerStatus>>({});

  useEffect(() => {
    let active = true;
    const run = async () => {
      const entries = await Promise.all(
        mandirs.map(async (mandir) => {
          try {
            const query = mandir.channelId
              ? `channelId=${encodeURIComponent(mandir.channelId)}`
              : `channelUrl=${encodeURIComponent(mandir.channelUrl)}`;
            const response = await fetch(`/api/darshan-player?${query}`);
            const payload = (await response.json()) as PlayerResponse;
            return [mandir.slug, payload.status] as const;
          } catch {
            return [mandir.slug, "none"] as const;
          }
        })
      );
      if (!active) return;
      setStatusById(Object.fromEntries(entries));
    };
    void run();
    return () => {
      active = false;
    };
  }, [mandirs]);

  const sorted = useMemo(() => {
    return [...mandirs].sort((a, b) => {
      const aStatus = statusById[a.slug] ?? "none";
      const bStatus = statusById[b.slug] ?? "none";
      return STATUS_ORDER[aStatus] - STATUS_ORDER[bStatus];
    });
  }, [mandirs, statusById]);

  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((mandir) => {
        const status = statusById[mandir.slug] ?? "none";
        return (
          <article
            key={mandir.slug}
            className="overflow-hidden rounded-2xl border border-sagar-amber/20 bg-white/90 shadow-sagar-soft"
          >
            <div className="relative aspect-[16/9]">
              <Image
                src={mandir.thumbnail}
                alt={mandir.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <span
                className={`absolute left-3 top-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${STATUS_CLASS[status]}`}
              >
                {STATUS_LABEL[status]}
              </span>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-serif text-sagar-ink">{mandir.displayName}</h2>
              <p className="mt-1 text-sm text-sagar-ink/70">{mandir.location}</p>
              <Link
                href={`/live/${mandir.slug}`}
                className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-full bg-sagar-saffron px-4 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember"
              >
                View Darshan
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
