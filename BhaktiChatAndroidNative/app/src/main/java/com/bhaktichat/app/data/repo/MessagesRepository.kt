package com.bhaktichat.app.data.repo

import com.bhaktichat.app.data.local.MessageDao
import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.MessageStatus
import kotlinx.coroutines.flow.Flow

interface MessagesRepository {
    fun observeMessages(threadId: String): Flow<List<MessageEntity>>
    suspend fun listMessages(threadId: String): List<MessageEntity>
    suspend fun latestMessage(threadId: String): MessageEntity?
    suspend fun addMessage(message: MessageEntity)
    suspend fun updateMessageStatus(messageId: String, status: MessageStatus)
    suspend fun replaceTypingWithResponse(messageId: String, responseText: String)
    suspend fun removeMessage(messageId: String)
    suspend fun deleteThreadMessages(threadId: String)
    suspend fun deleteAllMessages()
}

class RoomMessagesRepository(
    private val messageDao: MessageDao
) : MessagesRepository {
    override fun observeMessages(threadId: String): Flow<List<MessageEntity>> {
        return messageDao.observeMessagesForThread(threadId)
    }

    override suspend fun listMessages(threadId: String): List<MessageEntity> {
        return messageDao.listMessagesForThread(threadId)
    }

    override suspend fun latestMessage(threadId: String): MessageEntity? {
        return messageDao.getLatestMessageForThread(threadId)
    }

    override suspend fun addMessage(message: MessageEntity) {
        messageDao.insert(message)
    }

    override suspend fun updateMessageStatus(messageId: String, status: MessageStatus) {
        messageDao.updateStatus(messageId, status.name)
    }

    override suspend fun replaceTypingWithResponse(messageId: String, responseText: String) {
        messageDao.updateMessage(
            id = messageId,
            content = responseText,
            status = MessageStatus.SENT.name,
            isTypingIndicator = false
        )
    }

    override suspend fun removeMessage(messageId: String) {
        messageDao.deleteById(messageId)
    }

    override suspend fun deleteThreadMessages(threadId: String) {
        messageDao.deleteByThread(threadId)
    }

    override suspend fun deleteAllMessages() {
        messageDao.deleteAll()
    }
}
