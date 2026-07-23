package com.bhaktichat.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE threadId = :threadId ORDER BY createdAt ASC")
    fun observeMessagesForThread(threadId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE threadId = :threadId ORDER BY createdAt ASC")
    suspend fun listMessagesForThread(threadId: String): List<MessageEntity>

    @Query("SELECT * FROM messages WHERE threadId = :threadId ORDER BY createdAt DESC LIMIT 1")
    suspend fun getLatestMessageForThread(threadId: String): MessageEntity?

    @Query("SELECT * FROM messages WHERE guideId = :guideId ORDER BY createdAt ASC")
    fun observeMessages(guideId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE guideId = :guideId ORDER BY createdAt DESC LIMIT 1")
    fun observeLatestMessage(guideId: String): Flow<MessageEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: MessageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(messages: List<MessageEntity>)

    @Query("UPDATE messages SET content = :content WHERE id = :id")
    suspend fun updateContent(id: String, content: String)

    @Query("UPDATE messages SET status = :status WHERE id = :id")
    suspend fun updateStatus(id: String, status: String)

    @Query("UPDATE messages SET content = :content, status = :status, isTypingIndicator = :isTypingIndicator WHERE id = :id")
    suspend fun updateMessage(
        id: String,
        content: String,
        status: String,
        isTypingIndicator: Boolean
    )

    @Query("DELETE FROM messages WHERE guideId = :guideId")
    suspend fun deleteByGuide(guideId: String)

    @Query("DELETE FROM messages WHERE threadId = :threadId")
    suspend fun deleteByThread(threadId: String)

    @Query("DELETE FROM messages WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM messages")
    suspend fun deleteAll()

    @Query("SELECT COUNT(*) FROM messages WHERE guideId = :guideId")
    suspend fun countByGuide(guideId: String): Int
}
