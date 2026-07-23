"use client";

import Link from "next/link";
import { useBookmarks } from "@/lib/bookmarks";

export default function SavedPage() {
  const { bookmarks, toggleAarti, toggleMessage } = useBookmarks();

  const hasAny = bookmarks.aartis.length > 0 || bookmarks.messages.length > 0;

  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/60">Saved</p>
        <h1 className="mt-1 text-2xl font-bold text-sagar-ink">Your bookmarks</h1>
        <p className="mt-1 text-sm text-sagar-ink/70">
          Saved messages and aartis are stored on this device.
        </p>
      </div>

      {!hasAny ? (
        <div className="rounded-2xl border border-sagar-amber/25 bg-white p-6 text-sm text-sagar-ink/70 shadow-[0_20px_50px_-36px_rgba(46,22,10,0.6)]">
          You haven&apos;t saved anything yet. Bookmark messages in chat or aartis from their pages.
        </div>
      ) : null}

      {bookmarks.aartis.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-sagar-ink">Aartis</h2>
          <ul className="space-y-2">
            {bookmarks.aartis.map((slug) => (
              <li
                key={slug}
                className="flex items-center justify-between rounded-2xl border border-sagar-amber/25 bg-white px-4 py-3 shadow-[0_10px_30px_-26px_rgba(46,22,10,0.5)]"
              >
                <Link
                  href={`/en/aartis/${slug}`}
                  className="text-sm font-medium text-sagar-ink hover:text-sagar-ember"
                >
                  {slug}
                </Link>
                <button
                  type="button"
                  onClick={() => toggleAarti(slug)}
                  className="rounded-full border border-sagar-amber/30 px-3 py-1 text-xs font-semibold text-sagar-ink/70 hover:text-sagar-ember"
                  aria-label={`Remove ${slug}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bookmarks.messages.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-sagar-ink">Messages</h2>
          <ul className="space-y-2">
            {bookmarks.messages.map((id) => (
              <li
                key={id}
                className="flex items-center justify-between rounded-2xl border border-sagar-amber/25 bg-white px-4 py-3 shadow-[0_10px_30px_-26px_rgba(46,22,10,0.5)]"
              >
                <span className="truncate text-sm text-sagar-ink/80" title={id}>
                  Message {id.slice(0, 8)}…
                </span>
                <button
                  type="button"
                  onClick={() => toggleMessage(id)}
                  className="rounded-full border border-sagar-amber/30 px-3 py-1 text-xs font-semibold text-sagar-ink/70 hover:text-sagar-ember"
                  aria-label={`Remove ${id}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
