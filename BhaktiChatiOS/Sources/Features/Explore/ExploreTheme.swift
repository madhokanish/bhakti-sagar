import SwiftUI

/// Warm saffron/cream palette for the Explore tab and its sub-screens (Festivals, Panchang).
/// Mirrors Android's `ExplorePalette` object exactly (design_handoff_bhaktichat_ia).
enum ExplorePalette {
    static let card = Color.white
    static let cardBorder = Color(red: 120.0 / 255, green: 80.0 / 255, blue: 40.0 / 255, opacity: 0.10)
    static let textPrimary = Color(red: 0x2A / 255, green: 0x1C / 255, blue: 0x15 / 255)
    static let textSecondary = Color(red: 0x8A / 255, green: 0x6F / 255, blue: 0x5C / 255)
    static let textMuted = Color(red: 0xBD / 255, green: 0xA4 / 255, blue: 0x91 / 255)
    static let deepAccent = Color(red: 0xC2 / 255, green: 0x41 / 255, blue: 0x0C / 255)

    static let aartiGradient = [Color(red: 0xFC / 255, green: 0xA5 / 255, blue: 0xA5 / 255),
                                Color(red: 0xDC / 255, green: 0x26 / 255, blue: 0x26 / 255)]
    static let choghadiyaGradient = [Color(red: 0xFB / 255, green: 0x92 / 255, blue: 0x3C / 255),
                                      Color(red: 0xEA / 255, green: 0x58 / 255, blue: 0x0C / 255)]
    static let festivalGradient = [Color(red: 0xA5 / 255, green: 0xB4 / 255, blue: 0xFC / 255),
                                    Color(red: 0x63 / 255, green: 0x66 / 255, blue: 0xF1 / 255)]
    static let panchangGradient = [Color(red: 0xFC / 255, green: 0xD3 / 255, blue: 0x4D / 255),
                                    Color(red: 0xD9 / 255, green: 0x77 / 255, blue: 0x06 / 255)]
}
