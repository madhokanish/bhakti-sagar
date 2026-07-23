// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "BhaktiChatiOS",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "BhaktiChatiOS", targets: ["BhaktiChatiOS"])
    ],
    dependencies: [
        .package(url: "https://github.com/google/GoogleSignIn-iOS", from: "8.0.0"),
        .package(url: "https://github.com/PostHog/posthog-ios.git", from: "3.0.0"),
        .package(url: "https://github.com/googleads/swift-package-manager-google-mobile-ads.git", from: "11.0.0"),
        // Version range matches what GoogleMobileAds itself requires transitively —
        // declared explicitly here only so our target can `import GoogleUserMessagingPlatform`.
        .package(url: "https://github.com/googleads/swift-package-manager-google-user-messaging-platform.git", "1.1.0"..<"3.0.0")
    ],
    targets: [
        .target(
            name: "BhaktiChatiOS",
            dependencies: [
                .product(name: "GoogleSignIn", package: "GoogleSignIn-iOS"),
                .product(name: "PostHog", package: "posthog-ios"),
                .product(name: "GoogleMobileAds", package: "swift-package-manager-google-mobile-ads", condition: .when(platforms: [.iOS])),
                .product(name: "GoogleUserMessagingPlatform", package: "swift-package-manager-google-user-messaging-platform", condition: .when(platforms: [.iOS]))
            ],
            path: "Sources",
            resources: [.process("Resources")]
        )
    ]
)
