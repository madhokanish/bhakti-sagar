#if os(iOS)
import UIKit
import UserMessagingPlatform
import AppTrackingTransparency
import os

/// Google User Messaging Platform (UMP) consent, gathered once per app start. Required before
/// requesting ads for users in regions with consent laws (EEA/UK); elsewhere it typically
/// resolves immediately with no form.
///
/// Also requests Apple's App Tracking Transparency (ATT) authorization, since UMP covers
/// GDPR-style consent but iOS additionally gates IDFA access behind its own permission.
///
/// Mirrors Android's `AdsConsentManager.kt`, extended with the iOS-only ATT step.
enum AdsConsentManager {
    private static let logger = Logger(subsystem: "com.anish.BhaktiChat", category: "AdsConsent")

    static func gather(from viewController: UIViewController?, onResolved: @escaping () -> Void) {
        let params = UMPRequestParameters()
        UMPConsentInformation.sharedInstance.requestConsentInfoUpdate(with: params) { requestError in
            if let requestError {
                // Couldn't fetch consent info (e.g. network). Proceed without blocking ads;
                // Google's SDK still applies a conservative default.
                logger.warning("Consent info update failed: \(requestError.localizedDescription)")
                requestATTThenResolve(onResolved: onResolved)
                return
            }

            UMPConsentForm.loadAndPresentIfRequired(from: viewController) { formError in
                if let formError {
                    logger.warning("Consent form error: \(formError.localizedDescription)")
                }
                requestATTThenResolve(onResolved: onResolved)
            }
        }
    }

    private static func requestATTThenResolve(onResolved: @escaping () -> Void) {
        if #available(iOS 14, *) {
            ATTrackingManager.requestTrackingAuthorization { _ in
                DispatchQueue.main.async { onResolved() }
            }
        } else {
            onResolved()
        }
    }
}
#endif
