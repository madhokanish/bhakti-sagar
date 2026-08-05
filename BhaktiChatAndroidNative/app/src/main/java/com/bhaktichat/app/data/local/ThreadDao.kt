package com.bhaktichat.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ThreadDao {
    // Archived (collapsed pre-2.0 duplicate) threads never show up here — only in
    // listAllThreadsIncludingArchived, used solely by the one-time collapse migration.
    @Query("SELECT * FROM threads WHERE isArchived = 0 ORDER BY updatedAt DESC")
    fun observeThreads(): Flow<List<ThreadEntity>>

    @Query("SELECT * FROM threads WHERE isArchived = 0 ORDER BY updatedAt DESC")
    suspend fun listThreads(): List<ThreadEntity>

    @Query("SELECT * FROM threads ORDER BY updatedAt DESC")
    suspend fun listAllThreadsIncludingArchived(): List<ThreadEntity>

    @Query("SELECT * FROM threads WHERE id = :threadId LIMIT 1")
    suspend fun getThread(threadId: String): ThreadEntity?

    @Query("SELECT * FROM threads WHERE guideId = :guideId AND isArchived = 0 ORDER BY updatedAt DESC LIMIT 1")
    suspend fun getActiveThreadForGuide(guideId: String): ThreadEntity?

    @Query("UPDATE threads SET isArchived = 1 WHERE id = :threadId")
    suspend fun archiveThread(threadId: String)

    @Query(
        "UPDATE threads SET updatedAt = :updatedAt, remoteConversationId = NULL, statePayload = '' " +
            "WHERE id = :threadId"
    )
    suspend fun resetThreadState(threadId: String, updatedAt: Long)

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
