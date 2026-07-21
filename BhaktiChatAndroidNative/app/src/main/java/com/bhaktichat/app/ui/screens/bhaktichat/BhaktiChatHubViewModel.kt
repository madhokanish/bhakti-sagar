package com.bhaktichat.app.ui.screens.bhaktichat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.data.remote.ChatApiClient
import com.bhaktichat.app.data.remote.ChatLimitReachedException
import com.bhaktichat.app.data.repo.GuidesRepository
import com.bhaktichat.app.data.repo.MessagesRepository
import com.bhaktichat.app.data.repo.ThreadsRepository
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.domain.Guide
import com.bhaktichat.app.domain.MessageStatus
import com.bhaktichat.app.ui.navigation.bhaktiGuideChips
import com.bhaktichat.app.ui.screens.chat.ChatConversationState
import com.bhaktichat.app.ui.screens.chat.ChatTurnProcessor
import com.bhaktichat.app.util.Analytics
import com.bhaktichat.app.util.AuthPreferences
import com.bhaktichat.app.util.EntitlementStore
import com.bhaktichat.app.util.ReviewPromptStore
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

/** A recent thread (with selected guide) summarised for the hub's "Continue your chats" row. */
data class RecentHubThread(
    val threadId: String,
    val preview: String,
    val updatedAt: Long,
    val lastMessageFromUser: Boolean
)

data class BhaktiChatHubUiState(
    val guides: List<Guide> = emptyList(),
    val selectedGuideId: String = "krishna",
    val inputText: String = "",
    /** Up to 3 most-recent threads with the *currently selected* guide. */
    val recentThreadsWithSelectedGuide: List<RecentHubThread> = emptyList(),
    /** True while the hub is creating a thread + first turn — mirrors iOS sending spinner. */
    val isLaunchingThread: Boolean = false
) {
    val selectedGuide: Guide?
        get() = guides.firstOrNull { it.id == selectedGuideId } ?: guides.firstOrNull()

    val chips: List<String>
        get() = bhaktiGuideChips[selectedGuideId].orEmpty()
}

sealed interface BhaktiChatHubUiEvent {
    data class NavigateToThread(val threadId: String) : BhaktiChatHubUiEvent
}

