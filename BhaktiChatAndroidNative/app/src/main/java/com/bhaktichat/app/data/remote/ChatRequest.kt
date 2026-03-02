package com.bhaktichat.app.data.remote

data class SendChatRequest(
    val guideId: String,
    val conversationId: String?,
    val forceNewConversation: Boolean,
    val chatLang: String = "en",
    val message: String,
    val systemPromptStack: String? = null,
    val clientMode: String? = null,
    val stateAnchor: String? = null,
    val earlierSummary: String? = null
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
