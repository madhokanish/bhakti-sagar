import Foundation
import SwiftUI

/// Tracks free-tier usage (messages sent + divine images generated).
///
/// Mirrors Android's EntitlementStore: the app has pivoted to an ad-based
/// model, so all gating below is hard-wired to "unlimited / free" and the
/// paywall is never shown. `isPro` and the StoreKit plumbing (`grantPro()` /
/// `restore()`) are kept so users who already subscribed are still
/// recognized (`SubscriptionManager` reconciles it against StoreKit on
/// launch) — it no longer gates any feature, but is preserved for
/// grandfathering / analytics.
@MainActor
final class EntitlementStore: ObservableObject {

    static let freeMessageQuota: Int = 100
    static let freeImageQuota: Int = 5

    // MARK: Persisted state

    @AppStorage("bhakti_pro_active")          private var proActive: Bool = false
    @AppStorage("bhakti_free_messages_used")  private var messagesUsedStorage: Int = 0
    @AppStorage("bhakti_free_images_used")    private var imagesUsedStorage: Int = 0
    @AppStorage("bhakti_paywall_dismissed_at") private var dismissedAtStorage: Double = 0

    // MARK: Published mirrors (so views can observe)

    @Published private(set) var isPro: Bool = false
    @Published private(set) var messagesUsed: Int = 0
    @Published private(set) var imagesUsed: Int = 0
    @Published var shouldShowPaywall: Bool = false
    /// Records what triggered the paywall so the sheet can show a tailored headline.
    @Published private(set) var paywallTrigger: PaywallTrigger = .manual

    enum PaywallTrigger {
        case manual            // user tapped the PRO pill
        case messageQuota      // hit the message threshold
        case imageQuota        // hit the image threshold
    }

    // MARK: - Hard-limit gating
    //
    // Ad-based model: there are no more free-tier limits (mirrors Android's
    // EntitlementStore). These are hard-wired to the "unlimited / free" answer
    // so every feature is available to every user. The usage counters above
    // still increment (harmless — useful for ad-frequency decisions later),
    // but they no longer gate anything.

    /// No chat limit under the ad model.
    var isOverChatLimit: Bool { false }

    /// No divine-image limit under the ad model.
    var isOverImageLimit: Bool { false }

    /// No hard limit under the ad model.
    var isOverHardLimit: Bool { false }

    /// Chat is free for everyone.
    var canUseChat: Bool { true }

    /// Divine image is free for everyone.
    var canUseDivineImage: Bool { true }

    /// No paywall is ever shown, so dismissibility is moot (kept for API compatibility).
    var paywallIsDismissible: Bool { true }

    /// No-op: features are no longer gated, so nothing is ever "blocked".
    func presentForBlockedFeature(_ trigger: PaywallTrigger) {}

    init() {
        // Pull persisted values into published mirrors so the @Published
        // change notifications fire on init too.
        isPro = proActive
        messagesUsed = messagesUsedStorage
        imagesUsed = imagesUsedStorage
    }

    // MARK: Public — usage recording

    /// Call after a chat message has been *successfully* sent. No-op for Pro users.
    func recordMessageSent() {
        guard !isPro else { return }
        messagesUsedStorage += 1
        messagesUsed = messagesUsedStorage
        evaluate(against: .messageQuota)
    }

    /// Call after a divine image has been *successfully* generated. No-op for Pro users.
    func recordImageGenerated() {
        guard !isPro else { return }
        imagesUsedStorage += 1
        imagesUsed = imagesUsedStorage
        evaluate(against: .imageQuota)
    }

    // MARK: Public — paywall presentation (neutralized under the ad model)
    //
    // Kept as a no-op so existing call sites keep compiling, but the paywall
    // is never shown — the paywall UI has been removed (ad-model pivot),
    // matching Android.

    /// No-op: the purchase paywall has been removed (ad-based model).
    func presentManually() {}

    /// User dismissed without subscribing. Suppresses re-triggering for
    /// `paywallCooldown` — UNLESS the user is over the hard limit, in which
    /// case the paywall snaps back open immediately (it must not be
    /// escapable until they subscribe).
    func dismissPaywall() {
        if isOverHardLimit {
            // Hard gate: do not actually dismiss; do not start cooldown.
            shouldShowPaywall = true
            return
        }
        shouldShowPaywall = false
        dismissedAtStorage = Date().timeIntervalSince1970
    }

    /// Mock subscription success. Replace with real StoreKit2 transaction handling.
    func grantPro() {
        proActive = true
        isPro = true
        shouldShowPaywall = false
    }

    /// "Restore Purchases" stub. Real impl reads `Transaction.currentEntitlements`.
    func restore() {
        // no-op for the local mock; flip the flag from server-side billing in the future
    }

    #if DEBUG
    /// QA helper — exposed only in DEBUG so designers/QA can reset counters
    /// from the profile screen.
    func resetUsageCounters() {
        messagesUsedStorage = 0
        imagesUsedStorage = 0
        dismissedAtStorage = 0
        messagesUsed = 0
        imagesUsed = 0
    }

    func revokePro() {
        proActive = false
        isPro = false
    }
    #endif

    // MARK: Derived counters

    var messagesRemaining: Int {
        max(0, Self.freeMessageQuota - messagesUsed)
    }

    var imagesRemaining: Int {
        max(0, Self.freeImageQuota - imagesUsed)
    }

    // MARK: Internal

    /// Ad-based model: usage no longer triggers a paywall. Kept as a no-op so
    /// the recordMessageSent()/recordImageGenerated() call sites stay unchanged.
    private func evaluate(against trigger: PaywallTrigger) {}
}