class BhaktiChatHubViewModel(
    private val guidesRepository: GuidesRepository,
    private val threadsRepository: ThreadsRepository,
    private val messagesRepository: MessagesRepository,
    private val chatApiClient: ChatApiClient,
    private val authPreferences: AuthPreferences,
    private val entitlementStore: EntitlementStore,
    private val reviewPromptStore: ReviewPromptStore,
    initialGuideId: String?
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        BhaktiChatHubUiState(
            guides = guidesRepository.getGuides(),
            selectedGuideId = initialGuideId
                ?.takeIf { guidesRepository.getGuide(it) != null }
                ?: "krishna"
        )
    )
    val uiState: StateFlow<BhaktiChatHubUiState> = _uiState.asStateFlow()

    private val uiEventsChannel = Channel<BhaktiChatHubUiEvent>(capacity = Channel.BUFFERED)
    val uiEvents = uiEventsChannel.receiveAsFlow()

    init {
        // Keep the hub's "Continue your chats" section in sync with the threads
        // table for the currently selected guide. Cap at 3 most recent.
        viewModelScope.launch {
            combine(
                threadsRepository.observeThreads(),
                _uiState.map { it.selectedGuideId }
            ) { threads, selectedId ->
                threads
                    .asSequence()
                    .filter { it.guideId == selectedId }
                    .sortedByDescending { it.updatedAt }
                    .take(3)
                    .toList()
            }
                .collect { matching ->
                    val recent = matching.map { thread ->
                        val latest = messagesRepository.latestMessage(thread.id)
                        RecentHubThread(
                            threadId = thread.id,
                            preview = latest?.content
                                ?.lineSequence()
                                ?.firstOrNull()
                                ?.trim()
                                ?.takeIf { it.isNotEmpty() }
                                ?: "New conversation",
                            updatedAt = thread.updatedAt,
                            lastMessageFromUser = latest?.role == ChatRole.USER.wire
                        )
                    }
                    _uiState.update { it.copy(recentThreadsWithSelectedGuide = recent) }
                }
        }
    }

    fun openThread(threadId: String) {
        viewModelScope.launch {
            uiEventsChannel.send(BhaktiChatHubUiEvent.NavigateToThread(threadId))
        }
    }

    fun selectGuide(guideId: String) {
        if (guidesRepository.getGuide(guideId) == null) return
        _uiState.update { it.copy(selectedGuideId = guideId) }
    }

    fun onInputChanged(value: String) {
        _uiState.update { it.copy(inputText = value) }
    }

    fun startThreadFromChip(chipText: String) {
        val selectedGuide = _uiState.value.selectedGuide ?: return
        val prompt = chipText.trim()
        if (prompt.isBlank()) return
        // Ad-based model: chat is free for everyone — no quota gate.
        launchThreadWithPrompt(selectedGuide, prompt)
    }

    fun startThreadFromInput() {
        val selectedGuide = _uiState.value.selectedGuide ?: return
        val prompt = _uiState.value.inputText.trim()
        if (prompt.isBlank()) return
        // Ad-based model: chat is free for everyone — no quota gate.
        _uiState.update { it.copy(inputText = "") }
        launchThreadWithPrompt(selectedGuide, prompt)
    }

    private fun launchThreadWithPrompt(selectedGuide: Guide, prompt: String) {
        _uiState.update { it.copy(isLaunchingThread = true) }
        viewModelScope.launch {
            val thread = threadsRepository.createThread(selectedGuide.id)
            val now = System.currentTimeMillis()

            // Guide "speaks first": seed the warm opener so the thread doesn't open cold
            // on the user's own words. (Home already does this; the hub path did not.)
            messagesRepository.addMessage(
                MessageEntity(
                    id = UUID.randomUUID().toString(),
                    threadId = thread.id,
                    guideId = selectedGuide.id,
                    role = ChatRole.ASSISTANT.wire,
                    content = selectedGuide.openingScene,
                    createdAt = now,
                    status = MessageStatus.SENT.name
                )
            )

            val userMessage = MessageEntity(
                id = UUID.randomUUID().toString(),
                threadId = thread.id,
                guideId = selectedGuide.id,
                role = ChatRole.USER.wire,
                content = prompt,
                createdAt = now + 1,
                status = MessageStatus.SENDING.name
            )
            messagesRepository.addMessage(userMessage)
            messagesRepository.updateMessageStatus(userMessage.id, MessageStatus.SENT)

            val typingMessage = MessageEntity(
                id = UUID.randomUUID().toString(),
                threadId = thread.id,
                guideId = selectedGuide.id,
                role = ChatRole.ASSISTANT.wire,
                content = "",
                createdAt = now + 2,
                status = MessageStatus.SENT.name,
                isTypingIndicator = true
            )
            messagesRepository.addMessage(typingMessage)
            threadsRepository.touchThread(thread.id, typingMessage.createdAt)

            uiEventsChannel.send(BhaktiChatHubUiEvent.NavigateToThread(thread.id))
            _uiState.update { it.copy(isLaunchingThread = false) }

            val sendResult = ChatTurnProcessor.generateReply(
                threadId = thread.id,
                guide = selectedGuide,
                messageText = prompt,
                messages = messagesRepository
                    .listMessages(thread.id)
                    .filterNot { it.isTypingIndicator },
                authState = authPreferences.state.value,
                currentState = ChatConversationState(),
                remoteConversationId = null,
                chatApiClient = chatApiClient,
                onToken = { streamed ->
                    messagesRepository.replaceTypingWithResponse(typingMessage.id, streamed)
                }
            )

            // Server free-limit reached → drop the pending bubble and show the
            // non-skippable Pro gate rather than a fake/error reply.
            if (sendResult.exceptionOrNull() is ChatLimitReachedException) {
                messagesRepository.removeMessage(typingMessage.id)
                entitlementStore.markChatLimitReached()
                return@launch
            }

            val response = sendResult.getOrNull()?.replyText
                ?: "I am reflecting upon your question. Please try again in a moment."
            messagesRepository.replaceTypingWithResponse(typingMessage.id, response)
            val updatedAt = System.currentTimeMillis()
            threadsRepository.touchThread(thread.id, updatedAt)
            sendResult.getOrNull()?.let { result ->
                threadsRepository.updateConversationState(
                    threadId = thread.id,
                    updatedAt = updatedAt,
                    remoteConversationId = result.conversationId,
                    statePayload = result.nextState.toStateAnchorJson()
                )
                // Only count successful round-trips against the free-tier quota.
                entitlementStore.recordMessageSent()
                reviewPromptStore.recordMessageSent()
                Analytics.chatMessageSent(guideId = selectedGuide.id)
            }
        }
    }
}

class BhaktiChatHubViewModelFactory(
    private val guidesRepository: GuidesRepository,
    private val threadsRepository: ThreadsRepository,
    private val messagesRepository: MessagesRepository,
    private val chatApiClient: ChatApiClient,
    private val authPreferences: AuthPreferences,
    private val entitlementStore: EntitlementStore,
    private val reviewPromptStore: ReviewPromptStore,
    private val initialGuideId: String?
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return BhaktiChatHubViewModel(
            guidesRepository = guidesRepository,
            threadsRepository = threadsRepository,
            messagesRepository = messagesRepository,
            chatApiClient = chatApiClient,
            authPreferences = authPreferences,
            entitlementStore = entitlementStore,
            reviewPromptStore = reviewPromptStore,
            initialGuideId = initialGuideId
        ) as T
    }
}
