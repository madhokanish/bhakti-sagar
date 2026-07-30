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
        Wallpaper(id: "shani", title: "Shani Dev", subtitle: "Discipline and truth", assetName: "card_shani"),

        // Sourced from the per-aarti deity portraits generated for the Aartis feature.
        Wallpaper(id: "annapurna", title: "Annapurna Ji", subtitle: "Nourishment and plenty", assetName: "aarti_shri_annapurna_ji_ki_aarati"),
        Wallpaper(id: "ekadashi", title: "Ekadashi Mata", subtitle: "Fasting and devotion", assetName: "aarti_shri_ekadashi_mata_ki_aarati"),
        Wallpaper(id: "kali", title: "Kali Mata", subtitle: "Fierce protection", assetName: "aarti_shri_kali_mata_ki_aarati"),
        Wallpaper(id: "ganga", title: "Ganga Ji", subtitle: "Purity and flow", assetName: "aarti_shri_ganga_ji_ki_aarati"),
        Wallpaper(id: "gayatri", title: "Gayatri Mata", subtitle: "Wisdom and light", assetName: "aarti_shri_gayatri_mata_ki_aarati"),
        Wallpaper(id: "chitragupt", title: "Chitragupt Ji", subtitle: "Justice and record", assetName: "aarti_shri_chitragupt_ji_ki_aarati"),
        Wallpaper(id: "tulsi", title: "Tulsi Ji", subtitle: "Devotion and healing", assetName: "aarti_shri_tulsi_ji_ki_aarati"),
        Wallpaper(id: "durga", title: "Durga Ji", subtitle: "Strength and protection", assetName: "aarti_shri_durga_ji_ki_aarati"),
        Wallpaper(id: "parvati", title: "Parvati Ji", subtitle: "Devotion and balance", assetName: "aarti_shri_parvati_ji_ki_aarati"),
        Wallpaper(id: "brihaspati", title: "Brihaspati Dev", subtitle: "Wisdom and guidance", assetName: "aarti_shri_brihaspati_dev_ki_aarati"),
        Wallpaper(id: "hari-vishnu", title: "Hari Vishnu Ji", subtitle: "Preservation and grace", assetName: "aarti_shri_hari_vishnu_ji_ki_aarati"),
        Wallpaper(id: "ramchandra", title: "Ramchandra Ji", subtitle: "Dharma and honor", assetName: "aarti_shri_ramchandra_ji_ki_aarati"),
        Wallpaper(id: "lalita", title: "Lalita Mata", subtitle: "Beauty and grace", assetName: "aarti_shri_lalita_mata_ki_aarati"),
        Wallpaper(id: "vaishno-devi", title: "Vaishno Devi", subtitle: "Faith and shelter", assetName: "aarti_shri_vaishno_devi_ki_aarati"),
        Wallpaper(id: "shani-dev-aarti", title: "Shani Dev", subtitle: "Karma and discipline", assetName: "aarti_shri_shani_dev_ji_ki_aarati"),
        Wallpaper(id: "santoshi", title: "Santoshi Mata", subtitle: "Contentment and peace", assetName: "aarti_shri_santoshi_mata_ki_aarati"),
        Wallpaper(id: "satyanarayan", title: "Satyanarayan Ji", subtitle: "Truth and fulfillment", assetName: "aarti_shri_satyanarayan_ji_ki_aarati"),
        Wallpaper(id: "saraswati", title: "Saraswati Ji", subtitle: "Knowledge and art", assetName: "aarti_shri_saraswati_ji_ki_aarati"),
        Wallpaper(id: "sita", title: "Sita Ji", subtitle: "Purity and devotion", assetName: "aarti_shri_sita_ji_ki_aarati"),
        Wallpaper(id: "surya", title: "Surya Dev", subtitle: "Energy and vitality", assetName: "aarti_shri_surya_dev_ki_aarati")
    ]

    static func byId(_ id: String) -> Wallpaper? {
        all.first { $0.id == id }
    }
}
