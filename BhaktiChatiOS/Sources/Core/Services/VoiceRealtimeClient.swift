import Foundation
#if os(iOS)
import AVFoundation
#endif

/// Wraps a live OpenAI Realtime API voice session over WebSocket. Connects directly to
/// OpenAI (not proxied through our backend — only session bootstrap goes through our
/// server, see `BhaktiAPIClient.mintVoiceSession`) so audio round-trips stay as low-latency
/// as possible. Owns audio capture/playback for the duration of the call. Mirrors Android's
/// `data/remote/VoiceRealtimeClient.kt`.
///
/// Exact Realtime API event/field names were verified against OpenAI's live API during the
/// Android build of this feature, but this is a fast-moving API surface — unrecognized
/// events are logged, not treated as errors, so a rename doesn't crash the call, just
/// silently drops that signal until this file catches up.
@MainActor
final class VoiceRealtimeClient: ObservableObject {
    @Published private(set) var state: VoiceCallState = .idle
    @Published private(set) var assistantCaption: String = ""
    @Published private(set) var userCaption: String = ""

    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession?
    private let audioCapture = VoiceAudioCapture()
    private let audioPlayer = VoiceAudioPlayer()

    private var assistantTranscriptBuffer = ""
    private var userTranscriptBuffer = ""

    // The guide speaks first (like the text thread's opening scene) instead of the call
    // opening in dead silence on "Listening". Fired once, when the session is ready.
    private var hasGreeted = false
    private var openingLine = ""

    // Half-duplex mic gate (matches Android's fix). The mic is only transmitted while the guide
    // is silent, so its own voice (via speaker echo, or the greeting) can't reach the server VAD
    // — which, with interrupt_response=true, would otherwise cancel every reply the instant the
    // guide started talking, leaving the call stuck. Read from the audio-capture thread; only
    // ever written on the main actor, so a benign one-chunk race at a transition is harmless.
    private var micTransmitEnabled = false

    /// Called once a turn's transcripts are both settled, to persist via /voice/turn-complete.
    var onTurnComplete: ((_ userTranscript: String, _ assistantTranscript: String) -> Void)?

    func connect(ephemeralKey: String, model: String, openingLine: String = "") {
        guard webSocketTask == nil else { return }
        self.openingLine = openingLine
        state = .connecting

        #if os(iOS)
        do {
            let session = AVAudioSession.sharedInstance()
            // .voiceChat mode pairs record + playback for automatic echo cancellation —
            // the iOS equivalent of Android's VOICE_COMMUNICATION source/USAGE pairing.
            try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            state = .error("Could not configure audio session: \(error.localizedDescription)")
            return
        }
        #endif

        // The guide stops "speaking" (UI-wise) when the audio actually finishes playing, not
        // when the model finishes generating.
        audioPlayer.onGuideFinishedSpeaking = { [weak self] in
            guard let self else { return }
            // Recover from a no-audio reply too (state stuck at .thinking), so the mic can't stay
            // closed forever.
            if self.state == .guideSpeaking || self.state == .thinking {
                self.state = .listening
                // Keep the mic closed a short beat longer so the speaker tail dies down, then
                // reopen it — but only if the user hasn't already started speaking.
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
                    guard let self else { return }
                    if self.state == .listening { self.micTransmitEnabled = true }
                }
            }
        }

        let urlSession = URLSession(configuration: .default)
        self.urlSession = urlSession

        var request = URLRequest(url: URL(string: "wss://api.openai.com/v1/realtime?model=\(model)")!)
        request.setValue("Bearer \(ephemeralKey)", forHTTPHeaderField: "Authorization")

        let task = urlSession.webSocketTask(with: request)
        webSocketTask = task
        task.resume()

        audioPlayer.start()
        audioCapture.start { [weak self] data in
            self?.sendAudioChunk(data)
        }

