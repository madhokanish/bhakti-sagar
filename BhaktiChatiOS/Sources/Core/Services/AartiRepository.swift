import Foundation

enum AartiRepository {
    private static var cachedAartis: [Aarti]?

    static func loadAartis() throws -> [Aarti] {
        if let cachedAartis {
            return cachedAartis
        }

        let raw = try ResourceLoader.decodeJSON([RawAarti].self, filename: "aartis")
        let mapped = raw.map { item in
            let displayTitle = item.title.english?.nonEmpty ?? item.title.hindi?.nonEmpty ?? "Aarti"
            let displayHindiTitle = item.title.hindi?.nonEmpty ?? item.title.english?.nonEmpty ?? displayTitle
            let selectedLyrics = item.lyrics.english?.nonEmptyArray ?? item.lyrics.hindi?.nonEmptyArray ?? []
            let deity = resolveDeity(
                category: item.category,
                tags: item.tags,
                title: displayTitle
            )
            let tags = enrichTags(
                baseTags: item.tags,
                deity: deity,
                title: displayTitle,
                isTop: item.isTop
            )

            return Aarti(
                id: item.id,
                slug: item.slug,
                title: displayTitle,
                titleHi: displayHindiTitle,
                deity: deity,
                durationMinutes: estimateDurationMinutes(lyrics: selectedLyrics),
                tags: tags,
                youtubeVideoId: extractYouTubeVideoId(from: item.youtubeUrl),
                popularityCount: item.popularityCount,
                isTop: item.isTop,
                lyrics: selectedLyrics
            )
        }
        cachedAartis = mapped
        return mapped
    }
}

private struct RawAarti: Decodable {
    struct RawTitle: Decodable {
        let english: String?
        let hindi: String?
    }

    struct RawLyrics: Decodable {
        let english: [String]?
        let hindi: [String]?
    }

    let id: String
    let title: RawTitle
    let slug: String
    let category: String
    let isTop: Bool
    let youtubeUrl: String?
    let lyrics: RawLyrics
    let tags: [String]
    let popularityCount: Int?
}

private func resolveDeity(category: String, tags: [String], title: String) -> Deity {
    let normalizedCategory = category.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    let normalizedTitle = title.lowercased()
    let normalizedTags = tags.map { $0.lowercased() }

    if normalizedCategory == "krishna" { return .krishna }
    if normalizedCategory == "ganesha" || normalizedTags.contains(where: { $0.contains("ganesh") || $0.contains("ganesha") }) {
        return .ganesh
    }
    if normalizedCategory == "shiva" || normalizedTags.contains(where: { $0.contains("shiv") || $0.contains("shiva") }) {
        return .shiv
    }
    if normalizedCategory == "lakshmi" || normalizedTags.contains(where: { $0.contains("lakshmi") }) {
        return .lakshmi
    }
    if normalizedCategory == "shakti"
        || normalizedTags.contains(where: { $0.contains("devi") || $0.contains("mata") })
        || normalizedTitle.contains("mata") {
        return .devi
    }
    if normalizedCategory == "vishnu" { return .vishnu }
    if normalizedTags.contains(where: { $0.contains("hanuman") }) || normalizedTitle.contains("hanuman") {
        return .hanuman
    }
    return .other
}

private func enrichTags(baseTags: [String], deity: Deity, title: String, isTop: Bool) -> [String] {
    var tags = baseTags
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
        .filter { !$0.isEmpty }

    switch deity {
    case .krishna:
        tags += ["krishna", "morning"]
    case .ganesh:
        tags += ["ganesh", "morning"]
    case .shiv:
        tags += ["shiv", "evening"]
    case .lakshmi:
        tags += ["lakshmi", "devi", "evening"]
    case .devi:
        tags += ["devi", "evening"]
    case .vishnu:
        tags += ["morning"]
    case .hanuman:
        tags += ["morning"]
    case .other:
        break
    }

    let normalizedTitle = title.lowercased()
    if normalizedTitle.contains("vrat")
        || tags.contains(where: { $0.contains("ekadashi") || $0.contains("vrat") }) {
        tags.append("vrat")
    }

    if isTop {
        tags.append("popular")
    }

    return Array(NSOrderedSet(array: tags)) as? [String] ?? Array(Set(tags))
}

private func estimateDurationMinutes(lyrics: [String]) -> Int? {
    if lyrics.isEmpty { return 3 }
    let estimate = Int((Double(lyrics.count) / 6.0) + 2.0)
    return min(max(estimate, 2), 9)
}

private func extractYouTubeVideoId(from url: String?) -> String? {
    let safeURL = url?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if safeURL.isEmpty { return nil }

    if let range = safeURL.range(of: "watch?v=") {
        return String(safeURL[range.upperBound...]).components(separatedBy: "&").first?.nonEmpty
    }

    if let range = safeURL.range(of: "youtu.be/") {
        return String(safeURL[range.upperBound...]).components(separatedBy: "?").first?.nonEmpty
    }

    if let range = safeURL.range(of: "/embed/") {
        return String(safeURL[range.upperBound...]).components(separatedBy: "?").first?.nonEmpty
    }

    return nil
}

private extension String {
    var nonEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

private extension Array where Element == String {
    var nonEmptyArray: [String]? {
        let trimmed = map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        return trimmed.isEmpty ? nil : trimmed
    }
}
