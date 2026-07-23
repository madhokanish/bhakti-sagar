import Foundation
import PostHog

/// Thin wrapper over the PostHog SDK so the rest of the app never touches the raw client.
///
/// Call `configure()` once from `BhaktiChatAppRoot`'s startup. If no API key is configured
/// (see `Config/Secrets.xcconfig` → POSTHOG_API_KEY), `configure()` is a no-op and every
/// `capture`/`screen` call is silently ignored — the app runs fine with analytics off.
///
/// Mirrors Android's `util/Analytics.kt` — keep event names and property keys in sync.
enum Analytics {
    private static var enabled = false

    /// Initializes PostHog. Safe to call with a blank key (becomes a no-op).
    static func configure(apiKey: String, host: String, debug: Bool) {
        guard !apiKey.isEmpty else { return }
        let config = PostHogConfig(projectToken: apiKey, host: host)
        // We track screens manually per SwiftUI tab/route (this app has no
        // Activity-level screen boundary the SDK could infer automatically).
        config.captureScreenViews = false
        config.captureApplicationLifecycleEvents = true
        config.debug = debug
        PostHogSDK.shared.setup(config)
        enabled = true
    }

    /// Records a custom event with optional properties. No-op when analytics is disabled.
    static func capture(_ event: String, properties: [String: Any]? = nil) {
        guard enabled else { return }
        PostHogSDK.shared.capture(event, properties: properties)
    }

    /// Records a screen view. `name` should be a stable route/screen identifier.
    static func screen(_ name: String, properties: [String: Any]? = nil) {
        guard enabled else { return }
        PostHogSDK.shared.screen(name, properties: properties)
    }

    /// Associates subsequent events with a known user id (e.g. after sign-in).
    static func identify(distinctId: String, userProperties: [String: Any]? = nil) {
        guard enabled else { return }
        PostHogSDK.shared.identify(distinctId, userProperties: userProperties)
    }

    /// Clears the current identity (e.g. on sign-out) so events go to a fresh anonymous id.
    static func reset() {
        guard enabled else { return }
        PostHogSDK.shared.reset()
    }

    // MARK: - Semantic helpers (keep event names in one place)

    static func chatMessageSent(guideId: String?) {
        var properties: [String: Any] = [:]
        if let guideId { properties["guide_id"] = guideId }
        capture("chat_message_sent", properties: properties)
    }

    static func guideSelected(guideId: String) {
        capture("guide_selected", properties: ["guide_id": guideId])
    }

    static func aartiOpened(aartiId: String) {
        capture("aarti_opened", properties: ["aarti_id": aartiId])
    }

    static func choghadiyaOpened() {
        capture("choghadiya_opened")
    }

    static func divineImageGenerationStarted(mode: String) {
        capture("divine_image_generation_started", properties: ["mode": mode])
    }

    static func divineImageGenerated(mode: String) {
        capture("divine_image_generated", properties: ["mode": mode])
    }

    static func divineImageRegenerated(mode: String) {
        capture("divine_image_regenerated", properties: ["mode": mode])
    }

    static func divineImageSaved(mode: String) {
        capture("divine_image_saved", properties: ["mode": mode])
    }

    /// `target` is "instagram", "whatsapp", or "system".
    static func divineImageShared(target: String) {
        capture("divine_image_shared", properties: ["target": target])
    }

    // MARK: - Ads
    // `format` e.g. "banner"/"interstitial"; `placement` e.g. "aartis_list"/"choghadiya".

    static func adShown(format: String, placement: String) {
        capture("ad_shown", properties: ["format": format, "placement": placement])
    }

    static func adClicked(format: String, placement: String) {
        capture("ad_clicked", properties: ["format": format, "placement": placement])
    }
}
