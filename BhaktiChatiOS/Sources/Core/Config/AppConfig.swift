import Foundation

enum AppConfig {
    static let apiBaseURL = URL(string: "https://bhaktichat.com")!

    static var posthogApiKey: String {
        infoString("POSTHOG_API_KEY")
    }

    static var posthogHost: String {
        // Info.plist/xcconfig store the bare domain (POSTHOG_HOST_DOMAIN), not the full
        // URL — xcconfig treats an unescaped "//" anywhere in a value as a comment start,
        // which silently truncates a literal "https://..." value after "https:". Prepending
        // the scheme here in Swift sidesteps that entirely.
        let value = infoString("POSTHOG_HOST_DOMAIN")
        let host = value.isEmpty ? "us.i.posthog.com" : value
        return "https://\(host)"
    }

    static var admobAppId: String {
        let value = infoString("ADMOB_APP_ID")
        return value.isEmpty ? "ca-app-pub-3940256099942544~3347511713" : value
    }

    static var admobBannerId: String {
        let value = infoString("ADMOB_BANNER_ID")
        return value.isEmpty ? "ca-app-pub-3940256099942544/6300978111" : value
    }

    static var admobInterstitialId: String {
        let value = infoString("ADMOB_INTERSTITIAL_ID")
        return value.isEmpty ? "ca-app-pub-3940256099942544/1033173712" : value
    }

    private static func infoString(_ key: String) -> String {
        Bundle.main.object(forInfoDictionaryKey: key) as? String ?? ""
    }
}
