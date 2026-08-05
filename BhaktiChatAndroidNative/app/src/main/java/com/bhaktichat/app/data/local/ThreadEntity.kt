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
    val statePayload: String = "",
    /** Hidden from the conversation list without deleting it — set by the one-thread-per-guide
     *  migration when collapsing pre-2.0 duplicate threads, so nothing the user wrote is lost. */
    val isArchived: Boolean = false
)
