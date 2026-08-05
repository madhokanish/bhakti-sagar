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
    val audioUrl: String?,
    val popularityCount: Long?,
    val isTop: Boolean,
    val lyrics: List<String>,
    /** Per-aarti generated artwork (drawable resource name), when this specific aarti has its
     * own image rather than sharing a generic per-deity fallback. */
    val imageAssetName: String?
) {
    /** True when a real recorded aarti track is available to stream (vs. lyrics-only / TTS). */
    val hasAudio: Boolean get() = !audioUrl.isNullOrBlank()

    val subtitle: String?
        get() = titleHi.takeIf { it.isNotBlank() && !it.equals(title, ignoreCase = true) }

    val preview: String
        get() = lyrics
            .filter { it.isNotBlank() && !it.endsWith("...") }
            .take(2)
            .joinToString(" ")
            .ifBlank { "पूरे बोल पढ़ने के लिए टैप करें।" }
}
