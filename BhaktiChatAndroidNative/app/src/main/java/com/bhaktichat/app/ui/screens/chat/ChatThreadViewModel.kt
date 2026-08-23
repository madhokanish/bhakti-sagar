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
import com.bhaktichat.app.util.ChatNudgeStore
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
    val error: String? = null,
    /**
     * Shows the चढ़ावा card under the conversation. Held in UI state rather than inserted
     * into [messages] on purpose: ChatRepository builds the model's context from the message
     * list, so a promo injected there would become conversation history the guide starts
     * imitating.
     */
    val showChadhaavaNudge: Boolean = false
)

private val DEVOTIONAL_GREETING = Regex(
    "\\b(jai|jay|jaikara|radhe|radhey|har har mahadev|om namah shivaya|namah shivay|" +
        "hare krishna|hare ram|bajrangbali|jai mata di|praise be|praise the lord)\\b" +
        "|जय|राधे|हर हर महादेव|ॐ नमः शिवाय|हरे कृष्ण|हरे राम|जय माता दी",
    RegexOption.IGNORE_CASE
)

/** User messages between चढ़ावा nudges. */
private const val NUDGE_EVERY_N_EXCHANGES = 5

/** Hard ceiling per ViewModel instance, so one long session cannot nag repeatedly. */
private const val NUDGE_MAX_PER_SESSION = 2

class ChatThreadViewModel(
    private val threadId: String,
    private val guidesRepository: GuidesRepository,
    private val threadsRepository: ThreadsRepository,
    private val messagesRepository: MessagesRepository,
    private val chatApiClient: ChatApiClient,
    private val entitlementStore: EntitlementStore,
    private val reviewPromptStore: ReviewPromptStore,
    private val chatNudgeStore: ChatNudgeStore,
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
                maybeShowChadhaavaNudge(force = isDevotionalGreeting(trimmed))
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

    private var nudgesShownThisSession = 0

    /**
     * Offers चढ़ावा after every [NUDGE_EVERY_N_EXCHANGES]th message the user sends. The offer is BhaktiChat's,
     * not the guide's — a deity persona promising an outcome in exchange for payment is both
     * a Play policy problem and the thing that generates refund disputes.
     */
    private fun maybeShowChadhaavaNudge(force: Boolean = false) {
        if (entitlementStore.isPro.value) return
        if (nudgesShownThisSession >= NUDGE_MAX_PER_SESSION) return
        if (!chatNudgeStore.shouldShow()) return
        if (!force) {
            // Counts the user's own messages, not the guide's. One guide turn can land as
            // several bubbles, so an assistant-message count jumps in irregular steps (3 -> 7)
            // and a `% N == 0` test skips the multiple entirely — the nudge would fire only by
            // luck. One user message per exchange makes the cadence exact.
            val exchanges = _uiState.value.messages.count { it.role == ChatRole.USER.wire }
            if (exchanges == 0 || exchanges % NUDGE_EVERY_N_EXCHANGES != 0) return
        }
        nudgesShownThisSession += 1
        _uiState.update { it.copy(showChadhaavaNudge = true) }
        Analytics.screen(if (force) "chat_chadhaava_nudge_jaikara" else "chat_chadhaava_nudge")
    }

    /**
     * A jaikara — "Jai Shri Ram", "Radhe Radhe", "Har Har Mahadev" — is the user expressing
     * devotion unprompted, so the offer surfaces there rather than waiting for the reply
     * counter. It still respects the session cap and the dismissal cooldown, and it still
     * only raises the card: the user is never navigated out of their conversation.
     *
     * Word boundaries matter on the short romanised forms. "jai" without \b would fire on
     * "jaise", which is one of the most common words in Hinglish.
     */
    private fun isDevotionalGreeting(text: String): Boolean = DEVOTIONAL_GREETING.containsMatchIn(text)

    /** User said no. Buys a day of quiet across every thread. */
    fun dismissChadhaavaNudge() {
        chatNudgeStore.markDismissed()
        _uiState.update { it.copy(showChadhaavaNudge = false) }
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
    private val chatNudgeStore: ChatNudgeStore,
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
            chatNudgeStore = chatNudgeStore,
            userFirstName = userFirstName,
            languageStore = languageStore
        ) as T
    }
}
