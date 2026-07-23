package com.bhaktichat.app.domain

/** Lifecycle/turn state of a live Voice Mode call (OpenAI Realtime API session). */
sealed class VoiceCallState {
    data object Idle : VoiceCallState()
    data object Connecting : VoiceCallState()
    data object Listening : VoiceCallState()
    data object UserSpeaking : VoiceCallState()
    data object Thinking : VoiceCallState()
    data object GuideSpeaking : VoiceCallState()
    data class Error(val message: String) : VoiceCallState()
    data object Ended : VoiceCallState()
}
