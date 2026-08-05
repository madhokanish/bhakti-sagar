package com.bhaktichat.app.domain

import android.net.Uri
import androidx.annotation.DrawableRes

enum class DivineMode {
    PHOTO_WITH_GOD,
    PHOTO_AT_TEMPLE
}

data class DivineTemplate(
    val id: String,
    val mode: DivineMode,
    /** Keyed by [AppLanguage] — mirrors [Guide.openingScenes]'s map + lookup-function shape. */
    val titles: Map<AppLanguage, String>,
    val descriptions: Map<AppLanguage, String>,
    @DrawableRes val thumbnailRes: Int,
    val promptSkeleton: String,
    val deityTag: String? = null,
    val templeName: String? = null,
    val sceneName: String? = null,
    val isHomePrimary: Boolean = false
) {
    fun title(language: AppLanguage): String =
        titles[language] ?: titles.getValue(AppLanguage.HINGLISH)

    fun description(language: AppLanguage): String =
        descriptions[language] ?: descriptions.getValue(AppLanguage.HINGLISH)
}

data class DivineCreation(
    val id: String,
    val createdAt: Long,
    val mode: DivineMode,
    val templateId: String,
    val templateTitle: String,
    val inputPrompt: String,
    val inputImageUri: String?,
    val outputImageUri: String?,
    val status: CreationStatus,
    val errorMessage: String? = null,
    val variant: String? = null,
    val requestId: String? = null,
    val feedbackRating: String? = null
)

data class DivineImageResult(
    val uri: Uri,
    val variant: String?,
    val requestId: String?,
    val durationMs: Long?
)

enum class CreationStatus {
    IDLE,
    GENERATING,
    SUCCESS,
    FAILED
}
