import Foundation
import SwiftUI

struct ChoghadiyaCity: Identifiable, Hashable {
    let id: String
    let name: String
    let lat: Double
    let lon: Double
    let tz: String
}

struct ChoghadiyaSunResponse: Codable {
    let sunrise: String
    let sunset: String
    let nextSunrise: String
}

enum ChoghadiyaTone {
    case auspicious
    case neutral
    case challenging

    /// Matches the full Choghadiya screen's hero banner gradient for this tone, so any
    /// other tone-colored surface (e.g. Home's Choghadiya row) stays visually consistent.
    var gradientColors: [Color] {
        switch self {
        case .auspicious:
            return [
                Color(red: 19 / 255, green: 109 / 255, blue: 86 / 255),
                Color(red: 15 / 255, green: 69 / 255, blue: 79 / 255)
            ]
        case .neutral:
            return [
                Color(red: 92 / 255, green: 74 / 255, blue: 21 / 255),
                Color(red: 57 / 255, green: 40 / 255, blue: 14 / 255)
            ]
        case .challenging:
            return [
                Color(red: 109 / 255, green: 36 / 255, blue: 36 / 255),
                Color(red: 63 / 255, green: 19 / 255, blue: 34 / 255)
            ]
        }
    }

    var accentColor: Color {
        switch self {
        case .auspicious:
            return Color(red: 94 / 255, green: 211 / 255, blue: 148 / 255)
        case .neutral:
            return Color(red: 1, green: 184 / 255, blue: 84 / 255)
        case .challenging:
            return Color(red: 1, green: 112 / 255, blue: 112 / 255)
        }
    }
}

struct ChoghadiyaSlot: Identifiable, Hashable {
    let id: String
    let label: String
    let baseLabel: String
    let start: Date
    let end: Date
    let startLabel: String
    let endLabel: String
    let isNight: Bool

    var displayLabel: String {
        baseLabel == "Char" ? "Chal" : baseLabel
    }
}

enum ChoghadiyaCatalog {
    static let all: [ChoghadiyaCity] = [
        .init(id: "london", name: "London, UK", lat: 51.5072, lon: -0.1276, tz: "Europe/London"),
        .init(id: "new-york", name: "New York, USA", lat: 40.7128, lon: -74.0060, tz: "America/New_York"),
        .init(id: "toronto", name: "Toronto, Canada", lat: 43.6532, lon: -79.3832, tz: "America/Toronto"),
        .init(id: "dubai", name: "Dubai, UAE", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai"),
        .init(id: "sydney", name: "Sydney, Australia", lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney"),
        .init(id: "singapore", name: "Singapore", lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore"),
        .init(id: "delhi", name: "Delhi, India", lat: 28.6139, lon: 77.2090, tz: "Asia/Kolkata"),
        .init(id: "mumbai", name: "Mumbai, India", lat: 19.0760, lon: 72.8777, tz: "Asia/Kolkata")
    ]
}
