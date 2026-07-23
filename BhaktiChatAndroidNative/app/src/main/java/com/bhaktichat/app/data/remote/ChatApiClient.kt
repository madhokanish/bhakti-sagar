package com.bhaktichat.app.data.remote

data class ChatApiClientRequest(
    val threadId: String,
    val guideId: String,
    val conversationId: String?,
    val forceNewConversation: Boolean,
    val chatLang: String,
    val message: String,
    val systemPrompt: String,
    val developerPrompt: String,
    val languageInstruction: String,
    val guidePersonaPrompt: String,
    val modeInstruction: String,
    val stateAnchor: String,
    val earlierSummary: String?,
    val firstName: String?,
    val secondaryGuard: String,
    val optionalRewriteDirective: String?,
    val systemPromptStack: String?
)

data class ChatApiClientResponse(
    val replyText: String,
    val conversationId: String?
)

/**
 * Thrown (as a [Result.failure]) when the server reports the free-tier message limit is
 * exhausted. Callers should surface the non-skippable Pro gate rather than a generic error.
 */
class ChatLimitReachedException : Exception("Free message limit reached.")

interface ChatApiClient {
    /**
     * Sends [request] and returns the final reply. If [onToken] is provided, it is
     * invoked with the cumulative reply text as each streamed token arrives, so callers
     * can render the reply live instead of waiting for the whole response.
     */
    suspend fun sendMessage(
        request: ChatApiClientRequest,
        onToken: (suspend (String) -> Unit)? = null
    ): Result<ChatApiClientResponse>
}
