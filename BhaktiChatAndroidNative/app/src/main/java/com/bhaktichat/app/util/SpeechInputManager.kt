package com.bhaktichat.app.util

import com.bhaktichat.app.ui.i18n.str

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale

/**
 * Thin wrapper over [SpeechRecognizer] that exposes a single observable state and
 * a one-shot result callback. The manager keeps its own recognizer instance and must
 * be [release]d when the owning composable leaves the composition.
 */
class SpeechInputManager(
    private val context: Context,
    private val languageStore: LanguageStore
) {

    data class VoiceState(
        val isRecording: Boolean = false,
        val partialText: String = "",
        val error: String? = null
    )

    private val _state = MutableStateFlow(VoiceState())
    val state: StateFlow<VoiceState> = _state.asStateFlow()

    private var recognizer: SpeechRecognizer? = null
    private var onResultCallback: ((String) -> Unit)? = null

    fun isAvailable(): Boolean = SpeechRecognizer.isRecognitionAvailable(context)

    /** Toggles between [start] and [stop] — mirrors iOS SpeechInputManager.toggle(). */
    fun toggle(onResult: (String) -> Unit) {
        if (_state.value.isRecording) {
            stop()
        } else {
            start(onResult)
        }
    }

    fun start(onResult: (String) -> Unit) {
        if (_state.value.isRecording) return
        // Permission gate — surface a friendly state instead of crashing the recognizer.
        // The caller is still responsible for requesting RECORD_AUDIO via a launcher.
        val granted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
        if (!granted) {
            _state.value = VoiceState(error = languageStore.str("speech_mic_permission"))
            return
        }
        if (!isAvailable()) {
            _state.value = VoiceState(error = languageStore.str("speech_unavailable"))
            return
        }

        onResultCallback = onResult
        val instance = recognizer ?: SpeechRecognizer.createSpeechRecognizer(context).also {
            recognizer = it
        }

        instance.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                _state.value = _state.value.copy(isRecording = true, error = null)
            }

            override fun onBeginningOfSpeech() {}

            override fun onRmsChanged(rmsdB: Float) {}

            override fun onBufferReceived(buffer: ByteArray?) {}

            override fun onEndOfSpeech() {
                _state.value = _state.value.copy(isRecording = false)
            }

            override fun onError(error: Int) {
                _state.value = VoiceState(error = errorMessage(error))
            }

            override fun onResults(results: Bundle?) {
                val text = results
                    ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    ?.firstOrNull()
                    .orEmpty()
                _state.value = VoiceState(isRecording = false, partialText = text)
                if (text.isNotBlank()) {
                    onResultCallback?.invoke(text)
                }
            }

            override fun onPartialResults(partialResults: Bundle?) {
                val text = partialResults
                    ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    ?.firstOrNull()
                    .orEmpty()
                if (text.isNotBlank()) {
                    _state.value = _state.value.copy(partialText = text)
                }
            }

            override fun onEvent(eventType: Int, params: Bundle?) {}
        })

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
            )
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.forLanguageTag("hi-IN").toLanguageTag())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }

        runCatching { instance.startListening(intent) }
            .onFailure { _state.value = VoiceState(error = languageStore.str("speech_start_failed")) }
    }

    fun stop() {
        recognizer?.stopListening()
        _state.value = _state.value.copy(isRecording = false)
    }

    fun release() {
        runCatching { recognizer?.destroy() }
        recognizer = null
        onResultCallback = null
        _state.value = VoiceState()
    }

    private fun errorMessage(code: Int): String = when (code) {
        SpeechRecognizer.ERROR_AUDIO -> languageStore.str("speech_audio_error")
        SpeechRecognizer.ERROR_CLIENT -> languageStore.str("speech_generic_error")
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> languageStore.str("speech_mic_permission")
        SpeechRecognizer.ERROR_NETWORK -> languageStore.str("speech_network_error")
        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> languageStore.str("speech_timeout")
        SpeechRecognizer.ERROR_NO_MATCH -> languageStore.str("speech_no_match")
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> languageStore.str("speech_busy")
        SpeechRecognizer.ERROR_SERVER -> languageStore.str("speech_service_error")
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> languageStore.str("speech_no_speech")
        else -> languageStore.str("speech_generic_error")
    }
}
