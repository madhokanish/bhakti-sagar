package com.bhaktichat.app.ui.screens.divineimage
import com.bhaktichat.app.ui.i18n.translate
import com.bhaktichat.app.util.LanguageStore
import com.bhaktichat.app.ui.i18n.str

import android.net.Uri
import androidx.annotation.DrawableRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.R
import com.bhaktichat.app.data.remote.DivineImageGenerator
import com.bhaktichat.app.data.repo.DivineCreationRepository
import com.bhaktichat.app.data.repo.DivineTemplateRepository
import com.bhaktichat.app.domain.AppLanguage
import com.bhaktichat.app.domain.CreationStatus
import com.bhaktichat.app.domain.DivineCreation
import com.bhaktichat.app.domain.DivineMode
import com.bhaktichat.app.domain.DivineTemplate
import com.bhaktichat.app.domain.DIVINE_IDENTITY_REALISM_PREFIX
import com.bhaktichat.app.util.Analytics
import com.bhaktichat.app.util.EntitlementStore
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

data class DivineChoiceOption(
    val id: String,
    val title: String,
    @DrawableRes val thumbnailRes: Int? = null
)

data class DivineImageCreateUiState(
    val template: DivineTemplate? = null,
    val selectedImageUri: Uri? = null,
    val deityOptions: List<DivineChoiceOption> = emptyList(),
    val selectedDeity: String? = null,
    val sceneOptions: List<String> = emptyList(),
    val selectedScene: String? = null,
    val templeOptions: List<String> = emptyList(),
    val selectedTemple: String? = null,
    val customTempleName: String = "",
    val templeMomentOptions: List<String> = emptyList(),
    val selectedTempleMoment: String? = null,
    /// Optional freeform "extra details" entered by the user in the
    /// collapsible advanced section. Appended verbatim to the generated prompt
    /// when non-blank (mirrors iOS DivineImageCreateScreen.customPrompt).
    val customPrompt: String = "",
    val isSubmitting: Boolean = false,
    val validationMessage: String? = null
) {
    /**
     * True when every field required by [DivineImageCreateViewModel.validationError] is
     * present. Drives the Generate button's enabled state so it can't be tapped while
     * the deity/scene (or temple/moment) are still unset — tapping an "enabled" button
     * that then fails validation silently was a real UX bug.
     */
    val isReadyToGenerate: Boolean
        get() = selectedImageUri != null && when (template?.mode) {
            DivineMode.PHOTO_WITH_GOD ->
                !selectedDeity.isNullOrBlank() && !selectedScene.isNullOrBlank()
            DivineMode.PHOTO_AT_TEMPLE ->
                customTempleName.trim().ifBlank { selectedTemple.orEmpty() }.isNotBlank() &&
                    !selectedTempleMoment.isNullOrBlank()
            null -> false
        }
}

sealed interface DivineImageCreateUiEvent {
    data class NavigateToResult(val creationId: String) : DivineImageCreateUiEvent
}

