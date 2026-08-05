package com.bhaktichat.app.data.remote

import android.util.Base64
import android.util.Log
import com.bhaktichat.app.domain.VoiceCallState
import com.bhaktichat.app.util.VoiceAudioCapture
import com.bhaktichat.app.util.VoiceAudioPlayer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject

/**
 * Wraps a live OpenAI Realtime API voice session over WebSocket. Connects directly to
 * OpenAI (not proxied through our backend — only session bootstrap goes through our
 * server, see [VoiceSessionApi]) so audio round-trips stay as low-latency as possible.
 *
 * Owns audio capture/playback for the duration of the call; knows nothing about `Guide`
 * or UI beyond the state/transcript flows it exposes.
 *
 * Exact Realtime API event/field names below were verified against OpenAI's docs during
 * planning but this is a fast-moving API surface — re-confirm against the live reference
 * if events stop matching what's expected here (unrecognized events are logged, not
 * treated as errors, so a rename doesn't crash the call, just silently drops that signal
 * until this file catches up).
 */
class VoiceRealtimeClient(private val httpClient: OkHttpClient) {
    private val _state = MutableStateFlow<VoiceCallState>(VoiceCallState.Idle)
    val state: StateFlow<VoiceCallState> = _state.asStateFlow()

    private val _assistantCaption = MutableStateFlow("")
    val assistantCaption: StateFlow<String> = _assistantCaption.asStateFlow()

    private val _userCaption = MutableStateFlow("")
    val userCaption: StateFlow<String> = _userCaption.asStateFlow()

    // Live mic input level (0..1), updated only while the mic is actually transmitting. Drives
    // the on-screen level meter so the user can see the mic is picking up their voice.
    private val _micLevel = MutableStateFlow(0f)
    val micLevel: StateFlow<Float> = _micLevel.asStateFlow()

    /** Non-null once capture has concluded the mic is delivering only silence on every source. */
    private val _micWarning = MutableStateFlow<String?>(null)
    val micWarning: StateFlow<String?> = _micWarning.asStateFlow()

    private var socket: WebSocket? = null
    private val audioCapture = VoiceAudioCapture()
    private val audioPlayer = VoiceAudioPlayer()

    private var assistantTranscriptBuffer = StringBuilder()
    private var userTranscriptBuffer = StringBuilder()

    // The guide speaks first (like the text thread's opening scene) instead of the call
    // opening in dead silence on "Listening". Fired once, when the session is ready.
    private var hasGreeted = false

    // Half-duplex mic gate. THE core fix for the "stuck, never responds" bug: the session runs
    // server VAD with interrupt_response=true + create_response=true, so if the guide's own
    // voice reaches the mic (speaker echo, or the greeting playing while the mic is live), the
    // server treats it as the user talking and cancels the guide's reply the instant it starts
    // — on a loop, so nothing ever plays. Hardware echo cancellation isn't reliable enough
    // (emulators have none; real-device AEC is imperfect). Instead we simply never transmit the
    // mic while the guide is speaking, so its voice can't reach the VAD at all. This timestamp
    // keeps the mic closed for a short beat after the guide finishes, letting the speaker tail
    // die down before we resume listening.
    @Volatile private var micOpenAtMillis = 0L

    // DEBUG only: while true, the live mic is suppressed and a bundled test utterance is streamed
    // instead — used to prove the full capture→VAD→response→playback loop in an emulator, which
    // has no real microphone. Never set in release (no caller).
    @Volatile private var injectingTestAudio = false

    // Diagnostic: track outgoing mic audio so we can tell "mic is silent" (peak ~0, e.g.
    // emulator virtual mic) apart from "server VAD isn't firing despite real audio."
    private var micChunkCount = 0L
    private var micPeakInWindow = 0

    /** Called once a turn's transcripts are both settled, to persist via /voice/turn-complete. */
    var onTurnComplete: ((userTranscript: String, assistantTranscript: String) -> Unit)? = null

    // The guide's fixed opening line (same text the chat thread opens with), spoken verbatim
    // as the call's first turn so every guide opens in-character instead of improvising.
    private var openingLine: String = ""

