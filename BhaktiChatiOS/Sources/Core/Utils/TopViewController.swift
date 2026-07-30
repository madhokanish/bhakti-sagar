#if os(iOS)
import UIKit

/// Finds the actual frontmost view controller — walking through navigation stacks, tab bars,
/// and modal presentations — rather than just the key window's `rootViewController`.
///
/// This matters whenever something needs to present modally (a full-screen interstitial ad,
/// a Sign in with Apple sheet, an ad-consent form): if a `.sheet`/`.fullScreenCover` is already
/// on screen, the window's `rootViewController` already has that presentation on top of it, and
/// asking it to present something else silently fails in UIKit. Presenting from the true
/// frontmost controller avoids that.
enum TopViewController {
    static func find(base: UIViewController? = nil) -> UIViewController? {
        let controller = base ?? UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController

        if let navigationController = controller as? UINavigationController {
            return find(base: navigationController.visibleViewController)
        }
        if let tabBarController = controller as? UITabBarController {
            return find(base: tabBarController.selectedViewController)
        }
        if let presented = controller?.presentedViewController {
            return find(base: presented)
        }
        return controller
    }
}
#endif
