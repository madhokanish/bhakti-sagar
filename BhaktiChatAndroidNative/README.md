# BhaktiChat Android Native

Native Android app (Kotlin + Jetpack Compose) for persona based AI chat with Shri Krishna, Lakshmi Ji, and Shani Dev.

## Tech stack
- Kotlin + Jetpack Compose + Material 3
- ViewModel + StateFlow
- Room for local chat history
- OkHttp + Moshi for API payloads
- Streaming-ready client with SSE and chunked fallback

## Folder structure
- `app/src/main/java/com/bhaktichat/app/data`
- `app/src/main/java/com/bhaktichat/app/domain`
- `app/src/main/java/com/bhaktichat/app/ui`
- `app/src/main/java/com/bhaktichat/app/util`
- `app/src/main/assets/aartis.json`
- `mock-backend/server.mjs`

## Run locally
1. Open project in Android Studio.
2. Let Gradle sync complete.
3. Run app on emulator/device.

## Streaming backend setup
By default, debug builds use `USE_FAKE_STREAM=true` and stream mock responses inside app.

### Use external backend instead
1. In `app/build.gradle.kts`, set debug `USE_FAKE_STREAM` to `false`.
2. Set debug `CHAT_BASE_URL` to your backend URL.
3. Backend endpoint required:
   - `POST /chat`
   - Body: `{ "guideId": "krishna", "messages": [{"role":"user","content":"..."}] }`
   - Response: SSE (`data: ...`) or plain chunked text stream.

## Optional local Node mock server
From `mock-backend`:
```bash
npm install
npm start
```
Server starts at `http://localhost:8787`.
For Android emulator use `http://10.0.2.2:8787` as `CHAT_BASE_URL`.
