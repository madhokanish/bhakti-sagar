import Foundation
import Combine

/// Owns the full lifecycle of one Voice Mode call for a single guide/thread — bootstraps
/// the ephemeral session via our backend, hands off to `VoiceRealtimeClient` for the actual
/// WebSocket/audio work, and persists each finished turn. Mirrors Android's
/// `VoiceConversationViewModel.kt`.
@MainActor
final class VoiceConversationViewModel: ObservableObject {
    @Published private(set) var callState: VoiceCallState = .idle
    @Published private(set) var assistantCaption: String = ""
    @Published private(set) var userCaption: String = ""
    @Published private(set) var errorMessage: String?

    let guide: Guide
    private var conversationId: String?
    private let api: BhaktiAPIClient
    private let realtimeClient = VoiceRealtimeClient()
    private var hasStarted = false
    private var callStartDate: Date?
    private var cancellables = Set<AnyCancellable>()

    init(guide: Guide, conversationId: String?, api: BhaktiAPIClient) {
        self.guide = guide
        self.conversationId = conversationId
        self.api = api

        realtimeClient.$state
            .receive(on: DispatchQueue.main)
            .sink { [weak self] state in
                self?.callState = state
                if case let .error(message) = state {
                    self?.errorMessage = message
                }
            }
            .store(in: &cancellables)

        realtimeClient.$assistantCaption
            .receive(on: DispatchQueue.main)
            .assign(to: &$assistantCaption)

        realtimeClient.$userCaption
            .receive(on: DispatchQueue.main)
            .assign(to: &$userCaption)

        realtimeClient.onTurnComplete = { [weak self] userTranscript, assistantTranscript in
            self?.persistTurn(userTranscript: userTranscript, assistantTranscript: assistantTranscript)
        }
    }

    /// Call once RECORD_AUDIO permission is confirmed granted (the screen requests it before
    /// calling this).
    func start() async {
        guard !hasStarted else { return }
        hasStarted = true
        callStartDate = Date()

        do {
            let session = try await api.mintVoiceSession(guideId: guide.serverPromptKey)
            realtimeClient.connect(ephemeralKey: session.ephemeralKey, model: session.model, openingLine: guide.openingScene)
        } catch {
            errorMessage = error.localizedDescription
            callState = .error(error.localizedDescription)
            hasStarted = false
        }
    }

    private func persistTurn(userTranscript: String, assistantTranscript: String) {
        let durationSeconds = callStartDate.map { Date().timeIntervalSince($0) }
        Task {
            if let newConversationId = try? await api.submitVoiceTurn(
                guideId: guide.serverPromptKey,
                conversationId: conversationId,
                userTranscript: userTranscript,
                assistantTranscript: assistantTranscript,
                durationSeconds: durationSeconds
            ) {
                conversationId = newConversationId
            }
        }
    }

    /// Idempotent — safe to call from the view's teardown and from audio-interruption handling.
    func endCall() {
        guard hasStarted else { return }
        hasStarted = false
        realtimeClient.endCall()
    }
}
