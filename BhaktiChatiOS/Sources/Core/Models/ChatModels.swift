import Foundation

enum ChatRole: String, Codable {
    case user
    case assistant
}

struct ChatMessage: Identifiable, Hashable, Codable {
    let id: String
    let threadId: String
    let role: ChatRole
    let content: String
    let createdAt: Date
}

struct LoadConversationResult: Codable {
    let conversationId: String?
    let messages: [RemoteChatMessage]
}

struct RemoteChatMessage: Codable {
    let id: String
    let role: String
    let content: String
    let createdAt: String?
}

struct SendChatRequest: Codable {
    let guideId: String
    let conversationId: String?
    let forceNewConversation: Bool
    let chatLang: String
    let message: String
    let systemPrompt: String?
    let developerPrompt: String?
    let languageInstruction: String?
    let guidePersonaPrompt: String?
    let modeInstruction: String?
    let systemPromptStack: String?
    let stateAnchor: String?
    let earlierSummary: String?
    let firstName: String?
    let secondaryGuard: String?
    let optionalRewriteDirective: String?

    init(
        guideId: String,
        conversationId: String? = nil,
        forceNewConversation: Bool = false,
        chatLang: String = "en",
        message: String,
        systemPrompt: String? = nil,
        developerPrompt: String? = nil,
        languageInstruction: String? = nil,
        guidePersonaPrompt: String? = nil,
        modeInstruction: String? = nil,
        systemPromptStack: String? = nil,
        stateAnchor: String? = nil,
        earlierSummary: String? = nil,
        firstName: String? = nil,
        secondaryGuard: String? = nil,
        optionalRewriteDirective: String? = nil
    ) {
        self.guideId = guideId
        self.conversationId = conversationId
        self.forceNewConversation = forceNewConversation
        self.chatLang = chatLang
        self.message = message
        self.systemPrompt = systemPrompt
        self.developerPrompt = developerPrompt
        self.languageInstruction = languageInstruction
        self.guidePersonaPrompt = guidePersonaPrompt
        self.modeInstruction = modeInstruction
        self.systemPromptStack = systemPromptStack
        self.stateAnchor = stateAnchor
        self.earlierSummary = earlierSummary
        self.firstName = firstName
        self.secondaryGuard = secondaryGuard
        self.optionalRewriteDirective = optionalRewriteDirective
    }
}

enum StreamEvent: Hashable {
    case token(String)
    case conversationId(String?)
    case done
    case error(String)
    /// Backend reports the free-message cap was hit (`{"limitReached":true,...}`). Distinct
    /// from `.error` so it renders as a warm assistant message, not an "Error:"-prefixed one,
    /// and doesn't count toward the success-only message quota. Mirrors Android's
    /// `StreamEvent.LimitReached` (`OkHttpChatApi.kt`).
    case limitReached
}
