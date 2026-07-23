package com.bhaktichat.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ThreadDao {
    @Query("SELECT * FROM threads ORDER BY updatedAt DESC")
    fun observeThreads(): Flow<List<ThreadEntity>>

    @Query("SELECT * FROM threads ORDER BY updatedAt DESC")
    suspend fun listThreads(): List<ThreadEntity>

    @Query("SELECT * FROM threads WHERE id = :threadId LIMIT 1")
    suspend fun getThread(threadId: String): ThreadEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(thread: ThreadEntity)

    @Query("UPDATE threads SET updatedAt = :updatedAt WHERE id = :threadId")
    suspend fun updateUpdatedAt(threadId: String, updatedAt: Long)

    @Query(
        "UPDATE threads SET updatedAt = :updatedAt, remoteConversationId = :remoteConversationId, " +
            "statePayload = :statePayload WHERE id = :threadId"
    )
    suspend fun updateConversationState(
        threadId: String,
        updatedAt: Long,
        remoteConversationId: String?,
        statePayload: String
    )

    @Query("DELETE FROM threads WHERE id = :threadId")
    suspend fun deleteThread(threadId: String)

    @Query("DELETE FROM threads")
    suspend fun deleteAllThreads()
}
