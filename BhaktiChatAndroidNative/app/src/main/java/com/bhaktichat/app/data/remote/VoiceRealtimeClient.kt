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

    private var socket: WebSocket? = null
    private val audioCapture = VoiceAudioCapture()
    private val audioPlayer = VoiceAudioPlayer()

    private var assistantTranscriptBuffer = StringBuilder()
    private var userTranscriptBuffer = StringBuilder()

    // The guide speaks first (like the text thread's opening scene) instead of the call
    // opening in dead silence on "Listening". Fired once, when the session is ready.
    private var hasGreeted = false

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
            if (_state.value == VoiceCallState.GuideSpeaking) {
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
                audioCapture.start { chunk, length ->
                    sendAudioChunk(webSocket, chunk, length)
                }
                _state.value = VoiceCallState.Listening
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

    private fun sendAudioChunk(webSocket: WebSocket, chunk: ByteArray, length: Int) {
        val base64Audio = Base64.encodeToString(chunk, 0, length, Base64.NO_WRAP)
        val event = JSONObject().apply {
            put("type", "input_audio_buffer.append")
            put("audio", base64Audio)
        }
        webSocket.send(event.toString())

        // Peak amplitude of this PCM16 chunk (little-endian), tracked over a ~1s window.
        var i = 0
        while (i + 1 < length) {
            val sample = (chunk[i].toInt() and 0xFF) or (chunk[i + 1].toInt() shl 8)
            val amp = kotlin.math.abs(sample)
            if (amp > micPeakInWindow) micPeakInWindow = amp
            i += 2
        }
        micChunkCount++
        // ~50 chunks * 20ms = ~1s. Log peak so silence (emulator) vs. real speech is obvious.
        if (micChunkCount % 50 == 0L) {
            Log.d(TAG, "mic sent chunks=$micChunkCount peakAmplitude(last~1s)=$micPeakInWindow (0=silence, PCM16 max=32767)")
            micPeakInWindow = 0
        }
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
    }
}
