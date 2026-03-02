package com.bhaktichat.app.data.remote

import com.bhaktichat.app.domain.StreamEvent
import kotlinx.coroutines.flow.Flow

interface ChatApi {
    suspend fun loadConversation(
        guideId: String,
        conversationId: String?,
        forceNewConversation: Boolean,
        chatLang: String = "en"
    ): LoadConversationResult

    fun streamChat(request: SendChatRequest): Flow<StreamEvent>
}
