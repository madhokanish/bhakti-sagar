package com.bhaktichat.app.ui.screens.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.data.repo.ChatRepository
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.domain.Guides
import com.bhaktichat.app.domain.StreamEvent
import com.bhaktichat.app.util.AuthPreferences
import com.bhaktichat.app.util.GuidePreferences
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

class ChatViewModel(
    private val guideId: String,
    private val repository: ChatRepository,
    private val guidePreferences: GuidePreferences,
    private val authPreferences: AuthPreferences,
    private val deferInitialLoad: Boolean
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private val _refocusEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val refocusEvents: SharedFlow<Unit> = _refocusEvents.asSharedFlow()

    private var conversationId: String? = guidePreferences.conversationId(guideId)
    private var conversationState = ChatConversationState()

    init {
        val guide = Guides.byId(guideId)
        _uiState.update { it.copy(guide = guide) }
        guide?.let { guidePreferences.setLastGuideId(it.id) }

        viewModelScope.launch {
            repository.observeMessages(guideId).collect { messages ->
                _uiState.update { current -> current.copy(messages = messages) }
            }
        }

        if (!deferInitialLoad) {
            viewModelScope.launch {
                loadConversation(forceNewConversation = false)
            }
        }
    }

    fun onInputChanged(value: String) {
        _uiState.update { it.copy(inputText = value) }
    }

    fun onSelectSuggestedPrompt(prompt: String) {
        _uiState.update { it.copy(inputText = prompt) }
        onSend()
    }

    fun applyPrefillIfNeeded(text: String) {
        val trimmedText = text.trim()
        if (trimmedText.isBlank()) return

        val applied = _uiState.updateAndCheckIfChanged { current ->
            if (current.inputText.isBlank()) {
                current.copy(inputText = trimmedText, error = null)
            } else {
                current
            }
        }

        if (applied) {
            _refocusEvents.tryEmit(Unit)
        }
    }

    fun onSend() {
        val messageText = _uiState.value.inputText.trim()
        if (messageText.isEmpty()) return
        sendMessage(messageText = messageText, seedMessages = _uiState.value.messages)
    }

    fun launchFreshThread(skipOpener: Boolean, autoSendPrompt: String?) {
        val guide = _uiState.value.guide ?: return
        if (_uiState.value.isStreaming) return

        viewModelScope.launch {
            val seededMessages = resetConversation(guide = guide, skipOpener = skipOpener)
            _uiState.update {
                it.copy(
                    messages = seededMessages,
                    inputText = "",
                    error = null
                )
            }

            if (autoSendPrompt.isNullOrBlank()) {
                _refocusEvents.tryEmit(Unit)
            } else {
                sendMessage(messageText = autoSendPrompt.trim(), seedMessages = seededMessages)
            }
        }
    }

    fun onNewChat() {
        val guide = _uiState.value.guide ?: return
        viewModelScope.launch {
            val seededMessages = resetConversation(guide = guide, skipOpener = false)
            _uiState.update {
                it.copy(
                    messages = seededMessages,
                    inputText = "",
                    error = null
                )
            }
        }
    }

    private fun sendMessage(
        messageText: String,
        seedMessages: List<MessageEntity>
    ) {
        val guide = _uiState.value.guide ?: return
        if (_uiState.value.isStreaming) return

        _uiState.update { it.copy(inputText = "", isStreaming = true, error = null) }
        _refocusEvents.tryEmit(Unit)

        viewModelScope.launch {
            try {
            val authState = authPreferences.state.value
            val messageContext = AddressingEngine.buildMessageContext(
                guideId = guide.id,
                isAuthenticated = authState.isLoggedIn,
                firstName = authState.name,
                userMessage = messageText,
                previousAssistantMessage = seedMessages.lastOrNull {
                    ChatRole.fromWire(it.role) == ChatRole.ASSISTANT
                }
            )
            val turnMode = ChatTurnRouter.resolveMode(messageContext)
            val promptPayload = ChatPromptAssembler.build(
                guide = guide,
                context = messageContext,
                mode = turnMode,
                conversationState = conversationState,
                messages = seedMessages,
                firstName = authState.name
            )
            val plannedPrefix = AddressingEngine.buildAddressPrefix(messageContext)
            val userMessage = MessageEntity(
                id = UUID.randomUUID().toString(),
                guideId = guide.id,
                role = ChatRole.USER.wire,
                content = messageText,
                createdAt = System.currentTimeMillis()
            )
            repository.insertMessage(userMessage)

            val assistantMessageId = UUID.randomUUID().toString()
            repository.insertMessage(
                MessageEntity(
                    id = assistantMessageId,
                    guideId = guide.id,
                    role = ChatRole.ASSISTANT.wire,
                    content = "",
                    createdAt = System.currentTimeMillis() + 1
                )
            )

            val builder = StringBuilder()
            var appliedPrefix = ""
            var prefixDecided = plannedPrefix.isNullOrBlank()
            val forceNewConversation = conversationId == null &&
                seedMessages.none { ChatRole.fromWire(it.role) == ChatRole.USER }

            repository.sendMessageStreaming(
                guideId = guide.serverPromptKey,
                message = messageText,
                conversationId = conversationId,
                forceNewConversation = forceNewConversation,
                chatLang = messageContext.detectedLanguage.toWire(),
                systemPrompt = promptPayload.systemPrompt,
                developerPrompt = promptPayload.developerPrompt,
                languageInstruction = promptPayload.appVariables.languageInstruction,
                guidePersonaPrompt = promptPayload.appVariables.guidePersonaPrompt,
                systemPromptStack = promptPayload.systemPromptStack,
                clientMode = turnMode.name.lowercase(),
                stateAnchor = promptPayload.stateAnchor,
                earlierSummary = promptPayload.earlierSummary,
                firstName = promptPayload.appVariables.firstName,
                secondaryGuard = promptPayload.appVariables.secondaryGuard,
                optionalRewriteDirective = promptPayload.appVariables.optionalRewriteDirective
            ).collect { event ->
                when (event) {
                    is StreamEvent.Token -> {
                        if (!prefixDecided) {
                            appliedPrefix = if (AddressingEngine.shouldPrependPrefix(plannedPrefix.orEmpty(), event.textChunk)) {
                                plannedPrefix.orEmpty()
                            } else {
                                ""
                            }
                            prefixDecided = true
                        }
                        builder.append(event.textChunk)
                        repository.updateMessageContent(assistantMessageId, appliedPrefix + builder.toString())
                    }

                    is StreamEvent.ConversationId -> {
                        if (!event.value.isNullOrBlank()) {
                            conversationId = event.value
                            guidePreferences.setConversationId(guide.id, event.value)
                        }
                    }

                    is StreamEvent.Done -> {
                        if (builder.isNotEmpty()) {
                            val formatted = ChatResponseFormatter.format(
                                rawText = appliedPrefix + builder.toString(),
                                guideId = guide.id,
                                mode = turnMode,
                                language = messageContext.detectedLanguage,
                                suppressTrailingQuestion = conversationState.guardrails.recentQuestionEnds >= 3
                            )
                            repository.updateMessageContent(assistantMessageId, formatted)
                            conversationState = conversationState.advance(
                                locale = messageContext.detectedLanguage,
                                mode = turnMode,
                                userMessage = messageText,
                                assistantReply = formatted
                            )
                        }
                        _uiState.update { it.copy(isStreaming = false) }
                    }

                    is StreamEvent.Error -> {
                        if (builder.isEmpty()) {
                            repository.updateMessageContent(
                                assistantMessageId,
                                "I am reflecting upon your question. Please try again in a moment."
                            )
                        } else {
                            val formatted = ChatResponseFormatter.format(
                                rawText = appliedPrefix + builder.toString(),
                                guideId = guide.id,
                                mode = turnMode,
                                language = messageContext.detectedLanguage,
                                suppressTrailingQuestion = conversationState.guardrails.recentQuestionEnds >= 3
                            )
                            repository.updateMessageContent(assistantMessageId, formatted)
                            conversationState = conversationState.advance(
                                locale = messageContext.detectedLanguage,
                                mode = turnMode,
                                userMessage = messageText,
                                assistantReply = formatted
                            )
                        }
                        _uiState.update {
                            it.copy(
                                isStreaming = false,
                                error = event.message
                            )
                        }
                    }

                    StreamEvent.LimitReached -> {
                        _uiState.update {
                            it.copy(
                                isStreaming = false,
                                error = "Free message limit reached."
                            )
                        }
                    }
                }
            }
            } catch (cancellation: CancellationException) {
                throw cancellation
            } catch (error: Exception) {
                // Any failure inside the stream (DB write, formatting) must still clear
                // isStreaming — otherwise sendMessage is gated forever and the user can
                // never send again without restarting the app.
                _uiState.update {
                    it.copy(
                        isStreaming = false,
                        error = error.message ?: "Something went wrong. Please try again."
                    )
                }
            }
        }
    }

    private suspend fun resetConversation(
        guide: com.bhaktichat.app.domain.Guide,
        skipOpener: Boolean
    ): List<MessageEntity> {
        conversationId = null
        guidePreferences.setConversationId(guide.id, null)
        repository.clearGuide(guide.id)
        if (skipOpener) return emptyList()

        val openerMessage = MessageEntity(
            id = UUID.randomUUID().toString(),
            guideId = guide.id,
            role = ChatRole.ASSISTANT.wire,
            content = guide.openingScene,
            createdAt = System.currentTimeMillis()
        )
        repository.insertMessage(openerMessage)
        return listOf(openerMessage)
    }

    private suspend fun loadConversation(forceNewConversation: Boolean) {
        val guide = _uiState.value.guide ?: return
        try {
            if (forceNewConversation || conversationId == null) {
                if (forceNewConversation) {
                    conversationId = null
                    guidePreferences.setConversationId(guide.id, null)
                    repository.clearGuide(guide.id)
                }
                repository.ensureOpeningScene(guide.id, guide.openingScene)
                _uiState.update { it.copy(error = null) }
                return
            }

            val loadedConversationId = repository.refreshConversation(
                guideId = guide.serverPromptKey,
                conversationId = if (forceNewConversation) null else conversationId,
                forceNewConversation = forceNewConversation
            )
            conversationId = loadedConversationId
            guidePreferences.setConversationId(guide.id, loadedConversationId)
            repository.ensureOpeningScene(guide.id, guide.openingScene)
            _uiState.update { it.copy(error = null) }
        } catch (error: Throwable) {
            repository.ensureOpeningScene(guide.id, guide.openingScene)
            _uiState.update {
                it.copy(
                    error = error.message ?: "I am reflecting upon your question. Please try again in a moment."
                )
            }
        }
    }
}

private fun ConversationLanguage.toWire(): String = when (this) {
    ConversationLanguage.ENGLISH -> "en"
    ConversationLanguage.HINGLISH -> "hinglish"
    ConversationLanguage.HINDI -> "hi"
}

private inline fun <T> MutableStateFlow<T>.updateAndCheckIfChanged(transform: (T) -> T): Boolean {
    var changed = false
    update { current ->
        val updated = transform(current)
        changed = updated != current
        updated
    }
    return changed
}

class ChatViewModelFactory(
    private val guideId: String,
    private val repository: ChatRepository,
    private val guidePreferences: GuidePreferences,
    private val authPreferences: AuthPreferences,
    private val deferInitialLoad: Boolean = false
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return ChatViewModel(
            guideId = guideId,
            repository = repository,
            guidePreferences = guidePreferences,
            authPreferences = authPreferences,
            deferInitialLoad = deferInitialLoad
        ) as T
    }
}
