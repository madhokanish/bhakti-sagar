# Design Brief — Google Display Ad Creative (BhaktiChat)

## Campaign objective — read this first

This creative feeds a Google Ads **Display / app-install asset group** (the "Ad assets" step you're on — headlines, descriptions, images, videos, HTML5). Google doesn't run one fixed ad; it auto-combines whatever images/headlines/descriptions you upload into dozens of responsive banner shapes and serves them across the Display Network — other people's websites, apps, Gmail, YouTube. That's a fundamentally different environment than Meta's feed:

- **The banner has to work sitting inside someone else's page**, next to their content, often small, often just glimpsed. It's not a full-screen moment — treat every image asset as if it might render at 300×250 in the corner of a news article.
- **Google's algorithm — not you — decides which headline pairs with which image.** Design each image so it stands alone and makes sense with *any* of your 5 headlines, not just the one you had in mind when designing it. Don't bake a specific headline into the image as a caption; leave clear negative space instead (see safe zones below).
- Every image needs to read as "an app you can get" within a glance — include a small app icon in-frame (corner badge, consistent placement across all images) so the install intent survives even in the smallest ad slot Google renders it into.
- This is the **image asset** input for a responsive format, not a single hand-designed banner — think "a system that generates banners," not "a banner."

## One-line summary

Design a set of Display-ready images (landscape + square, at minimum) for BhaktiChat's Google Ads app-install asset group. These render small, inside other sites' pages, often unattended by the viewer — the opposite of Meta's full-attention feed scroll. Design for glanceability at thumbnail size, not for a large canvas.

## Required image specs — Google's Responsive Display asset slots

Google auto-generates banner combinations from whatever you upload against these slots. Cover all of them — missing a slot (especially Square) silently loses you inventory, since some placements only accept specific ratios.

| Asset | Ratio | Minimum | Recommended | Notes |
|---|---|---|---|---|
| **Landscape image** | 1.91:1 | 600 × 314 | 1200 × 628 | The most common slot — design this first, it's the workhorse |
| **Square image** | 1:1 | 300 × 300 | 1200 × 1200 | Same visual system as landscape, recomposed — not a stretched crop |
| **Portrait image** (optional but recommended) | 4:5 | 480 × 600 | 960 × 1200 | Newer slot, unlocks more mobile/in-app inventory |
| **Square logo** | 1:1 | 128 × 128 | 1200 × 1200 | Just the BhaktiChat app icon/mark on a clean/transparent background — no scene, no photo |
| **Landscape logo** | 4:1 | 512 × 128 | 1200 × 300 | Wordmark + icon, same clean-background treatment |

Upload at least 3 images per ratio (landscape, square) so Google's combination engine has variety to test — a single image per slot limits its ability to find a winning pairing.

## The images — same visual system as the Meta brief, adapted for small-scale legibility

Reuse the god portrait art and real app screenshots (Divine Image results, chat screen) already established as BhaktiChat's visual identity — don't source new stock art. But where the Meta brief could rely on a large, full-attention canvas, these need to hold up at 300×250:

1. **Divine Image before/after (primary image)** — the same-person selfie → AI deity-portrait transformation. Simplify the composition versus the Meta version: at banner scale, a busy side-by-side reads as clutter. A clean vertical or horizontal split with generous margin around both faces works better than an artistic diagonal wipe.
2. **Single deity portrait + app icon badge** — one strong deity portrait (Krishna, Lakshmi, or Shiv Ji — whichever tests best) with the BhaktiChat icon in the corner and generous empty space for Google to place the headline/CTA overlay it auto-generates. This is the safest, most legible option at the smallest render sizes.
3. **Screenshot-forward** — a real chat screen or Divine Image result, cropped tight to remove chrome/status bar clutter, so the app's actual UI reads as "real product" rather than an illustration.

Keep each image's focal point (the face, the app icon) inside the **center 80%** of the frame — Google's own headline/CTA overlays and cropping for odd inventory slots tend to clip the outer edges first.

## Copy — headlines and descriptions

Matches the in-product Hinglish voice, not corporate English. Google gives you up to 5 headlines (30 characters) and 5 descriptions (90 characters) — write distinct ones, not minor rewordings, since Google's combination testing benefits from real variety:

**Headlines (≤30 chars each):**
- Chat with Krishna Ji
- Ask Lakshmi Ji Anything
- Hindu AI Guide, Free
- Baat Karo Shri Krishna Se
- Apna Divine Image Banao

**Descriptions (≤90 chars each):**
- Jab mann bhatak jaye, Krishna se baat karo — free AI guide, real conversations, anytime.
- Turn your photo into a sacred darshan with your favorite deity. Free to try.
- Guidance on money, career, aur rishtे — Hindu wisdom, no waiting, no priest.

Treat the suggested headlines/descriptions Google's own tool proposes in that Ad assets screen as reference points, not the final copy — they're generic and don't carry BhaktiChat's Hinglish voice; swap in the lines above (or close variants) instead.

## Brand constraints

Reuse `docs/design-spec-premium-bhaktichat.md` tokens — warm parchment (`#fff8ef`–`#fff1dd`), Cormorant Garamond for any display type baked into an image, Manrope for anything smaller/functional. Like the Meta brief, push contrast harder than the website's restrained card treatment — a banner competing against a busy news page or app UI needs more visual weight than a page a visitor is calmly reading. Unlike Meta, keep text minimal-to-none baked into the image itself (see safe-zone note above) since Google's auto-generated headline overlay will sit on top of it — a portrait/scene with generous clear space, not a fully composed poster.

## Compliance constraints — same as Meta, plus Google-specific

- **No prediction/fortune-telling framing** — never imply the app predicts the future or replaces a real priest/deity. The in-product disclaimer holds here too.
- **No medical, legal, or financial-advice claims.**
- **Google Ads policy specifics to watch**: no "clickbait" arrows/fake UI elements (fake close buttons, fake progress bars) drawn into the creative — Google's policy team flags these more aggressively than Meta's. Keep any app-UI screenshots genuinely reflecting the real app, not a mocked-up exaggeration.
- Logo assets must be clean app-icon/wordmark only — no photography, no deity imagery in the logo slot.

## Deliverable checklist

- [ ] Landscape image (1200×628) — at least 3 variants
- [ ] Square image (1200×1200) — at least 3 variants, recomposed (not cropped/stretched from landscape)
- [ ] Portrait image (960×1200) — at least 1 variant, if time allows
- [ ] Square logo (1200×1200) — icon only, clean background
- [ ] Landscape logo (1200×300) — icon + wordmark, clean background
- [ ] 5 headlines (≤30 chars), 5 descriptions (≤90 chars) — see copy section above

## Success criteria

Shrink each image to actual thumbnail size (roughly a postage stamp on your screen) and glance at it from across the room — if the deity, the app icon, and the "this is an app" signal don't register instantly, it's failed the format. This is a stricter bar than the Meta brief's "half-second scroll test," since Display banners are often seen peripherally, not scrolled past head-on.