    fun connect(ephemeralKey: String, model: String, openingLine: String = "") {
        if (socket != null) return
        this.openingLine = openingLine
        _state.value = VoiceCallState.Connecting

        // The guide stops "speaking" (UI-wise) when the audio actually finishes playing, not
        // when the model finishes generating — otherwise the caption vanishes and it flips to
        // "Listening" a beat or two before the guide is done being heard.
        audioPlayer.onGuideFinishedSpeaking = {
            // Also recover from a no-audio reply (state stuck at Thinking) so the mic can't stay
            // closed forever if a response produced no audio.
            val s = _state.value
            if (s == VoiceCallState.GuideSpeaking || s == VoiceCallState.Thinking) {
                micOpenAtMillis = System.currentTimeMillis() + MIC_RESUME_GUARD_MS
                _state.value = VoiceCallState.Listening
            }
        }

        val request = Request.Builder()
            .url("wss://api.openai.com/v1/realtime?model=${model}")
            .addHeader("Authorization", "Bearer $ephemeralKey")
            .build()

        socket = httpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                audioPlayer.start()
                // Mic is started (warm) but the half-duplex gate keeps it from transmitting
                // until state becomes Listening — i.e. after the guide's opening line finishes.
                // Staying on Connecting here (rather than Listening) avoids opening the mic in
                // the brief window before the greeting starts.
                audioCapture.start(
                    onAudioChunk = { chunk, length, peak ->
                        sendAudioChunk(webSocket, chunk, length, peak)
                    },
                    onError = { message ->
                        // A dead microphone must NOT present as an endless silent "Listening" —
                        // that was exactly the production symptom. Surface it.
                        Log.e(TAG, "Audio capture failed: $message")
                        _state.value = VoiceCallState.Error(message)
                    },
                    onMicAppearsDead = {
                        _micWarning.value =
                            "We can't hear you — the microphone seems silent. " +
                                "Try removing Bluetooth or restarting the call."
                    }
                )
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleEvent(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "Voice WebSocket failure", t)
                _state.value = VoiceCallState.Error(t.message ?: "Connection lost")
                teardownAudio()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                _state.value = VoiceCallState.Ended
                teardownAudio()
            }
        })
    }

    /** Speaks the guide's fixed opening line as the first turn, before any user audio. */
    private fun sendOpeningGreeting() {
        val instructions = if (openingLine.isNotBlank()) {
            // Verbatim so every guide opens with its own established greeting, not an
            // improvised (and inconsistent) one. Word-for-word, nothing added.
            "Begin the call by speaking this exact opening aloud, word for word, warmly and in " +
                "first person. Say only this and nothing else:\n\n\"$openingLine\""
        } else {
            "Open the call by greeting the user warmly out loud in first person — one short, " +
                "natural spoken sentence, then gently invite them to share what is on their mind."
        }
        val response = JSONObject().apply { put("instructions", instructions) }
        val event = JSONObject().apply {
            put("type", "response.create")
            put("response", response)
        }
        socket?.send(event.toString())
    }

    private fun sendAudioChunk(webSocket: WebSocket, chunk: ByteArray, length: Int, peak: Int) {
        // Half-duplex gate: only transmit while the guide is silent. During UserSpeaking always
        // send (the user is mid-utterance); during Listening send once the post-guide guard has
        // elapsed; otherwise (Connecting/Thinking/GuideSpeaking/Error/Ended) drop the chunk so
        // the guide's own audio never reaches the server VAD.
        if (injectingTestAudio) return // debug test utterance is driving the input instead
        val s = _state.value
        val micOpen = s == VoiceCallState.UserSpeaking ||
            (s == VoiceCallState.Listening && System.currentTimeMillis() >= micOpenAtMillis)
        if (!micOpen) {
            if (_micLevel.value != 0f) _micLevel.value = 0f
            return
        }

        val base64Audio = Base64.encodeToString(chunk, 0, length, Base64.NO_WRAP)
        val event = JSONObject().apply {
            put("type", "input_audio_buffer.append")
            put("audio", base64Audio)
        }
        webSocket.send(event.toString())

        // Update the live level meter (throttled ~10/sec) and keep a 1s peak for the log.
        _micLevel.value = (peak / 32767f).coerceIn(0f, 1f)
        if (peak > micPeakInWindow) micPeakInWindow = peak
        micChunkCount++
        if (micChunkCount % 50 == 0L) {
            Log.d(TAG, "mic transmitting: peak(last~1s)=$micPeakInWindow (0=silence, 32767=max)")
            micPeakInWindow = 0
        }
    }

    /**
     * DEBUG: stream a bundled speech clip to the server as if the user had spoken it, then a
     * beat of trailing silence so server VAD detects end-of-speech. Proves the entire
     * capture→VAD→response→playback loop works without a real microphone (emulators have none).
     */
    fun injectTestUtterance(pcm: ByteArray) {
        val ws = socket ?: return
        if (injectingTestAudio) return
        Thread({
            injectingTestAudio = true
            try {
                val chunkBytes = 960 // 20ms @ 24kHz/16-bit mono
                var off = 0
                while (off < pcm.size) {
                    val len = minOf(chunkBytes, pcm.size - off)
                    val b64 = Base64.encodeToString(pcm, off, len, Base64.NO_WRAP)
                    ws.send(JSONObject().put("type", "input_audio_buffer.append").put("audio", b64).toString())
                    _micLevel.value = 0.6f
                    off += len
                    Thread.sleep(20)
                }
                // ~1.2s trailing silence so the server's VAD registers end-of-speech.
                val silence = ByteArray(chunkBytes)
                val silenceB64 = Base64.encodeToString(silence, 0, chunkBytes, Base64.NO_WRAP)
                repeat(60) {
                    ws.send(JSONObject().put("type", "input_audio_buffer.append").put("audio", silenceB64).toString())
                    Thread.sleep(20)
                }
                _micLevel.value = 0f
                Log.d(TAG, "Injected test utterance (${pcm.size} bytes) — awaiting guide response.")
            } catch (t: Throwable) {
                Log.w(TAG, "Test utterance injection failed", t)
            } finally {
                injectingTestAudio = false
            }
        }, "voice-test-inject").start()
    }

    private fun handleEvent(text: String) {
        val json = runCatching { JSONObject(text) }.getOrNull() ?: return
        when (json.optString("type")) {
            "session.created" -> {
                // Session is ready — have the guide open the conversation out loud rather
                // than waiting for the user to speak first. Persona/voice come from the
                // session config (set at token creation), so this stays guide-agnostic.
                if (!hasGreeted) {
                    hasGreeted = true
                    sendOpeningGreeting()
                    _state.value = VoiceCallState.Thinking
                }
            }

            "input_audio_buffer.speech_started" -> {
                // Optimistic, local-first interruption — don't wait for the server's
                // response.cancelled round trip before muting, or barge-in won't feel instant.
                if (_state.value == VoiceCallState.GuideSpeaking) {
                    audioPlayer.interruptNow()
                }
                // The guide's turn is over — clear its caption now the user is speaking.
                _assistantCaption.value = ""
                userTranscriptBuffer = StringBuilder()
                _state.value = VoiceCallState.UserSpeaking
            }

            "input_audio_buffer.speech_stopped" -> {
                _state.value = VoiceCallState.Thinking
            }

            "conversation.item.input_audio_transcription.completed" -> {
                val transcript = json.optString("transcript")
                if (transcript.isNotBlank()) {
                    userTranscriptBuffer.append(transcript)
                    _userCaption.value = userTranscriptBuffer.toString()
                }
            }

            "response.output_audio.delta" -> {
                val delta = json.optString("delta")
                if (delta.isNotBlank()) {
                    val bytes = Base64.decode(delta, Base64.NO_WRAP)
                    audioPlayer.enqueue(bytes)
                }
                _state.value = VoiceCallState.GuideSpeaking
            }

            "response.output_audio_transcript.delta" -> {
                val delta = json.optString("delta")
                if (delta.isNotBlank()) {
                    assistantTranscriptBuffer.append(delta)
                    _assistantCaption.value = assistantTranscriptBuffer.toString()
                }
            }

            "response.done" -> {
                // Generation finished, but buffered audio is still playing. Hand off to the
                // player, which flips us to Listening only once the audio is actually heard
                // (see onGuideFinishedSpeaking). Leave the caption on screen until then / until
                // the user speaks — don't clear it mid-sentence here.
                audioPlayer.markGenerationComplete()
                val userTranscript = userTranscriptBuffer.toString().trim()
                val assistantTranscript = assistantTranscriptBuffer.toString().trim()
                if (userTranscript.isNotEmpty() && assistantTranscript.isNotEmpty()) {
                    onTurnComplete?.invoke(userTranscript, assistantTranscript)
                }
                // Reset only the buffer for the next turn; keep the visible caption.
                assistantTranscriptBuffer = StringBuilder()
            }

            "response.cancelled" -> {
                // Confirms an interruption we already handled optimistically above — no-op.
            }

            "error" -> {
                val message = json.optJSONObject("error")?.optString("message") ?: "Voice session error"
                Log.e(TAG, "Voice realtime error event: $message")
                _state.value = VoiceCallState.Error(message)
            }

            else -> {
                Log.d(TAG, "Unhandled realtime event type: ${json.optString("type")}")
            }
        }
    }

    fun endCall() {
        socket?.close(1000, "client ended")
        socket = null
        teardownAudio()
        _state.value = VoiceCallState.Ended
    }

    private fun teardownAudio() {
        audioCapture.stop()
        audioPlayer.stop()
    }

    companion object {
        private const val TAG = "VoiceRealtimeClient"
        // How long to keep the mic closed after the guide finishes, so the speaker tail/echo
        // dies down before we start listening again. Short enough not to clip the user's reply.
        private const val MIC_RESUME_GUARD_MS = 250L
    }
}
