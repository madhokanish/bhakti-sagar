import Foundation
import OSLog

enum Telemetry {
    private static let logger = Logger(subsystem: "com.bhaktichat.ios", category: "app")
    private static let clock = ContinuousClock()
    private static let signposter = OSSignposter(logger: logger)

    struct Span {
        let name: String
        let startedAt: ContinuousClock.Instant
        let state: OSSignpostIntervalState
    }

    static func track(_ name: String, _ metadata: [String: String] = [:]) {
        let payload = metadata.map { "\($0.key)=\($0.value)" }.joined(separator: " ")
        logger.info("event=\(name, privacy: .public) \(payload, privacy: .public)")
    }

    static func error(_ name: String, message: String, metadata: [String: String] = [:]) {
        let payload = metadata.map { "\($0.key)=\($0.value)" }.joined(separator: " ")
        logger.error("error=\(name, privacy: .public) message=\(message, privacy: .public) \(payload, privacy: .public)")
    }

    static func begin(_ name: String, _ metadata: [String: String] = [:]) -> Span {
        track("\(name).begin", metadata)
        return Span(
            name: name,
            startedAt: clock.now,
            state: signposter.beginInterval("Operation", "\(name, privacy: .public)")
        )
    }

    static func end(_ name: String, from span: Span, _ metadata: [String: String] = [:]) {
        let elapsed = elapsedMillis(from: span)
        var payload = metadata
        payload["durationMs"] = String(max(0, elapsed))
        track("\(name).end", payload)
        signposter.endInterval("Operation", span.state, "\(name, privacy: .public)")
    }

    static func mark(_ name: String, from span: Span, _ metadata: [String: String] = [:]) {
        let elapsed = elapsedMillis(from: span)
        var payload = metadata
        payload["durationMs"] = String(max(0, elapsed))
        track("\(name).mark", payload)
    }

    private static func elapsedMillis(from span: Span) -> Int64 {
        let elapsedDuration = span.startedAt.duration(to: clock.now)
        return elapsedDuration.components.seconds * 1000
            + elapsedDuration.components.attoseconds / 1_000_000_000_000_000
    }
}

