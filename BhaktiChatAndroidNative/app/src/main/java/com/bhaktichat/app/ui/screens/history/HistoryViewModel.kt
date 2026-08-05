package com.bhaktichat.app.ui.screens.history

import com.bhaktichat.app.ui.i18n.str
import com.bhaktichat.app.util.LanguageStore

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.repo.AartiRepository
import com.bhaktichat.app.data.repo.DivineCreationRepository
import com.bhaktichat.app.data.repo.GuidesRepository
import com.bhaktichat.app.data.repo.MessagesRepository
import com.bhaktichat.app.data.repo.ThreadsRepository
import com.bhaktichat.app.domain.CreationStatus
import com.bhaktichat.app.domain.Deity
import com.bhaktichat.app.util.BookmarkStore
import com.bhaktichat.app.util.formatTime
import com.bhaktichat.app.ui.screens.divineimage.divineChoiceDisplayText
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HistoryItem(
    val threadId: String,
    val guideName: String,
    val preview: String,
    val timeLabel: String,
    val avatarRes: Int
)

data class HistoryCreationItem(
    val creationId: String,
    val title: String,
    val subtitle: String,
    val timeLabel: String,
    val previewUri: String?,
    val status: CreationStatus
)

enum class HistoryTab {
    CHATS,
    CREATIONS,
    SAVED
}

data class SavedMessageItem(
    val messageId: String,
    val guideName: String,
    val avatarRes: Int,
    val preview: String,
    val timeLabel: String,
    val threadId: String
)

data class SavedAartiItem(
    val aartiId: String,
    val title: String,
    val subtitle: String,
    val deity: Deity
)

data class HistoryUiState(
    val isLoading: Boolean = true,
    val selectedTab: HistoryTab = HistoryTab.CHATS,
    val items: List<HistoryItem> = emptyList(),
    val creationItems: List<HistoryCreationItem> = emptyList(),
    val savedMessages: List<SavedMessageItem> = emptyList(),
    val savedAartis: List<SavedAartiItem> = emptyList(),
    val query: String = ""
)

