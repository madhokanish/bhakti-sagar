package com.bhaktichat.app.util

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build

/**
 * Requests audio focus for a Voice Mode call so other apps' audio (music, etc.) pauses while
 * the call is active.
 *
 * Deliberately does NOT switch the device into `MODE_IN_COMMUNICATION` or force speakerphone
 * routing. That telephony-style path proved unreliable on real hardware — it could route the
 * guide's voice to the earpiece (so nothing played on the speaker) and interfere with mic
 * capture. Playback now uses `USAGE_MEDIA`, which plays out the loudspeaker at media volume on
 * its own, and capture uses `VOICE_RECOGNITION`; neither needs communication mode.
 */
class VoiceAudioFocusManager(context: Context) {
    private val appContext = context.applicationContext
    private val audioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var focusRequest: AudioFocusRequest? = null
    private var legacyFocusListener: AudioManager.OnAudioFocusChangeListener? = null

    /** Returns true if focus was granted. [onFocusChange] receives AudioManager.AUDIOFOCUS_* values. */
    fun request(onFocusChange: (Int) -> Unit): Boolean {
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attrs)
                .setOnAudioFocusChangeListener(onFocusChange)
                .build()
            focusRequest = req
            audioManager.requestAudioFocus(req) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        } else {
            val listener = AudioManager.OnAudioFocusChangeListener { onFocusChange(it) }
            legacyFocusListener = listener
            @Suppress("DEPRECATION")
            audioManager.requestAudioFocus(
                listener,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            ) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        }
    }

    fun release() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
        } else {
            legacyFocusListener?.let {
                @Suppress("DEPRECATION")
                audioManager.abandonAudioFocus(it)
            }
        }
        focusRequest = null
        legacyFocusListener = null
    }
}
