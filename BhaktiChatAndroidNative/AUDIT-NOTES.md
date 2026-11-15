# Android audit notes (third pass)

Running log. Each chunk is finished, tested (`./gradlew testDebugUnitTest`) and committed
before the next one starts. Nothing here has been tried on a device unless it says so.

## Chunk 1: chat and sign-in (done)

Read in full: `ChatThreadViewModel`, `AppContainer`, `BhaktiChatApplication`,
`BhaktiChatAuthRoot` (root composable), `AuthRepository`, `SubscriptionRepository`,
`ThreadDao`, `MessageDao`, `ThreadsRepository`, `MessagesRepository`,
`ChatTurnProcessor.generateReply`, `launchThread`/`startFreshThread` in `BhaktiChatApp`.
Read in part: `ChatThreadScreen` (effects, list, mic, date separators).
Not read this pass: `HistoryScreen`, `HistoryViewModel`, `GuidePickerScreen`,
`AddressingEngine`, `MessageContext`, `OkHttpChatApi`, `PromptAwareChatApiClient`.

### Fixed

1. **A question started from Home or History wiped the guide's memory.** `launchThread`
   always sent `remoteConversationId = null` and a blank conversation state, even when it
   reused an existing thread, so the server started a new conversation and the stored id was
   overwritten. It now continues the thread's stored conversation. (`BhaktiChatApp.kt`)
2. **Mic dictation kept only the last word or two.** The speech recognizer holds the callback
   from when recording started, and that callback appended each partial result to the input
   text as it was at that moment. It now reads the current text. (`ChatThreadScreen.kt`)
3. **Chat date separators were always in Hindi** ("12 नवंबर") whatever the app language.
   They now follow the app language, like Choghadiya. (`ChatThreadScreen.kt`)
4. **Opening the sign-in screen took चढ़ावा away from a paying guest account.** The
   subscription collector cleared the entitlement on `SignedOut`, which is only the sign-in
   screen. "Not now" restored it only if the refresh that followed succeeded, so offline it
   stayed off. Only `Guest` clears now. (`SubscriptionRepository.kt`)
5. **Account deletion cleared a prefs file that does not exist** (`bhaktichat_prefs`) and
   left the chat-nudge and membership-promo files behind. (`BhaktiChatApplication.kt`)

### For you to review

- **Hindi replies never stream.** `generateReply` passes no stream callback when the reply
  language is Hindi, so Hindi users wait for the whole reply while Hinglish and English users
  see it arrive. It looks deliberate but there is no comment saying why.
- **Account deletion leaves the old guest database file on disk.** Deleting the account
  resets the anonymous id, so the guest database named after the old id is never opened
  again. It is normally empty by then (its chats were moved into the account).
- **`showChadhaavaNudge` is never turned on.** The in-chat चढ़ावा card, its dismiss handler
  and `ChatNudgeStore` are wired but dead; a comment says they were kept on purpose. Remove
  them if the offer is not coming back.
- **A database write failure mid-send leaves the typing bubble behind.** The generic
  `catch` in `sendMessage` clears `isSending` but does not remove the typing row.

### What could break

- Fix 1: a prompt card tapped for a guide you have already chatted with now continues that
  server conversation. If the server has expired that conversation id, the send depends on
  how the backend treats an unknown id (same as a normal send from the chat screen).
- Fix 4: after signing in to a different account, the previous account's चढ़ावा flag stays
  until the new account's first status refresh returns.

### Tests to run by hand

- Chat with a guide, go Home, tap a situation card for the same guide: the reply should still
  know what was said before.
- Tap the mic and speak a full sentence: the whole sentence should land in the box.
- English mode, a chat with messages from last week: the separator should read "8 Nov".
- As a paying guest: Settings → Sign in → "Not now" in airplane mode: still a member.

## Chunk 2: चढ़ावा and checkout (done)

Read in full: `ChadhaavaViewModel`, `EntitlementStore`, `SubscriptionApi`, `WebCheckout`,
`MembershipPromoStore`, `ReviewPromptStore`, `BookmarkStore`; the gate, quick-checkout,
promo and चढ़ावा-route code in `BhaktiChatApp`; checkout effects, `HeroVideo` and
`QuickCheckoutSheet` in `ChadhaavaScreen`. Also ran a whole-app scan for declarations that
nothing references.
Not read this pass: the rest of `ChadhaavaScreen` (offer and manage UI), `ProfileScreen`,
`Analytics`, `SubscriptionManager` (Play Billing leftover), the backend subscription routes.

