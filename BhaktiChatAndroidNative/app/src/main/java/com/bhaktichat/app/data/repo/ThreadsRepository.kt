package com.bhaktichat.app.data.repo

import com.bhaktichat.app.data.local.ThreadDao
import com.bhaktichat.app.data.local.ThreadEntity
import kotlinx.coroutines.flow.Flow
import java.util.UUID

interface ThreadsRepository {
    fun observeThreads(): Flow<List<ThreadEntity>>
    suspend fun createThread(guideId: String): ThreadEntity
    suspend fun getThread(threadId: String): ThreadEntity?
    suspend fun listThreads(): List<ThreadEntity>
    suspend fun touchThread(threadId: String, updatedAt: Long)
    suspend fun updateConversationState(
        threadId: String,
        updatedAt: Long,
        remoteConversationId: String?,
        statePayload: String
    )
    suspend fun deleteThread(threadId: String)
    suspend fun deleteAllThreads()
}

class RoomThreadsRepository(
    private val threadDao: ThreadDao
) : ThreadsRepository {
    override fun observeThreads(): Flow<List<ThreadEntity>> = threadDao.observeThreads()

    override suspend fun createThread(guideId: String): ThreadEntity {
        val now = System.currentTimeMillis()
        val thread = ThreadEntity(
            id = UUID.randomUUID().toString(),
            guideId = guideId,
            createdAt = now,
            updatedAt = now
        )
        threadDao.insert(thread)
        return thread
    }

    override suspend fun getThread(threadId: String): ThreadEntity? = threadDao.getThread(threadId)

    override suspend fun listThreads(): List<ThreadEntity> = threadDao.listThreads()

    override suspend fun touchThread(threadId: String, updatedAt: Long) {
        threadDao.updateUpdatedAt(threadId, updatedAt)
    }

    override suspend fun updateConversationState(
        threadId: String,
        updatedAt: Long,
        remoteConversationId: String?,
        statePayload: String
    ) {
        threadDao.updateConversationState(
            threadId = threadId,
            updatedAt = updatedAt,
            remoteConversationId = remoteConversationId,
            statePayload = statePayload
        )
    }

    override suspend fun deleteThread(threadId: String) {
        threadDao.deleteThread(threadId)
    }

    override suspend fun deleteAllThreads() {
        threadDao.deleteAllThreads()
    }
}
