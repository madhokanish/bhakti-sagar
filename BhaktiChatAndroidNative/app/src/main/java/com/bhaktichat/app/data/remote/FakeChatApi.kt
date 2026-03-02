package com.bhaktichat.app.data.remote

import com.bhaktichat.app.domain.StreamEvent
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class FakeChatApi : ChatApi {
    override suspend fun loadConversation(
        guideId: String,
        conversationId: String?,
        forceNewConversation: Boolean,
        chatLang: String
    ): LoadConversationResult {
        val opener = when (guideId) {
            "krishna" -> "You close the door. Your mind is not quiet. Krishna smiles softly. Tell me, what is troubling your heart?"
            "lakshmi" -> "You sit quietly. There is worry in your heart. Lakshmi says: tell me what you need today."
            "shani" -> "You pause. Your breath feels heavy. Shani asks: where are you stuck?"
            else -> "Welcome. Tell me what is on your mind."
        }
        return LoadConversationResult(
            conversationId = conversationId ?: "fake-conversation-$guideId",
            messages = listOf(
                RemoteChatMessage(
                    id = "fake-opener-$guideId",
                    role = "assistant",
                    content = opener,
                    createdAt = null
                )
            )
        )
    }

    override fun streamChat(request: SendChatRequest): Flow<StreamEvent> = flow {
        val response = buildResponse(request)
        val tokens = response.split(" ")
        for (token in tokens) {
            emit(StreamEvent.Token(token + " "))
            delay(35)
        }
        emit(StreamEvent.ConversationId(request.conversationId ?: "fake-conversation-${request.guideId}"))
        emit(StreamEvent.Done)
    }

    private fun buildResponse(request: SendChatRequest): String {
        val safeLine = "I am an AI guide inspired by tradition, not the real deity. I cannot provide medical or legal advice."
        val userText = request.message
        return when (request.guideId) {
            "krishna" -> "Let us focus on action with calm intent. Start with one dharma aligned step in the next hour. $safeLine"
            "lakshmi" -> "Create order first: list your top three priorities and complete one with full attention. $safeLine"
            "shani" -> "Discipline is built through repetition. Choose one hard but honest action and complete it today. $safeLine"
            else -> "Thank you for sharing. Let us proceed with clarity and care. $safeLine"
        } + if (userText.isNotBlank()) " You asked: $userText" else ""
    }
}
