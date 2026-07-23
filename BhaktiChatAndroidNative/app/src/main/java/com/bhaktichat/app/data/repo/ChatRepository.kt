package com.bhaktichat.app.data.repo

import com.bhaktichat.app.data.local.MessageDao
import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.data.remote.ChatApi
import com.bhaktichat.app.data.remote.SendChatRequest
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.domain.StreamEvent
import kotlinx.coroutines.flow.Flow
import java.time.Instant
import java.util.UUID

class ChatRepository(
    private val messageDao: MessageDao,
    private val chatApi: ChatApi
) {
    fun observeMessages(guideId: String): Flow<List<MessageEntity>> = messageDao.observeMessages(guideId)
    fun observeLatestMessage(guideId: String): Flow<MessageEntity?> = messageDao.observeLatestMessage(guideId)

    suspend fun insertMessage(message: MessageEntity) = messageDao.insert(message)

    suspend fun ensureOpeningScene(guideId: String, openingScene: String) {
        if (messageDao.countByGuide(guideId) > 0) return
        messageDao.insert(
            MessageEntity(
                id = UUID.randomUUID().toString(),
                guideId = guideId,
                role = ChatRole.ASSISTANT.wire,
                content = openingScene,
                createdAt = System.currentTimeMillis()
            )
        )
    }

    suspend fun updateMessageContent(messageId: String, content: String) {
        messageDao.updateContent(messageId, content)
    }

    suspend fun clearGuide(guideId: String) {
        messageDao.deleteByGuide(guideId)
    }

    suspend fun refreshConversation(
        guideId: String,
        conversationId: String?,
        forceNewConversation: Boolean,
        chatLang: String = "en"
    ): String? {
        val result = chatApi.loadConversation(
            guideId = guideId,
            conversationId = conversationId,
            forceNewConversation = forceNewConversation,
            chatLang = chatLang
        )

        val now = System.currentTimeMillis()
        val mapped = result.messages
            .filter { it.role == ChatRole.USER.wire || it.role == ChatRole.ASSISTANT.wire }
            .mapIndexed { index, item ->
                MessageEntity(
                    id = item.id,
                    guideId = guideId,
                    role = item.role,
                    content = item.content,
                    createdAt = item.createdAt.toEpochMillisOrDefault(now + index)
                )
            }
            .sortedBy { it.createdAt }

        messageDao.deleteByGuide(guideId)
        if (mapped.isNotEmpty()) {
            messageDao.insertAll(mapped)
        }
        return result.conversationId
    }

    fun sendMessageStreaming(
        guideId: String,
        message: String,
        conversationId: String?,
        forceNewConversation: Boolean,
        chatLang: String = "en",
        systemPrompt: String? = null,
        developerPrompt: String? = null,
        languageInstruction: String? = null,
        guidePersonaPrompt: String? = null,
        systemPromptStack: String? = null,
        clientMode: String? = null,
        stateAnchor: String? = null,
        earlierSummary: String? = null,
        firstName: String? = null,
        secondaryGuard: String? = null,
        optionalRewriteDirective: String? = null
    ): Flow<StreamEvent> {
        val payload = SendChatRequest(
            guideId = guideId,
            conversationId = conversationId,
            forceNewConversation = forceNewConversation,
            chatLang = chatLang,
            message = message,
            systemPrompt = systemPrompt,
            developerPrompt = developerPrompt,
            languageInstruction = languageInstruction,
            guidePersonaPrompt = guidePersonaPrompt,
            systemPromptStack = systemPromptStack,
            modeInstruction = clientMode,
            stateAnchor = stateAnchor,
            earlierSummary = earlierSummary,
            firstName = firstName,
            secondaryGuard = secondaryGuard,
            optionalRewriteDirective = optionalRewriteDirective
        )
        return chatApi.streamChat(payload)
    }

    private fun String?.toEpochMillisOrDefault(default: Long): Long {
        val value = this ?: return default
        return runCatching { Instant.parse(value).toEpochMilli() }.getOrDefault(default)
    }
}
