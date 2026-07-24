package com.bhaktichat.app.util

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Process
import android.util.Log
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

/**
 * Plays the guide's spoken reply for Voice Mode — continuously-arriving PCM16 mono @ 24kHz
 * chunks from OpenAI's Realtime API (`response.output_audio.delta` events), not a discrete
 * audio file. Runs its own playback thread so the WebSocket's message-handling thread is
 * never blocked by [AudioTrack.write].
 *
 * The queue is deliberately UNBOUNDED: the server sends a reply's audio in a burst far
 * faster than realtime playback drains it. The previous bounded queue (64 chunks) silently
 * dropped whatever didn't fit — heard as stuttery/"slow" speech that cut off mid-sentence
 * on real networks. iOS's AVAudioPlayerNode buffers unboundedly, which is why it never had
 * this bug; a full minute of PCM16@24kHz is only ~2.9MB, so memory is a non-issue.
 */
class VoiceAudioPlayer {
    private var audioTrack: AudioTrack? = null
    private var playbackThread: Thread? = null
    private val isRunning = AtomicBoolean(false)
    private val queue = LinkedBlockingQueue<ByteArray>()

    // Frames written to the track since the last flush; compared against the actual playback
    // head so we can tell when the guide has *finished being heard*, not just finished
    // generating (generation completes ~1-2s before the buffered audio finishes playing).
    private val framesWritten = AtomicLong(0)
    private val generationComplete = AtomicBoolean(false)

    /** Fired on the playback thread once the last generated audio has actually been played out. */
    var onGuideFinishedSpeaking: (() -> Unit)? = null

    fun start() {
        if (isRunning.get()) return

        val minBuffer = AudioTrack.getMinBufferSize(SAMPLE_RATE, CHANNEL_OUT, ENCODING)
        val track = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
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
            // Generous buffer to ride out scheduling jitter — underruns here are audible as
            // stutter. Barge-in latency is unaffected: interruptNow() pause+flushes.
            .setBufferSizeInBytes(minBuffer * 4)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()
        audioTrack = track

        isRunning.set(true)
        playbackThread = Thread({
            Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)
            track.play()
            var loggedFirstAudio = false
            while (isRunning.get()) {
                val bytes = queue.poll(20, TimeUnit.MILLISECONDS)
                if (bytes != null) {
                    if (!loggedFirstAudio) {
                        loggedFirstAudio = true
                        Log.i(TAG, "First guide audio written to speaker (${bytes.size} bytes).")
                    }
                    track.write(bytes, 0, bytes.size, AudioTrack.WRITE_BLOCKING)
                    framesWritten.addAndGet((bytes.size / 2).toLong()) // PCM16 mono: 2 bytes/frame
                } else if (generationComplete.get()) {
                    // Queue drained and the model is done generating — has the audio actually
                    // been *heard* yet? The playback head lags what we've written by the track's
                    // internal buffer. Only signal "done speaking" once it catches up.
                    val head = track.playbackHeadPosition.toLong() and 0xFFFFFFFFL
                    if (head >= framesWritten.get()) {
                        generationComplete.set(false)
                        Log.i(TAG, "Guide finished speaking (underruns=${track.underrunCount})")
                        onGuideFinishedSpeaking?.invoke()
                    }
                }
            }
        }, "voice-playback").apply { start() }
    }

    /** Queues a chunk for playback. Never blocks and never drops — safe from any thread. */
    fun enqueue(bytes: ByteArray) {
        queue.offer(bytes)
    }

    /** Signals that no more audio will arrive for the current reply, so the playback thread can
     *  watch for the moment the buffered audio finishes playing and fire [onGuideFinishedSpeaking]. */
    fun markGenerationComplete() {
        generationComplete.set(true)
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
        // flush() resets the playback head to 0, so the written-frame counter must reset too,
        // and a barge-in must not later fire a stale "finished speaking" for the killed reply.
        framesWritten.set(0)
        generationComplete.set(false)
        track.play()
    }

    fun stop() {
        if (!isRunning.compareAndSet(true, false)) return
        generationComplete.set(false)
        framesWritten.set(0)
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
        private const val TAG = "VoiceAudioPlayer"
        const val SAMPLE_RATE = 24_000
        private const val CHANNEL_OUT = AudioFormat.CHANNEL_OUT_MONO
        private const val ENCODING = AudioFormat.ENCODING_PCM_16BIT
    }
}
