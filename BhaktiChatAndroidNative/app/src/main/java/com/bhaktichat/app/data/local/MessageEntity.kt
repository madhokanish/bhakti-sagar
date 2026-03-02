package com.bhaktichat.app.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "messages",
    indices = [Index(value = ["guideId"]), Index(value = ["guideId", "createdAt"])]
)
data class MessageEntity(
    @PrimaryKey val id: String,
    val guideId: String,
    val role: String,
    val content: String,
    val createdAt: Long
)
