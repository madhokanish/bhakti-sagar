# BhaktiChat iOS Replica

This folder contains the iOS replication work for the Android app in `BhaktiChatAndroidNative`.

## Current scope completed
- iOS SwiftUI shell with 4 tabs: Home, Bhakti Chat, Divine Image, History.
- Core domain parity for guides, chat contracts, divine image models, aarti models, and choghadiya cities.
- Backend API parity:
  - `GET /api/bhaktigpt/chat`
  - `POST /api/bhaktigpt/chat` (SSE)
  - `POST /api/bhaktigpt/divine-image`
  - `GET /api/choghadiya/sun`
- Route baseline parity:
  - Home + Explore
  - Bhakti Chat hub + thread screen
  - Divine Image home/create/result
  - Aartis list/detail
  - Guide picker/profile
  - Choghadiya
  - Profile
- Home visual parity baseline:
  - branded top bar
  - hero card
  - today quick actions
  - guide carousel cards
  - aarti preview section
- Aarti parity baseline:
  - searchable + saved-first aarti list
  - saved aarti persistence
  - detail screen with embedded YouTube player
  - "Ask Lord Krishna about this aarti" handoff into Bhakti Chat
- Choghadiya parity baseline:
  - city selector with refresh
  - current kaal summary
  - next good time card
  - day/night slot timeline tables
  - ask Shani CTA handoff into Bhakti Chat
- Divine Image parity baseline:
  - template home + inspirations
  - create screen with step-based mode inputs (deity/scene or temple/moment)
  - prompt skeleton composition with replacements
  - result screen with success/failure states, share/save
- Chat continuity parity baseline:
  - remote conversation ID persistence
  - per-thread state anchor payload
  - earlier-summary carry-forward for long threads
- CoreData persistence baseline (with legacy migration):
  - primary app state stored in CoreData-backed SQLite blob store
  - automatic one-way migration from legacy JSON store when CoreData is empty
  - persisted threads/messages/conversation context/divine creations/saved aartis
- Auth parity baseline:
  - persisted auth session model (`provider`, `name`, `email`, `photoURL`)
  - Profile sign-in/sign-out flows for Google/Apple entry points (local baseline)
  - signed-in first name automatically passed in chat requests
- Styling and chat UX baseline:
  - Bhakti dark theme tokens and card styling
  - live typing indicator while streaming assistant response

## Build
Shared module build from this directory:

```bash
swift build
```

Real iOS app project:
1. Open [BhaktiChatIOSApp.xcodeproj](/Users/anishmadhok/Documents/New%20project/BhaktiChatIOSApp/BhaktiChatIOSApp.xcodeproj)
2. Select the `BhaktiChatMobile` scheme
3. Build or run on simulator/device from Xcode

CLI simulator build:

```bash
xcodebuild \
  -project "../BhaktiChatIOSApp/BhaktiChatIOSApp.xcodeproj" \
  -scheme BhaktiChatMobile \
  -sdk iphonesimulator \
  -derivedDataPath "../BhaktiChatIOSApp/.derived" \
  CODE_SIGNING_ALLOWED=NO \
  build
```

Current packaging parity from Android release:
- Android `versionName`: `2.1.0`
- Android `versionCode`: `9`
- iOS `CFBundleShortVersionString`: `2.1.0`
- iOS `CFBundleVersion`: `9`

## Next parity milestones
1. App Store/TestFlight packaging setup (icons, launch, bundle/config QA).
2. Crash/logging/analytics parity.
3. End-to-end QA against Android release behavior and backend responses.
