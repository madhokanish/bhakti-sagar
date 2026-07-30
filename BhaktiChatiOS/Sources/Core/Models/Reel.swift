import Foundation

/// Which feed a reel belongs to. `.aartis` is served from the existing 22-aarti library
/// rather than from `reels.json` — see `ReelsRepository.reels(for:)`.
enum ReelFeed: String, CaseIterable, Hashable {
    /// Curated devotional clips from `reels.json`.
    case top
    case aartis

    var title: String {
        switch self {
        case .top:    return "Top"
        case .aartis: return "Aartis"
        }
    }
}

/// A single devotional video clip in the Reels feed.
///
/// Video and poster are streamed from the CDN (`https://bhaktichat.com/reels/…`), matching how
/// the aarti MP3s already work — so clips can be added or swapped without an App Store release.
/// `posterAsset` is a bundled stand-in shown while the remote poster loads (or if it 404s).
struct Reel: Identifiable, Hashable {
    let id: String
    let slug: String
    let title: String
    let caption: String
    let creatorName: String
    let creatorAvatarAsset: String?
    /// One of `GuidesCatalog`'s guide ids — drives the "Ask about this" chat handoff.
    let deityId: String
    let audioTitle: String
    let durationSeconds: Int
    let likeCount: Int
    let videoURL: String?
    let posterURL: String?
    let posterAsset: String?
    let feed: ReelFeed

    var durationLabel: String {
        let minutes = durationSeconds / 60
        let seconds = durationSeconds % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    /// "1.2k" style compact count, as specified for the action rail.
    var likeCountLabel: String {
        if likeCount >= 1_000_000 {
            return String(format: "%.1fm", Double(likeCount) / 1_000_000)
                .replacingOccurrences(of: ".0m", with: "m")
        }
        if likeCount >= 1_000 {
            return String(format: "%.1fk", Double(likeCount) / 1_000)
                .replacingOccurrences(of: ".0k", with: "k")
        }
        return "\(likeCount)"
    }
}
