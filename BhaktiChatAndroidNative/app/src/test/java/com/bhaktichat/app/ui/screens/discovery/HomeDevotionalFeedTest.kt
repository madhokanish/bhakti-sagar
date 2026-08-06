package com.bhaktichat.app.ui.screens.discovery

import com.bhaktichat.app.domain.Reel
import com.bhaktichat.app.domain.ReelFeed
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HomeDevotionalFeedTest {
    @Test
    fun `batch repeats three reel previews followed by one aarti preview`() {
        val videos = (1..6).map { reel("video-$it", ReelFeed.TOP, 30) }
        val aartis = (1..3).map { reel("aarti-$it", ReelFeed.AARTIS, 180) }

        val batch = buildHomeFeedBatch(videos, aartis, batchNumber = 7)

        assertEquals(16, batch.size)
        batch.chunked(4).forEach { group ->
            assertEquals(listOf(ReelFeed.TOP, ReelFeed.TOP, ReelFeed.TOP, ReelFeed.AARTIS), group.map { it.reel.feed })
        }
        assertEquals(batch.size, batch.map { it.instanceId }.distinct().size)
    }

    @Test
    fun `previews skip intros and keep the intended short duration`() {
        val batch = buildHomeFeedBatch(
            videoReels = listOf(reel("video", ReelFeed.TOP, 30)),
            aartiReels = listOf(reel("aarti", ReelFeed.AARTIS, 180)),
            batchNumber = 0
        )

        val video = batch.first { !it.isAarti }
        val aarti = batch.first { it.isAarti }

        assertEquals(3_000L, video.previewStartMillis)
        assertEquals(6_000L, video.previewDurationMillis)
        assertEquals(20_000L, aarti.previewStartMillis)
        assertEquals(10_000L, aarti.previewDurationMillis)
        assertTrue(batch.all { it.previewEndMillis > it.previewStartMillis })
    }

    private fun reel(id: String, feed: ReelFeed, durationSeconds: Int) = Reel(
        id = id,
        slug = id,
        title = "शीर्षक",
        caption = "विवरण",
        creatorName = "BhaktiChat",
        creatorAvatarRes = null,
        deityId = "कृष्ण",
        audioTitle = "भजन",
        durationSeconds = durationSeconds,
        likeCount = 0,
        videoUrl = "https://example.com/$id.mp4",
        hasVideoTrack = feed == ReelFeed.TOP,
        posterRes = null,
        feed = feed
    )
}
