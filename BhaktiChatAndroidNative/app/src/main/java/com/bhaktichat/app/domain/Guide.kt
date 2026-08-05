package com.bhaktichat.app.domain

import com.bhaktichat.app.ui.i18n.translate

data class Guide(
    val id: String,
    val avatarRes: Int,
    val avatarVerticalBias: Float,
    val profileImageRes: Int,
    val profileVerticalBias: Float,
    /** Keyed by [AppLanguage] — ported from the web app's `src/lib/chatOpeners.ts`, which
     *  already had hand-written, tone-checked EN/Hinglish/Hindi versions for every guide. */
    val openingScenes: Map<AppLanguage, String>,
    val serverPromptKey: String
) {
    fun openingScene(language: AppLanguage): String =
        openingScenes[language] ?: openingScenes.getValue(AppLanguage.HINGLISH)

    /**
     * Display copy is resolved from [id] rather than stored, so a guide reads in whichever
     * language the user picked. [openingScenes] stays an explicit map because those are
     * hand-authored scene-setting prose, not interchangeable UI strings.
     */
    fun displayName(language: AppLanguage): String = translate("guide_title_$id", language)

    fun status(language: AppLanguage): String = translate("guide_status_$id", language)

    fun description(language: AppLanguage): String = translate("guide_description_$id", language)

    fun teachings(language: AppLanguage): List<String> =
        (0 until TEACHING_COUNT).map { translate("guide_teaching_${id}_$it", language) }

    /** Sent to the guide as the user's message, so it must follow the chosen language —
     *  the chat backend mirrors the script it receives. */
    fun suggestedPrompts(language: AppLanguage): List<String> =
        (0 until PROMPT_COUNT).map { translate("guide_prompt_${id}_$it", language) }

    private companion object {
        const val TEACHING_COUNT = 5
        const val PROMPT_COUNT = 4
    }
}
