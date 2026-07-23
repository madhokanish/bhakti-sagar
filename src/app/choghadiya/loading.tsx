export default function Loading() {
  return (
    <div className="container py-12" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded-full bg-sagar-amber/15" />
        <div className="h-9 w-72 animate-pulse rounded-lg bg-sagar-amber/15" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-sagar-amber/15" />
      </div>

      <div className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-card">
        <div className="h-3 w-28 animate-pulse rounded-full bg-sagar-amber/15" />
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-7 w-40 animate-pulse rounded-md bg-sagar-amber/15" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-sagar-amber/15" />
          </div>
          <div className="h-14 w-14 animate-pulse rounded-full bg-sagar-amber/15" />
        </div>
        <div className="mt-4 h-3 w-3/4 animate-pulse rounded-full bg-sagar-amber/15" />
      </div>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-2xl border border-sagar-amber/20 bg-white/80 px-5 py-4 shadow-sagar-soft"
          >
            <div className="h-4 w-20 animate-pulse rounded-md bg-sagar-amber/15" />
            <div className="h-4 flex-1 animate-pulse rounded-md bg-sagar-amber/15" />
            <div className="h-4 w-16 animate-pulse rounded-md bg-sagar-amber/15" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading Choghadiya…</span>
    </div>
  );
}
