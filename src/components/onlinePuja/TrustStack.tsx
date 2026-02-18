"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onlinePujaTrust, youtubeTrust } from "../../../content/onlinePuja/socialProof";

type YoutubeTrustState = {
  subscribersLabel: string;
  videosLabel: string;
};

type Props = {
  className?: string;
};

export default function TrustStack({ className = "" }: Props) {
  const [youtubeLabels, setYoutubeLabels] = useState<YoutubeTrustState>({
    subscribersLabel: youtubeTrust.subscribersLabel,
    videosLabel: youtubeTrust.videosLabel
  });

  useEffect(() => {
    let isActive = true;

    const loadYoutubeStats = async () => {
      try {
        const response = await fetch("/api/youtube/channel-stats", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as Partial<YoutubeTrustState>;
        if (!isActive || !data.subscribersLabel || !data.videosLabel) return;
        setYoutubeLabels({
          subscribersLabel: data.subscribersLabel,
          videosLabel: data.videosLabel
        });
      } catch {
        // Keep configured fallback values.
      }
    };

    void loadYoutubeStats();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section className={`rounded-3xl border border-sagar-amber/20 bg-white/90 p-4 shadow-sagar-soft md:p-5 ${className}`}>
      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/35 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Rated by devotees</p>
          <p className="mt-2 text-sm font-semibold text-sagar-ink">
            {onlinePujaTrust.ratingLabel} ({onlinePujaTrust.ratingsCountLabel})
          </p>
        </article>
        <article className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/35 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Community trust</p>
          <p className="mt-2 text-sm font-semibold text-sagar-ink">{onlinePujaTrust.devoteesJoinedLabel}</p>
        </article>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {onlinePujaTrust.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-sagar-amber/25 bg-white px-3 py-1 text-xs font-semibold text-sagar-ink/80"
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/35 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Also trusted on YouTube</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-sagar-ink">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF0000]/10 text-[#FF0000]" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
              <path d="M23.5 6.2a3.1 3.1 0 0 0-2.2-2.2C19.3 3.5 12 3.5 12 3.5s-7.3 0-9.3.5A3.1 3.1 0 0 0 .5 6.2 32 32 0 0 0 0 12a32 32 0 0 0 .5 5.8 3.1 3.1 0 0 0 2.2 2.2c2 .5 9.3.5 9.3.5s7.3 0 9.3-.5a3.1 3.1 0 0 0 2.2-2.2A32 32 0 0 0 24 12a32 32 0 0 0-.5-5.8ZM9.6 15.5V8.5L15.9 12l-6.3 3.5Z" />
            </svg>
          </span>
          <span className="font-semibold">BhaktiSagarTV ({youtubeTrust.handle})</span>
          <span className="text-sagar-ink/65">•</span>
          <span>{youtubeLabels.subscribersLabel}</span>
          <span className="text-sagar-ink/65">•</span>
          <span>{youtubeLabels.videosLabel}</span>
          <Link
            href={youtubeTrust.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs font-semibold text-sagar-ember underline underline-offset-2"
          >
            Visit channel
          </Link>
        </div>
      </div>
    </section>
  );
}
