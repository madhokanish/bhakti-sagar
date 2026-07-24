import Foundation

/// A shareable deity wallpaper/status image — reuses the existing guide portrait art.
/// Mirrors Android's `domain/Wallpaper.kt`.
struct Wallpaper: Identifiable, Hashable {
    let id: String
    let title: String
    let subtitle: String
    let assetName: String
}

enum WallpapersCatalog {
    // Sourced from the highest-resolution portrait already bundled per deity — no new art
    // needed for a first cut of this feature.
    static let all: [Wallpaper] = [
        Wallpaper(id: "krishna", title: "Shri Krishna", subtitle: "Divine flute, eternal peace", assetName: "card_krishna"),
        Wallpaper(id: "shiv", title: "Shiv Ji", subtitle: "Stillness and inner strength", assetName: "shivji"),
        Wallpaper(id: "hanuman", title: "Hanuman Ji", subtitle: "Courage and devotion", assetName: "hanumanji"),
        Wallpaper(id: "lakshmi", title: "Lakshmi Ji", subtitle: "Abundance and grace", assetName: "card_lakshmi"),
        Wallpaper(id: "shani", title: "Shani Dev", subtitle: "Discipline and truth", assetName: "card_shani")
    ]

    static func byId(_ id: String) -> Wallpaper? {
        all.first { $0.id == id }
    }
}