class DivineImageCreateViewModel(
    private val mode: DivineMode,
    templateId: String,
    templateRepository: DivineTemplateRepository,
    private val creationRepository: DivineCreationRepository,
    private val generator: DivineImageGenerator,
    private val entitlementStore: EntitlementStore,
    private val languageStore: LanguageStore
) : ViewModel() {
    private val template = requireNotNull(templateRepository.getTemplate(templateId)) {
        "Unknown Divine Image template: $templateId"
    }

    private val deityOptions = listOf(
        DivineChoiceOption(id = "krishna", title = "Lord Krishna", thumbnailRes = R.drawable.card_krishna),
        DivineChoiceOption(id = "shiv", title = "Shiv Ji", thumbnailRes = R.drawable.shivji),
        DivineChoiceOption(id = "hanuman", title = "Hanuman Ji", thumbnailRes = R.drawable.hanumanji),
        DivineChoiceOption(id = "lakshmi", title = "Lakshmi Ji", thumbnailRes = R.drawable.card_lakshmi),
        DivineChoiceOption(id = "ganesh", title = "Ganesh Ji", thumbnailRes = R.drawable.ic_ganesh_top_aarti)
    )

    private val sceneOptionsByDeity = mapOf(
        "Lord Krishna" to listOf(
            "Lord Krishna blessing you",
            "Lord Krishna standing beside you in Vrindavan",
            "Lord Krishna teaching Gita"
        ),
        "Shiv Ji" to listOf(
            "Shiv Ji blessing you",
            "Shiv Ji meditating beside you"
        ),
        "Hanuman Ji" to listOf(
            "Hanuman Ji protecting you",
            "Hanuman Ji blessing you"
        ),
        "Lakshmi Ji" to listOf(
            "Lakshmi Ji blessing you",
            "Lakshmi Ji showering prosperity"
        )
    )

    private val templeOptions = listOf(
        "Kedarnath Temple",
        "Akshardham Temple Delhi",
        "Tirupati Balaji Temple",
        "Rameshwaram Temple",
        "Kashi Vishwanath Temple",
        "Golden Temple Amritsar"
    )

    private val templeMomentOptions = listOf(
        "Standing in front of the temple",
        "Doing aarti",
        "Offering prayers",
        "Walking in temple courtyard"
    )

    private val initialSelectedDeity = template.deityTag
    private val initialSceneOptions = initialSelectedDeity
        ?.let { sceneOptionsByDeity[it].orEmpty() }
        .orEmpty()
    private val initialSelectedScene = template.sceneName
        ?.takeIf { it in initialSceneOptions }
        ?: initialSceneOptions.firstOrNull()

    private val _uiState = MutableStateFlow(
        DivineImageCreateUiState(
            template = template,
            deityOptions = deityOptions,
            selectedDeity = if (mode == DivineMode.PHOTO_WITH_GOD) initialSelectedDeity else null,
            sceneOptions = if (mode == DivineMode.PHOTO_WITH_GOD) initialSceneOptions else emptyList(),
            selectedScene = if (mode == DivineMode.PHOTO_WITH_GOD) initialSelectedScene else null,
            templeOptions = templeOptions,
            selectedTemple = if (mode == DivineMode.PHOTO_AT_TEMPLE) template.templeName else null,
            customTempleName = "",
            templeMomentOptions = templeMomentOptions,
            selectedTempleMoment = if (mode == DivineMode.PHOTO_AT_TEMPLE) template.sceneName else null
        )
    )
    val uiState: StateFlow<DivineImageCreateUiState> = _uiState.asStateFlow()

    private val _uiEvents = MutableSharedFlow<DivineImageCreateUiEvent>(
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val uiEvents: SharedFlow<DivineImageCreateUiEvent> = _uiEvents.asSharedFlow()

    fun pickImage(uri: Uri?) {
        _uiState.update { current ->
            current.copy(selectedImageUri = uri, validationMessage = null)
        }
    }

    fun onCustomTempleNameChanged(text: String) {
        _uiState.update { current ->
            current.copy(
                customTempleName = text,
                selectedTemple = if (text.isBlank()) current.selectedTemple else null,
                validationMessage = null
            )
        }
    }

    /// Mirrors iOS — appends freeform user copy to the generated prompt.
    fun onCustomPromptChanged(text: String) {
        _uiState.update { current -> current.copy(customPrompt = text) }
    }

    fun selectDeity(deityName: String) {
        val scenes = sceneOptionsByDeity[deityName].orEmpty()
        _uiState.update { current ->
            current.copy(
                selectedDeity = deityName,
                sceneOptions = scenes,
                selectedScene = current.selectedScene
                    ?.takeIf { it in scenes }
                    ?: scenes.firstOrNull(),
                validationMessage = null
            )
        }
    }

    fun selectScene(sceneName: String) {
        _uiState.update { current ->
            current.copy(selectedScene = sceneName, validationMessage = null)
        }
    }

    fun selectTemple(templeName: String) {
        _uiState.update { current ->
            current.copy(
                selectedTemple = templeName,
                customTempleName = "",
                validationMessage = null
            )
        }
    }

    fun selectTempleMoment(moment: String) {
        _uiState.update { current ->
            current.copy(selectedTempleMoment = moment, validationMessage = null)
        }
    }

    fun generate() {
        val current = _uiState.value
        if (current.isSubmitting) return

        val validationError = validationError(current)
        if (validationError != null) {
            _uiState.update { state -> state.copy(validationMessage = validationError) }
            return
        }

        // Ad-based model: divine image is free for everyone — no quota gate.

        val finalPrompt = buildPrompt(current)
        val creationTitle = buildCreationTitle(current)
        val creationId = UUID.randomUUID().toString()
        val now = System.currentTimeMillis()
        val creation = DivineCreation(
            id = creationId,
            createdAt = now,
            mode = mode,
            templateId = template.id,
            templateTitle = creationTitle,
            inputPrompt = finalPrompt,
            inputImageUri = current.selectedImageUri?.toString(),
            outputImageUri = null,
            status = CreationStatus.GENERATING
        )

        _uiState.update { state -> state.copy(isSubmitting = true, validationMessage = null) }
        Analytics.divineImageGenerationStarted(mode = mode.name)

        viewModelScope.launch {
            creationRepository.upsertCreation(creation)
            _uiEvents.emit(DivineImageCreateUiEvent.NavigateToResult(creationId))

            val result = generator.generate(
                mode = mode,
                prompt = finalPrompt,
                inputImageUri = current.selectedImageUri
            )

            val updatedCreation = result.fold(
                onSuccess = { divineResult ->
                    creation.copy(
                        status = CreationStatus.SUCCESS,
                        outputImageUri = divineResult.uri.toString(),
                        variant = divineResult.variant,
                        requestId = divineResult.requestId,
                        errorMessage = null
                    )
                },
                onFailure = { throwable ->
                    creation.copy(
                        status = CreationStatus.FAILED,
                        errorMessage = languageStore.str("di_err_generate_failed")
                    )
                }
            )

            creationRepository.upsertCreation(updatedCreation)
            if (updatedCreation.status == CreationStatus.SUCCESS) {
                // Only burn quota on a successful creation. Failures leave the
                // counter alone so the user gets to retry without penalty.
                entitlementStore.recordImageGenerated()
                Analytics.divineImageGenerated(mode = mode.name)
            }
            _uiState.update { state -> state.copy(isSubmitting = false) }
        }
    }

    private fun validationError(current: DivineImageCreateUiState): String? {
        if (current.selectedImageUri == null) {
            return languageStore.str("di_err_pick_photo")
        }
        return when (mode) {
            DivineMode.PHOTO_WITH_GOD -> when {
                current.selectedDeity.isNullOrBlank() -> languageStore.str("di_err_pick_deity")
                current.selectedScene.isNullOrBlank() -> languageStore.str("di_err_pick_scene")
                else -> null
            }

            DivineMode.PHOTO_AT_TEMPLE -> when {
                current.selectedTempleName().isBlank() -> languageStore.str("di_err_pick_temple")
                current.selectedTempleMoment.isNullOrBlank() -> languageStore.str("di_err_pick_temple_scene")
                else -> null
            }
        }
    }

    private fun buildPrompt(current: DivineImageCreateUiState): String {
        val templatePrompt = when (mode) {
            DivineMode.PHOTO_WITH_GOD -> {
                template.promptSkeleton
                    .replace("[DEITY NAME]", deityNameForPrompt(current.selectedDeity))
                    .replace("[SCENE NAME]", current.selectedScene.orEmpty())
            }

            DivineMode.PHOTO_AT_TEMPLE -> {
                template.promptSkeleton
                    .replace("[TEMPLE NAME]", current.selectedTempleName())
                    .replace("[SCENE NAME]", current.selectedTempleMoment.orEmpty())
            }
        }
        // Append the user's freeform "extra details" verbatim if present.
        // Mirrors the iOS DivineImageCreateScreen.buildPrompt() behavior.
        val freeform = current.customPrompt.trim()
        val withFreeform = if (freeform.isNotEmpty()) {
            "$templatePrompt\n\nAdditional details: $freeform"
        } else {
            templatePrompt
        }
        return "$DIVINE_IDENTITY_REALISM_PREFIX\n\n$withFreeform"
    }

    private fun deityNameForPrompt(displayName: String?): String {
        return when (displayName.orEmpty().trim()) {
            "Lord Krishna" -> "Krishna"
            else -> displayName.orEmpty().trim()
        }
    }

    private fun buildCreationTitle(current: DivineImageCreateUiState): String {
        // Persisted DivineCreation.templateTitle is a stable record label (history, prompt
        // fallback), not live on-screen chrome — kept in English regardless of the user's
        // display language, matching its behavior before this field became language-aware.
        return when (mode) {
            DivineMode.PHOTO_WITH_GOD -> divineChoiceDisplayText(
                current.selectedScene ?: template.title(AppLanguage.HINDI),
                languageStore.language.value
            )
            DivineMode.PHOTO_AT_TEMPLE -> {
                val temple = current.selectedTempleName()
                val moment = current.selectedTempleMoment.orEmpty()
                if (temple.isBlank() || moment.isBlank()) {
                    template.title(AppLanguage.HINDI)
                } else {
                    "${divineChoiceDisplayText(moment, languageStore.language.value)} · ${divineChoiceDisplayText(temple, languageStore.language.value)}"
                }
            }
        }
    }

    private fun DivineImageCreateUiState.selectedTempleName(): String =
        customTempleName.trim().ifBlank { selectedTemple.orEmpty() }

    companion object {
        fun defaultDemoPhotoUri(packageName: String): Uri =
            Uri.parse("android.resource://$packageName/${R.drawable.demopic}")
    }
}

/**
 * Maps the generator's canonical English choice strings to display copy.
 *
 * Takes the language explicitly because callers are a mix of composables and ViewModels —
 * the values themselves stay English on the wire, since that is what the image generator
 * expects to receive.
 */
internal fun divineChoiceDisplayText(value: String, language: AppLanguage): String = when (value.trim()) {
    "Lord Krishna" -> translate("di_deity_krishna", language)
    "Shiv Ji" -> translate("di_deity_shiv", language)
    "Hanuman Ji" -> translate("di_deity_hanuman", language)
    "Lakshmi Ji" -> translate("di_deity_lakshmi", language)
    "Ganesh Ji" -> translate("di_deity_ganesh", language)
    "Lord Krishna blessing you" -> translate("di_scene_krishna_2", language)
    "Lord Krishna standing beside you in Vrindavan" -> translate("di_scene_krishna_1", language)
    "Lord Krishna teaching Gita" -> translate("di_scene_krishna_3", language)
    "Shiv Ji blessing you" -> translate("di_scene_shiv_2", language)
    "Shiv Ji meditating beside you" -> translate("di_scene_shiv_1", language)
    "Hanuman Ji protecting you" -> translate("di_scene_hanuman_1", language)
    "Hanuman Ji blessing you" -> translate("di_scene_hanuman_2", language)
    "Lakshmi Ji blessing you" -> translate("di_scene_lakshmi_1", language)
    "Lakshmi Ji showering prosperity" -> translate("di_scene_lakshmi_2", language)
    "Kedarnath Temple" -> translate("di_temple_kedarnath", language)
    "Akshardham Temple Delhi" -> translate("di_temple_akshardham", language)
    "Tirupati Balaji Temple" -> translate("di_temple_tirupati", language)
    "Rameshwaram Temple" -> translate("di_temple_rameshwaram", language)
    "Kashi Vishwanath Temple" -> translate("di_temple_kashi", language)
    "Golden Temple Amritsar" -> translate("di_temple_golden", language)
    "Standing in front of the temple" -> translate("di_tscene_front", language)
    "Doing aarti" -> translate("di_tscene_aarti", language)
    "Offering prayers" -> translate("di_tscene_prayer", language)
    "Walking in temple courtyard" -> translate("di_tscene_courtyard", language)
    else -> value
}

class DivineImageCreateViewModelFactory(
    private val languageStore: LanguageStore,
    private val mode: DivineMode,
    private val templateId: String,
    private val templateRepository: DivineTemplateRepository,
    private val creationRepository: DivineCreationRepository,
    private val generator: DivineImageGenerator,
    private val entitlementStore: EntitlementStore
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return DivineImageCreateViewModel(
            mode = mode,
            templateId = templateId,
            templateRepository = templateRepository,
            creationRepository = creationRepository,
            generator = generator,
            entitlementStore = entitlementStore,
            languageStore = languageStore
        ) as T
    }
}
