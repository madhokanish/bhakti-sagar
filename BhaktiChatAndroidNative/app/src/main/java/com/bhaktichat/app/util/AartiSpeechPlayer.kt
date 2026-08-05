package com.bhaktichat.app.util

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale

/**
 * Lightweight wrapper around Android's [TextToSpeech] for reading aarti lyrics aloud.
 *
 * - [onReady] fires once the engine is initialized.
 * - [onCompleted] fires on the main intent each time a speak() call finishes (or errors).
 */
class AartiSpeechPlayer(
    context: Context,
    private val onReady: () -> Unit = {},
    private val onCompleted: () -> Unit = {}
) {
    private var tts: TextToSpeech? = null
    var isReady: Boolean = false
        private set

    private val _isSpeaking = MutableStateFlow(false)
    /** Observable mirror of TTS playback — mirrors iOS AartiSpeechPlayer.isSpeaking. */
    val isSpeaking: StateFlow<Boolean> = _isSpeaking.asStateFlow()

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                isReady = true
                // Aarti lyrics are Devanagari Hindi, so use a Hindi voice when available.
                val target = Locale.forLanguageTag("hi-IN")
                val available = tts?.isLanguageAvailable(target) ?: TextToSpeech.LANG_NOT_SUPPORTED
                if (available >= TextToSpeech.LANG_AVAILABLE) {
                    tts?.language = target
                } else {
                    tts?.language = Locale.getDefault()
                }
                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {}
                    override fun onDone(utteranceId: String?) {
                        _isSpeaking.value = false
                        onCompleted()
                    }
                    @Deprecated("Required override")
                    override fun onError(utteranceId: String?) {
                        _isSpeaking.value = false
                        onCompleted()
                    }
                    override fun onError(utteranceId: String?, errorCode: Int) {
                        _isSpeaking.value = false
                        onCompleted()
                    }
                })
                onReady()
            }
        }
    }

    fun speak(text: String) {
        if (!isReady || text.isBlank()) return
        val params = Bundle()
        _isSpeaking.value = true
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, UTTERANCE_ID)
    }

    fun stop() {
        tts?.stop()
        _isSpeaking.value = false
    }

    /** Convenience for toggle-style UI controls (mirrors iOS AartiSpeechPlayer.toggle). */
    fun toggle(text: String) {
        if (_isSpeaking.value) stop() else speak(text)
    }

    fun shutdown() {
        runCatching {
            tts?.stop()
            tts?.shutdown()
        }
        tts = null
        isReady = false
        _isSpeaking.value = false
    }

    companion object {
        private const val UTTERANCE_ID = "aarti"
    }
}
