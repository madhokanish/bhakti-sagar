export default function Footer() {
  return (
    <footer className="mt-16 border-t border-sagar-amber/20 bg-sagar-cream/70">
      <div className="container flex flex-col gap-6 py-10 text-sm text-sagar-ink/70 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-serif text-lg text-sagar-ink">Bhakti Sagar</p>
          <p className="max-w-md">A calm space for aarti, bhajan, and devotion. Built for daily prayer and remembrance.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">
          <a href="/about" className="hover:text-sagar-saffron">About</a>
          <a href="/contact" className="hover:text-sagar-saffron">Contact</a>
          <a href="/privacy" className="hover:text-sagar-saffron">Privacy</a>
          <a href="/terms" className="hover:text-sagar-saffron">Terms</a>
          <a href="/editorial-policy" className="hover:text-sagar-saffron">Editorial</a>
          <a href="/sources" className="hover:text-sagar-saffron">Sources</a>
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-sagar-rose">
          Shanti · Bhakti · Smaran
        </div>
      </div>
    </footer>
  );
}
