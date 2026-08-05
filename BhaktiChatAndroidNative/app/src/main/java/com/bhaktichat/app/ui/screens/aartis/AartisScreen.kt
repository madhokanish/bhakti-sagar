package com.bhaktichat.app.ui.screens.aartis

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.PlayCircleOutline
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bhaktichat.app.data.local.SavedAartisStore
import com.bhaktichat.app.data.repo.AartiRepository
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.playback.AartiPlayerState
import com.bhaktichat.app.ui.components.ads.BannerAd
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults
import com.bhaktichat.app.ui.screens.aartis.components.AartiFilter
import com.bhaktichat.app.ui.screens.aartis.components.AartiRow
import com.bhaktichat.app.ui.screens.aartis.components.FilterChips
import com.bhaktichat.app.ui.i18n.t
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AartisScreen(
    repository: AartiRepository,
    savedAartisStore: SavedAartisStore,
    playerController: com.bhaktichat.app.playback.AartiPlayerController,
    onBack: () -> Unit,
    onOpenDetail: (String) -> Unit
) {
    var query by rememberSaveable { mutableStateOf("") }
    var selectedFilter by rememberSaveable { mutableStateOf("all") }
    var aartis by remember { mutableStateOf(emptyList<Aarti>()) }
    var isRefreshing by remember { mutableStateOf(false) }
    val savedIds by savedAartisStore.savedIds.collectAsStateWithLifecycle()
    val playerState by playerController.state.collectAsStateWithLifecycle()
    val coroutineScope = rememberCoroutineScope()
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    LaunchedEffect(Unit) {
        playerController.initialize()
        aartis = repository.loadAartis()
    }

    // All aartis that have a real audio track, in list order — this is the continuous queue.
    val audioAartis = remember(aartis) { aartis.filter { it.hasAudio } }

    // Mini-player progress line. MediaController doesn't push position, so poll it while a
    // queue is loaded (cheap, and only while the bar is visible).
    var progress by remember { mutableStateOf(0f) }
    LaunchedEffect(playerState.hasQueue) {
        while (playerState.hasQueue) {
            progress = playerController.positionFraction()
            kotlinx.coroutines.delay(500)
        }
        progress = 0f
    }

    val filtered = remember(aartis, query, selectedFilter) {
        aartis
            .filter { aarti ->
                matchesFilter(aarti, selectedFilter) && matchesQuery(aarti, query)
            }
            .sortedWith(
                compareByDescending<Aarti> { it.isTop }
                    .thenByDescending { it.popularityCount ?: 0L }
                    .thenBy { it.title }
            )
    }
    // "Aarti of the day": a real daily-rotating pick (was just the top-sorted row, i.e.
    // identical every day). Deterministic by day so it's stable within a day, fresh daily.
    val featuredAarti = remember(aartis, query, selectedFilter) {
        if (query.isBlank() && selectedFilter == "all" && aartis.isNotEmpty()) {
            val dayIndex = (System.currentTimeMillis() / 86_400_000L % aartis.size).toInt()
            aartis[dayIndex]
        } else {
            null
        }
    }
    val remainingAartis = if (featuredAarti == null) filtered else filtered.filter { it.id != featuredAarti.id }

    Box(modifier = androidx.compose.ui.Modifier.fillMaxSize()) {
    Column(modifier = androidx.compose.ui.Modifier
        .fillMaxSize()
        .nestedScroll(scrollBehavior.nestedScrollConnection)
    ) {
        TopAppBar(
            title = { Text(t("aartis")) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = t("aartis_back_content_description")
                    )
                }
            },
            scrollBehavior = scrollBehavior
        )

        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            singleLine = true,
            placeholder = { Text(t("aartis_search_placeholder")) },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Outlined.Search,
                    contentDescription = t("aartis_search_placeholder")
                )
            },
            modifier = androidx.compose.ui.Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        )

        FilterChips(
            filters = aartiFilters(),
            selectedKey = selectedFilter,
            onSelect = { selectedFilter = it }
        )

        // Ad-model: anchored banner on this browse screen (test unit until real ids are set).
        BannerAd(
            placement = "aartis_list",
            modifier = androidx.compose.ui.Modifier.padding(vertical = 4.dp)
        )

        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = {
                coroutineScope.launch {
                    isRefreshing = true
                    aartis = repository.loadAartis()
                    isRefreshing = false
                }
            },
            modifier = androidx.compose.ui.Modifier.fillMaxSize()
        ) {
            LazyColumn(
                modifier = androidx.compose.ui.Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = 16.dp,
                    end = 16.dp,
                    top = 12.dp,
                    // Leave room for the floating mini-player when a queue is active.
                    bottom = BhaktiBottomNavBarDefaults.overlayClearance + 8.dp +
                        (if (playerState.hasQueue) 76.dp else 0.dp)
                ),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (audioAartis.isNotEmpty() && query.isBlank() && selectedFilter == "all") {
                    item("play-all") {
                        PlayAllCard(
                            onPlayAll = { playerController.playQueue(audioAartis, audioAartis.first().id) }
                        )
                    }
                }

                featuredAarti?.let { aarti ->
                    item("featured-aarti") {
                        Surface(
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp),
                            tonalElevation = 1.dp,
                            color = MaterialTheme.colorScheme.surface,
                            modifier = androidx.compose.ui.Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = androidx.compose.ui.Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = t("aartis_todays_aarti_label"),
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = androidx.compose.ui.Modifier.padding(start = 8.dp, top = 6.dp, bottom = 4.dp)
                                )
                                AartiRow(
                                    aarti = aarti,
                                    highlighted = true,
                                    onClick = { onOpenDetail(aarti.id) }
                                ) {
                                    AartiRowTrailing(
                                        aarti = aarti,
                                        isSaved = aarti.id in savedIds,
                                        isNowPlaying = playerState.currentAartiId == aarti.id && playerState.isPlaying,
                                        onToggleSaved = { savedAartisStore.toggleSaved(aarti.id) },
                                        onPlay = if (aarti.hasAudio) {
                                            { playerController.playQueue(audioAartis, aarti.id) }
                                        } else null
                                    )
                                }
                            }
                        }
                    }
                }

                if (remainingAartis.isEmpty()) {
                    item("empty-state") {
                        Text(
                            text = t("aartis_empty_search"),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = androidx.compose.ui.Modifier.padding(vertical = 16.dp)
                        )
                    }
                } else {
                    item("list-shell") {
                        Surface(
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp),
                            tonalElevation = 1.dp,
                            color = MaterialTheme.colorScheme.surface,
                            modifier = androidx.compose.ui.Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = androidx.compose.ui.Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                remainingAartis.forEachIndexed { index, aarti ->
                                    AartiRow(
                                        aarti = aarti,
                                        onClick = { onOpenDetail(aarti.id) }
                                    ) {
                                        AartiRowTrailing(
                                            aarti = aarti,
                                            isSaved = aarti.id in savedIds,
                                            isNowPlaying = playerState.currentAartiId == aarti.id && playerState.isPlaying,
                                            onToggleSaved = { savedAartisStore.toggleSaved(aarti.id) },
                                            onPlay = if (aarti.hasAudio) {
                                                { playerController.playQueue(audioAartis, aarti.id) }
                                            } else null
                                        )
                                    }
                                    if (index < remainingAartis.lastIndex) {
                                        HorizontalDivider(
                                            modifier = androidx.compose.ui.Modifier.padding(start = 68.dp),
                                            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.45f)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

        if (playerState.hasQueue) {
            MiniPlayer(
                state = playerState,
                progress = progress,
                onPlayPause = { playerController.togglePlayPause() },
                onNext = { playerController.next() },
                onStop = { playerController.stop() },
                onExpand = { playerController.expandFullScreen() },
                modifier = androidx.compose.ui.Modifier
                    .align(androidx.compose.ui.Alignment.BottomCenter)
                    .padding(
                        start = 12.dp,
                        end = 12.dp,
                        bottom = BhaktiBottomNavBarDefaults.overlayClearance + 8.dp
                    )
            )
        }
    }
}

@Composable
private fun AartiRowTrailing(
    aarti: Aarti,
    isSaved: Boolean,
    isNowPlaying: Boolean,
    onToggleSaved: () -> Unit,
    onPlay: (() -> Unit)?
) {
    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
        if (onPlay != null) {
            IconButton(onClick = onPlay) {
                Icon(
                    imageVector = if (isNowPlaying) Icons.Filled.PlayArrow else Icons.Outlined.PlayCircleOutline,
                    contentDescription = t("aartis_play_content_description").format(aarti.title),
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
        IconButton(onClick = onToggleSaved) {
            Icon(
                imageVector = if (isSaved) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                contentDescription = if (isSaved) {
                    t("aartis_remove_saved_content_description").format(aarti.title)
                } else {
                    t("aartis_save_content_description").format(aarti.title)
                },
                tint = if (isSaved) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                }
            )
        }
    }
}

/** Prominent "play the whole aarti playlist" affordance at the top of the list. */
@Composable
private fun PlayAllCard(
    onPlayAll: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.primaryContainer,
        modifier = androidx.compose.ui.Modifier
            .fillMaxWidth()
            .clickable(onClick = onPlayAll)
    ) {
        Row(
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
            modifier = androidx.compose.ui.Modifier.padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Box(
                contentAlignment = androidx.compose.ui.Alignment.Center,
                modifier = androidx.compose.ui.Modifier
                    .size(44.dp)
                    .background(MaterialTheme.colorScheme.primary, CircleShape)
            ) {
                Icon(
                    imageVector = Icons.Filled.PlayArrow,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimary
                )
            }
            Spacer(androidx.compose.ui.Modifier.width(14.dp))
            Column {
                Text(
                    text = t("aartis_play_all"),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = t("aartis_play_all_subtitle"),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.75f)
                )
            }
        }
    }
}

/** Floating Spotify-style now-playing bar; visible whenever a queue is loaded. */
@Composable
private fun MiniPlayer(
    state: AartiPlayerState,
    progress: Float,
    onPlayPause: () -> Unit,
    onNext: () -> Unit,
    onStop: () -> Unit,
    onExpand: () -> Unit,
    modifier: androidx.compose.ui.Modifier = androidx.compose.ui.Modifier
) {
    // Smoothly interpolate the polled position so the bar glides instead of stepping.
    val animatedProgress by androidx.compose.animation.core.animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        label = "aartiProgress"
    )
    Surface(
        shape = RoundedCornerShape(16.dp),
        tonalElevation = 3.dp,
        shadowElevation = 8.dp,
        color = MaterialTheme.colorScheme.surface,
        // Tapping the bar opens the full-screen player. The transport IconButtons below have
        // their own clickable modifiers, so a tap on them is consumed there, not here.
        modifier = modifier.fillMaxWidth().clickable(onClick = onExpand)
    ) {
        Column {
            Row(
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                modifier = androidx.compose.ui.Modifier.padding(start = 16.dp, end = 6.dp, top = 8.dp, bottom = 6.dp)
            ) {
                Column(modifier = androidx.compose.ui.Modifier.weight(1f)) {
                    Text(
                        text = state.title.ifBlank { t("aarti_fallback_title") },
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                    Text(
                        text = if (state.isBuffering) t("buffering") else state.subtitle.ifBlank { t("now_playing_fallback") },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                }
                IconButton(onClick = onPlayPause) {
                    Icon(
                        imageVector = if (state.isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        contentDescription = if (state.isPlaying) t("pause_label") else t("play_label"),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                IconButton(onClick = onNext) {
                    Icon(
                        imageVector = Icons.Filled.SkipNext,
                        contentDescription = t("next_aarti_content_description"),
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }
                IconButton(onClick = onStop) {
                    Icon(
                        imageVector = Icons.Outlined.Close,
                        contentDescription = t("stop_playback_content_description"),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            LinearProgressIndicator(
                progress = { animatedProgress },
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                gapSize = 0.dp,
                drawStopIndicator = {},
                modifier = androidx.compose.ui.Modifier
                    .fillMaxWidth()
                    .height(3.dp)
            )
        }
    }
}

@Composable
private fun aartiFilters(): List<AartiFilter> = listOf(
    AartiFilter("all", t("aarti_filter_all")),
    AartiFilter("popular", t("aarti_filter_popular")),
    AartiFilter("morning", t("aarti_filter_morning")),
    AartiFilter("evening", t("aarti_filter_evening")),
    AartiFilter("krishna", t("aarti_filter_krishna")),
    AartiFilter("ganesh", t("aarti_filter_ganesh")),
    AartiFilter("shiv", t("aarti_filter_shiv")),
    AartiFilter("devi", t("aarti_filter_devi")),
    AartiFilter("vrat", t("aarti_filter_vrat"))
)

private fun matchesFilter(aarti: Aarti, filter: String): Boolean = when (filter) {
    "all" -> true
    "popular" -> aarti.isTop
    else -> aarti.tags.any { it.equals(filter, ignoreCase = true) }
}

private fun matchesQuery(aarti: Aarti, query: String): Boolean {
    if (query.isBlank()) return true
    val normalized = query.trim().lowercase()
    return aarti.title.lowercase().contains(normalized) ||
        aarti.titleHi.lowercase().contains(normalized) ||
        aarti.deity.name.lowercase().contains(normalized) ||
        aarti.tags.any { it.contains(normalized, ignoreCase = true) }
}
