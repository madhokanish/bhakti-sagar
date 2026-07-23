# BhaktiChat Premium Frontend Spec

## Direction
Temple Editorial Light

- Mood: devotional, calm, premium, modern.
- Visual principle: warm parchment surfaces with disciplined typography and subtle depth.
- Interaction principle: predictable, smooth, low-noise transitions.

## Typography

- Display: `Cormorant Garamond` (`--font-display`)
- Body/UI: `Manrope` (`--font-body`)
- Hindi support: `Noto Sans Devanagari`

Usage rules:

- Headlines and section titles use display weight (500-700).
- UI chrome, controls, and body copy use body font.
- Devanagari mode applies Noto class only where language is Hindi.

## Color Tokens

Global tokens in `src/app/globals.css`:

- `--bg-start: #fff8ef`
- `--bg-end: #fff2df`
- `--surface: #fffdf9`
- `--surface-soft: #fff6e8`
- `--surface-strong: #fff1dd`
- `--text-main: #2d1608`
- `--text-muted: #7a5a45`
- `--border-soft: rgba(170, 117, 80, 0.24)`
- `--ring: rgba(212, 85, 37, 0.4)`

Chat token surface in `BhaktiGptChatClient` follows the same warm palette.

## Component Rules

- Navigation: translucent light surface, centered pill navigation, clear elevation on scroll.
- Hero: atmospheric radial glow layers, stronger typography rhythm, preserved content hierarchy.
- Cards: 16-18px radii, subtle borders, low-contrast shadows, restrained hover lift.
- Footer: simplified brand lockup, cleaner link hierarchy, warm translucent background.
- Chat:
  - Fixed hierarchy remains (header/messages/composer).
  - Assistant and user bubbles stay visually distinct with readable line-height.
  - Controls share consistent radius, border, and elevation treatment.

## Motion and Accessibility

- Default transitions: ~150-200ms for color/opacity/transform.
- Global reveal class: `page-reveal` (`fade-up`) for entry polish.
- Reduced motion: all animations/transitions are effectively disabled under `prefers-reduced-motion`.
- Focus visibility: global `:focus-visible` ring uses `--ring`.
- Contrast: warm backgrounds with dark devotional ink text.

## Performance Notes

- Fonts are loaded with `next/font/google` and `display: swap`.
- No new UI libraries added.
- Visual treatment uses CSS gradients and simple shadows, avoiding heavy runtime effects.
