# Chat QA User Stories

This backlog turns the recent iOS chat QA findings into concrete user stories with acceptance criteria. The first four were fixed in this pass.

## CH-001 Prevent duplicate error bubbles

**User story**

As a user, when a chat send fails, I want to see one clear error response so the conversation does not feel broken or noisy.

**Acceptance criteria**

- A failed send appends at most one assistant error bubble.
- Network and server failures surface the same clear error path.
- The typing indicator clears when the failure is final.

**Status**

- Done on 2026-03-28

**Implementation**

- Removed duplicate transport error signaling in `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/Core/Services/BhaktiAPIClient.swift`
- Kept a single terminal error handling path in `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/App/AppState.swift`

## CH-002 Block overlapping sends while a reply is streaming

**User story**

As a user, when the guide is already replying in a thread, I want the composer to stay locked until that reply finishes so I do not accidentally stack sends into the same turn.

**Acceptance criteria**

- The thread composer is disabled while that thread is streaming.
- Seeded entry points like hub prompts, Aarti, and Choghadiya lock the destination thread immediately.
- The lock clears after `done` or a terminal error.

**Status**

- Done on 2026-03-28

**Implementation**

- Added per-thread send state in `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/App/AppState.swift`
- Thread composer now reads shared send state in `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/Features/BhaktiChat/ChatThreadScreen.swift`

## CH-003 Make the hub composer state honest

**User story**

As a user, when the Bhakti Chat hub input is empty, I want the send button to look disabled so the page communicates clearly when I can start a chat.

**Acceptance criteria**

- The hub send button is visually dimmed when the input is empty.
- The button is disabled until the user enters text.
- The hub also prevents double-tap launches while a thread is being opened.

**Status**

- Done on 2026-03-28

**Implementation**

- Updated the hub composer state in `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/Features/BhaktiChat/BhaktiChatHubScreen.swift`

## CH-004 Align iOS chat requests with the Android prompt contract

**User story**

As a user, I want the iOS guides to respond with the same conversational tone and routing hints as Android so the guide personalities feel consistent across platforms.

**Acceptance criteria**

- iOS sends `chatLang`, `systemPrompt`, `developerPrompt`, `languageInstruction`, `guidePersonaPrompt`, `modeInstruction`, `systemPromptStack`, and `secondaryGuard` where applicable.
- Shiv and Hanuman keep the Android plain-request behavior.
- Prompt fields are assembled consistently from guide, message, and conversation context.

**Status**

- Done on 2026-03-28

**Implementation**

- Added a prompt assembler in `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/Core/Services/ChatPromptSupport.swift`
- Wired the resulting payload into `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/App/AppState.swift`

## UX Backlog

These came out of QA too, but were left as follow-up polish rather than blockers.

### CH-005 Replace streamed partial text with a calmer typing indicator

**User story**

As a user, I want a stable typing indicator while the guide is composing so replies do not feel jittery or half-finished.

**Acceptance criteria**

- Streaming replies show a stable typing state instead of partial text flicker.
- The final assistant reply appears only when the turn is complete.

**Status**

- Done on 2026-03-28

**Implementation**

- Stopped painting partial token text into the typing bubble in `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/App/AppState.swift`

### CH-006 Tighten bubble width and rhythm

**User story**

As a user, I want chat bubbles to feel closer to a messaging app so the thread is easier to scan on mobile.

**Acceptance criteria**

- Message bubbles no longer stretch nearly edge to edge.
- Long answers wrap in a narrower, more readable column.

**Status**

- Done on 2026-03-28

**Implementation**

- Tightened message bubble width in `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/Features/BhaktiChat/ChatThreadScreen.swift`

### CH-007 Reload remote conversations when reopening threads

**User story**

As a user, I want previously opened threads to stay in sync with the server so I can resume conversations confidently across sessions.

**Acceptance criteria**

- Reopening an existing thread with a remote conversation id refreshes messages from the server.
- Local devotional opening scenes are preserved if the server history does not include them.
- Reload is skipped while a thread is actively sending.

**Status**

- Done on 2026-03-28

**Implementation**

- Added safe thread reload logic in `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/App/AppState.swift`
- Triggered remote sync from `/Users/anishmadhok/Documents/New project/BhaktiChatiOS/Sources/Features/BhaktiChat/ChatThreadScreen.swift`
