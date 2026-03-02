package com.bhaktichat.app.domain

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

    val displayLabel: String
        get() = if (baseLabel == "Char") "Chal" else baseLabel
}
