package com.bhaktichat.app.data.remote

import com.bhaktichat.app.domain.StreamEvent
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PromptAwareChatApiClientTest {

    @Test
    fun retriesWithoutPromptFieldsWhenPrimaryAttemptFails() = runBlocking {
        val observedRequests = mutableListOf<SendChatRequest>()
        val api = object : ChatApi {
            override suspend fun loadConversation(
                guideId: String,
                conversationId: String?,
                forceNewConversation: Boolean,
                chatLang: String
            ): LoadConversationResult {
                error("Not used in this test")
            }

            override fun streamChat(request: SendChatRequest): Flow<StreamEvent> = flow {
                observedRequests += request
                if (observedRequests.size == 1) {
                    emit(StreamEvent.Error("Primary request failed"))
                } else {
                    emit(StreamEvent.ConversationId("retry-conversation"))
                    emit(StreamEvent.Token("Hanuman Ji reply"))
                    emit(StreamEvent.Done)
                }
            }
        }

        val client = PromptAwareChatApiClient(api)

        val result = client.sendMessage(
            ChatApiClientRequest(
                threadId = "thread-1",
                guideId = "krishna",
                conversationId = null,
                forceNewConversation = true,
                chatLang = "en",
                message = "Give me courage today",
                systemPrompt = "system",
                developerPrompt = "developer",
                languageInstruction = "language",
                guidePersonaPrompt = "persona",
                modeInstruction = "mode",
                stateAnchor = "state",
                earlierSummary = "summary",
                firstName = "Anish",
                secondaryGuard = "guard",
                optionalRewriteDirective = "rewrite",
                systemPromptStack = "stack"
            ),
            onToken = null
        )

        assertTrue(result.isSuccess)
        assertEquals("Hanuman Ji reply", result.getOrNull()?.replyText)
        assertEquals(2, observedRequests.size)
        assertEquals("system", observedRequests.first().systemPrompt)
        assertNull(observedRequests.last().systemPrompt)
        assertNull(observedRequests.last().developerPrompt)
        assertNull(observedRequests.last().guidePersonaPrompt)
        assertEquals("retry-conversation", result.getOrNull()?.conversationId)
    }

    @Test
    fun sendsPlainRequestForHanumanGuide() = runBlocking {
        val observedRequests = mutableListOf<SendChatRequest>()
        val api = object : ChatApi {
            override suspend fun loadConversation(
                guideId: String,
                conversationId: String?,
                forceNewConversation: Boolean,
                chatLang: String
            ): LoadConversationResult {
                error("Not used in this test")
            }

            override fun streamChat(request: SendChatRequest): Flow<StreamEvent> = flow {
                observedRequests += request
                emit(StreamEvent.ConversationId("hanuman-conversation"))
                emit(StreamEvent.Token("Hanuman Ji reply"))
                emit(StreamEvent.Done)
            }
        }

        val client = PromptAwareChatApiClient(api)

        val result = client.sendMessage(
            ChatApiClientRequest(
                threadId = "thread-2",
                guideId = "hanuman",
                conversationId = null,
                forceNewConversation = true,
                chatLang = "en",
                message = "Give me courage today",
                systemPrompt = "system",
                developerPrompt = "developer",
                languageInstruction = "language",
                guidePersonaPrompt = "persona",
                modeInstruction = "mode",
                stateAnchor = "state",
                earlierSummary = "summary",
                firstName = "Anish",
                secondaryGuard = "guard",
                optionalRewriteDirective = "rewrite",
                systemPromptStack = "stack"
            ),
            onToken = null
        )

        assertTrue(result.isSuccess)
        assertEquals("Hanuman Ji reply", result.getOrNull()?.replyText)
        assertEquals(1, observedRequests.size)
        assertNull(observedRequests.single().systemPrompt)
        assertNull(observedRequests.single().developerPrompt)
        assertNull(observedRequests.single().guidePersonaPrompt)
        assertNull(observedRequests.single().modeInstruction)
        assertEquals("hanuman-conversation", result.getOrNull()?.conversationId)
    }
}
