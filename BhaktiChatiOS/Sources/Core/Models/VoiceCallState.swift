import Foundation

/// Mirrors Android's `domain/VoiceCallState.kt`.
enum VoiceCallState: Equatable {
    case idle
    case connecting
    case listening
    case userSpeaking
    case thinking
    case guideSpeaking
    case error(String)
    case ended
}
