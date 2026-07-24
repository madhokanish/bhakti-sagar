package com.bhaktichat.app.util

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Process
import android.util.Log
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Captures microphone audio for Voice Mode as raw PCM16 mono @ 24kHz — the format OpenAI's
 * Realtime API expects for `input_audio_buffer.append` events. Exposes raw chunks via a
 * callback; callers are responsible for base64-encoding/sending (this class only captures).
 *
 * Uses [MediaRecorder.AudioSource.VOICE_RECOGNITION] — the source designed for "capture the
 * user's speech and hand it to a recognizer", which is exactly this use case. It is far more
 * reliable across devices than `VOICE_COMMUNICATION`, which pulls in the platform's telephony
 * echo-cancel/AGC pipeline and (paired with MODE_IN_COMMUNICATION routing) can suppress the
 * mic to near-silence or misroute audio on real hardware. Echo is handled instead by the
 * caller's half-duplex gate (mic muted while the guide speaks), so we don't need — or want —
 * that fragile comm-mode processing here.
 */
class VoiceAudioCapture {
    private var audioRecord: AudioRecord? = null
    private var captureThread: Thread? = null
    private val isRunning = AtomicBoolean(false)

    /** onAudioChunk(bytes, length, peakAmplitude 0..32767 for this chunk). */
    fun start(onAudioChunk: (ByteArray, Int, Int) -> Unit) {
        if (isRunning.get()) return

        val minBuffer = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_IN, ENCODING)
        check(minBuffer != AudioRecord.ERROR && minBuffer != AudioRecord.ERROR_BAD_VALUE) {
            "Unsupported audio capture config on this device"
        }

        val record = AudioRecord(
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            SAMPLE_RATE,
            CHANNEL_IN,
            ENCODING,
            minBuffer * 3
        )
        check(record.state == AudioRecord.STATE_INITIALIZED) { "AudioRecord failed to initialize" }
        audioRecord = record
        Log.d(TAG, "AudioRecord initialized: source=VOICE_RECOGNITION rate=$SAMPLE_RATE sessionId=${record.audioSessionId}")

        isRunning.set(true)
        captureThread = Thread({
            Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)
            val chunk = ByteArray(CHUNK_BYTES)
            record.startRecording()
            Log.d(TAG, "startRecording() called, recordingState=${record.recordingState}")
            var loggedFirstAudio = false
            while (isRunning.get()) {
                val n = record.read(chunk, 0, chunk.size)
                if (n > 0) {
                    val peak = peakAmplitude(chunk, n)
                    if (!loggedFirstAudio && peak > 200) {
                        loggedFirstAudio = true
                        Log.d(TAG, "First real audio detected from mic (peak=$peak) — capture is working.")
                    }
                    onAudioChunk(chunk, n, peak)
                } else if (n < 0) {
                    Log.w(TAG, "AudioRecord.read() returned error $n")
                }
            }
        }, "voice-capture").apply { start() }
    }

    private fun peakAmplitude(chunk: ByteArray, length: Int): Int {
        var peak = 0
        var i = 0
        while (i + 1 < length) {
            val sample = (chunk[i].toInt() and 0xFF) or (chunk[i + 1].toInt() shl 8)
            val amp = kotlin.math.abs(sample)
            if (amp > peak) peak = amp
            i += 2
        }
        return peak
    }

    fun stop() {
        if (!isRunning.compareAndSet(true, false)) return
        // stop() unblocks any pending read() on the capture thread before we release it.
        audioRecord?.stop()
        captureThread?.join(200)
        audioRecord?.release()
        audioRecord = null
        captureThread = null
    }

    companion object {
        private const val TAG = "VoiceAudioCapture"
        const val SAMPLE_RATE = 24_000
        private const val CHANNEL_IN = AudioFormat.CHANNEL_IN_MONO
        private const val ENCODING = AudioFormat.ENCODING_PCM_16BIT
        // 20ms @ 24kHz/16-bit mono = 480 samples * 2 bytes.
        private const val CHUNK_BYTES = 960
    }
}
