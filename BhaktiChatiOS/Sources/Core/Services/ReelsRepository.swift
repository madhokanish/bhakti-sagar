import Foundation

/// Loads the bundled reels manifest and derives CDN urls from each clip's slug.
///
/// Mirrors `AartiRepository`: bundled JSON metadata, cached after first load, media streamed
/// from `bhaktichat.com` (confirmed live at `bhaktichat.com/reels/`). The `.aartis` feed is
/// projected from the existing aarti library rather than duplicated into `reels.json`. Only
/// the small poster JPEGs are bundled — for an instant first frame — not the videos themselves.
enum ReelsRepository {
    /// Clips live alongside the aarti MP3s on the same host.
    private static let mediaBaseURL = "https://bhaktichat.com/reels"

    private static var cachedReels: [Reel]?

    static func loadReels() throws -> [Reel] {
        if let cachedReels {
            return cachedReels
        }

        let raw = try ResourceLoader.decodeJSON([RawReel].self, filename: "reels")
        let mapped = raw.map { item in
            Reel(
                id: item.id,
                slug: item.slug,
                title: item.title,
                caption: item.caption,
                creatorName: item.creatorName,
                creatorAvatarAsset: item.creatorAvatarAsset,
                deityId: item.deityId,
                audioTitle: item.audioTitle,
                durationSeconds: item.durationSeconds,
                likeCount: item.likeCount,
                videoURL: "\(mediaBaseURL)/\(item.slug).mp4",
                posterURL: "\(mediaBaseURL)/\(item.slug).jpg",
                posterAsset: item.posterAsset,
                feed: ReelFeed(rawValue: item.feed) ?? .top
            )
        }
        cachedReels = mapped
        return mapped
    }

    /// Reels for a given feed. `.aartis` projects the existing aarti library into reel shape,
    /// so that section has real content without any new assets.
    static func reels(for feed: ReelFeed) -> [Reel] {
        switch feed {
        case .top:
            return (try? loadReels())?.filter { $0.feed == .top } ?? []
        case .aartis:
            return aartiReels()
        }
    }

    private static func aartiReels() -> [Reel] {
        guard let aartis = try? AartiRepository.loadAartis() else { return [] }
        return aartis
            .filter { $0.hasAudio }
            .map { aarti in
                Reel(
                    id: "aarti-reel-\(aarti.id)",
                    slug: aarti.slug,
                    title: aarti.title,
                    caption: aarti.titleHi,
                    creatorName: "BhaktiChat Aartis",
                    creatorAvatarAsset: aarti.imageAsset,
                    deityId: deityId(for: aarti.deity),
                    audioTitle: "\(aarti.title) · original audio",
                    durationSeconds: (aarti.durationMinutes ?? 3) * 60,
                    likeCount: aarti.popularityCount ?? 0,
                    videoURL: aarti.audioUrl,
                    posterURL: nil,
                    posterAsset: aarti.imageAsset,
                    feed: .aartis
                )
            }
    }

    /// Maps an aarti's deity onto one of the five chat guides for the "Ask about this" handoff.
    private static func deityId(for deity: Deity) -> String {
        switch deity {
        case .krishna, .vishnu, .other: return "krishna"
        case .shiv, .ganesh:            return "shiv"
        case .lakshmi, .devi:           return "lakshmi"
        case .hanuman:                  return "hanuman"
        }
    }
}

private struct RawReel: Decodable {
    let id: String
    let slug: String
    let title: String
    let caption: String
    let creatorName: String
    let creatorAvatarAsset: String?
    let deityId: String
    let audioTitle: String
    let durationSeconds: Int
    let likeCount: Int
    let posterAsset: String?
    let feed: String
}
