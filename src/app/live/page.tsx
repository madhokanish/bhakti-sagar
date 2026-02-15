import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getLiveMandirs } from "@/data/liveMandirs";
import LiveDarshanGrid from "@/components/LiveDarshanGrid";
import { resolveLiveMandirs } from "@/lib/liveDarshan";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Live Darshan",
    description:
      "Watch live darshan from temples, catch the latest completed livestreams, and continue devotion from anywhere.",
    pathname: "/live"
  })
};

export default async function LiveDarshanPage() {
  const mandirs = await resolveLiveMandirs(getLiveMandirs());

  return (
    <div className="container py-6 md:py-8">
      <section className="rounded-3xl border border-sagar-amber/25 bg-white/85 p-5 shadow-sagar-soft md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Live Darshan</p>
        <h1 className="mt-2 text-4xl font-serif leading-tight text-sagar-ink md:text-5xl">
          Darshan from mandirs, live and on demand
        </h1>
        <p className="mt-3 max-w-3xl text-base text-sagar-ink/75">
          We automatically show current live stream first. If a mandir is not live, we show the
          last livestream recording, then the latest regular upload.
        </p>
      </section>
      <LiveDarshanGrid mandirs={mandirs} />
    </div>
  );
}
