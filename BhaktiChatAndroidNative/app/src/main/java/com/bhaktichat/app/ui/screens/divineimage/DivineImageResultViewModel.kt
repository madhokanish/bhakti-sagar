package com.bhaktichat.app.ui.screens.divineimage
import com.bhaktichat.app.util.EntitlementStore

import com.bhaktichat.app.util.LanguageStore

import com.bhaktichat.app.ui.i18n.translate

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.remote.DivineFeedbackClient
import com.bhaktichat.app.data.remote.DivineImageGenerator
import com.bhaktichat.app.data.repo.DivineCreationRepository
import com.bhaktichat.app.data.repo.DivineTemplateRepository
import com.bhaktichat.app.domain.CreationStatus
import com.bhaktichat.app.domain.DivineCreation
import com.bhaktichat.app.domain.DivineTemplate
import com.bhaktichat.app.util.Analytics
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DivineImageResultUiState(
    val creation: DivineCreation? = null,
    val template: DivineTemplate? = null,
    val feedbackSubmitted: Boolean = false
)

sealed interface DivineImageResultUiEvent {
    data object NavigateHome : DivineImageResultUiEvent
    /** The generation this screen was watching got a 402 — open membership. */
    data object SubscriptionRequired : DivineImageResultUiEvent
    data class SaveImage(val uri: String) : DivineImageResultUiEvent
    data class ShareImage(
        val uri: String,
        val targetPackage: String? = null
    ) : DivineImageResultUiEvent
}

