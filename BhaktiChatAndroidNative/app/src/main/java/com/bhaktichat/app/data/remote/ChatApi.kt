package com.bhaktichat.app.data.remote

import com.bhaktichat.app.domain.StreamEvent
import kotlinx.coroutines.flow.Flow

interface ChatApi {
    fun streamChat(request: SendChatRequest): Flow<StreamEvent>
}
