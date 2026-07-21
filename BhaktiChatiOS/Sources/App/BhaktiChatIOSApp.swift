import StoreKit
import SwiftUI
#if os(iOS)
import GoogleMobileAds
#endif

public struct BhaktiChatAppRoot: View {
    @StateObject private var appState = AppState()
    @StateObject private var bookmarks = BookmarkStore()
    @StateObject private var entitlements = EntitlementStore()
    @StateObject private var subscriptions = SubscriptionManager()
    @StateObject private var streaks = StreakStore()
    @StateObject private var reviewPrompt = ReviewPromptStore()
    @AppStorage("bhakti_theme_mode") private var themeMode: String = "system"
    @Environment(\.scenePhase) private var scenePhase
    #if os(iOS)
    @Environment(\.requestReview) private var requestReview
    #endif

    public init() {}

    private var preferredScheme: ColorScheme? {
        switch themeMode {
        case "light": return .light
        case "dark":  return .dark
        default:      return nil
        }
    }

    public var body: some View {
        RootTabView()
            .environmentObject(appState)
            .environmentObject(bookmarks)
            .environmentObject(entitlements)
            .environmentObject(subscriptions)
            .environmentObject(streaks)
            .environmentObject(reviewPrompt)
            .preferredColorScheme(preferredScheme)
            .task {
                // First, so early lifecycle events are captured.
                #if DEBUG
                Analytics.configure(apiKey: AppConfig.posthogApiKey, host: AppConfig.posthogHost, debug: true)
                #else
                Analytics.configure(apiKey: AppConfig.posthogApiKey, host: AppConfig.posthogHost, debug: false)
                #endif
            }
            .task {
                streaks.recordVisit()
            }
            .task {
                // Bridge entitlements into AppState so server-driven flows
                // (sendMessage success, etc.) can increment usage counters.
                appState.entitlements = entitlements
                appState.reviewPrompt = reviewPrompt
                await appState.restoreNativeAuthIfNeeded()
            }
            .onChange(of: scenePhase) { _, newPhase in
                // Accumulated foreground time is one of the two review-prompt eligibility
                // signals (see ReviewPromptStore) — not wall-clock time since install.
                if newPhase == .active {
                    reviewPrompt.recordForegroundStart()
                } else {
                    reviewPrompt.recordForegroundEnd()
                }
            }
            #if os(iOS)
            .alert("Enjoying BhaktiChat? 🙏", isPresented: $reviewPrompt.shouldShowPrompt) {
                Button("Yes, I love it!") {
                    reviewPrompt.markPromptShown()
                    requestReview()
                }
                Button("Not now", role: .cancel) {
                    reviewPrompt.markPromptShown()
                }
            } message: {
                Text("If BhaktiChat has been helpful, a quick rating helps other seekers find it too.")
            }
            #endif
            .task {
                // Preload StoreKit products + restore any existing entitlement
                // so the paywall opens with prices already populated.
                await subscriptions.loadProductsIfNeeded()
            }
            .onChange(of: subscriptions.hasActiveSubscription) { _, isActive in
                // Real StoreKit purchases mirror into EntitlementStore — keeps
                // the rest of the app reading from a single source of truth.
                if isActive { entitlements.grantPro() }
            }
            .task {
                Task.detached(priority: .background) {
                    try? await Task.sleep(for: .milliseconds(350))
                    await AppPreheater.prewarm()
                }
            }
            #if os(iOS)
            .task {
                Task.detached(priority: .background) {
                    GADMobileAds.sharedInstance().start(completionHandler: nil)
                }
                let topViewController = UIApplication.shared.connectedScenes
                    .compactMap { ($0 as? UIWindowScene)?.keyWindow }
                    .first?.rootViewController
                AdsConsentManager.gather(from: topViewController) {
                    InterstitialAdManager.shared.load()
                }
            }
            #endif
            .onOpenURL { url in
                _ = NativeAuthService.handleOpenURL(url)
            }
    }
}
