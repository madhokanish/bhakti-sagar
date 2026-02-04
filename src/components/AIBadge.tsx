export default function AIBadge({ label = "AI Powered" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-sagar-saffron/40 bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sagar-saffron shadow-sagar-soft">
      <span className="relative flex h-4 w-4 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-sagar-saffron/20 blur-[2px]" />
        <svg viewBox="0 0 24 24" aria-hidden="true" className="relative h-3.5 w-3.5 text-sagar-saffron">
          <path
            d="M12 2l3.8 6.2L22 12l-6.2 3.8L12 22l-3.8-6.2L2 12l6.2-3.8L12 2z"
            fill="currentColor"
          />
        </svg>
      </span>
      {label}
    </span>
  );
}
