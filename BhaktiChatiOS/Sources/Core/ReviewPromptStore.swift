import Foundation

/// Decides when to show the "Enjoying BhaktiChat?" pre-prompt, so the native StoreKit review
/// dialog only gets triggered for users who say yes — the OS throttles how often the real
/// dialog can appear (Apple caps it around 3x/year), so we don't want to waste that on someone
/// who'd bounce off it.
///
/// Trigger: at least `messageThreshold` messages sent, or at least `foregroundMinutesThreshold`
/// minutes of accumulated foreground time (not wall-clock time since install — actual time
/// spent with the app open). Shown at most once per app version (resets on update, so a
/// returning happy user can be asked again after later releases).
///
/// Mirrors Android's `util/ReviewPromptStore.kt` — keep both in sync.
@MainActor
final class ReviewPromptStore: ObservableObject {
    // Read-write (not private(set)): SwiftUI's `.alert(_, isPresented:)` needs a writable
    // binding via `$reviewPrompt.shouldShowPrompt`. `.alert` can't be dismissed by an outside
    // tap (unlike `.sheet`), so the only writers in practice are `markPromptShown()` and the
    // alert's own button actions, which also call `markPromptShown()` — never left out of sync.
    @Published var shouldShowPrompt = false

    private let defaults: UserDefaults
    private var foregroundStartedAt: Date?

    private let messageThreshold = 12
    private let foregroundMinutesThreshold = 12.0

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    /// Call once per user message sent (success or not — the ask is about engagement, not luck).
    func recordMessageSent() {
        let next = defaults.integer(forKey: Keys.messagesSent) + 1
        defaults.set(next, forKey: Keys.messagesSent)
        checkEligibility()
    }

    /// Call when the app becomes active (scenePhase → .active).
    func recordForegroundStart() {
        foregroundStartedAt = .now
    }

    /// Call when the app resigns active (scenePhase → .background/.inactive).
    func recordForegroundEnd() {
        guard let startedAt = foregroundStartedAt else { return }
        foregroundStartedAt = nil
        let elapsed = Date.now.timeIntervalSince(startedAt)
        guard elapsed > 0 else { return }
        let total = defaults.double(forKey: Keys.foregroundSeconds) + elapsed
        defaults.set(total, forKey: Keys.foregroundSeconds)
        checkEligibility()
    }

    /// Marks the prompt as shown for this app version — never re-checked again until an update.
    func markPromptShown() {
        defaults.set(currentAppVersion, forKey: Keys.lastShownVersion)
        shouldShowPrompt = false
    }

    private func checkEligibility() {
        guard defaults.string(forKey: Keys.lastShownVersion) != currentAppVersion else { return }

        let messagesSent = defaults.integer(forKey: Keys.messagesSent)
        let foregroundMinutes = defaults.double(forKey: Keys.foregroundSeconds) / 60

        if messagesSent >= messageThreshold || foregroundMinutes >= foregroundMinutesThreshold {
            shouldShowPrompt = true
        }
    }

    private var currentAppVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
    }

    private enum Keys {
        static let messagesSent = "bhakti_review_prompt_messages_sent"
        static let foregroundSeconds = "bhakti_review_prompt_foreground_seconds"
        static let lastShownVersion = "bhakti_review_prompt_last_shown_version"
    }
}
