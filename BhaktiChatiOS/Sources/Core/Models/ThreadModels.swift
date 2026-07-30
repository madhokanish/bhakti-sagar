import Foundation

struct ChatThread: Identifiable, Hashable, Codable {
    let id: String
    let guideId: String
    var createdAt: Date
    var updatedAt: Date
    var remoteConversationId: String?
    var stateAnchor: String?
    var earlierSummary: String?
    var lastRemoteSyncAt: Date?
}

struct PersistedChatState: Codable {
    var selectedGuideId: String
    var threads: [ChatThread]
    var messagesByThread: [String: [ChatMessage]]
    var divineCreations: [DivineCreation]
    var savedAartiIDs: Set<String>
    var authSession: AuthSession
    /// Thread ids hidden from the conversation list without deleting them — used to collapse
    /// pre-2.0 "many threads per deity" history down to one visible row per guide, and by the
    /// one-thread-per-deity migration, without losing anything the user wrote. See
    /// `AppState.migrateToOneThreadPerDeityIfNeeded()`.
    var archivedThreadIDs: Set<String>

    static let empty = PersistedChatState(
        selectedGuideId: "krishna",
        threads: [],
        messagesByThread: [:],
        divineCreations: [],
        savedAartiIDs: [],
        authSession: .guest,
        archivedThreadIDs: []
    )

    enum CodingKeys: String, CodingKey {
        case selectedGuideId
        case threads
        case messagesByThread
        case divineCreations
        case savedAartiIDs
        case authSession
        case archivedThreadIDs
    }

    init(
        selectedGuideId: String,
        threads: [ChatThread],
        messagesByThread: [String: [ChatMessage]],
        divineCreations: [DivineCreation],
        savedAartiIDs: Set<String>,
        authSession: AuthSession,
        archivedThreadIDs: Set<String> = []
    ) {
        self.selectedGuideId = selectedGuideId
        self.threads = threads
        self.messagesByThread = messagesByThread
        self.divineCreations = divineCreations
        self.savedAartiIDs = savedAartiIDs
        self.authSession = authSession
        self.archivedThreadIDs = archivedThreadIDs
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        selectedGuideId = try container.decodeIfPresent(String.self, forKey: .selectedGuideId) ?? "krishna"
        threads = try container.decodeIfPresent([ChatThread].self, forKey: .threads) ?? []
        messagesByThread = try container.decodeIfPresent([String: [ChatMessage]].self, forKey: .messagesByThread) ?? [:]
        divineCreations = try container.decodeIfPresent([DivineCreation].self, forKey: .divineCreations) ?? []
        savedAartiIDs = try container.decodeIfPresent(Set<String>.self, forKey: .savedAartiIDs) ?? []
        authSession = try container.decodeIfPresent(AuthSession.self, forKey: .authSession) ?? .guest
        // Absent on every pre-2.0 save — defaults empty so migration runs against full history.
        archivedThreadIDs = try container.decodeIfPresent(Set<String>.self, forKey: .archivedThreadIDs) ?? []
    }
}
