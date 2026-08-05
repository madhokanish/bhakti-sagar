package com.bhaktichat.app.util

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Process
import android.util.Log
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Captures microphone audio for Voice Mode and delivers raw PCM16 mono @ 24kHz — the format
 * OpenAI's Realtime API expects for `input_audio_buffer.append` events.
 *
 * Capture strategy (mirrors the iOS implementation, which is proven working): record at the
 * hardware-guaranteed 48kHz and downsample 2:1 to 24kHz in software, rather than asking the
 * OEM HAL for a non-native 24kHz stream (a known source of silent-capture bugs on real
 * devices; the CDD mandates 48kHz mono PCM16 on every device).
 *
 * Self-healing source selection: starts with [MediaRecorder.AudioSource.VOICE_RECOGNITION]
 * (designed for speech-to-recognizer capture). If the mic delivers nothing but digital
 * silence for the first couple of seconds — the exact "voice mode is deaf" production
 * symptom, seen when an OEM gates a source or routing sends input to a dead endpoint — it
 * automatically tears down and retries with the plain [MediaRecorder.AudioSource.MIC]
 * source. If that is also silent, [onMicAppearsDead] fires so the UI can tell the user
 * instead of pretending to listen. Echo is handled by the caller's half-duplex gate, so the
 * telephony-style VOICE_COMMUNICATION pipeline is deliberately avoided entirely.
 */
class VoiceAudioCapture {
    private var audioRecord: AudioRecord? = null
    private var captureThread: Thread? = null
    private val isRunning = AtomicBoolean(false)

