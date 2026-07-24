# Design Brief — App Store Screenshots (iOS)

## Objective
Turn the 4 raw iPhone captures of BhaktiChat into polished, on-brand App Store
"marketed" screenshots that sell the app at a glance. These appear on the product page
and — critically — the **first 3** appear on the install sheet, so they must communicate
the core value instantly, even at thumbnail size.

Pairs with `design-spec-premium-bhaktichat.md` (source of truth for colour/type tokens).

## Hard specs (non-negotiable)
- **Canvas size:** **1284 × 2778 px** (portrait, 6.5"/6.9" class). This single size is
  accepted by App Store Connect and auto-scales to smaller devices. (1242 × 2688 also valid
  if the tool defaults to it — pick one and use it for ALL screenshots so they're uniform.)
- **Format:** PNG or high-quality JPEG, RGB, no transparency, no rounded corners on the
  outer canvas (full-bleed rectangle).
- **Count/order:** deliver all 5 slots below in this exact order (screenshot 1 = leftmost /
  install-sheet hero). Minimum 3; we're providing more for a richer page.
- **No status-bar clutter:** clean the captures first — set a full battery, full signal,
  hide the debug Dynamic Island blob. (Use a clean simulator capture, or mask the notch area
  with the device frame.)

## Brand tokens (use these exact values)
| Token | Hex | Use |
|---|---|---|
| Cream background | `#FFFBF4` | canvas base |
| Warm saffron | `#FB923C` → `#EA580C` | gradient accents, glow |
| Deep accent | `#C2410C` | small emphasis, underlines |
| Gold | `#FBBF24` | sparkle/diya accents (sparingly) |
| Ink (headline) | `#2A1C15` | caption headline text |
| Warm grey (subtext) | `#8A6F5C` | caption sub-line |
| Card white | `#FFFFFF` | device drop-shadow base |

**Type:** headline in a warm humanist serif or the app's display font, **bold, 2 lines max**,
~64–76 px. Sub-line sans-serif, ~34–40 px, warm grey. Left-aligned or centred — but the same
choice across all 5.

## Layout template (identical on every screenshot)
```
┌─────────────────────────────┐  1284 × 2778
│      [ warm cream→saffron    │
│        gradient background,  │
│        subtle radial glow    │
│        top-centre, faint     │
│        lotus/diya motif ]    │
│                              │
│   HEADLINE (2 lines, ink)    │  ← top ~16–22% of canvas
│   sub-line (warm grey)       │
│                              │
│      ┌───────────────┐       │
│      │               │       │
│      │  screenshot    │       │  ← device in a clean rounded
│      │  inside iPhone │       │     iPhone frame, centred,
│      │  frame, soft   │       │     ~66–72% of canvas height,
│      │  drop shadow   │       │     with a soft warm shadow
│      │               │       │
│      └───────────────┘       │
│                              │  ← ~6% breathing room at bottom
└─────────────────────────────┘
```
- Keep a consistent **~90 px side margin** and identical device size/position on all 5 so
  they read as a set when swiped.
- Device frame: a neutral titanium/black iPhone 15/16 Pro frame is fine; or a clean
  bezel-less rounded-rect (28 px corner radius) with a 1px warm border if you prefer frameless.
- Background: cream `#FFFBF4` base with a soft top-centre radial glow in saffron at ~12%
  opacity; optional faint gold sparkle/lotus line-art at low opacity — never busy.

## The 5 screenshots — source, headline, sub-line

**1 — Guide hub (HERO / install sheet)**
Source: the "What would you like to ask Shri Krishna?" screen (guide row + starter prompts).
- Headline: **"Your deities, ready to talk"**
- Sub: "Krishna, Lakshmi Ji, Shiv Ji, Hanuman Ji & Shani Dev"
- Why first: instantly shows *what the app is* — multiple named deities you can chat with.

**2 — Chat conversation**
Source: the Shri Krishna chat thread (the warm Hinglish reply "Jaise main tumhare paas…").
- Headline: **"Guidance that feels like home"**
- Sub: "Talk naturally — in Hindi, English or Hinglish"
- Note: this shows the real conversational warmth + the phone-call (voice) icon — a plus.

**3 — Divine Image**
Source: the Explore "Divine Image — Turn your photo into a sacred darshan" featured card.
- Headline: **"Turn your photo into a sacred darshan"**
- Sub: "A beautiful, shareable keepsake in seconds"

**4 — Life situations / Home**
Source: the Home screen (Daily Darshan streak + Life Situations grid).
- Headline: **"Help for money, anxiety, fear & more"**
- Sub: "Compassionate guidance for everyday life"

**5 — Explore services**
Source: the Explore services list (Aartis, Choghadiya, Festivals, Panchang).
- Headline: **"Aartis, Choghadiya & Panchang too"**
- Sub: "30+ aartis, daily timings, festivals & vrat"

## Copy rules
- Headlines ≤ 5 words where possible; must be legible at thumbnail size.
- No claims the app doesn't do; no "predict/fortune" language (matches in-app disclaimer and
  avoids re-triggering review scrutiny).
- Keep deity names spelled exactly as in-app (Shri Krishna, Lakshmi Ji, Shiv Ji, Hanuman Ji,
  Shani Dev).

## Apple do's & don'ts
- **Do** show only real app UI (these are genuine captures — good).
- **Don't** add fake device chrome that misrepresents the OS, pricing, or "Editor's Choice"
  style badges, or reference other platforms.
- **Don't** cover essential UI with captions — headline sits *above* the device, not over it.
- Keep text well inside the frame (Apple crops edges on some surfaces).

## Production options (pick one)
1. **Figma (recommended):** one 1284×2778 frame per screenshot, a shared component for
   background + caption + device frame; drop each capture into the device mockup. Export @1x.
   Free device frames: Apple "Design Resources" or the "Mockuuups/Angle" style kits.
2. **Canva:** "App Store screenshot" template at 1284×2778; same layout, place captures in a
   phone frame element.
3. **AI image tool:** feed each raw capture + this brief's per-screenshot headline and the
   colour tokens; instruct "place the provided screenshot unaltered inside an iPhone frame on
   a cream #FFFBF4 background with a soft saffron top glow; add the headline above in bold ink
   #2A1C15." Verify the tool does NOT redraw/alter the actual screenshot content.

## Deliverables checklist
- [ ] 5 PNGs, all exactly 1284 × 2778, same background/frame/margins
- [ ] First 3 read clearly as thumbnails
- [ ] Status bar cleaned (full battery/signal, no debug blob)
- [ ] Uploaded to App Store Connect → iPhone 6.5" slot (you already have 3; replace/extend to 5)
