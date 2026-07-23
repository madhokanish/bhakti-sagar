import Foundation

enum AppPreheater {
    static let assetNames: [String] = Array(
        Set(
            GuidesCatalog.all.flatMap { [$0.avatarAssetName, $0.cardAssetName] }
                + DiscoveryCatalog.guides.map(\.imageAssetName)
                + DivineTemplateCatalog.templates.map(\.thumbnailAssetName)
                + [
                    "bhaktichat_logo",
                    "aarti_sangreh",
                    "choghadiya",
                    "gita_wisdom",
                    "for_peace",
                    "photo_with_god",
                    "photo_at_temple"
                ]
        )
    )

    private static let criticalAssetNames: [String] = Array(
        Set(
            DiscoveryCatalog.guides.prefix(5).map(\.imageAssetName)
                + ["bhaktichat_logo", "photo_with_god", "photo_at_temple"]
        )
    )

    private static let secondaryAssetNames: [String] = assetNames.filter { !criticalAssetNames.contains($0) }

    static func prewarm() async {
        let start = Telemetry.begin("app.prewarm", ["assetCount": String(assetNames.count)])
        PackageAssetLoader.preload(names: criticalAssetNames)
        _ = try? AartiRepository.loadAartis()
        try? await Task.sleep(for: .milliseconds(250))
        PackageAssetLoader.preload(names: secondaryAssetNames)
        Telemetry.end("app.prewarm", from: start)
    }
}
