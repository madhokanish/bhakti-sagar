import Foundation

enum Deity: String, Codable {
    case krishna = "KRISHNA"
    case ganesh = "GANESH"
    case shiv = "SHIV"
    case lakshmi = "LAKSHMI"
    case devi = "DEVI"
    case vishnu = "VISHNU"
    case hanuman = "HANUMAN"
    case other = "OTHER"
}

struct Aarti: Identifiable, Codable, Hashable {
    let id: String
    let slug: String
    let title: String
    let titleHi: String
    let deity: Deity
    let durationMinutes: Int?
    let tags: [String]
    let youtubeVideoId: String?
    let popularityCount: Int?
    let isTop: Bool
    let lyrics: [String]

    var subtitle: String? {
        titleHi
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .takeIf { !$0.isEmpty && $0.caseInsensitiveCompare(title) != .orderedSame }
    }

    var preview: String {
        let lines = lyrics
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty && !$0.hasSuffix("...") }
            .prefix(2)

        let text = lines.joined(separator: " ")
        return text.isEmpty ? "Tap to read full lyrics." : text
    }

    var lyricVerses: [String] {
        lyrics
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    var hasArtwork: Bool {
        switch deity {
        case .ganesh, .shiv, .lakshmi, .krishna, .hanuman:
            return true
        default:
            return false
        }
    }
}

private extension String {
    func takeIf(_ predicate: (String) -> Bool) -> String? {
        predicate(self) ? self : nil
    }
}
