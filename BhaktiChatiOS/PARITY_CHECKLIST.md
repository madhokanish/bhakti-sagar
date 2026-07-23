# Android -> iOS Parity Checklist

## Top-level tabs
- [x] Home
- [x] Bhakti Chat
- [x] Explore (was "Divine Image" — restructured to match Android's 4-tab IA)
- [x] History

## Routes
- [x] Home
- [x] Home Explore
- [x] Thread route with `threadId`
- [x] Explore (Divine Image / Aartis / Choghadiya / Festivals / Panchang hub)
- [x] Divine Image Create
- [x] Divine Image Result
- [x] Guide Picker
- [x] Guide Profile
- [x] Aartis
- [x] Aarti Detail
- [x] Choghadiya
- [x] Festivals
- [x] Panchang
- [x] Profile

## Data / persistence
- [x] Threads repository parity
- [x] Messages repository parity
- [x] Conversation ID/state anchor parity
- [x] Saved Aartis parity
- [x] CoreData persistence migration baseline

## Backend parity
- [x] `/api/bhaktigpt/chat` GET
- [x] `/api/bhaktigpt/chat` POST stream
- [x] `/api/bhaktigpt/divine-image` POST
- [x] `/api/choghadiya/sun` GET

## UX parity
- [x] Home hero and quick actions
- [x] Guide carousel and cards
- [x] Chat typing indicators + replacements
- [x] Divine template cards and generation states
- [x] History tabs (`All chats`, image creations)
- [x] Aarti filtering + saved state + detail player
- [x] Choghadiya slot tables

## Release readiness
- [x] Apple Sign-In / Google Sign-In strategy (real GIDSignIn + ASAuthorizationAppleIDCredential; iOS is ahead of Android here, which is Google-only)
- [x] App icons and launch assets (BhaktiChat.xcodeproj now hosts the package; icon set resolves correctly)
- [x] Analytics parity (PostHog wired, see Analytics.swift)
- [ ] Sign In with Apple capability registered on the App ID in App Store Connect / Developer Portal — entitlements file + build setting are wired locally (`BhaktiChat.entitlements`, `CODE_SIGN_ENTITLEMENTS`), but registering the actual capability against the App ID requires the user's Apple Developer account (Xcode does this automatically when you add the capability with a real team selected in Signing & Capabilities)
- [ ] Fill in real secrets in `BhaktiChat/Config/Secrets.xcconfig` (PostHog key, AdMob release ad unit ids, Google Sign-In client ID) before archiving for release
- [ ] TestFlight build pipeline — needs a real archive/upload run, not attempted here (external, hard-to-reverse action)
- [ ] Crash reporting (not yet integrated — Telemetry.error() logs locally only; consider Sentry/Crashlytics before wide release)

## Android v2.1.0(9) -> v2.3.0(11) catch-up (in progress)
- [x] Package wired into BhaktiChat.xcodeproj as the real app target (WebView removed)
- [x] Paywall neutralization (ad-supported model, matching Android) — hard limits removed, "Get Pro" pill and paywall sheet removed to match Android exactly
- [x] AdMob + UMP/ATT ads — banners on Aartis/Guide Picker/Choghadiya/History, interstitial on Divine Image generation wait
- [x] PostHog analytics — semantic events wired at chat send, guide select, aarti open, choghadiya open, divine image start/generated/saved, sign-in/out identify/reset
- [x] Streak tracking — StreakStore + DarshanStreakHeroCard on Home (found and ported Android's live streak UI, which lives in DiscoveryScreen.kt's HomeScreen function, not the dead ui/screens/home/HomeScreen.kt file)
- [x] Daily reminder notifications — iOS already had a working implementation in ProfileScreen; fixed notification copy to match Android exactly and fixed a minute-persistence bug (picker allowed picking minutes but only hour was saved/scheduled)
- [x] Divine Image upload quality + output watermark — bumped to 1536px/92% quality, watermark applied client-side to the generated result (decode → draw → re-encode), matching Android's exact visual spec and its "always resolve to local watermarked bytes regardless of URL vs base64 response" behavior
- [x] Explore tab restructure + Festivals/Panchang screens — Divine Image/Aartis/Choghadiya moved under a new Explore tab (replacing the old dedicated Divine Image tab), plus new Festivals and Panchang screens with Android's exact static content. `AppTab.divineImage` renamed to `.explore` (confirmed zero persisted-state migration risk beforehand)

## Post-ship fixes
- [x] **Crash on launch** — `AdsConsentManager` calls `ATTrackingManager.requestTrackingAuthorization` at startup, but `Info.plist` was missing `NSUserTrackingUsageDescription`. iOS hard-crashes (TCC termination) any time that API is called without the key present. Added the key; confirmed via crash logs (`~/Library/Logs/DiagnosticReports`) before/after and a clean 10s+ run post-fix.
- [x] **Chat default language** — both platforms' language detection defaulted to English for any message without a recognized Hindi/Hinglish loanword, so short/ambiguous messages (e.g. "hi", "thanks") got English replies instead of the intended Hinglish default. Fixed on both Android (`AddressingEngine.kt`) and iOS (`ChatPromptSupport.swift`) with the same rule: Devanagari → Hindi; Hinglish loanword present → Hinglish; a substantive Latin-script message (4+ words) with no loanwords → English (respects genuine English speakers); anything shorter/ambiguous → inherit the recent thread's language, or default to **Hinglish** if nothing is established yet. Also unified the two platforms' hinglish-marker word lists (they'd drifted — e.g. only Android had "dharma", only iOS had "achha").
- [x] **Divine Image screen content rendering under the status bar** — `ExploreScreen`'s Featured card pushed `DivineImageHomeScreen` via `NavigationLink`, but that screen owns its own internal `NavigationStack` (for its create/result sub-routing). SwiftUI doesn't support nesting one `NavigationStack` inside another's push destination — safe-area/status-bar layout breaks for screens further down the nested stack, which is exactly what was reported (title text rendering under the status bar on Divine Image Create). Fixed by presenting `DivineImageHomeScreen` via `.fullScreenCover` instead (with a new close button), so its `NavigationStack` is a genuine top-level stack again.
- [x] **Divine Image generation appearing stuck** — `generateDivineImage()` used the default `URLSession` 60s request timeout, but generation is documented to take up to 90s server-side (Android uses a dedicated 120s image client for this reason). Phase 3's upload-quality bump (1536px/92%) made the larger payload more likely to exceed 60s. Set `request.timeoutInterval = 120` to match Android.
- [x] **Side-padding inconsistency** — new Explore/Festivals/Panchang screens used 18pt horizontal padding (copied from Android's `18.dp` spec value) while every other iOS screen uses 16pt. Unified to 16pt for internal consistency.
- [x] **Redundant "Explore" row on Home** — ported an older Android Home layout that included an "Explore" tile row (Aarti Sangreh/Gita Wisdom/Choghadiya) with a "See all" link to `HomeExploreListScreen`. Checked Android's actual *current* Home (`DiscoveryScreen.kt`) and confirmed this section no longer exists there — it was replaced by a "Today Widget" (Best Muhurat → Choghadiya, Aarti of the day → Aartis) and a "Create Darshan" promo card (→ Divine Image) once the dedicated Explore tab existed. Ported that real layout, removed the now-dead `HomeExploreListScreen.swift`, `ExploreTileCard`, and `DiscoveryCatalog.exploreTiles`/`DiscoveryExploreTile`.
- [x] **Banner ad placements corrected** — re-verified all 4 Android banner placements against files actually invoked in the nav graph (not just present in the source tree — this codebase has several dead/unreachable screen files, see above). Findings: (1) `guide_picker` ad only existed in `ChatEntryScreen.kt`, which is never invoked anywhere — the real live `GuidePickerScreen.kt` has no ad at all, so removed it from iOS entirely; (2) `aartis_list`, `choghadiya`, `history_list` are all real but positioned near the **top** of their screens (right after the header controls, before the main content) — iOS had all three at the **bottom**. Repositioned to match.
