# TestFlight Upload Guide

## 1) Ensure signing is ready
- Apple Developer team is selected in Xcode.
- Bundle identifier is final.
- Capabilities are configured.
- App icon set is installed (use `scripts/install_appicon_set.sh`).

## 2) Build archive and IPA
Use the helper script with your real workspace/project and scheme.

### Workspace example
```bash
./scripts/archive_ios.sh \
  --workspace /absolute/path/YourApp.xcworkspace \
  --scheme YourApp \
  --configuration Release \
  --team-id YOURTEAMID \
  --bundle-id com.your.bundle
```

### Project example
```bash
./scripts/archive_ios.sh \
  --project /absolute/path/YourApp.xcodeproj \
  --scheme YourApp \
  --configuration Release \
  --team-id YOURTEAMID \
  --bundle-id com.your.bundle
```

The script exports an IPA into `build/export` (or your custom `--export-dir`).

## 3) Upload to TestFlight
Recommended: Transporter app (Mac App Store).
- Open Transporter.
- Sign in with App Store Connect account.
- Drag the exported `.ipa`.
- Upload and wait for processing.

Alternative CLI (if configured in your environment):
```bash
xcrun iTMSTransporter -m upload -assetFile /absolute/path/YourApp.ipa -u APPLE_ID -p APP_SPECIFIC_PASSWORD
```

## 4) Post-upload checks
- Wait for build processing in App Store Connect.
- Add internal testers first.
- Verify smoke flows on TestFlight build:
  - chat streaming
  - divine image create/result
  - aarti detail video
  - choghadiya timelines
  - sign-in/sign-out persistence
