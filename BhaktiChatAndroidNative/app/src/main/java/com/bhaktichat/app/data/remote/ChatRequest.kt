package com.bhaktichat.app.data.remote

data class SendChatRequest(
    val guideId: String,
    val conversationId: String?,
    val forceNewConversation: Boolean,
    val chatLang: String = "en",
    val message: String,
    val systemPrompt: String? = null,
    val developerPrompt: String? = null,
    val languageInstruction: String? = null,
    val guidePersonaPrompt: String? = null,
    val modeInstruction: String? = null,
    val systemPromptStack: String? = null,
    val stateAnchor: String? = null,
    val earlierSummary: String? = null,
    val firstName: String? = null,
    val secondaryGuard: String? = null,
    val optionalRewriteDirective: String? = null
)

data class RemoteChatMessage(
    val id: String,
    val role: String,
    val content: String,
    val createdAt: String?
)

data class LoadConversationResult(
    val conversationId: String?,
    val messages: List<RemoteChatMessage>
)