class HistoryViewModel(
    private val threadsRepository: ThreadsRepository,
    private val messagesRepository: MessagesRepository,
    private val guidesRepository: GuidesRepository,
    private val creationRepository: DivineCreationRepository,
    private val bookmarkStore: BookmarkStore? = null,
    private val aartiRepository: AartiRepository? = null,
    // Read at call time rather than captured: history rows rebuild on language change.
    private val languageStore: LanguageStore
) : ViewModel() {
    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                threadsRepository.observeThreads(),
                creationRepository.observeCreations(limit = 100)
            ) { threads, creations ->
                val chatItems = threads.mapNotNull { thread ->
                    val guide = guidesRepository.getGuide(thread.guideId) ?: return@mapNotNull null
                    val latestMessage = messagesRepository.latestMessage(thread.id) ?: return@mapNotNull null
                    HistoryItem(
                        threadId = thread.id,
                        guideName = guide.displayName(languageStore.language.value),
                        preview = latestMessage.content.lineSequence().firstOrNull().orEmpty(),
                        timeLabel = formatTime(latestMessage.createdAt),
                        avatarRes = guide.avatarRes
                    )
                }

                val creationItems = creations.map { creation ->
                    val creationSubtitle = languageStore.str("di_made_with")
                    HistoryCreationItem(
                        creationId = creation.id,
                        title = divineChoiceDisplayText(creation.templateTitle, languageStore.language.value),
                        subtitle = creationSubtitle,
                        timeLabel = formatTime(creation.createdAt),
                        previewUri = creation.outputImageUri,
                        status = creation.status
                    )
                }
                chatItems to creationItems
            }.collect { (chatItems, creationItems) ->
                _uiState.update { current ->
                    current.copy(
                        isLoading = false,
                        items = chatItems,
                        creationItems = creationItems
                    )
                }
            }
        }

        if (bookmarkStore != null) {
            viewModelScope.launch {
                combine(
                    bookmarkStore.messageIds,
                    bookmarkStore.aartiIds
                ) { messageIds, aartiIds -> messageIds to aartiIds }
                    .collect { (messageIds, aartiIds) ->
                        val savedMessages = resolveSavedMessages(messageIds)
                        val savedAartis = resolveSavedAartis(aartiIds)
                        _uiState.update { it.copy(savedMessages = savedMessages, savedAartis = savedAartis) }
                    }
            }
        }
    }

    private suspend fun resolveSavedMessages(ids: Set<String>): List<SavedMessageItem> {
        if (ids.isEmpty()) return emptyList()
        // Walk all threads — small N in practice, simple & correct.
        val threads = threadsRepository.listThreads()
        val results = mutableListOf<SavedMessageItem>()
        for (thread in threads) {
            val guide = guidesRepository.getGuide(thread.guideId) ?: continue
            val messages = messagesRepository.listMessages(thread.id)
            for (msg in messages) {
                if (msg.id in ids) {
                    results += SavedMessageItem(
                        messageId = msg.id,
                        guideName = guide.displayName(languageStore.language.value),
                        avatarRes = guide.avatarRes,
                        preview = msg.content.lineSequence().firstOrNull().orEmpty(),
                        timeLabel = formatTime(msg.createdAt),
                        threadId = thread.id
                    )
                }
            }
        }
        return results.sortedByDescending { it.timeLabel }
    }

    private suspend fun resolveSavedAartis(ids: Set<String>): List<SavedAartiItem> {
        val repo = aartiRepository ?: return emptyList()
        if (ids.isEmpty()) return emptyList()
        val aartis = runCatching { repo.loadAartis() }.getOrDefault(emptyList())
        return aartis
            .filter { it.id in ids }
            .map {
                SavedAartiItem(
                    aartiId = it.id,
                    title = it.title,
                    subtitle = it.subtitle ?: languageStore.str("aarti"),
                    deity = it.deity
                )
            }
    }

    fun selectTab(tab: HistoryTab) {
        _uiState.update { current ->
            current.copy(selectedTab = tab)
        }
    }

    fun onQueryChanged(q: String) {
        _uiState.update { current ->
            current.copy(query = q)
        }
    }

    fun deleteThread(threadId: String) {
        viewModelScope.launch {
            threadsRepository.deleteThread(threadId)
            messagesRepository.deleteThreadMessages(threadId)
        }
    }

    fun deleteCreation(creationId: String) {
        viewModelScope.launch {
            creationRepository.deleteCreation(creationId)
        }
    }

    fun deleteAllThreads() {
        viewModelScope.launch {
            val threads = threadsRepository.listThreads()
            // Clear messages first to avoid orphaned rows in case the FK is loose.
            for (thread in threads) {
                messagesRepository.deleteThreadMessages(thread.id)
            }
            // Belt-and-suspenders: drop anything that wasn't tied to a thread we listed.
            messagesRepository.deleteAllMessages()
            threadsRepository.deleteAllThreads()
        }
    }

    fun deleteAllDivineCreations() {
        viewModelScope.launch {
            creationRepository.deleteAllCreations()
        }
    }
}

class HistoryViewModelFactory(
    private val threadsRepository: ThreadsRepository,
    private val messagesRepository: MessagesRepository,
    private val guidesRepository: GuidesRepository,
    private val creationRepository: DivineCreationRepository,
    private val bookmarkStore: BookmarkStore? = null,
    private val aartiRepository: AartiRepository? = null,
    private val languageStore: LanguageStore
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return HistoryViewModel(
            threadsRepository = threadsRepository,
            messagesRepository = messagesRepository,
            guidesRepository = guidesRepository,
            creationRepository = creationRepository,
            bookmarkStore = bookmarkStore,
            aartiRepository = aartiRepository,
            languageStore = languageStore
        ) as T
    }
}
