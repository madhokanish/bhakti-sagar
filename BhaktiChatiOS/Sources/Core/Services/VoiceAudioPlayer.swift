import Foundation
#if os(iOS)
import AVFoundation

/// Plays the guide's spoken reply for Voice Mode — continuously-arriving PCM16 mono @ 24kHz
/// chunks from OpenAI's Realtime API (`response.output_audio.delta` events). Uses
/// `AVAudioEngine` + `AVAudioPlayerNode`; each scheduled buffer's `.dataPlayedBack`
/// completion fires once that buffer has actually been rendered to the speaker — not merely
/// consumed off the queue — so `onGuideFinishedSpeaking` only fires once the guide has truly
/// been heard, not the moment the model finishes generating. Mirrors Android's
/// `util/VoiceAudioPlayer.kt` (which achieves the same thing via `AudioTrack`'s playback-head
/// position).
final class VoiceAudioPlayer {
    private let engine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    private var isRunning = false

    // Bumped on every interrupt/stop so a completion handler from a buffer that was
    // superseded by a barge-in can't fire a stale "finished speaking" signal.
    private var generation = 0
    private var pendingBufferCount = 0
    private var isGenerationComplete = false

    var onGuideFinishedSpeaking: (() -> Void)?

    private static let format = VoiceAudioCapture.targetFormat

    func start() {
        guard !isRunning else { return }
        engine.attach(playerNode)
        engine.connect(playerNode, to: engine.mainMixerNode, format: Self.format)
        engine.prepare()
        do {
            try engine.start()
            playerNode.play()
            isRunning = true
        } catch {
            // isRunning stays false; enqueue() becomes a no-op below.
        }
    }

    /// Queues a chunk for playback. Safe to call from any thread — completion handling
    /// always hops back to main before touching shared state.
    func enqueue(_ data: Data) {
        guard isRunning else { return }
        let frameCount = UInt32(data.count / MemoryLayout<Int16>.size)
        guard frameCount > 0,
              let buffer = AVAudioPCMBuffer(pcmFormat: Self.format, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount
        data.withUnsafeBytes { raw in
            guard let source = raw.bindMemory(to: Int16.self).baseAddress,
                  let dest = buffer.int16ChannelData?[0] else { return }
            dest.update(from: source, count: Int(frameCount))
        }

        let bufferGeneration = generation
        pendingBufferCount += 1
        playerNode.scheduleBuffer(buffer, completionCallbackType: .dataPlayedBack) { [weak self] _ in
            DispatchQueue.main.async {
                guard let self, bufferGeneration == self.generation else { return }
                self.pendingBufferCount = max(0, self.pendingBufferCount - 1)
                if self.pendingBufferCount == 0 && self.isGenerationComplete {
                    self.isGenerationComplete = false
                    self.onGuideFinishedSpeaking?()
                }
            }
        }
    }

    /// Signals that no more audio will arrive for the current reply. Once every already-
    /// scheduled buffer has actually finished playing, `onGuideFinishedSpeaking` fires.
    func markGenerationComplete() {
        isGenerationComplete = true
        if pendingBufferCount == 0 {
            isGenerationComplete = false
            onGuideFinishedSpeaking?()
        }
    }

    /// Stops playback immediately (barge-in) — call the moment the user starts talking over
    /// the guide, optimistically, before waiting for the server's own interruption event.
    func interruptNow() {
        generation += 1
        pendingBufferCount = 0
        isGenerationComplete = false
        playerNode.stop()
        playerNode.play()
    }

    func stop() {
        guard isRunning else { return }
        isRunning = false
        generation += 1
        pendingBufferCount = 0
        isGenerationComplete = false
        playerNode.stop()
        engine.stop()
    }
}
#else
final class VoiceAudioPlayer {
    var onGuideFinishedSpeaking: (() -> Void)?
    func start() {}
    func enqueue(_ data: Data) {}
    func markGenerationComplete() {}
    func interruptNow() {}
    func stop() {}
}
#endif
