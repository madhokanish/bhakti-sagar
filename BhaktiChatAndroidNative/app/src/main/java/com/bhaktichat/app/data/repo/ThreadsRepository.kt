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

    /** Get-or-create: BhaktiChat 2.0 keeps exactly one visible conversation per guide — like
     *  messaging a person, not filing a new ticket every time. */
    suspend fun getOrCreateThread(guideId: String): ThreadEntity

    /** Clears server-side conversation state (remote id + state anchor) so the next message
     *  starts genuinely fresh context. Message *history* is cleared separately, by the caller,
     *  via MessagesRepository.deleteThreadMessages — thread metadata and chat messages are
     *  different repositories on Android. */
    suspend fun resetThreadState(threadId: String, updatedAt: Long = System.currentTimeMillis())

    /** One-time-in-effect collapse of pre-2.0 duplicate threads: per guide, keeps the
     *  most-recently-updated thread and archives the rest (hidden from the list, never
     *  deleted). Idempotent and self-limiting — once every guide has at most one active
     *  thread, later calls are no-ops — so it's safe to call on every app start rather than
     *  needing a separate one-time flag. */
    suspend fun collapseDuplicateThreadsIfNeeded()
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

    override suspend fun getOrCreateThread(guideId: String): ThreadEntity {
        return threadDao.getActiveThreadForGuide(guideId) ?: createThread(guideId)
    }

    override suspend fun resetThreadState(threadId: String, updatedAt: Long) {
        threadDao.resetThreadState(threadId, updatedAt)
    }

    override suspend fun collapseDuplicateThreadsIfNeeded() {
        val byGuide = threadDao.listAllThreadsIncludingArchived()
            .filter { !it.isArchived }
            .groupBy { it.guideId }
        for ((_, group) in byGuide) {
            if (group.size <= 1) continue
            val survivorId = group.maxByOrNull { it.updatedAt }?.id ?: continue
            for (thread in group) {
                if (thread.id != survivorId) {
                    threadDao.archiveThread(thread.id)
                }
            }
        }
    }
}
