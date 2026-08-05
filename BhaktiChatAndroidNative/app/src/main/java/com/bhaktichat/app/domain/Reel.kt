package com.bhaktichat.app.domain

import com.bhaktichat.app.ui.i18n.translate

enum class ReelFeed {
    TOP,
    AARTIS
}

data class Reel(
    val id: String,
    val slug: String,
    val title: String,
    val caption: String,
    val creatorName: String,
    val creatorAvatarRes: Int?,
    val deityId: String,
    val audioTitle: String,
    val durationSeconds: Int,
    val likeCount: Long,
    /** Null for the `.aartis` feed when the underlying aarti has no recorded audio. */
    val videoUrl: String?,
    /** No real video track for the `.aartis` feed — audio-only, played with no video surface
     * attached (an ExoPlayer bound to a video surface silenced these on iOS; Android skips the
     * surface for this feed from the start instead of attaching and then discovering that). */
    val hasVideoTrack: Boolean,
    val posterRes: Int?,
    val feed: ReelFeed
) {
    /** Unit words come from the translation table, so counts read correctly in either script. */
    fun likeCountLabel(language: AppLanguage): String = when {
        likeCount >= 1_000_000 ->
            "%.1f %s".format(likeCount / 100_000.0, translate("reel_like_lakh", language))
        likeCount >= 1_000 ->
            "%.1f %s".format(likeCount / 1_000.0, translate("reel_like_thousand", language))
        else -> likeCount.toString()
    }

    val durationLabel: String
        get() = "%d:%02d".format(durationSeconds / 60, durationSeconds % 60)
}

/**
 * Display copy for a reel.
 *
 * The static TOP feed carries no strings of its own — each field is looked up from the slug,
 * so the feed follows the chosen language. The aarti feed is projected from
 * assets/aartis.json and already holds real titles, which are returned unchanged: aarti
 * names are devotional text, not UI chrome.
 */
fun Reel.displayTitle(language: AppLanguage): String =
    if (feed == ReelFeed.TOP) translate("reel_title_$slug", language) else title

fun Reel.displayCaption(language: AppLanguage): String =
    if (feed == ReelFeed.TOP) translate("reel_caption_$slug", language) else caption

fun Reel.displayAudioTitle(language: AppLanguage): String =
    if (feed == ReelFeed.TOP) translate("reel_audio_$slug", language) else audioTitle
