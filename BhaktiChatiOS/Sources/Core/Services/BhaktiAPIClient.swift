import Foundation

final class BhaktiAPIClient {
    private let baseURL: URL
    private let session: URLSession

    init(baseURL: URL = AppConfig.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func loadConversation(
        guideId: String,
        conversationId: String? = nil,
        forceNewConversation: Bool = false,
        chatLang: String = "en"
    ) async throws -> LoadConversationResult {
        Telemetry.track("chat.load_conversation", ["guideId": guideId])
        let start = Telemetry.begin("chat.load_conversation", ["guideId": guideId])
        defer { Telemetry.end("chat.load_conversation", from: start, ["guideId": guideId]) }
        var components = URLComponents(url: baseURL.appending(path: "/api/bhaktigpt/chat"), resolvingAgainstBaseURL: false)
        var items = [
            URLQueryItem(name: "guideId", value: guideId),
            URLQueryItem(name: "chatLang", value: chatLang)
        ]
        if let conversationId, !conversationId.isEmpty {
            items.append(URLQueryItem(name: "conversationId", value: conversationId))
        }
        if forceNewConversation {
            items.append(URLQueryItem(name: "new", value: "1"))
        }
        components?.queryItems = items

        guard let url = components?.url else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            Telemetry.error("chat.load_conversation", message: "bad server response")
            throw URLError(.badServerResponse)
        }
        guard 200..<300 ~= http.statusCode else {
            Telemetry.error("chat.load_conversation", message: "http \(http.statusCode)", metadata: ["guideId": guideId])
            throw APIError.server(code: http.statusCode, message: String(data: data, encoding: .utf8) ?? "Unknown error")
        }

        return try JSONDecoder().decode(LoadConversationResult.self, from: data)
    }