No bug found in the checkout flow itself: the resume flag, promo suppression, polling and
return-from-tab handling all read correctly.

### Fixed

1. **Tone-word fallback printed a raw key.** `translateTone` fell back to
   `translate("tone_neutral_fallback")`, but that entry was never in the main string table,
   so an unknown tone would render as the literal text `tone_neutral_fallback`. It now falls
   back to the "neutral" tone word. (`Strings.kt`)
2. **Removed code nothing references:** four `BookmarkStore` getters, `syncing` in
   `SubscriptionRepository`, and `Guide.suggestedPrompts` (iOS has its own copy; the string
   keys stay because iOS uses them).

### For you to review

- **History's "Saved" section can never show anything.** It reads `BookmarkStore`, and
  nothing in the app adds to that store: there is no bookmark action on a chat message, and
  saving an aarti writes to a different store (`SavedAartisStore`). Suggested fix: make
  History read saved aartis from `SavedAartisStore`, and either add a bookmark action to
  chat messages or delete the saved-messages UI and `BookmarkStore`.
- **The चढ़ावा hero video plays over a playing aarti.** The hero `ExoPlayer` does not request
  audio focus, so with an aarti in the mini-player both play at once. Suggested fix: give the
  hero player audio attributes with `handleAudioFocus = true`. Needs a listen on a device.
- **The iOS string generator has the same tone fallback.** Line 192 of
  `BhaktiChatiOS/scripts/generate_strings_from_android.py` still writes
  `translate("tone_neutral_fallback", ...)` into `Strings.swift`. Left alone (iOS work).
- **A guest who taps pay at a gate loses the gate.** The silent guest-account path resumes
  on the चढ़ावा page with no `blocked` value, so the page does not say what they were trying
  to open and its analytics source reads "tab".
- **Checkout polling asks Razorpay every 3 seconds for 3 minutes** (up to 60 gateway reads
  per attempt), and keeps going after the user is back on the offer. Deliberate, but heavy.
- **`recordImageGenerated` and `imagesUsed` do nothing now.** Images are members-only and
  the recorder returns early for members, so the counter is always 0.
- **Unused colour constants:** `ScreenBgTop`, `ScreenBgBottom`, `ModeTempleStart`,
  `ModeTempleEnd` (`DivineImageTheme.kt`); `SurfaceElevated`, `AccentWarm`, `AccentSuccess`
  (`Theme.kt`). Harmless; left in place.
- Still open from the first audit: `CheckoutRequest`, `createSubscription`,
  `preloadRazorpay`, `purchaseInFlight`, `UserCancelled` and the AD_ID permission all belong
  to the unused Razorpay SDK / Play Billing / AdMob paths.

### What could break

- Nothing behavioural: the removals had no callers, and the tone fallback only changes the
  text for a tone key that does not exist.

## Chunk 3: divine images and voice (done)

Read in full: `DivineCreationRepository`, `DivineImageUi`, `BitmapDecoding`,
`DivineImageModels`, `DivineImageResultViewModel`, `DivineImageGenerator`,
`launchDivineGeneration`, `VoiceRealtimeClient`, `VoiceConversationViewModel`,
`VoiceSessionApi`, the voice route in `BhaktiChatApp`.
Not read this pass: the divine image screens (`Create`, `Result`, `Home` composables), the
rest of `DivineImageCreateViewModel`, `DivineTemplateRepository`, `VoiceModeScreen`,
`VoiceAudioCapture`, `VoiceAudioPlayer`, `VoiceAudioFocusManager`.

### Fixed

1. **Voice could leave the mic open after the call was ended.** If the call ended while the
   session was still being set up (End tapped, or a phone call took audio focus), the
   session reply then connected anyway and started recording, and nothing could stop it:
   `endCall()` does nothing once the call is marked as not started. The reply is now ignored
   if the call has already ended. (`VoiceConversationViewModel.kt`)
2. **Divine image files piled up in the cache for ever.** Creations are kept in memory only,
   so after a restart every generated PNG (several MB each) and copied input photo is
   unreachable, and nothing deleted them. Files older than an hour are now removed when the
   app starts. (`DivineImageGenerator.kt`)
3. **Each generation left two full-size bitmaps for the garbage collector** (about 16 MB
   each at 2048 px). They are recycled once the file is written. (`DivineImageGenerator.kt`)
4. **A 402 with a non-JSON body read as a generic failure** because the body was parsed
   before the status was checked. The status is checked first. (`DivineImageGenerator.kt`)

