# BhaktiChat Android Native

Native Android app (Kotlin + Jetpack Compose) for BhaktiChat: persona-based AI chat with
devotional guides, divine images, voice mode, aartis, reels, choghadiya and the चढ़ावा
subscription.

## Tech stack
- Kotlin + Jetpack Compose + Material 3
- ViewModel + StateFlow, manual DI via `AppContainer`
- Room for local chat history (one database per user; guests get their own)
- OkHttp + `org.json`; chat streams over SSE
- Media3 for aarti playback and reels, AdMob + UMP, PostHog + Firebase Analytics
- Razorpay (web checkout / UPI mandate) for चढ़ावा

## Backend
Debug and release builds both talk to production, `https://bhaktichat.com`
(`API_BASE_URL` in `app/build.gradle.kts`). The backend is the Next.js app one level up.

## Local configuration
`local.properties` (git-ignored) holds `posthog.apiKey`, `posthog.host`,
`google.webClientId` and the `admob.*` ids. Release builds fail fast without a valid
`google.webClientId`. Debug builds always use Google's test ad units.

Release signing reads `keystore.properties` (copy `keystore.properties.template`).

## Build
There is no system Java on the dev machine; use Android Studio's JBR:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
./gradlew :app:assembleDebug        # debug APK
./gradlew :app:testDebugUnitTest    # unit tests
./gradlew :app:bundleRelease        # Play bundle
```
