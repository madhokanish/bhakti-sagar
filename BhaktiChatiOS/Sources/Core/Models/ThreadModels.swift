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

    static let empty = PersistedChatState(
        selectedGuideId: "krishna",
        threads: [],
        messagesByThread: [:],
        divineCreations: [],
        savedAartiIDs: [],
        authSession: .guest
    )

    enum CodingKeys: String, CodingKey {
        case selectedGuideId
        case threads
        case messagesByThread
        case divineCreations
        case savedAartiIDs
        case authSession
    }

    init(
        selectedGuideId: String,
        threads: [ChatThread],
        messagesByThread: [String: [ChatMessage]],
        divineCreations: [DivineCreation],
        savedAartiIDs: Set<String>,
        authSession: AuthSession
    ) {
        self.selectedGuideId = selectedGuideId
        self.threads = threads
        self.messagesByThread = messagesByThread
        self.divineCreations = divineCreations
        self.savedAartiIDs = savedAartiIDs
        self.authSession = authSession
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        selectedGuideId = try container.decodeIfPresent(String.self, forKey: .selectedGuideId) ?? "krishna"
        threads = try container.decodeIfPresent([ChatThread].self, forKey: .threads) ?? []
        messagesByThread = try container.decodeIfPresent([String: [ChatMessage]].self, forKey: .messagesByThread) ?? [:]
        divineCreations = try container.decodeIfPresent([DivineCreation].self, forKey: .divineCreations) ?? []
        savedAartiIDs = try container.decodeIfPresent(Set<String>.self, forKey: .savedAartiIDs) ?? []
        authSession = try container.decodeIfPresent(AuthSession.self, forKey: .authSession) ?? .guest
    }
}
