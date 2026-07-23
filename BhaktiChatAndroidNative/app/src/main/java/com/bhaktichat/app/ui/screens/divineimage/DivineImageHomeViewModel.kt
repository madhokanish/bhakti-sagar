package com.bhaktichat.app.ui.screens.divineimage

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.repo.DivineCreationRepository
import com.bhaktichat.app.data.repo.DivineTemplateRepository
import com.bhaktichat.app.domain.CreationStatus
import com.bhaktichat.app.domain.DivineCreation
import com.bhaktichat.app.domain.DivineTemplate
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DivineImageHomeUiState(
    val homeOptions: List<DivineTemplate> = emptyList(),
    val inspirations: List<DivineTemplate> = emptyList(),
    /** Successful past generations for the "Your creations" rail (most recent first). */
    val recentCreations: List<DivineCreation> = emptyList()
)

class DivineImageHomeViewModel(
    private val templateRepository: DivineTemplateRepository,
    private val creationRepository: DivineCreationRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        DivineImageHomeUiState(
            homeOptions = templateRepository.getHomeOptions(),
            inspirations = templateRepository.getInspirations()
        )
    )
    val uiState: StateFlow<DivineImageHomeUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            creationRepository.observeCreations(limit = 24).collectLatest { creations ->
                val successful = creations.filter {
                    it.status == CreationStatus.SUCCESS && !it.outputImageUri.isNullOrBlank()
                }
                _uiState.update { current -> current.copy(recentCreations = successful) }
            }
        }
    }
}

class DivineImageHomeViewModelFactory(
    private val templateRepository: DivineTemplateRepository,
    private val creationRepository: DivineCreationRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return DivineImageHomeViewModel(
            templateRepository = templateRepository,
            creationRepository = creationRepository
        ) as T
    }
}