### For you to review

- **Divine image history is lost every time the app restarts.** `DivineCreation` rows are
  only in memory (`InMemoryDivineCreationRepository`), so History's creations list is empty
  after a restart and a paid image that was not saved to the gallery is gone. Fixing it
  means a Room table and keeping the files out of the cache directory.
- **A voice call is not recorded in the chat.** Voice turns are sent to the server, but the
  conversation id the server returns is never written to the thread, and the transcripts
  are not added to the local messages. On a thread with no earlier text chat, the next text
  message starts a new server conversation that knows nothing about the call.
- **The "microphone seems silent" warning is hard-coded English**
  (`VoiceRealtimeClient.kt`, `onMicAppearsDead`). It needs a string key and the language
  passed in.
- **The voice route still opens the full चढ़ावा page** when a non-member reaches it, while
  every other gate opens the quick-checkout sheet.
- **The input photo is JPEG-encoded twice** (once when copied in, again when sent). Small
  quality loss and wasted work; sending the copied file's bytes as they are would avoid it.

### What could break

- Fix 2: a divine image shared to another app more than an hour before a restart can no
  longer be re-opened from that app's stale link. Images saved to the gallery are not
  touched.
- Fix 3: if any code kept using the bitmap after saving it would crash; nothing does.

### Tests to run by hand

- Start a voice call and tap End immediately, several times: the mic indicator in the
  status bar should go away each time.
- Generate a divine image, save it, restart the app: the saved image is still in the
  gallery.

## Chunk 4: aartis and reels (done)

Read in full: `AartiPlayerController`, `AartiPlaybackService`, `AartiRepository`,
`ReelsRepository`; the pager and player code in `ReelsScreen`; the filter and search code in
`AartisScreen`. Checked `aartis.json` with a script: 25 entries, no duplicate ids, every
entry has a Hindi title, Hindi lyrics, artwork that exists, and audio or a YouTube link.
Not read this pass: `AartiDetailScreen`, `AartiNowPlayingScreen`, `AartiRow`,
`YouTubePlayerEmbed`, `ReelsViewModel`, `ReelStatusExporter`, the rest of `AartisScreen`.

### Fixed

1. **Aarti search did not work in Latin letters.** Both title fields hold the Devanagari
   title, so typing "ganesh ji ki aarti" only matched if a deity name or tag happened to
   match. Search now also matches the slug, which is the English title. (`AartisScreen.kt`)
2. **The "vrat" tag check looked at the Devanagari title for the word "vrat".** It can never
   match; it now checks the English title. No aarti is affected today (the one vrat aarti is
   tagged), so this only matters for aartis added later. (`AartiRepository.kt`)
3. **Removed a `when` whose three branches reduced to "use the Hindi lyrics".**
   (`AartiRepository.kt`)

### For you to review

- **Aarti titles and lyrics are always Devanagari, in every app language.** `aartis.json`
  has an English title and romanised lyrics for each aarti, and the app never shows them.
  English and Hinglish users get Hindi-script titles and lyrics. `Aarti.title` and
  `Aarti.titleHi` are always the same string, so `Aarti.subtitle` is always null.
- **Switching the reels feed keeps the page number.** The pager state is not reset when
  moving between "Top" and "Aartis", so you land part-way down the other feed.
- **Reel like counts are hard-coded numbers** in `ReelsRepository` (12,400, 8,730, ...).
- **An aarti keeps playing after sign-out or account switch**, and the last track in a queue
  never reports `aartiPlayCompleted`.

### What could break

- Fix 1: a search term can now match more aartis than before (any word in the English
  title).

### Tests to run by hand

- Aartis → search "ganesh": the Ganesh aarti should appear. Search "गणेश": still appears.

## Chunk 5: Home and Choghadiya (done)

Read in full: `ChoghadiyaCalculator`, `ChoghadiyaRepository`, `ChoghadiyaViewModel`,
`ChoghadiyaSlot`, `DailyReminderReceiver` (receiver, scheduler, boot receiver); the Home
refresh and Choghadiya preview loop in `DiscoveryScreen`; `NotificationsSection` in
`ProfileScreen`. Checked both Choghadiya tables (7 weekdays, day and night) against the
standard sequences: all 112 entries are correct.
Not read this pass: `ChoghadiyaScreen` (UI), the rest of `DiscoveryScreen`,
`HomeDevotionalFeed`, `ChoghadiyaCity`.

### Fixed

