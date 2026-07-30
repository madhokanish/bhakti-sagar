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
    let audioUrl: String?
    /// Per-aarti generated artwork (PackageAssetLoader asset name), when this specific aarti
    /// has its own image rather than sharing a generic per-deity fallback.
    let imageAsset: String?

    var hasAudio: Bool {
        guard let audioUrl else { return false }
        return !audioUrl.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

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
        if imageAsset != nil { return true }
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
