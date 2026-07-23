package com.bhaktichat.app.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "threads",
    indices = [Index(value = ["guideId"]), Index(value = ["updatedAt"])]
)
data class ThreadEntity(
    @PrimaryKey val id: String,
    val guideId: String,
    val createdAt: Long,
    val updatedAt: Long = createdAt,
    val remoteConversationId: String? = null,
    val statePayload: String = ""
)