1. **Home's Choghadiya row stayed empty after an offline launch.** If the first load failed,
   the update loop never started, so the row only came back on a manual pull-to-refresh. It
   now retries every 30 seconds until it has data. (`DiscoveryScreen.kt`)
2. **The reminder's notification channel kept the language it was first created in.** The
   channel name and description in system settings never changed after a language switch.
   The channel is now re-created each time, which updates them. (`DailyReminderReceiver.kt`)

### For you to review

- **The daily reminder is only set up when someone opens Settings.** The alarm is scheduled
  from the Notifications section of Settings, and after a reboot or app update. A new install
  that never opens Settings has no reminder until its first reboot, and on Android 13+ the
  notification permission is only requested from Settings, so most users never get one.
  Suggested fix: ask for the permission at a chosen moment (for example after the first chat
  reply) and schedule the alarm at app start.
- **The reminder uses the launcher icon as its small icon** (`R.mipmap.ic_launcher`).
  Android draws small icons as a flat silhouette, so it shows as a blank circle or square.
  It needs a single-colour vector.
- **Choghadiya times keep the language they were loaded in.** Slot times ("5:43 AM" or
  "5:43 पूर्वाह्न") are formatted when the data loads, so after a language switch the open
  screen shows the old format until the next load.
- **At sunrise the Choghadiya screen flips to its full loading state** while the new day
  loads, instead of keeping the old slots visible.

### What could break

- Fix 1: an offline Home screen now makes one failing request every 30 seconds.

### Tests to run by hand

- Airplane mode, open the app, turn airplane mode off: the Choghadiya row on Home should
  appear within about 30 seconds without pulling to refresh.
- Switch app language, then open system Settings → Apps → BhaktiChat → Notifications: the
  channel name should be in the new language once a reminder has fired or Settings in the
  app has been opened.

## Chunk 6: Explore, strings and resources (done)

Read in full: `WallpaperDetailScreen`; the sign-in screen and dialog in `BhaktiChatAuthRoot`.
Script checks over the whole app: every key in `Strings.kt` against Android and iOS usage,
duplicate keys, format placeholders, Latin-script Hindi entries, hard-coded UI text, and
every file under `res/` against Kotlin, XML, the manifest and `aartis.json`.
Not read this pass: `ExploreScreen`, `WallpapersScreen`, `PanchangScreen`,
`FestivalsScreen`, `Theme.kt`, `Type.kt`.

Results of the checks: no unused string keys, no duplicate keys, no placeholder mismatches,
no unused drawables, raw files or layouts. Nothing to remove.

### Fixed

1. **Wallpaper Save, Share and Set froze the screen.** Each tap decoded the full wallpaper
   and wrote it out as a PNG on the main thread, then (for Save) copied it into the gallery
   there too. That work now runs in the background. (`WallpaperDetailScreen.kt`)
2. **Every wallpaper tap left another PNG in the cache.** The file name carried a
   timestamp, so nothing was ever overwritten. There is now one file per wallpaper.
3. **"Continue with Google" was hard-coded English.** It has a string key now and reads
   "Google से जारी रखें" in Hindi. iOS `Strings.swift` was regenerated for the new key (that
   file is in your uncommitted iOS folder).

### For you to review

- **Many "English" strings are Hinglish.** In English mode the UI shows text such as
  "Apni photo add karne ke liye tap kijiye". The full list (key and text) is in
  `AUDIT-english-strings.txt` next to this file. This is the UI side of review item 1 from
  the first audit (English mode replies in Hinglish).
- **On Android 7 to 9, "Saved to Photos" is not true.** Below Android 10 the wallpaper is
  written to the app's own external folder, which the gallery does not index. Saving to the
  shared Pictures folder there needs the storage permission. Divine image saving likely has
  the same gap (not re-read this pass).
- **The wallpaper share caption says "Get yours free"** while wallpapers are members-only,
  and it is hard-coded English (`SHARE_CAPTION`).
- **The reviewer sign-in path is hard-coded English** ("Enter email or username", "Sign in",
  "Email or username", "Password", "Cancel"). Only Play reviewers use it, so I left it.
- **`cancel` and `common_cancel` are the same string under two keys.**

### What could break

- Fix 1: Save, Share and Set now react a moment after the tap instead of blocking; a second
  quick tap starts a second copy of the same work.

### Tests to run by hand

- Open a wallpaper and tap Save, Share and Set as wallpaper: no freeze, and each still works.
- Hindi mode → Settings → Sign in: the Google button reads "Google से जारी रखें".
