package com.bhaktichat.app.data.remote

import com.bhaktichat.app.domain.StreamEvent
import kotlinx.coroutines.flow.collect

class PromptAwareChatApiClient(
    private val chatApi: ChatApi
) : ChatApiClient {
    override suspend fun sendMessage(
        request: ChatApiClientRequest,
        onToken: (suspend (String) -> Unit)?
    ): Result<ChatApiClientResponse> {
        if (request.guideId in plainRequestGuideIds) {
            return sendPlainRequest(request, onToken)
        }

        val primaryResult = send(request.toSendChatRequest(), onToken)
        if (primaryResult.limitReached) {
            return Result.failure(ChatLimitReachedException())
        }
        if (primaryResult.replyText.isNotBlank()) {
            return Result.success(
                ChatApiClientResponse(
                    replyText = primaryResult.replyText,
                    conversationId = primaryResult.conversationId
                )
            )
        }

        val fallbackResult = send(
            request.toSendChatRequest(
                conversationIdOverride = primaryResult.conversationId,
                includePromptFields = false
            ),
            onToken
        )
        if (fallbackResult.replyText.isNotBlank()) {
            return Result.success(
                ChatApiClientResponse(
                    replyText = fallbackResult.replyText,
                    conversationId = fallbackResult.conversationId
                )
            )
        }

        val resolvedError = fallbackResult.streamError ?: primaryResult.streamError
        if (resolvedError != null) {
            return Result.failure(resolvedError)
        }

        return Result.failure(IllegalStateException("Empty response"))
    }

    private suspend fun sendPlainRequest(
        request: ChatApiClientRequest,
        onToken: (suspend (String) -> Unit)?
    ): Result<ChatApiClientResponse> {
        val plainResult = send(request.toSendChatRequest(includePromptFields = false), onToken)
        if (plainResult.limitReached) {
            return Result.failure(ChatLimitReachedException())
        }
        if (plainResult.replyText.isNotBlank()) {
            return Result.success(
                ChatApiClientResponse(
                    replyText = plainResult.replyText,
                    conversationId = plainResult.conversationId
                )
            )
        }

        val plainError = plainResult.streamError
        if (plainError != null) {
            return Result.failure(plainError)
        }

        return Result.failure(IllegalStateException("Empty response"))
    }

    private suspend fun send(
        request: SendChatRequest,
        onToken: (suspend (String) -> Unit)?
    ): StreamCapture {
        val replyBuilder = StringBuilder()
        var responseConversationId = request.conversationId
        var streamError: Throwable? = null
        var limitReached = false

        chatApi.streamChat(
            request
        ).collect { event ->
            when (event) {
                is StreamEvent.Token -> {
                    replyBuilder.append(event.textChunk)
                    onToken?.invoke(replyBuilder.toString())
                }
                is StreamEvent.ConversationId -> {
                    if (!event.value.isNullOrBlank()) {
                        responseConversationId = event.value
                    }
                }

                is StreamEvent.Error -> {
                    streamError = IllegalStateException(event.message)
                }

                StreamEvent.LimitReached -> {
                    limitReached = true
                }

                StreamEvent.Done -> Unit
            }
        }

        return StreamCapture(
            replyText = replyBuilder.toString().trim(),
            conversationId = responseConversationId,
            streamError = streamError,
            limitReached = limitReached
        )
    }
}

private data class StreamCapture(
    val replyText: String,
    val conversationId: String?,
    val streamError: Throwable?,
    val limitReached: Boolean
)

private val plainRequestGuideIds = setOf("shiv", "hanuman")

private fun ChatApiClientRequest.toSendChatRequest(
    conversationIdOverride: String? = null,
    includePromptFields: Boolean = true
): SendChatRequest {
    return SendChatRequest(
        guideId = guideId,
        conversationId = conversationIdOverride ?: conversationId,
        forceNewConversation = forceNewConversation,
        chatLang = chatLang,
        message = message,
        systemPrompt = systemPrompt.takeIf { includePromptFields },
        developerPrompt = developerPrompt.takeIf { includePromptFields },
        languageInstruction = languageInstruction.takeIf { includePromptFields },
        guidePersonaPrompt = guidePersonaPrompt.takeIf { includePromptFields },
        modeInstruction = modeInstruction.takeIf { includePromptFields },
        systemPromptStack = systemPromptStack.takeIf { includePromptFields },
        stateAnchor = stateAnchor.takeIf { includePromptFields },
        earlierSummary = earlierSummary.takeIf { includePromptFields },
        firstName = firstName.takeIf { includePromptFields },
        secondaryGuard = secondaryGuard.takeIf { includePromptFields },
        optionalRewriteDirective = optionalRewriteDirective.takeIf { includePromptFields }
    )
}
