import Foundation

/// Lightweight UserDefaults-backed store for user-curated bookmarks across the app.
/// Tracks message ids (for chat) and aarti slugs (for the Aartis tab).
@MainActor
final class BookmarkStore: ObservableObject {
    @Published private(set) var bookmarkedMessageIds: Set<String> = []
    @Published private(set) var bookmarkedAartiSlugs: Set<String> = []

    private let messageKey = "bhakti_bookmarked_message_ids"
    private let aartiKey   = "bhakti_bookmarked_aarti_slugs"

    init() { load() }

    // MARK: - Messages

    func isMessageBookmarked(_ id: String) -> Bool {
        bookmarkedMessageIds.contains(id)
    }

    func toggleMessage(_ id: String) {
        if bookmarkedMessageIds.contains(id) {
            bookmarkedMessageIds.remove(id)
        } else {
            bookmarkedMessageIds.insert(id)
        }
        save()
    }

    // MARK: - Aartis

    func isAartiBookmarked(_ slug: String) -> Bool {
        bookmarkedAartiSlugs.contains(slug)
    }

    func toggleAarti(_ slug: String) {
        if bookmarkedAartiSlugs.contains(slug) {
            bookmarkedAartiSlugs.remove(slug)
        } else {
            bookmarkedAartiSlugs.insert(slug)
        }
        save()
    }

    // MARK: - Persistence

    private func load() {
        let defaults = UserDefaults.standard
        if let stored = defaults.array(forKey: messageKey) as? [String] {
            bookmarkedMessageIds = Set(stored)
        }
        if let stored = defaults.array(forKey: aartiKey) as? [String] {
            bookmarkedAartiSlugs = Set(stored)
        }
    }

    private func save() {
        let defaults = UserDefaults.standard
        defaults.set(Array(bookmarkedMessageIds), forKey: messageKey)
        defaults.set(Array(bookmarkedAartiSlugs), forKey: aartiKey)
    }
}
