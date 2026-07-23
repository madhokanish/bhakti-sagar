export default function Loading() {
  return (
    <div className="container py-12" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="h-3 w-32 animate-pulse rounded-full bg-sagar-amber/15" />
          <div className="mt-3 h-8 w-64 animate-pulse rounded-lg bg-sagar-amber/15" />
          <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-sagar-amber/15" />
        </div>
        <div className="h-10 w-full max-w-md animate-pulse rounded-full border border-sagar-amber/20 bg-sagar-amber/15" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-sagar-amber/20 bg-white/80 p-5 shadow-sagar-card"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 animate-pulse rounded-full bg-sagar-amber/15" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-sagar-amber/15" />
            </div>
            <div className="mt-4 h-32 w-full animate-pulse rounded-xl bg-sagar-amber/15" />
            <div className="mt-4 h-5 w-3/4 animate-pulse rounded-md bg-sagar-amber/15" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-md bg-sagar-amber/15" />
            <div className="mt-2 h-3 w-5/6 animate-pulse rounded-md bg-sagar-amber/15" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading aartis…</span>
    </div>
  );
}
