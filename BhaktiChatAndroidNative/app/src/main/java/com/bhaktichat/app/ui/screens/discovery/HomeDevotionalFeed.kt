package com.bhaktichat.app.ui.screens.discovery
import com.bhaktichat.app.domain.displayTitle
import com.bhaktichat.app.domain.displayCaption
import com.bhaktichat.app.domain.displayAudioTitle
import com.bhaktichat.app.ui.i18n.LocalAppLanguage

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.bhaktichat.app.R
import com.bhaktichat.app.domain.Reel
import com.bhaktichat.app.domain.ReelFeed
import com.bhaktichat.app.ui.i18n.t
import com.bhaktichat.app.ui.screens.reels.ReelStatusExporter
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

internal const val HOME_FEED_KEY_PREFIX = "home-devotional-feed-"

internal data class HomeFeedEntry(
    val instanceId: String,
    val reel: Reel,
    val previewStartMillis: Long,
    val previewEndMillis: Long
) {
    val previewDurationMillis: Long
        get() = (previewEndMillis - previewStartMillis).coerceAtLeast(1L)

    val isAarti: Boolean
        get() = reel.feed == ReelFeed.AARTIS
}

internal data class HomeFeedPlayback(
    val player: ExoPlayer,
    val progress: Float
)

internal fun homeFeedItemKey(entry: HomeFeedEntry): String = "$HOME_FEED_KEY_PREFIX${entry.instanceId}"

/** Builds a 3-reels-to-1-aarti batch. Every batch receives unique UI ids so Compose can append
 * repeated catalog items safely while the underlying media ids remain stable for navigation. */
internal fun buildHomeFeedBatch(
    videoReels: List<Reel>,
    aartiReels: List<Reel>,
    batchNumber: Int
): List<HomeFeedEntry> {
    if (videoReels.isEmpty()) return emptyList()
    val videos = videoReels.shuffled()
    val aartis = aartiReels.shuffled()
    var videoIndex = 0
    var aartiIndex = 0

    return buildList {
        repeat(4) { groupIndex ->
            repeat(3) {
                val reel = videos[videoIndex % videos.size]
                add(reel.toHomeFeedEntry(batchNumber, size))
                videoIndex += 1
            }
            if (aartis.isNotEmpty()) {
                val reel = aartis[aartiIndex % aartis.size]
                add(reel.toHomeFeedEntry(batchNumber, size))
                aartiIndex += 1
            }
        }
    }
}

private fun Reel.toHomeFeedEntry(batchNumber: Int, index: Int): HomeFeedEntry {
    val totalMillis = durationSeconds.coerceAtLeast(1) * 1_000L
    val isAarti = feed == ReelFeed.AARTIS
    val desiredStart = if (isAarti) 20_000L else if (totalMillis >= 12_000L) 3_000L else 0L
    val start = desiredStart.coerceAtMost((totalMillis - 1_000L).coerceAtLeast(0L))
    val desiredDuration = if (isAarti) 10_000L else 6_000L
    val end = (start + desiredDuration).coerceAtMost(totalMillis).coerceAtLeast(start + 1L)
    return HomeFeedEntry(
        instanceId = "$batchNumber-$index-$id",
        reel = this,
        previewStartMillis = start,
        previewEndMillis = end
    )
}

@Composable
internal fun rememberHomeFeedPlayback(
    activeEntry: HomeFeedEntry?,
    isMuted: Boolean
): HomeFeedPlayback {
    val context = LocalContext.current
    val player = remember {
        ExoPlayer.Builder(context).build().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .setUsage(C.USAGE_MEDIA)
                    .build(),
                /* handleAudioFocus = */ true
            )
            repeatMode = Player.REPEAT_MODE_ONE
        }
    }
    var progress by remember { mutableFloatStateOf(0f) }

    DisposableEffect(player) {
        onDispose { player.release() }
    }

    LaunchedEffect(isMuted) {
        player.volume = if (isMuted) 0f else 1f
    }

    LaunchedEffect(activeEntry?.instanceId) {
        val entry = activeEntry
        val mediaUrl = entry?.reel?.videoUrl
        if (entry == null || mediaUrl.isNullOrBlank()) {
            player.pause()
            progress = 0f
            return@LaunchedEffect
        }

        val mediaItem = MediaItem.Builder()
            .setMediaId(entry.reel.id)
            .setUri(mediaUrl)
            .setClippingConfiguration(
                MediaItem.ClippingConfiguration.Builder()
                    .setStartPositionMs(entry.previewStartMillis)
                    .setEndPositionMs(entry.previewEndMillis)
                    .build()
            )
            .build()
        player.setMediaItem(mediaItem)
        player.prepare()
        player.play()

        while (true) {
            progress = (player.currentPosition.toFloat() / entry.previewDurationMillis.toFloat())
                .coerceIn(0f, 1f)
            delay(100L)
        }
    }

    return HomeFeedPlayback(player = player, progress = progress)
}

