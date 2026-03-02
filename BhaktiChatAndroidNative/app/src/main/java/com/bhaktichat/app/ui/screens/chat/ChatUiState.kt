package com.bhaktichat.app.ui.screens.chat

import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.Guide

data class ChatUiState(
    val guide: Guide? = null,
    val messages: List<MessageEntity> = emptyList(),
    val inputText: String = "",
    val isStreaming: Boolean = false,
    val error: String? = null
)