    /**
     * @param onAudioChunk delivers PCM16 mono @ 24kHz: (bytes, length, peakAmplitude 0..32767)
     * @param onError called once with a human-readable message if capture cannot start at all
     * @param onMicAppearsDead called once if every capture source yields only silence — the UI
     *   should surface this rather than showing a deaf "Listening".
     */
    fun start(
        onAudioChunk: (ByteArray, Int, Int) -> Unit,
        onError: (String) -> Unit = {},
        onMicAppearsDead: () -> Unit = {}
    ) {
        if (isRunning.get()) return
        isRunning.set(true)

        captureThread = Thread({
            Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)

            val sources = listOf(
                MediaRecorder.AudioSource.VOICE_RECOGNITION to "VOICE_RECOGNITION",
                MediaRecorder.AudioSource.MIC to "MIC"
            )
            var micConfirmedAlive = false
            var notifiedDead = false

            for ((index, sourcePair) in sources.withIndex()) {
                if (!isRunning.get()) break
                val (source, sourceName) = sourcePair
                val isLastSource = index == sources.size - 1

                val opened = openRecord(source, sourceName)
                if (opened == null) {
                    if (isLastSource && !micConfirmedAlive) {
                        isRunning.set(false)
                        onError("Microphone unavailable. Please restart the call.")
                        return@Thread
                    }
                    continue
                }
                val (record, captureRate) = opened
                audioRecord = record

                record.startRecording()
                if (record.recordingState != AudioRecord.RECORDSTATE_RECORDING) {
                    // startRecording() failed silently (mic policy/busy). Without this check
                    // the loop would spin forever while the UI claims to be listening.
                    Log.e(TAG, "[$sourceName] startRecording() did not enter RECORDING state")
                    record.release()
                    audioRecord = null
                    if (isLastSource) {
                        isRunning.set(false)
                        onError("Microphone is unavailable (another app may be using it).")
                        return@Thread
                    }
                    continue
                }
                Log.i(TAG, "Recording started: source=$sourceName rate=$captureRate")

                val downsample = captureRate == 48_000
                // Read 20ms at the capture rate; after 2:1 decimation this yields 20ms @ 24kHz
                // (960 bytes), matching what the realtime session expects per append.
                val readBuf = ByteArray(if (downsample) CHUNK_BYTES_24K * 2 else CHUNK_BYTES_24K)
                val outBuf = ByteArray(CHUNK_BYTES_24K)
                var silentMillis = 0L
                var switchSource = false

                while (isRunning.get() && !switchSource) {
                    val n = record.read(readBuf, 0, readBuf.size)
                    if (n <= 0) {
                        if (n < 0) Log.w(TAG, "[$sourceName] read() error $n")
                        continue
                    }
                    val outLen: Int
                    val outArr: ByteArray
                    if (downsample) {
                        outLen = decimate2to1(readBuf, n, outBuf)
                        outArr = outBuf
                    } else {
                        outLen = n
                        outArr = readBuf
                    }
                    val peak = peakAmplitude(outArr, outLen)

                    if (!micConfirmedAlive) {
                        if (peak > ALIVE_PEAK_THRESHOLD) {
                            micConfirmedAlive = true
                            Log.i(TAG, "[$sourceName] mic confirmed alive (peak=$peak)")
                        } else {
                            silentMillis += CHUNK_MILLIS
                            if (silentMillis >= SILENT_FALLBACK_MILLIS && !isLastSource) {
                                // Pure digital silence — this source is dead on this device.
                                // Fall through to the next source and try again.
                                Log.w(TAG, "[$sourceName] ${silentMillis}ms of pure silence — falling back to next source")
                                switchSource = true
                            } else if (silentMillis >= SILENT_DEAD_MILLIS && isLastSource && !notifiedDead) {
                                notifiedDead = true
                                Log.e(TAG, "[$sourceName] mic silent on every source — notifying UI")
                                onMicAppearsDead()
                            }
                        }
                    }

                    onAudioChunk(outArr, outLen, peak)
                }

                runCatching { record.stop() }
                record.release()
                audioRecord = null

                if (!switchSource) break // normal shutdown (or mic alive and stop() was called)
            }
        }, "voice-capture").apply { start() }
    }

    private fun openRecord(source: Int, sourceName: String): Pair<AudioRecord, Int>? {
        // Preferred: hardware-native 48kHz. Fallback: direct 24kHz.
        for (rate in intArrayOf(48_000, TARGET_SAMPLE_RATE)) {
            val minBuffer = AudioRecord.getMinBufferSize(rate, CHANNEL_IN, ENCODING)
            if (minBuffer == AudioRecord.ERROR || minBuffer == AudioRecord.ERROR_BAD_VALUE) continue
            val record = runCatching {
                AudioRecord(source, rate, CHANNEL_IN, ENCODING, minBuffer * 3)
            }.getOrNull() ?: continue
            if (record.state != AudioRecord.STATE_INITIALIZED) {
                record.release()
                continue
            }
            Log.i(TAG, "AudioRecord initialized: source=$sourceName rate=$rate sessionId=${record.audioSessionId}")
            return record to rate
        }
        Log.w(TAG, "[$sourceName] could not initialize at 48kHz or 24kHz")
        return null
    }

    /**
     * 48kHz→24kHz decimation: averages each adjacent PCM16 sample pair. The averaging acts
     * as a crude low-pass, which is sufficient anti-aliasing for speech feeding a VAD/ASR.
     */
    private fun decimate2to1(input: ByteArray, length: Int, output: ByteArray): Int {
        var inIdx = 0
        var outIdx = 0
        while (inIdx + 3 < length && outIdx + 1 < output.size) {
            val s1 = ((input[inIdx].toInt() and 0xFF) or (input[inIdx + 1].toInt() shl 8)).toShort().toInt()
            val s2 = ((input[inIdx + 2].toInt() and 0xFF) or (input[inIdx + 3].toInt() shl 8)).toShort().toInt()
            val avg = (s1 + s2) / 2
            output[outIdx] = (avg and 0xFF).toByte()
            output[outIdx + 1] = ((avg shr 8) and 0xFF).toByte()
            inIdx += 4
            outIdx += 2
        }
        return outIdx
    }

    private fun peakAmplitude(chunk: ByteArray, length: Int): Int {
        var peak = 0
        var i = 0
        while (i + 1 < length) {
            val sample = ((chunk[i].toInt() and 0xFF) or (chunk[i + 1].toInt() shl 8)).toShort().toInt()
            val amp = kotlin.math.abs(sample)
            if (amp > peak) peak = amp
            i += 2
        }
        return peak
    }

    fun stop() {
        if (!isRunning.compareAndSet(true, false)) return
        // stop() unblocks any pending read() on the capture thread before we release it.
        runCatching { audioRecord?.stop() }
        captureThread?.join(400)
        audioRecord?.release()
        audioRecord = null
        captureThread = null
    }

    companion object {
        private const val TAG = "VoiceAudioCapture"
        const val TARGET_SAMPLE_RATE = 24_000
        private const val CHANNEL_IN = AudioFormat.CHANNEL_IN_MONO
        private const val ENCODING = AudioFormat.ENCODING_PCM_16BIT
        // 20ms @ 24kHz/16-bit mono = 480 samples * 2 bytes.
        private const val CHUNK_BYTES_24K = 960
        private const val CHUNK_MILLIS = 20L
        // Real mics always have a noise floor well above this; only digital silence stays under.
        private const val ALIVE_PEAK_THRESHOLD = 50
        private const val SILENT_FALLBACK_MILLIS = 2_000L
        private const val SILENT_DEAD_MILLIS = 4_000L
    }
}