    func streamChat(_ payload: SendChatRequest) -> AsyncThrowingStream<StreamEvent, Error> {
        AsyncThrowingStream { continuation in
            Task {
                let start = Telemetry.begin("chat.stream", ["guideId": payload.guideId])
                var didEnd = false
                var sawFirstToken = false

                func finishStream(_ metadata: [String: String] = [:]) {
                    guard !didEnd else { return }
                    didEnd = true
                    Telemetry.end("chat.stream", from: start, metadata.merging(["guideId": payload.guideId]) { $1 })
                }

                do {
                    Telemetry.track("chat.stream.start", ["guideId": payload.guideId])
                    var request = URLRequest(url: baseURL.appending(path: "/api/bhaktigpt/chat"))
                    request.httpMethod = "POST"
                    request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.httpBody = try JSONEncoder().encode(payload)

                    let (bytes, response) = try await session.bytes(for: request)
                    guard let http = response as? HTTPURLResponse else {
                        Telemetry.error("chat.stream", message: "bad server response", metadata: ["guideId": payload.guideId])
                        throw URLError(.badServerResponse)
                    }
                    guard 200..<300 ~= http.statusCode else {
                        var text = ""
                        for try await line in bytes.lines {
                            text += line
                        }
                        Telemetry.error("chat.stream", message: "http \(http.statusCode)", metadata: ["guideId": payload.guideId])
                        throw APIError.server(
                            code: http.statusCode,
                            message: Self.readableServerMessage(
                                from: Data(text.utf8),
                                response: http,
                                fallback: "Chat stream failed"
                            )
                        )
                    }

                    let contentType = http.value(forHTTPHeaderField: "Content-Type")?.lowercased() ?? ""
                    if contentType.contains("text/event-stream") {
                        try await Self.parseSSE(
                            bytes: bytes,
                            continuation: continuation,
                            onToken: {
                                if !sawFirstToken {
                                    sawFirstToken = true
                                    Telemetry.mark("chat.stream.first_token", from: start, ["guideId": payload.guideId])
                                }
                            },
                            onFinish: { metadata in
                                finishStream(metadata)
                            }
                        )
                    } else {
                        var text = ""
                        for try await line in bytes.lines {
                            text += line
                        }
                        // The plain-JSON fallback body is still structured JSON (matches
                        // Android's non-stream path), not raw prose — decode it rather than
                        // yielding the raw payload as if it were the assistant's reply. This
                        // was surfacing `{"limitReached":true,...}` verbatim in chat bubbles.
                        switch Self.decodePlainChatPayload(text) {
                        case .limitReached:
                            continuation.yield(.limitReached)
                        case let .assistantText(message):
                            if !message.isEmpty { continuation.yield(.token(message)) }
                        case let .rawText(raw):
                            if !raw.isEmpty { continuation.yield(.token(raw)) }
                        }
                        continuation.yield(.done)
                        continuation.finish()
                        finishStream(["mode": "plain"])
                    }
                } catch {
                    Telemetry.error("chat.stream", message: error.localizedDescription, metadata: ["guideId": payload.guideId])
                    finishStream(["result": "error"])
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    func generateDivineImage(
        mode: DivineMode,
        prompt: String,
        inputImageDataURL: String? = nil
    ) async throws -> DivineImageResponse {
        Telemetry.track("divine.generate.start", ["mode": mode.rawValue])
        let start = Telemetry.begin("divine.generate", ["mode": mode.rawValue])
        defer { Telemetry.end("divine.generate", from: start, ["mode": mode.rawValue]) }
        struct Payload: Codable {
            let mode: String
            let prompt: String
            let inputImageDataUrl: String?
            let userKey: String?
            let requestId: String?
        }

        var request = URLRequest(url: baseURL.appending(path: "/api/bhaktigpt/divine-image"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // Generation takes up to 90s server-side (matches Android's dedicated 120s image
        // client) — the default 60s request timeout was cutting this off before completion.
        request.timeoutInterval = 120
        let userKey = AnonUserKey.value
        let requestId = UUID().uuidString
        request.httpBody = try JSONEncoder().encode(
            Payload(
                mode: mode.rawValue,
                prompt: prompt,
                inputImageDataUrl: inputImageDataURL,
                userKey: userKey,
                requestId: requestId
            )
        )

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            Telemetry.error("divine.generate", message: "bad server response", metadata: ["mode": mode.rawValue])
            throw URLError(.badServerResponse)
        }
        guard 200..<300 ~= http.statusCode else {
            Telemetry.error("divine.generate", message: "http \(http.statusCode)", metadata: ["mode": mode.rawValue])
            throw APIError.server(
                code: http.statusCode,
                message: Self.readableServerMessage(
                    from: data,
                    response: http,
                    fallback: "Divine image service is unavailable right now. Please try again later."
                )
            )
        }

        return try JSONDecoder().decode(DivineImageResponse.self, from: data)
    }

    /// Submits A/B test feedback. Fire-and-forget — failures are swallowed.
    func submitDivineImageFeedback(
        requestId: String,
        variant: String,
        rating: String,
        mode: String?,
        userKey: String?
    ) async {
        struct Payload: Codable {
            let requestId: String
            let variant: String
            let rating: String
            let mode: String?
            let userKey: String?
        }
        do {
            var request = URLRequest(url: baseURL.appending(path: "/api/bhaktigpt/divine-image/feedback"))
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(
                Payload(requestId: requestId, variant: variant, rating: rating, mode: mode, userKey: userKey)
            )
            _ = try await session.data(for: request)
        } catch {
            // Silently swallow — feedback is best-effort.
        }
    }

    func fetchChoghadiyaSun(for city: ChoghadiyaCity, date: Date = .now) async throws -> ChoghadiyaSunResponse {
        Telemetry.track("choghadiya.fetch", ["city": city.id])
        let start = Telemetry.begin("choghadiya.fetch", ["city": city.id])
        defer { Telemetry.end("choghadiya.fetch", from: start, ["city": city.id]) }
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: city.tz)
        let day = formatter.string(from: date)

        var components = URLComponents(url: baseURL.appending(path: "/api/choghadiya/sun"), resolvingAgainstBaseURL: false)
        components?.queryItems = [
            .init(name: "lat", value: String(city.lat)),
            .init(name: "lon", value: String(city.lon)),
            .init(name: "date", value: day),
            .init(name: "tz", value: city.tz)
        ]

        guard let url = components?.url else {
            throw URLError(.badURL)
        }

        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse else {
            Telemetry.error("choghadiya.fetch", message: "bad server response", metadata: ["city": city.id])
            throw URLError(.badServerResponse)
        }
        guard 200..<300 ~= http.statusCode else {
            Telemetry.error("choghadiya.fetch", message: "http \(http.statusCode)", metadata: ["city": city.id])
            throw APIError.server(code: http.statusCode, message: String(data: data, encoding: .utf8) ?? "Unknown error")
        }

        return try JSONDecoder().decode(ChoghadiyaSunResponse.self, from: data)
    }

    private static func parseSSE(
        bytes: URLSession.AsyncBytes,
        continuation: AsyncThrowingStream<StreamEvent, Error>.Continuation,
        onToken: () -> Void,
        onFinish: ([String: String]) -> Void
    ) async throws {
        var currentEvent = "message"
        var dataLines: [String] = []
        var shouldFinish = false

        func flushEvent() {
            guard !dataLines.isEmpty else {
                currentEvent = "message"
                return
            }

            let text = dataLines.joined(separator: "\n")
            let json = text.data(using: .utf8).flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }

            switch currentEvent {
            case "token":
                if json?["limitReached"] as? Bool == true {
                    continuation.yield(.limitReached)
                } else {
                    let token = (json?["text"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? text
                    onToken()
                    continuation.yield(.token(token))
                }
            case "meta":
                continuation.yield(.conversationId(json?["conversationId"] as? String))
            case "done":
                continuation.yield(.conversationId(json?["conversationId"] as? String))
                continuation.yield(.done)
                continuation.finish()
                shouldFinish = true
                onFinish(["result": "done"])
            case "error":
                let message = (json?["message"] as? String) ?? "Unable to process your message right now."
                continuation.yield(.error(message))
                continuation.finish()
                shouldFinish = true
                onFinish(["result": "server_error"])
            default:
                continuation.yield(.token(text))
            }

            dataLines.removeAll(keepingCapacity: true)
            currentEvent = "message"
        }

        for try await line in bytes.lines {
            if line.isEmpty {
                flushEvent()
                if shouldFinish { return }
                continue
            }
            if line.hasPrefix("event:") {
                // `URLSession.AsyncBytes.lines` can drop the blank separator lines in SSE
                // responses, so treat a new event header as an implicit boundary.
                flushEvent()
                if shouldFinish { return }
                currentEvent = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces)
            } else if line.hasPrefix("data:") {
                dataLines.append(String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces))
            }
        }

        flushEvent()
        if shouldFinish { return }
        continuation.yield(.done)
        continuation.finish()
        onFinish(["result": "eof"])
    }

    private enum PlainChatPayload {
        case limitReached
        case assistantText(String)
        case rawText(String)
    }

    /// Decodes the non-SSE plain-response body of `/api/bhaktigpt/chat`. That body is still
    /// structured JSON (matches Android's `assistantMessage`/`limitReached` handling in
    /// `OkHttpChatApi.kt`), not raw prose — treating it as raw prose was what surfaced
    /// `{"limitReached":true,...}` verbatim as a chat bubble.
    private static func decodePlainChatPayload(_ text: String) -> PlainChatPayload {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return .rawText(text)
        }
        if json["limitReached"] as? Bool == true {
            return .limitReached
        }
        if let assistantMessage = json["assistantMessage"] as? String {
            return .assistantText(assistantMessage)
        }
        return .rawText(text)
    }

    private static func readableServerMessage(
        from data: Data,
        response: HTTPURLResponse,
        fallback: String
    ) -> String {
        let contentType = response.value(forHTTPHeaderField: "Content-Type")?.lowercased() ?? ""
        let raw = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            if let error = json["error"] as? String, !error.isEmpty {
                return error
            }
            if let errorObject = json["error"] as? [String: Any],
               let message = errorObject["message"] as? String,
               !message.isEmpty {
                return message
            }
            if let message = json["message"] as? String, !message.isEmpty {
                return message
            }
        }

        if contentType.contains("text/html") || raw.lowercased().hasPrefix("<!doctype html") {
            return fallback
        }

        if raw.isEmpty {
            return fallback
        }

        return String(raw.prefix(220))
    }
}

enum APIError: Error, LocalizedError {
    case server(code: Int, message: String)

    var errorDescription: String? {
        switch self {
        case let .server(code, message):
            return "Server error (\(code)): \(message)"
        }
    }
}

/// Stable anonymous identifier used for A/B test bucketing when there's
/// no authenticated user. Persisted in UserDefaults so it survives launches.
enum AnonUserKey {
    private static let defaultsKey = "bhakti_anon_user_key"

    static var value: String {
        let defaults = UserDefaults.standard
        if let existing = defaults.string(forKey: defaultsKey), !existing.isEmpty {
            return existing
        }
        let fresh = UUID().uuidString
        defaults.set(fresh, forKey: defaultsKey)
        return fresh
    }
}
