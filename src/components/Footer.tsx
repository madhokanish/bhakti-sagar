export default function Footer() {
  return (
    <footer className="mt-16 border-t border-sagar-amber/20 bg-sagar-cream/70">
      <div className="container flex flex-col gap-4 py-10 text-sm text-sagar-ink/70 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-serif text-lg text-sagar-ink">Bhakti Sagar</p>
          <p className="max-w-md">A calm space for aarti, bhajan, and devotion. Built for daily prayer and remembrance.</p>
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-sagar-rose">
          Shanti · Bhakti · Smaran
        </div>
      </div>
    </footer>
  );
}
