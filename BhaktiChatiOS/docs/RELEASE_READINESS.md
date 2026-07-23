# iOS Release Readiness

`BhaktiChat.xcodeproj` (repo root) is now the real host app for this package — build/archive
that project's `BhaktiChat` scheme, not a standalone workspace.

## Automated preflight
Run:

```bash
./scripts/preflight.sh
```

## Manual packaging steps (Xcode)
1. Open `BhaktiChat.xcodeproj` (repo root) in Xcode.
2. Fill in `BhaktiChat/Config/Secrets.xcconfig` (git-ignored) with real PostHog/AdMob/Google
   Sign-In values — see `Secrets.example.xcconfig` for the keys needed.
3. Confirm bundle identifier (`com.anish.BhaktiChat`) and team (`ZD7X3237SF`) in Signing &
   Capabilities match your App Store Connect record.
4. In Signing & Capabilities, add the "Sign In with Apple" capability if not already
   present — `BhaktiChat.entitlements` declares it, but the App ID also needs it registered
   in the Apple Developer portal (Xcode does this automatically with a real team selected;
   it can't be done from the CLI with ad-hoc/local signing).
5. Configure version/build numbers (`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`).
6. Archive and validate.
7. Upload to TestFlight and verify install + smoke tests.

## Smoke test checklist
- Open Home; verify hero, streak card (after 1+ day of use), quick actions, guide carousel.
- Start chat from Home and from Guide/Profile; verify response streams.
- Confirm chat/Divine Image are never hard-blocked by a paywall after heavy use; manual
  "Get Pro" entry point is gone (matches Android — ad-supported model).
- Confirm test banner ads render on Aartis/Guide Picker/Choghadiya/History; confirm the
  interstitial fires once per Divine Image generation, not on repeat History views.
- Confirm ATT prompt and (region-simulated) UMP consent form appear appropriately; confirm
  PostHog events land in the dashboard (or debug console) for key actions.
- Open Divine Image flow, generate a result, confirm the watermark appears on the shown
  and saved/shared image.
- Open Explore tab (replaces the old dedicated Divine Image tab); confirm Aartis,
  Choghadiya, Festivals, and Panchang all open correctly from there.
- Open Aarti details and play embedded YouTube.
- Open Choghadiya and verify day/night slot timeline.
- Enable the daily reminder in Profile at a near-future time; confirm it fires and deep-links.
- Sign in/out from Profile; restart app; verify auth state persists.

## Telemetry hooks
- `Telemetry.track(...)` for key UI events (local diagnostics).
- `Analytics.*` for PostHog product analytics (see `Sources/Core/Services/Analytics.swift`).
- `Telemetry.error(...)` for network/persistence failures.
