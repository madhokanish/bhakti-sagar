import Foundation
#if os(iOS)
import AVFoundation

/// Captures microphone audio for Voice Mode as raw PCM16 mono @ 24kHz — the format OpenAI's
/// Realtime API expects for `input_audio_buffer.append` events. iOS mic hardware is never
/// natively 24kHz mono Int16, so every captured buffer is converted via `AVAudioConverter`
/// before being handed to the caller. Mirrors Android's `util/VoiceAudioCapture.kt`.
final class VoiceAudioCapture {
    private let engine = AVAudioEngine()
    private var converter: AVAudioConverter?
    private var isRunning = false

    static let targetFormat = AVAudioFormat(
        commonFormat: .pcmFormatInt16,
        sampleRate: 24_000,
        channels: 1,
        interleaved: true
    )!

    func start(onAudioChunk: @escaping (Data) -> Void) {
        guard !isRunning else { return }

        let inputNode = engine.inputNode
        let hardwareFormat = inputNode.outputFormat(forBus: 0)

        guard let converter = AVAudioConverter(from: hardwareFormat, to: Self.targetFormat) else {
            return
        }
        self.converter = converter

        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: hardwareFormat) { [weak self] buffer, _ in
            self?.convert(buffer: buffer, hardwareFormat: hardwareFormat, onAudioChunk: onAudioChunk)
        }

        engine.prepare()
        do {
            try engine.start()
            isRunning = true
        } catch {
            inputNode.removeTap(onBus: 0)
        }
    }

    private func convert(buffer: AVAudioPCMBuffer, hardwareFormat: AVAudioFormat, onAudioChunk: @escaping (Data) -> Void) {
        guard let converter else { return }
        let ratio = Self.targetFormat.sampleRate / hardwareFormat.sampleRate
        let outputCapacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 32
        guard let outputBuffer = AVAudioPCMBuffer(pcmFormat: Self.targetFormat, frameCapacity: outputCapacity) else {
            return
        }

        var conversionError: NSError?
        var didProvideInput = false
        converter.convert(to: outputBuffer, error: &conversionError) { _, outStatus in
            if didProvideInput {
                outStatus.pointee = .noDataNow
                return nil
            }
            didProvideInput = true
            outStatus.pointee = .haveData
            return buffer
        }

        guard conversionError == nil,
              outputBuffer.frameLength > 0,
              let int16Data = outputBuffer.int16ChannelData else { return }

        let frameLength = Int(outputBuffer.frameLength)
        let data = Data(bytes: int16Data[0], count: frameLength * MemoryLayout<Int16>.size)
        onAudioChunk(data)
    }

    func stop() {
        guard isRunning else { return }
        isRunning = false
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        converter = nil
    }
}
#else
final class VoiceAudioCapture {
    func start(onAudioChunk: @escaping (Data) -> Void) {}
    func stop() {}
}
#endif
