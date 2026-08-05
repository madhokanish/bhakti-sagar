package com.bhaktichat.app.domain

import com.bhaktichat.app.ui.i18n.translate

data class ChoghadiyaSlot(
    val label: String,
    val start: String,
    val end: String,
    val quality: String,
    val startEpochMillis: Long = 0L,
    val endEpochMillis: Long = 0L,
    val isNight: Boolean = false
) {
    val baseLabel: String
        get() = label.substringBefore(" (")

    /**
     * The period name in the user's script. [baseLabel] stays the canonical English key the
     * calculator produces; only the presentation changes.
     */
    fun displayLabel(language: AppLanguage): String {
        val name = translate(
            when (baseLabel) {
                "Shubh" -> "chogh_shubh"
                "Labh" -> "chogh_laabh"
                "Amrit" -> "chogh_amrit"
                "Char" -> "chogh_chal"
                "Rog" -> "chogh_rog"
                "Kaal" -> "chogh_kaal"
                "Udveg" -> "chogh_udveg"
                else -> "chogh_title"
            },
            language
        )
        return if (isNight) "$name (${translate("chogh_night", language)})" else name
    }
}