@Composable
internal fun HomeDevotionalFeedPost(
    entry: HomeFeedEntry,
    player: ExoPlayer,
    isActive: Boolean,
    isMuted: Boolean,
    progress: Float,
    onToggleMute: () -> Unit,
    onOpenReel: (Reel) -> Unit,
    onPlayAarti: (Reel, Long) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isExporting by remember(entry.instanceId) { androidx.compose.runtime.mutableStateOf(false) }
    val artworkScale by animateFloatAsState(
        targetValue = if (entry.isAarti && isActive) 1.06f else 1f,
        animationSpec = tween(durationMillis = 6_000),
        label = "aarti-artwork-scale"
    )
    val mediaTitle = if (entry.isAarti) t("home_feed_aarti_preview") else t("home_feed_reel_preview")
    val exportTitle = if (entry.isAarti) t("home_feed_share_aarti") else t("reels_set_as_status")

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Color(0xFFFFFCF7))
            .padding(bottom = 14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(start = 14.dp, end = 10.dp, top = 13.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Image(
                painter = painterResource(entry.reel.creatorAvatarRes ?: R.drawable.bhaktichat_logo),
                contentDescription = null,
                modifier = Modifier.size(36.dp).clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = entry.reel.creatorName,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2A1E14)
                )
                Text(
                    text = mediaTitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF8B735F)
                )
            }
            Text(
                text = t("home_feed_for_you"),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFB85A22)
            )
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(4f / 5f)
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0xFF1E1712))
        ) {
            if (entry.reel.posterRes != null) {
                Image(
                    painter = painterResource(entry.reel.posterRes),
                    contentDescription = entry.reel.displayTitle(LocalAppLanguage.current),
                    modifier = Modifier.fillMaxSize().scale(artworkScale),
                    contentScale = ContentScale.Crop
                )
            }

            if (isActive && entry.reel.hasVideoTrack) {
                AndroidView(
                    factory = { ctx ->
                        PlayerView(ctx).apply {
                            useController = false
                            resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                            setBackgroundColor(android.graphics.Color.TRANSPARENT)
                        }
                    },
                    update = { view -> view.player = player },
                    modifier = Modifier.fillMaxSize()
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colorStops = arrayOf(
                                0f to Color.Black.copy(alpha = 0.12f),
                                0.55f to Color.Transparent,
                                1f to Color.Black.copy(alpha = 0.82f)
                            )
                        )
                    )
            )

            IconButton(
                onClick = onToggleMute,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(10.dp)
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.42f))
            ) {
                Icon(
                    imageVector = if (isMuted) Icons.Filled.VolumeOff else Icons.Filled.VolumeUp,
                    contentDescription = if (isMuted) t("home_feed_sound_on") else t("home_feed_sound_off"),
                    tint = Color.White
                )
            }

            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Text(
                    text = entry.reel.displayTitle(LocalAppLanguage.current),
                    fontSize = 22.sp,
                    lineHeight = 27.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = entry.reel.displayCaption(LocalAppLanguage.current),
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    color = Color.White.copy(alpha = 0.92f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Box(
                    modifier = Modifier
                        .padding(top = 5.dp)
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.3f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(if (isActive) progress.coerceIn(0f, 1f) else 0f)
                            .height(4.dp)
                            .clip(CircleShape)
                            .background(Color.White)
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Button(
                onClick = {
                    if (entry.isAarti) onPlayAarti(entry.reel, entry.previewStartMillis)
                    else onOpenReel(entry.reel)
                },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFB64A18))
            ) {
                Icon(Icons.Filled.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                Box(modifier = Modifier.width(6.dp))
                Text(if (entry.isAarti) t("home_feed_listen_full") else t("home_feed_watch_full"))
            }
            OutlinedButton(
                onClick = {
                    if (!isExporting) {
                        isExporting = true
                        scope.launch {
                            ReelStatusExporter.export(context, entry.reel, exportTitle)
                            isExporting = false
                        }
                    }
                },
                modifier = Modifier.weight(1f)
            ) {
                Icon(
                    imageVector = if (entry.isAarti) Icons.Filled.Share else Icons.Filled.AddCircle,
                    contentDescription = null,
                    modifier = Modifier.size(17.dp)
                )
                Box(modifier = Modifier.width(6.dp))
                Text(
                    text = if (isExporting) "…" else if (entry.isAarti) {
                        t("home_feed_share")
                    } else {
                        t("home_feed_set_status")
                    },
                    maxLines = 1
                )
            }
        }
    }
}
