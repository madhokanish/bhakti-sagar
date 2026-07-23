#if os(iOS)
import UIKit
import GoogleMobileAds
import os

/// Loads and shows a single interstitial at a time, auto-preloading the next one after each
/// show. Not wired to every placement — call `load()` early (e.g. Divine Image create screen
/// appearing), then `show(from:placement:)` at a natural break such as the Divine-Image
/// create → result transition. Impressions/clicks flow to PostHog via `Analytics`.
///
/// IMPORTANT: never show an interstitial mid chat, mid aarti playback, or during the
/// divine-image generation wait — those are active devotional/anticipation moments.
///
/// Mirrors Android's `InterstitialAdManager.kt`.
@MainActor
final class InterstitialAdManager: NSObject {
    static let shared = InterstitialAdManager()

    private let adUnitId: String
    private var ad: GADInterstitialAd?
    private var loading = false
    private var currentPlacement: String?
    private var logger = Logger(subsystem: "com.anish.BhaktiChat", category: "InterstitialAds")

    init(adUnitId: String = AppConfig.admobInterstitialId) {
        self.adUnitId = adUnitId
    }

    /// Preloads an interstitial if one isn't already loaded/loading. Safe to call repeatedly.
    func load() {
        guard ad == nil, !loading else { return }
        loading = true
        GADInterstitialAd.load(withAdUnitID: adUnitId, request: GADRequest()) { [weak self] loaded, error in
            guard let self else { return }
            self.loading = false
            if let error {
                self.logger.warning("Interstitial failed to load: \(error.localizedDescription)")
                self.ad = nil
                if let pending = self.pendingShowRequest {
                    self.pendingShowRequest = nil
                    pending.onDone()
                }
                return
            }
            self.ad = loaded
            self.ad?.fullScreenContentDelegate = self
            if let pending = self.pendingShowRequest {
                self.pendingShowRequest = nil
                self.show(from: pending.rootViewController, placement: pending.placement, onDone: pending.onDone)
            }
        }
    }

    /// Shows the interstitial if one is ready, otherwise invokes `onDone` immediately and
    /// preloads for next time. `onDone` always runs (whether or not an ad showed) so callers
    /// can continue their navigation uniformly.
    func show(from rootViewController: UIViewController?, placement: String, onDone: @escaping () -> Void = {}) {
        guard let current = ad else {
            load()
            onDone()
            return
        }
        currentPlacement = placement
        pendingOnDone = onDone
        current.present(fromRootViewController: rootViewController)
    }

    /// Like `show`, but if the preload hasn't finished yet, waits for it (rather than giving
    /// up immediately) and shows as soon as it lands. Used on the Divine Image Result screen:
    /// the preload starts on the Create screen's appearance, and the demo-photo shortcut can
    /// reach this screen well before a real network ad load finishes.
    func loadThenShow(from rootViewController: UIViewController?, placement: String, onDone: @escaping () -> Void = {}) {
        if ad != nil {
            show(from: rootViewController, placement: placement, onDone: onDone)
            return
        }
        pendingShowRequest = (rootViewController, placement, onDone)
        load()
    }

    private var pendingOnDone: (() -> Void)?
    private var pendingShowRequest: (rootViewController: UIViewController?, placement: String, onDone: () -> Void)?
}

extension InterstitialAdManager: GADFullScreenContentDelegate {
    func adDidRecordImpression(_ ad: GADFullScreenPresentingAd) {
        if let placement = currentPlacement {
            Analytics.adShown(format: "interstitial", placement: placement)
        }
    }

    func adDidRecordClick(_ ad: GADFullScreenPresentingAd) {
        if let placement = currentPlacement {
            Analytics.adClicked(format: "interstitial", placement: placement)
        }
    }

    func ad(_ ad: GADFullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        logger.warning("Interstitial failed to show: \(error.localizedDescription)")
        self.ad = nil
        let onDone = pendingOnDone
        pendingOnDone = nil
        onDone?()
    }

    func adDidDismissFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        self.ad = nil
        load()
        let onDone = pendingOnDone
        pendingOnDone = nil
        onDone?()
    }
}
#endif
