import Foundation

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
