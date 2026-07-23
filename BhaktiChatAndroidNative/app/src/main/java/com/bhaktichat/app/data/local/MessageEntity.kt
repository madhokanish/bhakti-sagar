package com.bhaktichat.app.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.bhaktichat.app.domain.MessageStatus

@Entity(
    tableName = "messages",
    indices = [
        Index(value = ["guideId"]),
        Index(value = ["guideId", "createdAt"]),
        Index(value = ["threadId"]),
        Index(value = ["threadId", "createdAt"])
    ]
)
data class MessageEntity(
    @PrimaryKey val id: String,
    val threadId: String = "",
    val guideId: String,
    val role: String,
    val content: String,
    val createdAt: Long,
    val status: String = MessageStatus.SENT.name,
    val isTypingIndicator: Boolean = false
)
