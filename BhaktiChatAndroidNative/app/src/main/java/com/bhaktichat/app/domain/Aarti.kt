package com.bhaktichat.app.domain

enum class Deity {
    KRISHNA,
    GANESH,
    SHIV,
    LAKSHMI,
    DEVI,
    VISHNU,
    HANUMAN,
    OTHER
}

data class Aarti(
    val id: String,
    val slug: String,
    val title: String,
    val titleHi: String,
    val deity: Deity,
    val durationMinutes: Int?,
    val tags: List<String>,
    val youtubeVideoId: String?,
    val popularityCount: Long?,
    val isTop: Boolean,
    val lyrics: List<String>
) {
    val subtitle: String?
        get() = titleHi.takeIf { it.isNotBlank() && !it.equals(title, ignoreCase = true) }

    val preview: String
        get() = lyrics
            .filter { it.isNotBlank() && !it.endsWith("...") }
            .take(2)
            .joinToString(" ")
            .ifBlank { "Tap to read full lyrics." }
}
