import Foundation

/// Derives the current *paksha* — the lunar fortnight — for the Home header subtitle.
///
/// Paksha is a binary determination from the moon's phase: **Shukla** (waxing, new moon →
/// full moon) and **Krishna** (waning, full → new). That only needs lunar age, which is
/// straightforward deterministic astronomy, so this needs no network call or almanac data.
///
/// Precision note: within a few hours either side of a new/full moon the label can be a day
/// out, since this uses a mean synodic month rather than true lunar longitude. That is fine
/// for a subtitle; anything that needs exact tithi should come from a real panchang source.
enum PakshaCalculator {
    /// Mean synodic month (new moon to new moon), in days.
    private static let synodicMonth = 29.530588853

    /// A known new moon: 2000-01-06 18:14 UTC.
    private static let referenceNewMoon = Date(timeIntervalSince1970: 947_182_440)

    enum Paksha: String {
        case shukla = "Shukla paksha"
        case krishna = "Krishna paksha"
    }

    /// Days since the last new moon, 0..<synodicMonth.
    static func lunarAge(on date: Date = .now) -> Double {
        let days = date.timeIntervalSince(referenceNewMoon) / 86_400
        let age = days.truncatingRemainder(dividingBy: synodicMonth)
        return age < 0 ? age + synodicMonth : age
    }

    static func paksha(on date: Date = .now) -> Paksha {
        lunarAge(on: date) < synodicMonth / 2 ? .shukla : .krishna
    }
}
