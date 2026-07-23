package com.bhaktichat.app.util

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Process
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Captures microphone audio for Voice Mode as raw PCM16 mono @ 24kHz — the format OpenAI's
 * Realtime API expects for `input_audio_buffer.append` events. Exposes raw chunks via a
 * callback; callers are responsible for base64-encoding/sending (this class only captures).
 *
 * Uses [MediaRecorder.AudioSource.VOICE_COMMUNICATION], not `MIC` — this pairs with
 * [VoiceAudioPlayer]'s `USAGE_VOICE_COMMUNICATION` output for platform echo cancellation.
 * Without this pairing, the guide's own spoken reply bleeds into the mic on speakerphone
 * and can false-trigger the server's voice-activity detection as a user interruption.
 */
class VoiceAudioCapture {
    private var audioRecord: AudioRecord? = null
    private var captureThread: Thread? = null
    private val isRunning = AtomicBoolean(false)

    fun start(onAudioChunk: (ByteArray, Int) -> Unit) {
        if (isRunning.get()) return

        val minBuffer = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_IN, ENCODING)
        check(minBuffer != AudioRecord.ERROR && minBuffer != AudioRecord.ERROR_BAD_VALUE) {
            "Unsupported audio capture config on this device"
        }

        val record = AudioRecord(
            MediaRecorder.AudioSource.VOICE_COMMUNICATION,
            SAMPLE_RATE,
            CHANNEL_IN,
            ENCODING,
            minBuffer * 3
        )
        check(record.state == AudioRecord.STATE_INITIALIZED) { "AudioRecord failed to initialize" }
        audioRecord = record

        isRunning.set(true)
        captureThread = Thread({
            Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)
            val chunk = ByteArray(CHUNK_BYTES)
            record.startRecording()
            while (isRunning.get()) {
                val n = record.read(chunk, 0, chunk.size)
                if (n > 0) {
                    onAudioChunk(chunk, n)
                }
            }
        }, "voice-capture").apply { start() }
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
        const val SAMPLE_RATE = 24_000
        private const val CHANNEL_IN = AudioFormat.CHANNEL_IN_MONO
        private const val ENCODING = AudioFormat.ENCODING_PCM_16BIT
        // 20ms @ 24kHz/16-bit mono = 480 samples * 2 bytes.
        private const val CHUNK_BYTES = 960
    }
}