class DivineImageResultViewModel(
    private val creationId: String,
    private val templateRepository: DivineTemplateRepository,
    private val creationRepository: DivineCreationRepository,
    private val generator: DivineImageGenerator,
    private val feedbackClient: DivineFeedbackClient,
    private val anonUserKey: String,
    private val languageStore: LanguageStore,
    private val entitlementStore: EntitlementStore
) : ViewModel() {
    /** Emitted when a regeneration is refused for quota reasons. */
    private val _paywallEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val paywallEvents: SharedFlow<Unit> = _paywallEvents.asSharedFlow()

    private val _uiState = MutableStateFlow(DivineImageResultUiState())
    val uiState: StateFlow<DivineImageResultUiState> = _uiState.asStateFlow()

    private val _uiEvents = MutableSharedFlow<DivineImageResultUiEvent>(
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val uiEvents: SharedFlow<DivineImageResultUiEvent> = _uiEvents.asSharedFlow()

    init {
        viewModelScope.launch {
            creationRepository.observeCreation(creationId).collectLatest { creation ->
                // Only on the live GENERATING → 402 transition, not when opening an old
                // failed creation from history (its failed card has its own button).
                if (_uiState.value.creation?.status == CreationStatus.GENERATING &&
                    creation?.subscriptionRequired == true
                ) {
                    _uiEvents.tryEmit(DivineImageResultUiEvent.SubscriptionRequired)
                }
                _uiState.update { current ->
                    current.copy(
                        creation = creation,
                        template = creation?.let { templateRepository.getTemplate(it.templateId) },
                        feedbackSubmitted = current.feedbackSubmitted ||
                            !creation?.feedbackRating.isNullOrBlank()
                    )
                }
            }
        }
    }

    fun cancel() {
        val creation = _uiState.value.creation ?: return
        if (creation.status != CreationStatus.GENERATING) return
        // The generation runs in an app-lifetime scope now, so stop it explicitly — otherwise
        // its result would overwrite this cancelled row.
        creationRepository.cancelGeneration(creation.id)
        viewModelScope.launch {
            creationRepository.upsertCreation(
                creation.copy(
                    status = CreationStatus.FAILED,
                    errorMessage = translate("common_cancelled", languageStore.language.value)
                )
            )
            _uiEvents.emit(DivineImageResultUiEvent.NavigateHome)
        }
    }

    fun regenerate() {
        val creation = _uiState.value.creation ?: return
        // Regenerating is a full generation and costs the same, so it has to respect the
        // quota. Without this a free user could generate twice, then sit on the result
        // screen tapping "phir banaiye" forever — unlimited images, and the counter never
        // moved because this path did not record either.
        if (!entitlementStore.canUseDivineImage) {
            entitlementStore.reportQuotaReached("divine_image_regenerate")
            viewModelScope.launch { _paywallEvents.emit(Unit) }
            return
        }
        Analytics.divineImageRegenerated(mode = creation.mode.name)
        viewModelScope.launch {
            // Reuse the exact prompt the creation was made with. Rebuilding it from
            // templateTitle broke for Hindi users: that title is translated display copy, so
            // the English deity lookup missed and the prompt lost the deity entirely.
            val generatingCreation = creation.copy(
                status = CreationStatus.GENERATING,
                outputImageUri = null,
                errorMessage = null,
                variant = null,
                requestId = null,
                feedbackRating = null,
                subscriptionRequired = false
            )
            creationRepository.upsertCreation(generatingCreation)
            _uiState.update { state -> state.copy(feedbackSubmitted = false) }
            launchDivineGeneration(
                creationRepository = creationRepository,
                generator = generator,
                entitlementStore = entitlementStore,
                generating = generatingCreation,
                failedMessage = translate("di_err_generate_failed", languageStore.language.value)
            )
        }
    }

    fun onFeedback(rating: String) {
        val creation = _uiState.value.creation ?: return
        val requestId = creation.requestId ?: return
        val variant = creation.variant ?: return
        if (_uiState.value.feedbackSubmitted) return

        _uiState.update { state -> state.copy(feedbackSubmitted = true) }

        viewModelScope.launch {
            creationRepository.updateFeedback(creation.id, rating)
            feedbackClient.submitFeedback(
                requestId = requestId,
                variant = variant,
                rating = rating,
                mode = creation.mode.name,
                userKey = anonUserKey
            )
        }
    }

    fun save() {
        val creation = _uiState.value.creation ?: return
        val uri = creation.outputImageUri ?: return
        if (creation.status != CreationStatus.SUCCESS) return
        Analytics.divineImageSaved(mode = creation.mode.name)
        _uiEvents.tryEmit(DivineImageResultUiEvent.SaveImage(uri))
    }

    fun share() {
        shareWithPackage(targetPackage = null)
    }

    fun shareToInstagram() {
        shareWithPackage(targetPackage = "com.instagram.android")
    }

    fun shareToWhatsApp() {
        shareWithPackage(targetPackage = "com.whatsapp")
    }

    private fun shareWithPackage(targetPackage: String?) {
        val creation = _uiState.value.creation ?: return
        val uri = creation.outputImageUri ?: return
        if (creation.status != CreationStatus.SUCCESS) return
        Analytics.divineImageShared(
            target = when (targetPackage) {
                "com.instagram.android" -> "instagram"
                "com.whatsapp" -> "whatsapp"
                else -> "system"
            }
        )
        _uiEvents.tryEmit(
            DivineImageResultUiEvent.ShareImage(
                uri = uri,
                targetPackage = targetPackage
            )
        )
    }
}

class DivineImageResultViewModelFactory(
    private val creationId: String,
    private val templateRepository: DivineTemplateRepository,
    private val creationRepository: DivineCreationRepository,
    private val generator: DivineImageGenerator,
    private val feedbackClient: DivineFeedbackClient,
    private val anonUserKey: String,
    private val languageStore: LanguageStore,
    private val entitlementStore: EntitlementStore
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return DivineImageResultViewModel(
            creationId = creationId,
            templateRepository = templateRepository,
            creationRepository = creationRepository,
            generator = generator,
            feedbackClient = feedbackClient,
            anonUserKey = anonUserKey,
            languageStore = languageStore,
            entitlementStore = entitlementStore
        ) as T
    }
}
