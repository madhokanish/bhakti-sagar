package com.bhaktichat.app.util

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Process
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Plays the guide's spoken reply for Voice Mode — continuously-arriving PCM16 mono @ 24kHz
 * chunks from OpenAI's Realtime API (`response.output_audio.delta` events), not a discrete
 * audio file. Runs a bounded queue on its own thread so the WebSocket's message-handling
 * thread is never blocked by [AudioTrack.write] — blocking there would delay processing of
 * the very next event, which might be the interruption signal that needs to mute playback.
 */
class VoiceAudioPlayer {
    private var audioTrack: AudioTrack? = null
    private var playbackThread: Thread? = null
    private val isRunning = AtomicBoolean(false)
    private val queue = ArrayBlockingQueue<ByteArray>(64)

    fun start() {
        if (isRunning.get()) return

        val minBuffer = AudioTrack.getMinBufferSize(SAMPLE_RATE, CHANNEL_OUT, ENCODING)
        val track = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(CHANNEL_OUT)
                    .setEncoding(ENCODING)
                    .build()
            )
            // Kept small deliberately — barge-in must feel near-instant, and a larger
            // buffer means more already-queued audio to flush on interruption.
            .setBufferSizeInBytes(minBuffer * 2)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()
        audioTrack = track

        isRunning.set(true)
        playbackThread = Thread({
            Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)
            track.play()
            while (isRunning.get()) {
                val bytes = queue.poll(50, TimeUnit.MILLISECONDS) ?: continue
                track.write(bytes, 0, bytes.size, AudioTrack.WRITE_BLOCKING)
            }
        }, "voice-playback").apply { start() }
    }

    /** Queues a chunk for playback. Never blocks — safe to call from a WebSocket callback thread. */
    fun enqueue(bytes: ByteArray) {
        queue.offer(bytes)
    }

    /**
     * Stops playback immediately (barge-in) without tearing down the track — call this the
     * moment the user starts talking over the guide, optimistically, before waiting for the
     * server's own interruption confirmation event.
     */
    fun interruptNow() {
        val track = audioTrack ?: return
        queue.clear()
        if (track.playState == AudioTrack.PLAYSTATE_PLAYING) {
            track.pause()
            track.flush()
        }
        track.play()
    }

    fun stop() {
        if (!isRunning.compareAndSet(true, false)) return
        queue.clear()
        playbackThread?.join(200)
        audioTrack?.let { track ->
            if (track.playState == AudioTrack.PLAYSTATE_PLAYING) track.pause()
            track.flush()
            track.stop()
            track.release()
        }
        audioTrack = null
        playbackThread = null
    }

    companion object {
        const val SAMPLE_RATE = 24_000
        private const val CHANNEL_OUT = AudioFormat.CHANNEL_OUT_MONO
        private const val ENCODING = AudioFormat.ENCODING_PCM_16BIT
    }
}
