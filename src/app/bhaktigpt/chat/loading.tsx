export default function Loading() {
  return (
    <div className="flex min-h-[70vh] gap-4 p-4" aria-busy="true" aria-live="polite">
      <aside className="hidden w-64 shrink-0 flex-col gap-3 rounded-2xl border border-sagar-amber/20 bg-sagar-cream p-3 md:flex">
        <div className="h-9 w-full animate-pulse rounded-xl bg-sagar-amber/15" />
        <div className="mt-2 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border border-sagar-amber/20 bg-white/80 p-2"
            >
              <div className="h-9 w-9 animate-pulse rounded-lg bg-sagar-amber/15" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse rounded-md bg-sagar-amber/15" />
                <div className="h-2.5 w-1/2 animate-pulse rounded-md bg-sagar-amber/15" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex flex-1 flex-col rounded-2xl border border-sagar-amber/20 bg-sagar-cream p-4">
        <div className="space-y-4">
          <div className="flex justify-start">
            <div className="h-16 w-3/4 max-w-md animate-pulse rounded-2xl bg-sagar-amber/15" />
          </div>
          <div className="flex justify-end">
            <div className="h-12 w-2/3 max-w-sm animate-pulse rounded-2xl bg-sagar-amber/15" />
          </div>
          <div className="flex justify-start">
            <div className="h-20 w-3/4 max-w-md animate-pulse rounded-2xl bg-sagar-amber/15" />
          </div>
        </div>
        <div className="mt-auto pt-4">
          <div className="h-12 w-full animate-pulse rounded-2xl border border-sagar-amber/20 bg-white/80" />
        </div>
      </section>
      <span className="sr-only">Loading chat…</span>
    </div>
  );
}
