package com.bhaktichat.app.ui.screens.voice

import android.media.AudioManager
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.remote.VoiceRealtimeClient
import com.bhaktichat.app.data.remote.VoiceSessionApi
import com.bhaktichat.app.domain.AppLanguage
import com.bhaktichat.app.domain.Guide
import com.bhaktichat.app.domain.VoiceCallState
import com.bhaktichat.app.util.VoiceAudioFocusManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class VoiceUiState(
    val guideName: String,
    val guideProfileImageRes: Int,
    val callState: VoiceCallState = VoiceCallState.Idle,
    val assistantCaption: String = "",
    val userCaption: String = "",
    val micLevel: Float = 0f,
    val micWarning: String? = null,
    val errorMessage: String? = null
)

/**
 * Owns the full lifecycle of one Voice Mode call for a single guide/thread — the
 * WebSocket connection, audio capture/playback, and audio focus all live behind
 * [VoiceRealtimeClient] and [VoiceAudioFocusManager], not in the composable, so they
 * survive rotation via nav-graph scoping (matching ChatThreadViewModel).
 */
class VoiceConversationViewModel(
    private val guide: Guide,
    private var conversationId: String?,
    private val voiceSessionApi: VoiceSessionApi,
    private val realtimeClient: VoiceRealtimeClient,
    private val audioFocusManager: VoiceAudioFocusManager,
    private val language: AppLanguage
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        VoiceUiState(guideName = guide.displayName, guideProfileImageRes = guide.profileImageRes)
    )
    val uiState: StateFlow<VoiceUiState> = _uiState.asStateFlow()

    private var callStartMillis = 0L
    private var hasStarted = false

    init {
        viewModelScope.launch {
            realtimeClient.state.collect { callState ->
                _uiState.update {
                    it.copy(
                        callState = callState,
                        errorMessage = if (callState is VoiceCallState.Error) {
                            "आवाज़ से बातचीत में समस्या हुई। कृपया फिर प्रयास करें।"
                        } else {
                            it.errorMessage
                        }
                    )
                }
            }
        }
        viewModelScope.launch {
            realtimeClient.assistantCaption.collect { caption ->
                _uiState.update { it.copy(assistantCaption = caption) }
            }
        }
        viewModelScope.launch {
            realtimeClient.userCaption.collect { caption ->
                _uiState.update { it.copy(userCaption = caption) }
            }
        }
        viewModelScope.launch {
            realtimeClient.micLevel.collect { level ->
                _uiState.update { it.copy(micLevel = level) }
            }
        }
        viewModelScope.launch {
            realtimeClient.micWarning.collect { warning ->
                _uiState.update { it.copy(micWarning = warning) }
            }
        }
        realtimeClient.onTurnComplete = { userTranscript, assistantTranscript ->
            viewModelScope.launch {
                val durationSeconds = ((System.currentTimeMillis() - callStartMillis) / 1000.0)
                    .takeIf { it > 0 }
                voiceSessionApi.reportTurnComplete(
                    guideId = guide.serverPromptKey,
                    conversationId = conversationId,
                    userTranscript = userTranscript,
                    assistantTranscript = assistantTranscript,
                    durationSeconds = durationSeconds
                ).onSuccess { newConversationId -> conversationId = newConversationId }
            }
        }
    }

    /** Call once RECORD_AUDIO permission is confirmed granted. */
    fun start() {
        if (hasStarted) return
        hasStarted = true
        callStartMillis = System.currentTimeMillis()

        val focusGranted = audioFocusManager.request { focusChange -> handleAudioFocusChange(focusChange) }
        if (!focusGranted) {
            _uiState.update { it.copy(errorMessage = "आवाज़ शुरू नहीं हो सकी। कृपया फिर प्रयास करें।") }
            hasStarted = false
            return
        }

        viewModelScope.launch {
            voiceSessionApi.startSession(guide.serverPromptKey)
                .onSuccess { session ->
                    realtimeClient.connect(session.ephemeralKey, session.model, guide.openingScene(language))
                }
                .onFailure {
                    _uiState.update { it.copy(errorMessage = "आवाज़ से बातचीत शुरू नहीं हो सकी। कृपया फिर प्रयास करें।") }
                }
        }
    }

    private fun handleAudioFocusChange(focusChange: Int) {
        // A real incoming call escalates to AUDIOFOCUS_LOSS almost immediately anyway, so
        // v1 deliberately treats every loss type the same (end the call) rather than
        // building a pause/resume state machine for the rarer transient-only case.
        when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS,
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> endCall()
        }
    }

    /** DEBUG: inject a bundled test utterance to exercise the full loop without a real mic. */
    fun injectTestUtterance(pcm: ByteArray) {
        realtimeClient.injectTestUtterance(pcm)
    }

    /** Idempotent — safe to call from the composable's teardown, onCleared(), and audio-focus loss. */
    fun endCall() {
        if (!hasStarted) return
        hasStarted = false
        realtimeClient.endCall()
        audioFocusManager.release()
    }

    override fun onCleared() {
        endCall()
    }
}

class VoiceConversationViewModelFactory(
    private val guide: Guide,
    private val conversationId: String?,
    private val voiceSessionApi: VoiceSessionApi,
    private val voiceWebSocketClient: okhttp3.OkHttpClient,
    private val audioFocusManager: VoiceAudioFocusManager,
    private val language: AppLanguage
) : ViewModelProvider.Factory {
    // VoiceRealtimeClient holds per-call socket/audio state (guards against being connected
    // twice), so it must be a fresh instance per call — only the underlying OkHttpClient
    // (with its pingInterval config) is a shared, DI-provided dependency.
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return VoiceConversationViewModel(
            guide = guide,
            conversationId = conversationId,
            voiceSessionApi = voiceSessionApi,
            realtimeClient = VoiceRealtimeClient(voiceWebSocketClient),
            audioFocusManager = audioFocusManager,
            language = language
        ) as T
    }
}
