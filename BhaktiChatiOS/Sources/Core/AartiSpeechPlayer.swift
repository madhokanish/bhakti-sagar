import Foundation
#if canImport(AVFoundation)
import AVFoundation

/// Plays aarti lyrics aloud using `AVSpeechSynthesizer`. Designed to be observed by
/// SwiftUI views so they can toggle the play/stop affordance accordingly.
@MainActor
final class AartiSpeechPlayer: NSObject, ObservableObject {
    @Published var isSpeaking: Bool = false

    private let synthesizer = AVSpeechSynthesizer()

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func speak(text: String, language: String = "en-IN") {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        // Configure a playback-friendly audio session on iOS so the speech is audible
        // even when the device is on silent.
        #if os(iOS)
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try? session.setActive(true, options: [])
        #endif

        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }

        let utterance = AVSpeechUtterance(string: trimmed)
        utterance.voice = AVSpeechSynthesisVoice(language: language)
            ?? AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.95
        utterance.pitchMultiplier = 1.0
        utterance.postUtteranceDelay = 0.2
        synthesizer.speak(utterance)
    }

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
        isSpeaking = false
    }

    func toggle(text: String, language: String = "en-IN") {
        if isSpeaking {
            stop()
        } else {
            speak(text: text, language: language)
        }
    }
}

extension AartiSpeechPlayer: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = true }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = false }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = false }
    }
}

#else

@MainActor
final class AartiSpeechPlayer: ObservableObject {
    @Published var isSpeaking: Bool = false
    func speak(text: String, language: String = "en-IN") {}
    func stop() {}
    func toggle(text: String, language: String = "en-IN") {}
}

#endif
