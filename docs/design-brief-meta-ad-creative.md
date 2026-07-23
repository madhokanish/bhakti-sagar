# Design Brief — Meta App Install Ad Creative (BhaktiChat)

## Campaign objective — read this first

This creative is for Meta's **App Promotion / App Installs** campaign objective specifically — not brand awareness, not website traffic, not engagement. Every variant exists to get someone to tap install, right now, on their phone. That constrains the design in a few concrete ways:

- **The creative must read as "this is an app you can get," not just "this is a nice image."** Include a small app icon badge in-frame (bottom corner is standard) on every variant, so the "downloadable app" signal survives even if Meta's own CTA button/overlay gets visually lost against a busy background.
- **CTA button** (set at the ad level in Ads Manager, not baked into the image) will read **"Install Now"** or **"Download"** — design compositions with a clear, uncluttered lower-third/corner where that button can sit in Meta's actual ad unit without covering the image's focal point.
- Don't design these as if they might also get repurposed for a website hero or a brand-awareness post — that's a different job (see the separate website brief, `design-brief-app-promotion.md`). If a composition would work equally well with no CTA at all, it's drifted into brand territory and missed the point of this brief.

## One-line summary

Design 3 ad creative variants for Meta App Install campaigns driving iOS/Android installs. These run in a noisy social feed competing for a half-second glance — different job than the website, which has a visitor's full attention. Treat this as its own design problem, not a resize of the site.

## Goal

Each variant should stop a scroll and communicate one clear emotional/functional hook fast enough to register before someone swipes past, and make it obvious within that glance that tapping leads to an app install — not an article, not a website. All three drive the same single action: install the app.

## The 3 variants

**Variant 1 — Divine Image before/after**
A real selfie/portrait photo next to the AI-generated "photo with [deity]" result from the same person. This is the strongest asset — it's a genuine visual transformation, not a UI screenshot, and it's the one thing about this app that doesn't exist in competitor apps (Bible Chat, CrossTalk). Side-by-side or a wipe/reveal composition both work; designer's call on which reads better per format.

**Variant 2 — Warm chat exchange**
Short video (screen-recording style, 15–30s) or a 2–3 frame still sequence showing a real, warm exchange: someone typing a worry ("kya karu, kuch samajh nahi aa raha") and a guide (Krishna or Shani Dev) responding with grounded, comforting guidance. Sells the emotional value of the product, not a feature tour. Should feel like reading over someone's shoulder, not a product demo.

**Variant 3 — Testimonial graphic**
A simple, quote-forward static graphic using one of the real quotes already live on bhaktichat.com (e.g., *"I come here when my mind spirals. The guidance is simple and practical." — Rohan M., London*). Attribution (first name + city) matters — it's what makes it feel like a real person, not marketing copy. Keep the design restrained: quote is the hero, everything else recedes.

## Assets available

I'll attach: deity portrait art (Krishna, Lakshmi, Shani Dev, Shiv Ji, Hanuman Ji — already used across the app/site), and real screenshots from both the iOS and Android apps. Use these as source material for all three variants — don't source new stock art or illustration; the god portraits already in use are the established visual identity and should stay consistent with what's in the app itself.

## Format specs — design each variant at these sizes

Meta serves ads across Feed, Stories, and Reels, each with different aspect ratios and safe zones. Design for the ratios below, not just one master size stretched to fit:

| Placement | Ratio | Notes |
|---|---|---|
| Feed (image or video) | 1:1 or 4:5 | 4:5 (portrait) takes up more scroll real estate than square — prefer it where the composition allows |
| Stories / Reels | 9:16 (full vertical) | **Safe zone**: keep all critical content (faces, text, logo) within the center ~1080×1420px of a 1080×1920 canvas — top ~250px and bottom ~250px get covered by profile name, caption, and the CTA button Meta overlays automatically |
| Video (Variant 2) | 9:16 primary, 1:1 secondary if time allows | MP4/MOV, first 3 seconds must work with sound off — most feed video plays muted by default, so the hook can't depend on audio alone |

Deliver each variant in both Feed and Stories ratios where feasible — at minimum, Variant 1 and Variant 3 should exist in both; Variant 2 (video) can prioritize 9:16 if time-constrained.

## Brand constraints

Reuse the existing site design tokens (`docs/design-spec-premium-bhaktichat.md`) as the base palette/type — warm parchment tones (`#fff8ef`–`#fff1dd`), display headlines in Cormorant Garamond, body/UI in Manrope — but **push contrast harder than the website would**. A feed ad sitting between two other apps' bright, saturated posts needs more visual weight (stronger color blocks, bolder type scale, higher-contrast text-over-image) than a page a visitor is already reading calmly. This is the one place it's fine to deviate from the site's restrained, low-contrast card treatment — justify any specific deviation but don't feel bound to "quiet and premium" here the way the website brief asked for.

## Copy

Primary text should be in Hinglish, matching the app's actual in-product voice — not corporate English. Reference line: *"Jab mann bhatak jaye, Krishna se baat karo. Free AI guide — Hindu wisdom, real conversations, anytime."* Keep any text overlaid directly on the image/video minimal — a short hook line or the deity's name is enough; let the primary ad copy (separate from the creative) carry the fuller message.

## Compliance constraints — read before designing

Meta's ad policies and the app's own in-product disclaimers both apply here:

- **No prediction/fortune-telling framing.** Never imply the app predicts the future, gives astrology guarantees, or acts as a real deity/priest. The app itself carries this exact disclaimer in-product — the ads can't promise something the product explicitly says it doesn't do.
- **No medical, legal, or financial-advice claims** — same boundary the in-app disclaimer holds to.
- Avoid personalized-health/personal-attribute implications in imagery or copy (a general Meta ad policy area, not specific to this app, but worth designer awareness — e.g., don't imply the ad "knows" something private about the viewer).

## Deliverable checklist

- [ ] Variant 1 (Divine Image before/after) — 4:5 and 9:16
- [ ] Variant 2 (chat exchange) — 9:16 video (+ 1:1 if time allows)
- [ ] Variant 3 (testimonial) — 4:5 and 9:16
- [ ] All exports at Meta's minimum resolution (1080px on the shortest side)
- [ ] Video under file-size/duration limits (keep to 15–30s, standard MP4/H.264)

## Success criteria

A designer or reviewer should be able to look at each variant at actual feed size (not zoomed in) and immediately get the hook within half a second — if it takes explaining, it's failed the format. Test by shrinking the export to thumbnail size and glancing at it from across a room.
