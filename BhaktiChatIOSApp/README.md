# Bhakti Chat iOS App

This folder contains the real Xcode app wrapper for the shared SwiftUI replica in `../BhaktiChatiOS`.

## Open In Xcode
- Project: [BhaktiChatIOSApp.xcodeproj](/Users/anishmadhok/Documents/New%20project/BhaktiChatIOSApp/BhaktiChatIOSApp.xcodeproj)
- Scheme: `BhaktiChatMobile`

## Build From Terminal
```bash
xcodebuild \
  -project "/Users/anishmadhok/Documents/New project/BhaktiChatIOSApp/BhaktiChatIOSApp.xcodeproj" \
  -scheme BhaktiChatMobile \
  -sdk iphonesimulator \
  -derivedDataPath "/Users/anishmadhok/Documents/New project/BhaktiChatIOSApp/.derived" \
  CODE_SIGNING_ALLOWED=NO \
  build
```

Built simulator app output:
- `/Users/anishmadhok/Documents/New project/BhaktiChatIOSApp/.derived/Build/Products/Debug-iphonesimulator/BhaktiChatMobile.app`

Release metadata aligned to the current Android release:
- Bundle display name: `Bhakti Chat`
- Bundle identifier: `com.anish.bhaktichat.ios`
- Version: `2.1.0`
- Build: `9`

Before shipping to TestFlight/App Store:
- Set your final Apple bundle identifier if you want it different from `com.anish.bhaktichat.ios`
- Configure signing/team in Xcode
- Archive with `Any iOS Device`
