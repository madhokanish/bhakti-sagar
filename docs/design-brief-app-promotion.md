# Design Brief — Promote the iOS & Android Apps on bhaktichat.com

## One-line summary

BhaktiChat now has real native iOS and Android apps (both just went through App Store / Play Store submission), but bhaktichat.com currently has **zero mention of them anywhere** — no download badges, no app screenshots, no smart-app-banner tag. This brief covers designing the elements needed to fix that, without disrupting the site's existing "Temple Editorial Light" visual identity.

## Background / why this matters

The website was built and has grown as a web-chat product in its own right. The native apps are a newer, separate initiative that shipped without ever being cross-promoted back to the site that drives most of the traffic. Every visitor to bhaktichat.com today is a missed app-install opportunity.

## Current state (verified directly, July 2026)

- Hero: "If you could speak to God, what would you ask?" + Krishna/Arjuna illustration, no app mention.
- Below the hero: featured guides (Krishna, Lakshmi, Shani Dev), trust badges ("Private & Secure," "Safe Space for Reflection"), a stats bar (4.83 rating / 2,500+ users / 10,000+ sessions / 25+ countries), testimonials with city attribution, and links to "deity knowledge hubs."
- Checked the page source directly: no `apps.apple.com` or `play.google.com` links anywhere, no `apple-itunes-app` meta tag (the iOS Safari Smart App Banner).
- The existing stats bar reports *web/product* usage, not app-store-specific ratings — there's no "X★ on the App Store" type signal anywhere.

## Competitive reference

Looked at two live competitor sites in the same category (AI + faith companion apps) for how they handle this. Use these as inspiration, not templates to copy verbatim — BhaktiChat's tone is warmer/devotional vs. their more corporate-Christian tone, and the visual system should stay inside the existing token set (below).

**CrossTalk (formerly biblechat.ai)** — the simple, direct approach:
- Two large, official "Download on the App Store" / "Get it on Google Play" badge buttons placed immediately below the hero headline, above the fold, no scrolling required.
- iOS Smart App Banner meta tag present (`apple-itunes-app`) — native Safari "Open in App Store" strip.
- A phone-frame mockup lower on the page showing the actual chat UI in use (not abstract art).

**Bible Chat (thebiblechat.com)** — the sophisticated funnel approach:
- Hero leads with an app-store-rating trust badge: gold stars, "4.9/5 based on 300,000+ App Reviews," laurel-wreath graphic, front and center.
- The primary CTA ("Get started") does **not** link straight to the app stores — it routes into a separate quiz/personalization funnel ("Let's build your personal walk with God" → pick an avatar → a few questions → tailored plan → then the download prompt).
- Real testimonials pulled from App Store reviews, each with name, date, and "Source: App Store" attribution, with the most persuasive phrase bolded inline.
- A phone-mockup screenshot of the actual app UI, positioned right after the testimonials.

**Takeaway for this brief:** borrow the *rating badge* and *real-screenshot-mockup* ideas from both, and the *direct, no-friction badges* from CrossTalk. The quiz-funnel is a legitimate long-term growth idea but is out of scope for this round — BhaktiChat's apps are brand new with no review history yet, so a personalization funnel has nothing to personalize toward yet.

## What to design

1. **Hero-adjacent download CTA.** Two official app store badges (Apple's and Google's official badge assets — do not create custom-styled substitutes, both platforms have brand guidelines for these) placed near the existing hero CTA, sized and spaced to sit comfortably within the current hero without competing with the headline. Needs a mobile-stacked and desktop-inline arrangement.

2. **Persistent secondary placement.** The same two badges repeated in the footer, so the ask is available no matter how far someone scrolls without needing a second dedicated section.

3. **Real-device app screenshot mockup.** A phone-frame (or two, one iOS one Android, or a single representative frame) showing actual chat UI — not stock/illustrated art. I have real screenshots captured from both apps during testing that can be supplied as source images; design should build a frame treatment (device bezel, shadow/glow consistent with the site's warm palette) that these can drop into. Placement: after the featured-guides section, before or alongside testimonials — should feel like proof, not decoration.

4. **App-store rating badge component** (build now, populate later). A compact stat unit in the same visual language as the existing stats bar (4.83 / 2,500+ users / etc.) but sourcing "X★ App Store · X★ Google Play" once real store ratings exist. Design it now as an available slot even though it may show placeholder/pending state at launch (app is brand new, no reviews yet).

5. **iOS Smart App Banner** — this is a one-line meta tag, not a visual design task, but flag it so engineering doesn't forget it alongside the visual work: `<meta name="apple-itunes-app" content="app-id=...">`.

## Brand constraints — reuse the existing design system

Do not invent a new visual language. Everything above must read as a native extension of the site's current "Temple Editorial Light" spec (`docs/design-spec-premium-bhaktichat.md`):

- **Color tokens:** `--bg-start: #fff8ef`, `--bg-end: #fff2df`, `--surface: #fffdf9`, `--surface-soft: #fff6e8`, `--surface-strong: #fff1dd`, `--text-main: #2d1608`, `--text-muted: #7a5a45`, `--border-soft: rgba(170,117,80,0.24)`, `--ring: rgba(212,85,37,0.4)`.
- **Typography:** Display headlines in Cormorant Garamond, UI/body copy in Manrope, Devanagari text in Noto Sans Devanagari where applicable.
- **Component rules:** 16–18px card radii, subtle borders, low-contrast shadows, restrained hover lift (matches existing card treatment already used for guide cards / testimonials).
- **Motion:** ~150–200ms transitions, respect `prefers-reduced-motion`, use the existing `page-reveal` fade-up entry pattern for consistency with how other sections animate in.
- Warm parchment surfaces, not stark white — the phone-mockup frame and badge placements should sit on the existing warm background, not break into a contrasting block unless there's a strong reason to (e.g., a deliberately darker "download" band, if that reads better — designer's call, but justify the deviation if proposed).

## Content / assets available

- Real iOS and Android app screenshots (already captured, can be supplied) — Home, Bhakti Chat hub, Explore, Divine Image screens all available.
- Existing guide portrait art (Krishna, Lakshmi, Shani Dev, Shiv Ji, Hanuman Ji) already used elsewhere on the site — reusable in any composition.
- Official badge assets: use Apple's and Google's official "Download on the App Store" / "Get it on Google Play" SVG/PNG badges, sourced from their official brand asset pages — not recreated from scratch.

## Success criteria

- A visitor to bhaktichat.com on any device can find and tap a real app-store download link within one scroll of landing on the page.
- An iPhone Safari visitor sees the native "Open in App Store" banner automatically.
- The new elements are indistinguishable in visual quality/tone from the existing site — no jarring "bolted-on" feeling.
- Nothing here requires the existing hero copy, featured guides, or testimonial content to be rewritten or removed — this is additive.

## Out of scope for this brief

- The quiz/personalization funnel (Bible Chat's approach) — a legitimate future idea, not now.
- Expanding the SEO content library ("deity knowledge hubs") to match Bible Chat's 2,000+ article scale — separate content-strategy initiative, not a design task.
- Any redesign of the existing hero, featured-guides, or testimonials sections beyond making room for the additions above.
