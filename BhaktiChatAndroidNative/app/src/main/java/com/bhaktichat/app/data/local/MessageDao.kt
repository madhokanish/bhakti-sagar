package com.bhaktichat.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageDao {
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

    @Query("DELETE FROM messages WHERE guideId = :guideId")
    suspend fun deleteByGuide(guideId: String)

    @Query("SELECT COUNT(*) FROM messages WHERE guideId = :guideId")
    suspend fun countByGuide(guideId: String): Int
}
