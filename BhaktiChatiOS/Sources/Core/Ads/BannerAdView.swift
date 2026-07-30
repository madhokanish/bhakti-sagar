#if os(iOS)
import SwiftUI
import GoogleMobileAds

/// A standard 320x50 AdMob banner as a SwiftUI view. Defaults to the (test-in-debug) banner
/// unit from `AppConfig`. `placement` is a stable label reported to analytics (e.g. "aartis_list").
///
/// Impressions/clicks are forwarded to PostHog via `Analytics`. Mirrors Android's `BannerAd.kt`.
struct BannerAdView: UIViewRepresentable {
    let placement: String
    var adUnitId: String = AppConfig.admobBannerId

    func makeCoordinator() -> Coordinator {
        Coordinator(placement: placement)
    }

    func makeUIView(context: Context) -> GADBannerView {
        let banner = GADBannerView(adSize: GADAdSizeBanner)
        banner.adUnitID = adUnitId
        banner.delegate = context.coordinator
        banner.rootViewController = TopViewController.find()
        banner.load(GADRequest())
        return banner
    }

    func updateUIView(_ uiView: GADBannerView, context: Context) {}

    final class Coordinator: NSObject, GADBannerViewDelegate {
        let placement: String

        init(placement: String) {
            self.placement = placement
        }

        func bannerViewDidRecordImpression(_ bannerView: GADBannerView) {
            Analytics.adShown(format: "banner", placement: placement)
        }

        func bannerViewDidRecordClick(_ bannerView: GADBannerView) {
            Analytics.adClicked(format: "banner", placement: placement)
        }
    }
}
#endif
