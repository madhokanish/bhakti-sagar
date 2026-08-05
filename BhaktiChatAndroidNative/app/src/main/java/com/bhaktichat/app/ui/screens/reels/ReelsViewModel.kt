package com.bhaktichat.app.ui.screens.reels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.repo.ReelsRepository
import com.bhaktichat.app.domain.Reel
import com.bhaktichat.app.domain.ReelFeed
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ReelsUiState(
    val feed: ReelFeed = ReelFeed.TOP,
    val reels: List<Reel> = emptyList(),
    val likedIds: Set<String> = emptySet(),
    val savedIds: Set<String> = emptySet()
)

class ReelsViewModel(
    private val reelsRepository: ReelsRepository,
    initialReelId: String? = null
) : ViewModel() {
    private val _uiState = MutableStateFlow(ReelsUiState())
    val uiState: StateFlow<ReelsUiState> = _uiState.asStateFlow()
    private var pendingInitialReelId: String? = initialReelId

    init {
        // Shuffled fresh on every visit to the tab (this ViewModel is scoped to the composable,
        // so a new instance — and a new shuffle — happens each time the user opens Reels).
        loadFeed(ReelFeed.TOP)
    }

    fun selectFeed(feed: ReelFeed) {
        if (_uiState.value.feed == feed) return
        loadFeed(feed)
    }

    fun toggleLike(id: String) = _uiState.update { it.copy(likedIds = it.likedIds.toggled(id)) }
    fun toggleSave(id: String) = _uiState.update { it.copy(savedIds = it.savedIds.toggled(id)) }

    private fun loadFeed(feed: ReelFeed) {
        viewModelScope.launch {
            val shuffled = reelsRepository.reels(feed).shuffled()
            val requestedId = pendingInitialReelId
            val reels = if (requestedId != null) {
                val requested = shuffled.firstOrNull { it.id == requestedId }
                if (requested != null) {
                    listOf(requested) + shuffled.filterNot { it.id == requestedId }
                } else {
                    shuffled
                }
            } else {
                shuffled
            }
            pendingInitialReelId = null
            _uiState.update { it.copy(feed = feed, reels = reels) }
        }
    }

    private fun Set<String>.toggled(id: String): Set<String> =
        if (contains(id)) this - id else this + id
}

class ReelsViewModelFactory(
    private val reelsRepository: ReelsRepository,
    private val initialReelId: String? = null
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return ReelsViewModel(reelsRepository, initialReelId) as T
    }
}
