package com.bhaktichat.app.ui.screens.divineimage

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
import com.bhaktichat.app.domain.DIVINE_IDENTITY_REALISM_PREFIX
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
    private val languageStore: LanguageStore
) : ViewModel() {
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
        Analytics.divineImageRegenerated(mode = creation.mode.name)
        viewModelScope.launch {
            val template = templateRepository.getTemplate(creation.templateId)
            val refreshedPrompt = template
                ?.let { buildPromptForRegenerate(template = it, creation = creation) }
                ?: creation.inputPrompt
            val generatingCreation = creation.copy(
                status = CreationStatus.GENERATING,
                outputImageUri = null,
                errorMessage = null,
                inputPrompt = refreshedPrompt,
                variant = null,
                requestId = null,
                feedbackRating = null
            )
            creationRepository.upsertCreation(generatingCreation)
            _uiState.update { state -> state.copy(feedbackSubmitted = false) }

            val result = generator.generate(
                mode = creation.mode,
                prompt = refreshedPrompt,
                inputImageUri = creation.inputImageUri?.let(android.net.Uri::parse)
            )

            val updatedCreation = result.fold(
                onSuccess = { divineResult ->
                    generatingCreation.copy(
                        status = CreationStatus.SUCCESS,
                        outputImageUri = divineResult.uri.toString(),
                        variant = divineResult.variant,
                        requestId = divineResult.requestId,
                        errorMessage = null
                    )
                },
                onFailure = { throwable ->
                    generatingCreation.copy(
                        status = CreationStatus.FAILED,
                        errorMessage = translate("di_err_generate_failed", languageStore.language.value)
                    )
                }
            )
            creationRepository.upsertCreation(updatedCreation)
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

    private fun buildPromptForRegenerate(
        template: DivineTemplate,
        creation: DivineCreation
    ): String {
        val templatePrompt = when (creation.mode) {
            com.bhaktichat.app.domain.DivineMode.PHOTO_WITH_GOD -> {
                val scene = creation.templateTitle.ifBlank { template.sceneName.orEmpty() }
                val deity = deityNameForPrompt(extractDeityFromScene(scene) ?: template.deityTag)
                template.promptSkeleton
                    .replace("[DEITY NAME]", deity)
                    .replace("[SCENE NAME]", scene)
            }

            com.bhaktichat.app.domain.DivineMode.PHOTO_AT_TEMPLE -> {
                val (moment, temple) = parseTempleMomentAndName(creation = creation, template = template)
                template.promptSkeleton
                    .replace("[TEMPLE NAME]", temple)
                    .replace("[SCENE NAME]", moment)
            }
        }

        return if (templatePrompt.startsWith(DIVINE_IDENTITY_REALISM_PREFIX)) {
            templatePrompt
        } else {
            "$DIVINE_IDENTITY_REALISM_PREFIX\n\n$templatePrompt"
        }
    }

    private fun parseTempleMomentAndName(
        creation: DivineCreation,
        template: DivineTemplate
    ): Pair<String, String> {
        val parts = creation.templateTitle
            .split("·")
            .map { it.trim() }
            .filter { it.isNotBlank() }
        val moment = parts.firstOrNull().orEmpty().ifBlank { template.sceneName.orEmpty() }
        val temple = parts.getOrNull(1).orEmpty().ifBlank { template.templeName.orEmpty() }
        return moment to temple
    }

    private fun extractDeityFromScene(scene: String): String? {
        val normalized = scene.lowercase()
        return when {
            "krishna" in normalized -> "Krishna"
            "hanuman" in normalized -> "Hanuman Ji"
            "shiv" in normalized || "shiva" in normalized -> "Shiv Ji"
            "lakshmi" in normalized -> "Lakshmi Ji"
            else -> null
        }
    }

    private fun deityNameForPrompt(displayName: String?): String {
        return when (displayName.orEmpty().trim()) {
            "Lord Krishna" -> "Krishna"
            else -> displayName.orEmpty().trim()
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
    private val languageStore: LanguageStore
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
            languageStore = languageStore
        ) as T
    }
}
