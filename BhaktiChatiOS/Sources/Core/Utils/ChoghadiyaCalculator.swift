import Foundation

enum ChoghadiyaCalculator {
    private static let dayTable: [Int: [String]] = [
        1: ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"], // Sunday
        2: ["Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit"], // Monday
        3: ["Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"], // Tuesday
        4: ["Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh"], // Wednesday
        5: ["Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh"], // Thursday
        6: ["Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char"], // Friday
        7: ["Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal"] // Saturday
    ]

    private static let nightTable: [Int: [String]] = [
        1: ["Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh"],
        2: ["Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char"],
        3: ["Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal"],
        4: ["Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg"],
        5: ["Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit"],
        6: ["Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog"],
        7: ["Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh"]
    ]

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    static func buildSlots(sunrise: Date, sunset: Date, nextSunrise: Date, timeZone: TimeZone) -> [ChoghadiyaSlot] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone

        let weekday = calendar.component(.weekday, from: sunrise)
        let dayNames = dayTable[weekday] ?? []
        let nightNames = nightTable[weekday] ?? []

        let dayDuration = sunset.timeIntervalSince(sunrise)
        let nightDuration = nextSunrise.timeIntervalSince(sunset)
        let dayStep = dayDuration / 8.0
        let nightStep = nightDuration / 8.0

        timeFormatter.timeZone = timeZone

        var slots: [ChoghadiyaSlot] = []
        for (index, name) in dayNames.enumerated() {
            let start = sunrise.addingTimeInterval(dayStep * Double(index))
            let end = (index == 7) ? sunset : sunrise.addingTimeInterval(dayStep * Double(index + 1))
            slots.append(
                ChoghadiyaSlot(
                    id: "day_\(index)_\(Int(start.timeIntervalSince1970))",
                    label: name,
                    baseLabel: name,
                    start: start,
                    end: end,
                    startLabel: timeFormatter.string(from: start),
                    endLabel: timeFormatter.string(from: end),
                    isNight: false
                )
            )
        }

        for (index, name) in nightNames.enumerated() {
            let start = sunset.addingTimeInterval(nightStep * Double(index))
            let end = (index == 7) ? nextSunrise : sunset.addingTimeInterval(nightStep * Double(index + 1))
            slots.append(
                ChoghadiyaSlot(
                    id: "night_\(index)_\(Int(start.timeIntervalSince1970))",
                    label: "\(name) (Night)",
                    baseLabel: name,
                    start: start,
                    end: end,
                    startLabel: timeFormatter.string(from: start),
                    endLabel: timeFormatter.string(from: end),
                    isNight: true
                )
            )
        }

        return slots
    }

    static func tone(for baseLabel: String) -> ChoghadiyaTone {
        switch baseLabel {
        case "Shubh", "Labh", "Amrit": return .auspicious
        case "Char": return .neutral
        default: return .challenging
        }
    }

    static func meaning(for baseLabel: String) -> String {
        switch baseLabel {
        case "Shubh": return "Supportive window for important actions."
        case "Labh": return "Useful for growth and practical gains."
        case "Amrit": return "Strong for blessings and meaningful starts."
        case "Char": return "Good for movement and routine tasks."
        case "Rog": return "Keep to ordinary work and avoid high-stakes decisions."
        case "Kaal": return "Better for restraint and patience."
        default: return "Move slowly and avoid pressure decisions."
        }
    }

    static func isAuspicious(_ baseLabel: String) -> Bool {
        ["Shubh", "Labh", "Amrit"].contains(baseLabel)
    }
}
