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
