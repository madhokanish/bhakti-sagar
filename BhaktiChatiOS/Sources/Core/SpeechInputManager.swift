import Foundation
#if canImport(Speech) && canImport(AVFoundation) && os(iOS)
import Speech
import AVFoundation

/// Drives on-device dictation backed by `SFSpeechRecognizer`. Used in the chat
/// composer to let users speak their prompt instead of typing.
@MainActor
final class SpeechInputManager: ObservableObject {
    @Published var transcribedText: String = ""
    @Published var isRecording: Bool = false
    @Published var error: String? = nil

    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionTask: SFSpeechRecognitionTask?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private let audioEngine = AVAudioEngine()

    func toggleRecording() async {
        if isRecording {
            stop()
        } else {
            await start()
        }
    }

    private func start() async {
        error = nil
        transcribedText = ""

        // 1. Speech recognition authorization
        let speechAuth: SFSpeechRecognizerAuthorizationStatus = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }
        guard speechAuth == .authorized else {
            error = "Speech recognition permission is required."
            return
        }

        // 2. Microphone authorization
        let micGranted: Bool = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
        guard micGranted else {
            error = "Microphone permission is required."
            return
        }

        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            error = "Speech recognizer is not available right now."
            return
        }

        // 3. Configure audio session
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.record, mode: .measurement, options: .duckOthers)
            try session.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            self.error = "Could not start audio session: \(error.localizedDescription)"
            return
        }

        // 4. Prepare request & tap the input node
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        recognitionRequest = request

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            self.error = "Could not start audio engine: \(error.localizedDescription)"
            stop()
            return
        }

        isRecording = true

        // 5. Start the recognition task — capture partial transcriptions as they arrive
        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, taskError in
            Task { @MainActor in
                guard let self else { return }
                if let result {
                    self.transcribedText = result.bestTranscription.formattedString
                    if result.isFinal {
                        self.stop()
                    }
                }
                if taskError != nil {
                    self.stop()
                }
            }
        }
    }

    func stop() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
        isRecording = false
    }
}

#else

/// No-op fallback for platforms without Speech / AVFoundation (e.g. macOS previews).
@MainActor
final class SpeechInputManager: ObservableObject {
    @Published var transcribedText: String = ""
    @Published var isRecording: Bool = false
    @Published var error: String? = "Speech input is not supported on this platform."

    func toggleRecording() async {}
    func stop() {}
}

#endif
