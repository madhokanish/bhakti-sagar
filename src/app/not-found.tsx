export default function NotFound() {
  return (
    <div className="container py-20">
      <h1 className="text-4xl font-serif text-sagar-ink">Page not found</h1>
      <p className="mt-4 text-sm text-sagar-ink/70">
        The aarti or page you are looking for is not available yet.
      </p>
      <a href="/" className="mt-6 inline-flex rounded-full bg-sagar-saffron px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white">
        Return Home
      </a>
    </div>
  );
}
