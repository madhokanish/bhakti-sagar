# Hindi Hreflang SEO Verification (`/` and `/hi`)

## URLs covered
- `https://bhaktichat.com/`
- `https://bhaktichat.com/hi`

## What to verify in View Source

### English homepage (`https://bhaktichat.com/`)
Confirm these tags exist in `<head>`:

```html
<link rel="canonical" href="https://bhaktichat.com/">
<link rel="alternate" hreflang="en" href="https://bhaktichat.com/">
<link rel="alternate" hreflang="hi" href="https://bhaktichat.com/hi">
<link rel="alternate" hreflang="hi-IN" href="https://bhaktichat.com/hi">
<link rel="alternate" hreflang="x-default" href="https://bhaktichat.com/">
```

Also verify document language:

```html
<html lang="en">
```

### Hindi homepage (`https://bhaktichat.com/hi`)
Confirm these tags exist in `<head>`:

```html
<link rel="canonical" href="https://bhaktichat.com/hi">
<link rel="alternate" hreflang="en" href="https://bhaktichat.com/">
<link rel="alternate" hreflang="hi" href="https://bhaktichat.com/hi">
<link rel="alternate" hreflang="hi-IN" href="https://bhaktichat.com/hi">
<link rel="alternate" hreflang="x-default" href="https://bhaktichat.com/">
```

Also verify document language:

```html
<html lang="hi">
```

## Sitemap checks
Open:
- `https://bhaktichat.com/sitemap.xml`

Confirm both URLs are present:
- `https://bhaktichat.com/`
- `https://bhaktichat.com/hi`

Confirm each of those entries includes language alternates:
- `en`
- `hi`
- `hi-IN`
- `x-default`

## Robots and indexability checks
- Verify `https://bhaktichat.com/robots.txt` does not disallow `/hi`.
- Verify no `noindex` directive is present on `/hi`.
- Verify canonical is self-referencing on `/hi` (must not point to `/`).

## Google Search Console checks
1. URL Inspection for `https://bhaktichat.com/`.
2. URL Inspection for `https://bhaktichat.com/hi`.
3. Request indexing for both if needed.
4. Submit/re-submit sitemap: `https://bhaktichat.com/sitemap.xml`.
5. Confirm hreflang is recognized and no canonical conflicts appear.

## Lighthouse SEO checks
Run Lighthouse SEO audit for:
- `/`
- `/hi`

Verify no critical internationalization/canonical issues.
