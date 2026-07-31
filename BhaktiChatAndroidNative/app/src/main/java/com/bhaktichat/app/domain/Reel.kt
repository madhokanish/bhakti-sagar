package com.bhaktichat.app.domain

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
    val likeCountLabel: String
        get() = when {
            likeCount >= 1_000_000 -> "%.1fM".format(likeCount / 1_000_000.0)
            likeCount >= 1_000 -> "%.1fK".format(likeCount / 1_000.0)
            else -> likeCount.toString()
        }

    val durationLabel: String
        get() = "%d:%02d".format(durationSeconds / 60, durationSeconds % 60)
}
