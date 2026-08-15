package com.bhaktichat.app.ui.screens.chat
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.MutableSharedFlow

import com.bhaktichat.app.util.LanguageStore

import com.bhaktichat.app.ui.i18n.translate

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.data.local.ThreadEntity
import com.bhaktichat.app.data.remote.ChatApiClient
import com.bhaktichat.app.data.remote.ChatLimitReachedException
import com.bhaktichat.app.data.repo.GuidesRepository
import com.bhaktichat.app.data.repo.MessagesRepository
import com.bhaktichat.app.data.repo.ThreadsRepository
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.domain.Guide
import com.bhaktichat.app.domain.MessageStatus
import com.bhaktichat.app.util.Analytics
import com.bhaktichat.app.util.EntitlementStore
import com.bhaktichat.app.util.ReviewPromptStore
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID

data class ThreadUiState(
    val thread: ThreadEntity? = null,
    val guide: Guide? = null,
    val messages: List<MessageEntity> = emptyList(),
    val inputText: String = "",
    val isLoading: Boolean = true,
    val isSending: Boolean = false,
    val error: String? = null
)

class ChatThreadViewModel(
    private val threadId: String,
    private val guidesRepository: GuidesRepository,
    private val threadsRepository: ThreadsRepository,
    private val messagesRepository: MessagesRepository,
    private val chatApiClient: ChatApiClient,
    private val entitlementStore: EntitlementStore,
    private val reviewPromptStore: ReviewPromptStore,
    private val userFirstName: String = "",
    private val languageStore: LanguageStore
) : ViewModel() {
    /** Emitted when a send is refused for quota reasons; the screen navigates to चढ़ावा. */
    private val _paywallEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val paywallEvents: SharedFlow<Unit> = _paywallEvents.asSharedFlow()

    private val _uiState = MutableStateFlow(ThreadUiState())
    val uiState: StateFlow<ThreadUiState> = _uiState.asStateFlow()
    private var conversationState = ChatConversationState()
    private var remoteConversationId: String? = null

    init {
        viewModelScope.launch {
            val thread = threadsRepository.getThread(threadId)
            val guide = thread?.guideId?.let(guidesRepository::getGuide)
            conversationState = ChatConversationState.fromStoredPayload(thread?.statePayload)
            remoteConversationId = thread?.remoteConversationId
            _uiState.update {
                it.copy(
                    thread = thread,
                    guide = guide,
                    isLoading = false,
                    error = if (thread == null || guide == null) {
                        translate("chat_thinking_fallback", languageStore.language.value)
                    } else {
                        null
                    }
                )
            }
        }

        viewModelScope.launch {
            messagesRepository.observeMessages(threadId).collect { messages ->
                _uiState.update { current ->
                    current.copy(messages = messages)
                }
            }
        }
    }

    fun onInputChanged(value: String) {
        _uiState.update { it.copy(inputText = value) }
    }

    fun sendMessage(text: String = _uiState.value.inputText) {
        val thread = _uiState.value.thread ?: return
        val guide = _uiState.value.guide ?: return
        val trimmed = text.trim()
        if (trimmed.isBlank() || _uiState.value.isSending) return

        // Free tier exhausted — send nothing and route the user to चढ़ावा. Checked before
        // any message is persisted so a blocked attempt leaves no half-written thread.
        if (!entitlementStore.canUseChat) {
            entitlementStore.reportQuotaReached("chat")
            viewModelScope.launch { _paywallEvents.emit(Unit) }
            return
        }

        viewModelScope.launch {
            try {
            val now = System.currentTimeMillis()
            val userMessage = MessageEntity(
                id = UUID.randomUUID().toString(),
                threadId = thread.id,
                guideId = guide.id,
                role = ChatRole.USER.wire,
                content = trimmed,
                createdAt = now,
                status = MessageStatus.SENDING.name
            )
            messagesRepository.addMessage(userMessage)
            messagesRepository.updateMessageStatus(userMessage.id, MessageStatus.SENT)

            val typingMessage = MessageEntity(
                id = UUID.randomUUID().toString(),
                threadId = thread.id,
                guideId = guide.id,
                role = ChatRole.ASSISTANT.wire,
                content = "",
                createdAt = now + 1,
                status = MessageStatus.SENT.name,
                isTypingIndicator = true
            )
            messagesRepository.addMessage(typingMessage)
            threadsRepository.touchThread(thread.id, typingMessage.createdAt)

            _uiState.update {
                it.copy(
                    inputText = "",
                    isSending = true,
                    error = null
                )
            }

            val sendResult = withContext(Dispatchers.IO) {
                ChatTurnProcessor.generateReply(
                    threadId = thread.id,
                    guide = guide,
                    messageText = trimmed,
                    messages = messagesRepository
                        .listMessages(thread.id)
                        .filterNot { it.isTypingIndicator },
                    currentState = conversationState,
                    remoteConversationId = remoteConversationId,
                    chatApiClient = chatApiClient,
                    userFirstName = userFirstName,
                    appLanguage = languageStore.language.value,
                    // Stream tokens straight into the assistant bubble as they arrive so
                    // the reply feels live instead of appearing all at once.
                    onToken = { streamed ->
                        messagesRepository.replaceTypingWithResponse(typingMessage.id, streamed)
                    }
                )
            }

            // Server says the free limit is exhausted → drop the pending bubble and show
            // the non-skippable Pro gate instead of a fake/error reply.
            if (sendResult.exceptionOrNull() is ChatLimitReachedException) {
                withContext(Dispatchers.IO) { messagesRepository.removeMessage(typingMessage.id) }
                entitlementStore.markChatLimitReached()
                _uiState.update { it.copy(isSending = false, error = null) }
                return@launch
            }

            val response = sendResult.getOrNull()?.replyText
                ?: translate("chat_thinking_fallback", languageStore.language.value)
            withContext(Dispatchers.IO) {
                messagesRepository.replaceTypingWithResponse(typingMessage.id, response)
                threadsRepository.touchThread(thread.id, System.currentTimeMillis())
                sendResult.getOrNull()?.let { result ->
                    threadsRepository.updateConversationState(
                        threadId = thread.id,
                        updatedAt = System.currentTimeMillis(),
                        remoteConversationId = result.conversationId,
                        statePayload = result.nextState.toStateAnchorJson()
                    )
                }
            }
            sendResult.getOrNull()?.let { result ->
                conversationState = result.nextState
                remoteConversationId = result.conversationId
                // Only burn quota on a successful round-trip (the assistant reply
                // actually came back). Failures / errors leave the counter alone.
                entitlementStore.recordMessageSent()
                reviewPromptStore.recordMessageSent()
                Analytics.chatMessageSent(guideId = guide.id)
                // Full turn text, so conversations are readable in PostHog for product review
                // and model improvement. (Sensitive content — see Analytics.guideChatTurn.)
                Analytics.guideChatTurn(
                    guideId = guide.id,
                    userInput = trimmed,
                    guideResponse = response,
                    language = languageStore.language.value.wireValue
                )
            }

            _uiState.update {
                it.copy(
                    isSending = false,
                    error = sendResult.exceptionOrNull()?.let { translate("chat_send_failed", languageStore.language.value) }
                )
            }
            } catch (cancellation: CancellationException) {
                throw cancellation
            } catch (error: Exception) {
                // A DB write here must not strand the UI: isSending has to clear, or the
                // user can never send again without restarting the app.
                _uiState.update {
                    it.copy(
                        isSending = false,
                        error = translate("common_something_wrong", languageStore.language.value)
                    )
                }
            }
        }
    }

    /**
     * Removes the most recent assistant reply (if any) and re-asks the model for the
     * preceding user prompt. No-op if there is no user message yet or if a send is
     * already in flight.
     */
    fun regenerateLastReply() {
        if (_uiState.value.isSending) return
        val msgs = _uiState.value.messages
        if (msgs.isEmpty()) return
        val lastUser = msgs.lastOrNull { ChatRole.fromWire(it.role) == ChatRole.USER } ?: return

        viewModelScope.launch {
            // Remove the trailing assistant message(s) AND the last user message itself
            // so that sendMessage() can re-insert a fresh user message and produce a
            // brand-new reply.
            val lastUserIndex = msgs.indexOfLast { it.id == lastUser.id }
            val toRemove = msgs.drop(lastUserIndex)
            withContext(Dispatchers.IO) {
                toRemove.forEach { messagesRepository.removeMessage(it.id) }
            }
            sendMessage(lastUser.content)
        }
    }
}

class ChatThreadViewModelFactory(
    private val threadId: String,
    private val guidesRepository: GuidesRepository,
    private val threadsRepository: ThreadsRepository,
    private val messagesRepository: MessagesRepository,
    private val chatApiClient: ChatApiClient,
    private val entitlementStore: EntitlementStore,
    private val reviewPromptStore: ReviewPromptStore,
    private val userFirstName: String = "",
    private val languageStore: LanguageStore
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return ChatThreadViewModel(
            threadId = threadId,
            guidesRepository = guidesRepository,
            threadsRepository = threadsRepository,
            messagesRepository = messagesRepository,
            chatApiClient = chatApiClient,
            entitlementStore = entitlementStore,
            reviewPromptStore = reviewPromptStore,
            userFirstName = userFirstName,
            languageStore = languageStore
        ) as T
    }
}
