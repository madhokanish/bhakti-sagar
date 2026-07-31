package com.bhaktichat.app.ui.screens.reels

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.PlayCircleOutline
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.bhaktichat.app.domain.Reel
import com.bhaktichat.app.domain.ReelFeed
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults
import kotlinx.coroutines.launch

/**
 * Full-bleed vertical devotional video feed — sound-on autoplay (TikTok/Instagram convention),
 * one clip per page, with a chat handoff ("Ask about this") as the differentiating action.
 * Mirrors iOS's ReelsScreen, including its `.aartis` fix: that feed is audio-only (no real video
 * track), so those pages never attach a video surface — only the underlying player's audio.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ReelsScreen(
    factory: ReelsViewModelFactory,
    onAskAbout: (Reel) -> Unit
) {
    val vm: ReelsViewModel = viewModel(factory = factory)
    val uiState by vm.uiState.collectAsStateWithLifecycle()
    var isMuted by rememberSaveable { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        if (uiState.reels.isEmpty()) {
            EmptyState()
        } else {
            val pagerState = rememberPagerState(pageCount = { uiState.reels.size })
            VerticalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize()
            ) { page ->
                val reel = uiState.reels[page]
                ReelPage(
                    reel = reel,
                    isActive = pagerState.currentPage == page,
                    isMuted = isMuted,
                    isLiked = uiState.likedIds.contains(reel.id),
                    isSaved = uiState.savedIds.contains(reel.id),
                    onToggleMute = { isMuted = !isMuted },
                    onLike = { vm.toggleLike(reel.id) },
                    onSave = { vm.toggleSave(reel.id) },
                    onAsk = { onAskAbout(reel) }
                )
            }
        }

        FeedSwitcher(
            selected = uiState.feed,
            onSelect = vm::selectFeed,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .statusBarsPadding()
                .padding(top = 6.dp)
        )
    }
}

@Composable
private fun EmptyState() {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Filled.PlayCircleOutline,
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.5f),
            modifier = Modifier.size(34.dp)
        )
        Text(
            text = "No reels yet",
            color = Color.White,
            style = MaterialTheme.typography.titleMedium
        )
        Text(
            text = "New devotional clips arrive here soon.",
            color = Color.White.copy(alpha = 0.6f),
            style = MaterialTheme.typography.bodySmall
        )
    }
}

@Composable
private fun FeedSwitcher(
    selected: ReelFeed,
    onSelect: (ReelFeed) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .background(Color.Black.copy(alpha = 0.001f))
            .padding(horizontal = 14.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        listOf(ReelFeed.TOP to "Top", ReelFeed.AARTIS to "Aartis").forEach { (feed, label) ->
            val isSelected = feed == selected
            Text(
                text = label,
                color = if (isSelected) Color.White else Color.White.copy(alpha = 0.55f),
                fontWeight = if (isSelected) FontWeight.Black else FontWeight.SemiBold,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.clickable { onSelect(feed) }
            )
        }
    }
}

@Composable
private fun ReelPage(
    reel: Reel,
    isActive: Boolean,
    isMuted: Boolean,
    isLiked: Boolean,
    isSaved: Boolean,
    onToggleMute: () -> Unit,
    onLike: () -> Unit,
    onSave: () -> Unit,
    onAsk: () -> Unit
) {
    val context = LocalContext.current

    // One ExoPlayer per page, scoped to this composable's lifecycle — mirrors iOS's
    // one-AVQueuePlayer-per-page design. `handleAudioFocus = true` lets Android's standard audio
    // focus system (not app-managed shared-session juggling) arbitrate against the Aarti
    // player's own MediaSessionService.
    val exoPlayer = remember(reel.id) {
        ExoPlayer.Builder(context).build().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .setUsage(C.USAGE_MEDIA)
                    .build(),
                /* handleAudioFocus = */ true
            )
            repeatMode = Player.REPEAT_MODE_ONE
            reel.videoUrl?.let { url -> setMediaItem(MediaItem.fromUri(url)) }
            prepare()
        }
    }
    DisposableEffect(reel.id) {
        onDispose { exoPlayer.release() }
    }
    LaunchedEffect(isActive) {
        if (isActive) exoPlayer.play() else exoPlayer.pause()
    }
    LaunchedEffect(isMuted) {
        exoPlayer.volume = if (isMuted) 0f else 1f
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .clickable(onClick = onToggleMute)
    ) {
        if (reel.posterRes != null) {
            Image(
                painter = painterResource(id = reel.posterRes),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        } else {
            Box(modifier = Modifier.fillMaxSize().background(Color(0xFF1A1414)))
        }

        // The `.aartis` feed has no real video track — attaching a video surface to an
        // audio-only asset is what silenced it on iOS, so this feed never gets one here.
        if (reel.hasVideoTrack) {
            AndroidView(
                factory = { ctx ->
                    PlayerView(ctx).apply {
                        player = exoPlayer
                        useController = false
                        resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                        setBackgroundColor(android.graphics.Color.TRANSPARENT)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    androidx.compose.ui.graphics.Brush.verticalGradient(
                        colorStops = arrayOf(
                            0f to Color.Black.copy(alpha = 0.5f),
                            0.25f to Color.Transparent,
                            0.55f to Color.Transparent,
                            1f to Color.Black.copy(alpha = 0.85f)
                        )
                    )
                )
        )

        Row(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = BhaktiBottomNavBarDefaults.overlayClearance + 14.dp),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            CaptionBlock(reel = reel, isMuted = isMuted, modifier = Modifier.weight(1f))
            ActionRail(
                reel = reel,
                isLiked = isLiked,
                isSaved = isSaved,
                onLike = onLike,
                onSave = onSave,
                onAsk = onAsk
            )
        }
    }
}

@Composable
private fun CaptionBlock(reel: Reel, isMuted: Boolean, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.padding(end = 12.dp),
        horizontalAlignment = Alignment.Start
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (reel.creatorAvatarRes != null) {
                Image(
                    painter = painterResource(id = reel.creatorAvatarRes),
                    contentDescription = reel.creatorName,
                    modifier = Modifier.size(30.dp).clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            }
            Text(
                text = reel.creatorName,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.labelLarge
            )
        }
        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(top = 6.dp))
        Text(
            text = reel.caption,
            color = Color.White,
            style = MaterialTheme.typography.bodyMedium,
            maxLines = 3,
            overflow = TextOverflow.Ellipsis
        )
        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(top = 6.dp))
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(
                imageVector = if (isMuted) Icons.Filled.VolumeOff else Icons.Filled.VolumeUp,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.75f),
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = reel.audioTitle,
                color = Color.White.copy(alpha = 0.85f),
                style = MaterialTheme.typography.labelSmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun ActionRail(
    reel: Reel,
    isLiked: Boolean,
    isSaved: Boolean,
    onLike: () -> Unit,
    onSave: () -> Unit,
    onAsk: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isExporting by remember { mutableStateOf(false) }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        RailButton(
            icon = if (isLiked) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
            label = reel.likeCountLabel,
            tint = if (isLiked) Color(0xFFFF5A5F) else Color.White,
            onClick = onLike
        )
        RailButton(
            icon = if (isSaved) Icons.Filled.Bookmark else Icons.Filled.BookmarkBorder,
            label = "Save",
            tint = Color.White,
            onClick = onSave
        )
        RailButton(
            icon = Icons.Filled.Share,
            label = "Share",
            tint = Color.White,
            onClick = {
                if (!isExporting) {
                    isExporting = true
                    scope.launch {
                        ReelStatusExporter.export(context, reel, chooserTitle = "Share reel")
                        isExporting = false
                    }
                }
            }
        )
        // Video-only — the `.aartis` feed has no real video track, and WhatsApp Status is a
        // photo/video format, so there's nothing meaningful to hand it for those clips.
        if (reel.hasVideoTrack) {
            RailButton(
                icon = Icons.Filled.AddCircle,
                label = if (isExporting) "…" else "Status",
                tint = Color.White,
                onClick = {
                    if (!isExporting) {
                        isExporting = true
                        scope.launch {
                            ReelStatusExporter.export(context, reel, chooserTitle = "Set as status")
                            isExporting = false
                        }
                    }
                }
            )
        }
        RailButton(
            icon = Icons.Filled.AutoAwesome,
            label = "Ask",
            tint = Color.White,
            accent = true,
            onClick = onAsk
        )
    }
}

@Composable
private fun RailButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    tint: Color,
    accent: Boolean = false,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(
                    color = if (accent) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.16f),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = if (accent) Color.White else tint,
                modifier = Modifier.size(16.dp)
            )
        }
        Text(
            text = label,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.labelSmall
        )
    }
}
