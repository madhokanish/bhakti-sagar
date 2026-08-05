package com.bhaktichat.app.domain

data class Guide(
    val id: String,
    val displayName: String,
    val status: String,
    val avatarRes: Int,
    val avatarVerticalBias: Float,
    val profileImageRes: Int,
    val profileVerticalBias: Float,
    val description: String,
    val teachings: List<String>,
    /** Keyed by [AppLanguage] — ported from the web app's `src/lib/chatOpeners.ts`, which
     *  already had hand-written, tone-checked EN/Hinglish/Hindi versions for every guide. */
    val openingScenes: Map<AppLanguage, String>,
    val suggestedPrompts: List<String>,
    val serverPromptKey: String
) {
    fun openingScene(language: AppLanguage): String =
        openingScenes[language] ?: openingScenes.getValue(AppLanguage.HINGLISH)
}
