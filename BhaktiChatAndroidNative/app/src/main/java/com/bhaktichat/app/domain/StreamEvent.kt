package com.bhaktichat.app.domain

sealed class StreamEvent {
    data class Token(val textChunk: String) : StreamEvent()
    data class ConversationId(val value: String?) : StreamEvent()
    data object Done : StreamEvent()
    data class Error(val message: String) : StreamEvent()

    /** Server signalled the free-tier message limit is exhausted (a hard, non-skippable gate). */
    data object LimitReached : StreamEvent()
}