        receiveNext()
    }

    private func receiveNext() {
        webSocketTask?.receive { [weak self] result in
            guard let self else { return }
            Task { @MainActor in
                switch result {
                case let .success(message):
                    if case let .string(text) = message {
                        self.handleEvent(text)
                    }
                    self.receiveNext()
                case let .failure(error):
                    self.state = .error(error.localizedDescription)
                    self.teardownAudio()
                }
            }
        }
    }

    private func sendAudioChunk(_ data: Data) {
        // Half-duplex: drop mic audio while the guide is speaking (or during the greeting), so
        // the guide's own voice never reaches the server VAD.
        guard micTransmitEnabled else { return }
        sendJSON(["type": "input_audio_buffer.append", "audio": data.base64EncodedString()])
    }

    /// Speaks the guide's fixed opening line as the first turn, before any user audio.
    private func sendOpeningGreeting() {
        let instructions: String
        if !openingLine.isEmpty {
            // Verbatim so every guide opens with its own established greeting, not an
            // improvised (and inconsistent) one. Word-for-word, nothing added.
            instructions = "Begin the call by speaking this exact opening aloud, word for word, warmly and in " +
                "first person. Say only this and nothing else:\n\n\"\(openingLine)\""
        } else {
            instructions = "Open the call by greeting the user warmly out loud in first person — one short, " +
                "natural spoken sentence, then gently invite them to share what is on their mind."
        }
        sendJSON(["type": "response.create", "response": ["instructions": instructions]])
    }

    private func sendJSON(_ object: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: object),
              let text = String(data: data, encoding: .utf8) else { return }
        webSocketTask?.send(.string(text)) { _ in }
    }

    private func handleEvent(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else { return }

        switch type {
        case "session.created":
            // Session is ready — have the guide open the conversation out loud rather than
            // waiting for the user to speak first.
            if !hasGreeted {
                hasGreeted = true
                sendOpeningGreeting()
                state = .thinking
            }

        case "input_audio_buffer.speech_started":
            // Optimistic, local-first interruption — don't wait for the server's
            // response.cancelled round trip before muting, or barge-in won't feel instant.
            if state == .guideSpeaking {
                audioPlayer.interruptNow()
            }
            assistantCaption = ""
            userTranscriptBuffer = ""
            micTransmitEnabled = true // keep sending through the user's whole utterance
            state = .userSpeaking

        case "input_audio_buffer.speech_stopped":
            micTransmitEnabled = false // user done; the server has the full utterance
            state = .thinking

        case "conversation.item.input_audio_transcription.completed":
            if let transcript = json["transcript"] as? String, !transcript.isEmpty {
                userTranscriptBuffer += transcript
                userCaption = userTranscriptBuffer
            }

        case "response.output_audio.delta":
            if let delta = json["delta"] as? String, let bytes = Data(base64Encoded: delta) {
                audioPlayer.enqueue(bytes)
            }
            micTransmitEnabled = false // guide is speaking — mute the mic
            state = .guideSpeaking

        case "response.output_audio_transcript.delta":
            if let delta = json["delta"] as? String, !delta.isEmpty {
                assistantTranscriptBuffer += delta
                assistantCaption = assistantTranscriptBuffer
            }

        case "response.done":
            // Generation finished, but buffered audio is still playing. Hand off to the
            // player, which flips us to .listening only once the audio is actually heard.
            // Leave the caption on screen until then / until the user speaks.
            audioPlayer.markGenerationComplete()
            let userTranscript = userTranscriptBuffer.trimmingCharacters(in: .whitespacesAndNewlines)
            let assistantTranscript = assistantTranscriptBuffer.trimmingCharacters(in: .whitespacesAndNewlines)
            if !userTranscript.isEmpty, !assistantTranscript.isEmpty {
                onTurnComplete?(userTranscript, assistantTranscript)
            }
            assistantTranscriptBuffer = ""

        case "response.cancelled":
            // Confirms an interruption we already handled optimistically above — no-op.
            break

        case "error":
            let message = (json["error"] as? [String: Any])?["message"] as? String ?? "Voice session error"
            state = .error(message)

        default:
            break
        }
    }

    func endCall() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        urlSession = nil
        teardownAudio()
        state = .ended
    }

    private func teardownAudio() {
        audioCapture.stop()
        audioPlayer.stop()
        #if os(iOS)
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        #endif
    }
}
