export default function Loading() {
  return (
    <div className="container py-12" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded-full bg-sagar-amber/15" />
        <div className="h-9 w-72 animate-pulse rounded-lg bg-sagar-amber/15" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-sagar-amber/15" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-sagar-amber/20 bg-white/80 p-5 shadow-sagar-card"
          >
            <div className="h-3 w-24 animate-pulse rounded-full bg-sagar-amber/15" />
            <div className="mt-4 h-28 w-full animate-pulse rounded-xl bg-sagar-amber/15" />
            <div className="mt-4 h-5 w-3/4 animate-pulse rounded-md bg-sagar-amber/15" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-md bg-sagar-amber/15" />
            <div className="mt-2 h-3 w-5/6 animate-pulse rounded-md bg-sagar-amber/15" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading mantras…</span>
    </div>
  );
}
