package com.bhaktichat.app.ui.screens.discovery
import com.bhaktichat.app.domain.displayTitle
import com.bhaktichat.app.domain.displayCaption
import com.bhaktichat.app.domain.displayAudioTitle
import com.bhaktichat.app.ui.i18n.LocalAppLanguage

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.Image
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.ui.graphics.Brush
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.R
import com.bhaktichat.app.data.repo.AartiRepository
import com.bhaktichat.app.data.repo.ChoghadiyaRepository
import com.bhaktichat.app.data.repo.ReelsRepository
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.domain.ChoghadiyaCities
import com.bhaktichat.app.domain.ChoghadiyaSlot
import com.bhaktichat.app.domain.Reel
import com.bhaktichat.app.domain.ReelFeed
import com.bhaktichat.app.domain.Wallpapers
import com.bhaktichat.app.playback.AartiPlayerState
import com.bhaktichat.app.ui.screens.aartis.components.aartiImageRes
import com.bhaktichat.app.ui.screens.choghadiya.KaalTone
import com.bhaktichat.app.ui.screens.choghadiya.heroGradientFor
import com.bhaktichat.app.ui.screens.choghadiya.kaalToneFor
import com.bhaktichat.app.ui.i18n.t
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import com.bhaktichat.app.domain.Guides
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults
import com.bhaktichat.app.ui.components.shell.GuideAvatarItem
import com.bhaktichat.app.ui.components.shell.SectionHeaderRow
import com.bhaktichat.app.ui.components.shell.SituationCard
import com.bhaktichat.app.ui.navigation.DiscoveryGuideConfig
import com.bhaktichat.app.ui.navigation.discoveryGuideCatalog
import com.bhaktichat.app.ui.navigation.discoverySituations
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.distinctUntilChanged
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onOpenProfile: () -> Unit,
    onStartGuidedThread: (guideId: String, prompt: String, skipOpener: Boolean) -> Unit,
    onOpenGuideThread: (String) -> Unit,
    onOpenGuidePicker: () -> Unit,
    onOpenAartis: () -> Unit,
    onOpenChoghadiya: () -> Unit,
    onOpenSubscribe: () -> Unit,
    onOpenDivineImage: () -> Unit = {},
    onOpenReels: (String?) -> Unit = {},
    onOpenWallpapers: () -> Unit = {},
    onPlayAartiFromFeed: (String, Long) -> Unit = { _, _ -> },
    onToggleAartiSpotlight: () -> Unit = {},
    reelsRepository: ReelsRepository,
    aartiRepository: AartiRepository,
    choghadiyaRepository: ChoghadiyaRepository,
    aartiPlayerState: AartiPlayerState = AartiPlayerState(),
    userName: String = "",
    isPro: Boolean = false,
    streak: Int = 0,
    onOpenStreak: () -> Unit = {}
) {
    var reelsPreview by remember { mutableStateOf<List<Reel>>(emptyList()) }
    var aartiSpotlightFallback by remember { mutableStateOf<Aarti?>(null) }
    var choghadiyaPreview by remember { mutableStateOf<ChoghadiyaSlot?>(null) }
    var choghadiyaTone by remember { mutableStateOf(KaalTone.NEUTRAL) }
    var choghadiyaProgress by remember { mutableStateOf(0f) }
    var choghadiyaIsLoading by remember { mutableStateOf(true) }
    var homeFeedVideoReels by remember { mutableStateOf<List<Reel>>(emptyList()) }
    var homeFeedAartiReels by remember { mutableStateOf<List<Reel>>(emptyList()) }
    var homeFeedEntries by remember { mutableStateOf<List<HomeFeedEntry>>(emptyList()) }
    var homeFeedBatch by remember { mutableStateOf(0) }
    var activeHomeFeedId by remember { mutableStateOf<String?>(null) }
    var isHomeFeedMuted by rememberSaveable { mutableStateOf(false) }
    var isRefreshing by remember { mutableStateOf(false) }
    var refreshGeneration by remember { mutableStateOf(0) }
    val homeListState = rememberLazyListState()

    // Changing refreshGeneration cancels the old live-data loop and performs one complete Home
    // refresh. Existing content remains visible if an individual source is temporarily unavailable.
    LaunchedEffect(refreshGeneration) {
        activeHomeFeedId = null
        val topReels = runCatching { reelsRepository.reels(ReelFeed.TOP) }
            .getOrDefault(homeFeedVideoReels)
        if (topReels.isNotEmpty()) reelsPreview = topReels.shuffled().take(8)
        val aartis = runCatching { aartiRepository.loadAartis() }.getOrDefault(emptyList())
        if (aartis.isNotEmpty()) {
            aartiSpotlightFallback = aartis.shuffled().firstOrNull { it.isTop }
                ?: aartis.shuffled().firstOrNull()
        }
        val aartiReels = runCatching { reelsRepository.reels(ReelFeed.AARTIS) }
            .getOrDefault(homeFeedAartiReels)
        if (topReels.isNotEmpty()) homeFeedVideoReels = topReels
        if (aartiReels.isNotEmpty()) homeFeedAartiReels = aartiReels
        if (topReels.isNotEmpty()) {
            homeFeedBatch = 0
            homeFeedEntries = buildHomeFeedBatch(topReels, aartiReels, batchNumber = 0)
        }
        // Lightweight Home preview — always the recommended city. The full Choghadiya screen
        // lets the user pick/detect a specific city; this teaser just needs *a* live "what's
        // auspicious right now" value, not a personalized one.
        val slots = runCatching {
            choghadiyaRepository.loadToday(ChoghadiyaCities.recommendedCity()).slots
        }.getOrDefault(emptyList())
        choghadiyaIsLoading = false
        isRefreshing = false

        // Keep the active slot and its progress live while Home remains open. A new network
        // request is unnecessary: today's response already contains the complete sun cycle.
        while (slots.isNotEmpty()) {
            val now = System.currentTimeMillis()
            val slot = slots.firstOrNull { now in it.startEpochMillis until it.endEpochMillis }
                ?: slots.firstOrNull { it.endEpochMillis > now }
            choghadiyaPreview = slot
            choghadiyaTone = slot?.let { kaalToneFor(it.baseLabel) } ?: KaalTone.NEUTRAL
            choghadiyaProgress = slot?.progressAt(now) ?: 0f
            delay(30_000L)
        }
    }

    // Select only the dominant visible feed post. A short dwell avoids swapping the shared
    // decoder repeatedly during a fast fling; sound begins when scrolling settles on a post.
    LaunchedEffect(homeListState) {
        snapshotFlow {
            val layout = homeListState.layoutInfo
            layout.visibleItemsInfo
                .mapNotNull { item ->
                    val key = item.key as? String ?: return@mapNotNull null
                    if (!key.startsWith(HOME_FEED_KEY_PREFIX)) return@mapNotNull null
                    val visibleStart = maxOf(item.offset, layout.viewportStartOffset)
                    val visibleEnd = minOf(item.offset + item.size, layout.viewportEndOffset)
                    val visibleFraction = ((visibleEnd - visibleStart).coerceAtLeast(0)).toFloat() /
                        item.size.coerceAtLeast(1).toFloat()
                    key.removePrefix(HOME_FEED_KEY_PREFIX) to visibleFraction
                }
                .maxByOrNull { it.second }
                ?.takeIf { it.second >= 0.55f }
                ?.first
        }
            .distinctUntilChanged()
            .collectLatest { candidate ->
                delay(220L)
                activeHomeFeedId = candidate
            }
    }

    // Append another shuffled 3:1 batch as the user nears the end. LazyColumn keeps only the
    // visible post compositions alive, so the feed can continue without accumulating players.
    LaunchedEffect(homeListState, homeFeedEntries.size, homeFeedVideoReels, homeFeedAartiReels) {
        if (homeFeedEntries.isEmpty()) return@LaunchedEffect
        snapshotFlow { homeListState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0 }
            .distinctUntilChanged()
            .collect { lastVisibleIndex ->
                val totalItems = homeListState.layoutInfo.totalItemsCount
                if (lastVisibleIndex >= totalItems - 3) {
                    val nextBatch = homeFeedBatch + 1
                    homeFeedBatch = nextBatch
                    homeFeedEntries = homeFeedEntries + buildHomeFeedBatch(
                        videoReels = homeFeedVideoReels,
                        aartiReels = homeFeedAartiReels,
                        batchNumber = nextBatch
                    )
                }
            }
    }

    val activeHomeFeedEntry = homeFeedEntries.firstOrNull { it.instanceId == activeHomeFeedId }
    val homeFeedPlayback = rememberHomeFeedPlayback(
        activeEntry = activeHomeFeedEntry,
        isMuted = isHomeFeedMuted
    )

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = {
            if (!isRefreshing) {
                isRefreshing = true
                choghadiyaIsLoading = true
                refreshGeneration += 1
            }
        },
        modifier = Modifier.fillMaxSize()
    ) {
        LazyColumn(
            state = homeListState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = 16.dp,
                end = 16.dp,
                top = 12.dp,
                bottom = BhaktiBottomNavBarDefaults.overlayClearance + 8.dp
            ),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
        item("topbar") {
            // Plain "Home" title via AppTopBar's default rendering — matches
            // Explore/History/BhaktiChat now (was previously a bespoke logo+wordmark
            // treatment unique to this screen; standardized per product review).
            AppTopBar(
                title = t("home_title"),
                leftContent = {
                    IconButton(onClick = onOpenProfile) {
                        Icon(
                            imageVector = Icons.Outlined.Person,
                            contentDescription = t("profile_content_description"),
                            tint = StreakDeepAccent
                        )
                    }
                }
            )
        }

        item("greeting") {
            GreetingHeader(userName = userName, streak = streak, onOpenStreak = onOpenStreak)
        }

        item("guides-header") {
            SectionHeaderRow(
                title = t("home_ai_spiritual_guides"),
                actionLabel = t("home_see_all"),
                onActionClick = onOpenGuidePicker
            )
        }

        item("guides-row") {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(discoveryGuideCatalog, key = { it.id }) { guide ->
                    HomeGuideTile(
                        guide = guide,
                        onOpenGuideThread = onOpenGuideThread
                    )
                }
            }
        }

        item("situations-header") {
            SectionHeaderRow(title = t("home_life_situations"))
        }

        item("situations-grid") {
            BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                // Tightened gutter: 12dp (was 16dp) — mirrors iOS.
                val cardWidth = (maxWidth - 12.dp) / 2
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    discoverySituations.chunked(2).forEach { rowItems ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            rowItems.forEach { situation ->
                                val guide = Guides.byId(situation.defaultGuideId)
                                val guideName = guide?.let { t("guide_title_${it.id}") }
                                val translatedPrompt = t("situation_prompt_${situation.id}")
                                SituationCard(
                                    title = t("situation_title_${situation.id}"),
                                    icon = situation.icon,
                                    subtitle = guideName?.let { t("ask_guide").format(it) }.orEmpty(),
                                    modifier = Modifier.width(cardWidth),
                                    accentColor = situationAccentColor(situation.id),
                                    guideAvatarRes = guide?.avatarRes,
                                    onClick = {
                                        onStartGuidedThread(
                                            situation.defaultGuideId,
                                            translatedPrompt,
                                            true
                                        )
                                    }
                                )
                            }
                            if (rowItems.size == 1) {
                                Spacer(modifier = Modifier.width(cardWidth))
                            }
                        }
                    }
                }
            }
        }

        if (reelsPreview.isNotEmpty()) {
            item("reels-header") {
                SectionHeaderRow(
                    title = t("home_reels"),
                    actionLabel = t("home_see_all"),
                    onActionClick = { onOpenReels(null) }
                )
            }
            item("reels-shelf") {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(reelsPreview, key = { it.id }) { reel ->
                        ReelShelfCard(reel = reel, onClick = { onOpenReels(reel.id) })
                    }
                }
            }
        }

        item("aarti-spotlight") {
            AartiSpotlightCard(
                playerState = aartiPlayerState,
                fallback = aartiSpotlightFallback,
                onOpenAartis = onOpenAartis,
                onToggle = onToggleAartiSpotlight
            )
        }

        item("darshan-promo") {
            CreateDarshanPromoCard(onClick = onOpenDivineImage)
        }

        item("choghadiya-row") {
            ChoghadiyaPreviewRow(
                slot = choghadiyaPreview,
                tone = choghadiyaTone,
                progress = choghadiyaProgress,
                isLoading = choghadiyaIsLoading,
                onClick = onOpenChoghadiya
            )
        }

        item("wallpapers-row") {
            WallpapersPreviewRow(onClick = onOpenWallpapers)
        }

        if (homeFeedEntries.isNotEmpty()) {
            item(key = "home-devotional-feed-title", contentType = "section-header") {
                SectionHeaderRow(title = t("home_feed_title"))
            }
            items(
                items = homeFeedEntries,
                key = ::homeFeedItemKey,
                contentType = { "home-devotional-feed-post" }
            ) { entry ->
                HomeDevotionalFeedPost(
                    entry = entry,
                    player = homeFeedPlayback.player,
                    isActive = entry.instanceId == activeHomeFeedId,
                    isMuted = isHomeFeedMuted,
                    progress = if (entry.instanceId == activeHomeFeedId) homeFeedPlayback.progress else 0f,
                    onToggleMute = { isHomeFeedMuted = !isHomeFeedMuted },
                    onOpenReel = { reel -> onOpenReels(reel.id) },
                    onPlayAarti = { reel, startMillis ->
                        onPlayAartiFromFeed(reel.id.removePrefix("aarti-"), startMillis)
                    }
                )
            }
        }
        }
    }
}

/** Reels shelf card — Home's teaser into the Reels tab (design mirrors iOS's ReelShelfCard). */
@Composable
private fun ReelShelfCard(reel: Reel, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .width(108.dp)
            .height(150.dp)
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
    ) {
        if (reel.posterRes != null) {
            Image(
                painter = painterResource(id = reel.posterRes),
                contentDescription = reel.displayTitle(LocalAppLanguage.current),
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        } else {
            Box(modifier = Modifier.fillMaxSize().background(Color(0xFF2A1E14)))
        }
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.5f to Color.Transparent,
                        1f to Color.Black.copy(alpha = 0.78f)
                    )
                )
        )
        Text(
            text = reel.displayTitle(LocalAppLanguage.current),
            fontSize = 11.5.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(8.dp)
        )
    }
}

/** Spotify-style hero card with live now-playing state — mirrors iOS's aartiSpotlightCard.
 *  The card body opens the Aartis list; the trailing 44dp button is a direct transport control. */
@Composable
private fun AartiSpotlightCard(
    playerState: AartiPlayerState,
    fallback: Aarti?,
    onOpenAartis: () -> Unit,
    onToggle: () -> Unit
) {
    val context = LocalContext.current
    val hasNowPlaying = playerState.currentAartiId != null
    val title = if (hasNowPlaying) playerState.title else (fallback?.title ?: t("aartis"))
    val subtitleText = if (hasNowPlaying) {
        t("aartis_play_all_subtitle")
    } else {
        fallback?.durationMinutes?.let { "$it ${t("min_suffix")} · ${t("aartis_play_all_subtitle")}" }
            ?: t("aartis_play_all_subtitle")
    }
    val imageRes = if (hasNowPlaying) {
        aartiImageRes(context, playerState.imageAssetName, playerState.deity)
    } else {
        fallback?.let { aartiImageRes(context, it) }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF5A3418), Color(0xFF2A1E14))))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier
                .weight(1f)
                .clickable(onClick = onOpenAartis),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(14.dp))
            ) {
                if (imageRes != null) {
                    Image(
                        painter = painterResource(id = imageRes),
                        contentDescription = title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.White.copy(alpha = 0.15f))
                    )
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text = if (playerState.isPlaying) t("home_now_playing") else t("home_todays_aarti"),
                    fontSize = 9.5.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.8.sp,
                    color = Color.White.copy(alpha = 0.6f)
                )
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = subtitleText,
                    fontSize = 10.5.sp,
                    color = Color.White.copy(alpha = 0.5f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        IconButton(
            onClick = onToggle,
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(BhaktiThemeTokens.AccentPrimary)
        ) {
            Icon(
                imageVector = if (playerState.isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                contentDescription = if (playerState.isPlaying) t("pause_aarti") else t("play_todays_aarti"),
                tint = Color.White
            )
        }
    }
}

/** Live tone-colored Choghadiya status card. Its color and calculation are shared with the
 *  full Choghadiya screen, while the time bar stays current for as long as Home is visible. */
@Composable
private fun ChoghadiyaPreviewRow(
    slot: ChoghadiyaSlot?,
    tone: KaalTone,
    progress: Float,
    isLoading: Boolean,
    onClick: () -> Unit
) {
    val verdict = when (tone) {
        KaalTone.AUSPICIOUS -> t("choghadiya_verdict_favourable")
        KaalTone.NEUTRAL -> t("choghadiya_verdict_neutral")
        KaalTone.CHALLENGING -> t("choghadiya_verdict_unfavourable")
    }
    val title = slot?.let { t("choghadiya_kaal_active").format(it.displayLabel) }
        ?: if (isLoading) t("home_choghadiya_loading") else t("home_choghadiya_unavailable")

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.linearGradient(heroGradientFor(tone)))
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.18f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Bolt,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(18.dp)
                )
            }
            Text(
                text = if (slot == null) t("home_choghadiya_now") else verdict,
                modifier = Modifier.weight(1f),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White.copy(alpha = 0.94f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Icon(
                imageVector = Icons.Filled.ChevronRight,
                contentDescription = t("home_choghadiya_details"),
                tint = Color.White.copy(alpha = 0.78f)
            )
        }

        Text(
            text = title,
            fontSize = 19.sp,
            lineHeight = 24.sp,
            fontWeight = FontWeight.Black,
            color = Color.White,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )

        if (slot != null) {
            Text(
                text = "${slot.start} से ${slot.end} तक",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White.copy(alpha = 0.96f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = t(slot.homeGuidanceKey()),
                fontSize = 12.5.sp,
                lineHeight = 17.sp,
                color = Color.White.copy(alpha = 0.9f),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.28f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(progress.coerceIn(0f, 1f))
                        .fillMaxHeight()
                        .clip(CircleShape)
                        .background(Color.White)
                )
            }
        }
    }
}

private fun ChoghadiyaSlot.progressAt(now: Long): Float {
    val duration = (endEpochMillis - startEpochMillis).coerceAtLeast(1L)
    val elapsed = (now - startEpochMillis).coerceIn(0L, duration)
    return elapsed.toFloat() / duration.toFloat()
}

private fun ChoghadiyaSlot.homeGuidanceKey(): String = when (baseLabel) {
    "Shubh" -> "choghadiya_guidance_shubh"
    "Labh" -> "choghadiya_guidance_labh"
    "Amrit" -> "choghadiya_guidance_amrit"
    "Char" -> "choghadiya_guidance_char"
    "Rog" -> "choghadiya_guidance_rog"
    "Kaal" -> "choghadiya_guidance_kaal"
    else -> "choghadiya_guidance_udveg"
}

/** 4-image strip teaser into the Wallpapers grid — mirrors iOS's wallpapersRow. */
@Composable
private fun WallpapersPreviewRow(onClick: () -> Unit) {
    val strip = Wallpapers.all.take(4)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(136.dp)
            .clip(RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
    ) {
        Row(modifier = Modifier.fillMaxSize()) {
            strip.forEach { wallpaper ->
                Image(
                    painter = painterResource(id = wallpaper.imageRes),
                    contentDescription = t("wallpaper_title_${wallpaper.id}"),
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(),
                    contentScale = ContentScale.Crop
                )
            }
        }
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.38f to Color.Black.copy(alpha = 0.05f),
                        1f to Color.Black.copy(alpha = 0.86f)
                    )
                )
        )
        Row(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(t("home_wallpapers"), fontSize = 15.sp, fontWeight = FontWeight.Black, color = Color.White)
                Text(
                    text = t("home_wallpapers_subtitle"),
                    fontSize = 11.5.sp,
                    color = Color.White.copy(alpha = 0.78f)
                )
            }
            Icon(
                imageVector = Icons.Filled.ChevronRight,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.8f)
            )
        }
    }
}

/** Real photo background + social-proof sample thumbnails — mirrors iOS's divineImageCard,
 *  which converts noticeably better than a plain gradient-and-text card. */
@Composable
private fun CreateDarshanPromoCard(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(224.dp)
            .clip(RoundedCornerShape(22.dp))
            .clickable(onClick = onClick)
    ) {
        Image(
            painter = painterResource(id = R.drawable.photo_with_god),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.38f to Color(0xFF140804).copy(alpha = 0f),
                        1f to Color(0xFF140804).copy(alpha = 0.92f)
                    )
                )
        )
        // Two sample results, top-right — social proof of what the feature returns.
        Row(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            listOf(R.drawable.demopic, R.drawable.photo_at_temple).forEach { sampleRes ->
                Image(
                    painter = painterResource(id = sampleRes),
                    contentDescription = null,
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .border(1.5.dp, Color.White.copy(alpha = 0.55f), RoundedCornerShape(10.dp)),
                    contentScale = ContentScale.Crop
                )
            }
        }
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                Icon(Icons.Filled.AutoAwesome, null, tint = Color(0xFFFFE7C6), modifier = Modifier.size(10.dp))
                Text(t("home_divine_image_eyebrow"), fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFFFFE7C6), letterSpacing = 1.sp)
            }
            Text(t("home_divine_image_title"), fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
            // Timing claim matches the app's own generating-state estimate (60-90s) rather than
            // a rounder "about 20 seconds" that overpromises what it actually does.
            Text(
                t("home_divine_image_subtitle"),
                fontSize = 12.5.sp,
                color = Color.White.copy(alpha = 0.85f)
            )
            Row(
                modifier = Modifier
                    .padding(top = 2.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White)
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(t("home_upload_a_photo"), fontSize = 13.sp, fontWeight = FontWeight.Black, color = Color(0xFF7C2D12))
                Icon(
                    Icons.AutoMirrored.Filled.ArrowForward,
                    null,
                    tint = Color(0xFF7C2D12),
                    modifier = Modifier.size(15.dp)
                )
            }
        }
    }
}

private val StreakDeepAccent = Color(0xFFC2410C)
private val StreakTextPrimary = Color(0xFF2A1C15)

/** Compact greeting + tappable streak pill — mirrors iOS's greetingHeader, which replaced a
 *  big dismissible "DAILY DARSHAN" hero card with this smaller, always-visible treatment. */
@Composable
private fun GreetingHeader(userName: String, streak: Int, onOpenStreak: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = greetingText(userName = userName, hour = java.time.LocalTime.now().hour),
                fontSize = 19.sp,
                fontWeight = FontWeight.Black,
                color = StreakTextPrimary
            )
            Text(
                text = dateSubtitle(),
                fontSize = 12.sp,
                color = Color(0xFF8A6F5C)
            )
        }
        Row(
            modifier = Modifier
                .clip(CircleShape)
                .background(Color.White)
                .border(1.dp, StreakDeepAccent.copy(alpha = 0.18f), CircleShape)
                .clickable(onClick = onOpenStreak)
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.LocalFireDepartment,
                contentDescription = null,
                tint = StreakDeepAccent,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = "$streak",
                fontSize = 12.5.sp,
                fontWeight = FontWeight.Black,
                color = StreakDeepAccent
            )
        }
    }
}

@Composable
private fun greetingText(userName: String, hour: Int): String {
    val part = when (hour) {
        in 4..11 -> t("good_morning")
        in 12..16 -> t("good_afternoon")
        else -> t("good_evening")
    }
    val firstName = userName.trim().substringBefore(" ")
    return if (firstName.isBlank()) part else "$part, $firstName"
}

@Composable
private fun dateSubtitle(): String {
    // Hindi gets real Devanagari day/month names via java.time's own locale data (Android
    // bundles full ICU data for Hindi); Hinglish keeps the Latin-script date since Hinglish
    // text elsewhere stays in Roman script too.
    val locale = if (com.bhaktichat.app.ui.i18n.LocalAppLanguage.current == com.bhaktichat.app.domain.AppLanguage.HINDI) {
        Locale("hi")
    } else {
        Locale.ENGLISH
    }
    val formatter = java.time.format.DateTimeFormatter.ofPattern("EEEE, d MMMM", locale)
    return java.time.LocalDate.now().format(formatter)
}

/** Per-deity gradient ring (design tokens). Keyed loosely by guide id/title. */
private fun deityRingGradient(guideId: String): List<Color> {
    val k = guideId.lowercase()
    return when {
        "krishna" in k -> listOf(Color(0xFFFDBA74), Color(0xFFEA580C))
        "lakshmi" in k -> listOf(Color(0xFFFCD34D), Color(0xFFD97706))
        "shiv" in k -> listOf(Color(0xFFA5B4FC), Color(0xFF6366F1))
        "hanuman" in k -> listOf(Color(0xFFFCA5A5), Color(0xFFDC2626))
        "shani" in k -> listOf(Color(0xFF94A3B8), Color(0xFF475569))
        else -> listOf(Color(0xFFFB923C), Color(0xFFEA580C))
    }
}

/**
 * Large, gradient-ringed guide avatar — the visual centrepiece of Home
 * (design_handoff_bhaktichat_ia). Notably bigger than the shared GuideAvatarItem.
 */
@Composable
private fun HomeGuideTile(
    guide: DiscoveryGuideConfig,
    onOpenGuideThread: (String) -> Unit
) {
    val translatedTitle = t("guide_title_${guide.id}")
    Column(
        modifier = Modifier
            .width(108.dp)
            .clickable(enabled = guide.available) { onOpenGuideThread(guide.id) },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(96.dp)
                .border(3.dp, Brush.linearGradient(deityRingGradient(guide.id)), CircleShape)
                .padding(4.dp),
            contentAlignment = Alignment.Center
        ) {
            if (guide.imageRes != null) {
                Image(
                    painter = painterResource(id = guide.imageRes),
                    contentDescription = translatedTitle,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop,
                    alpha = if (guide.available) 1f else 0.6f
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.White, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = guide.fallbackLetter,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold,
                        color = StreakDeepAccent
                    )
                }
            }
        }
        Text(
            text = translatedTitle,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF5C4433),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * Per-situation accent color for the Life Situations grid. Mirrors the iOS
 * [HomeScreen.accentColor(forSituation:)] palette — desaturated, brand-warm
 * hues that give each card a distinct emotional identity while still
 * harmonizing with the saffron / cream theme.
 */
private fun situationAccentColor(id: String): Color = when (id) {
    "money_stress"        -> Color(red = 0.34f, green = 0.62f, blue = 0.46f)  // emerald
    "bad_luck"            -> Color(red = 0.40f, green = 0.45f, blue = 0.62f)  // slate-indigo
    "anxiety"             -> Color(red = 0.39f, green = 0.58f, blue = 0.78f)  // calm blue
    "fear"                -> Color(red = 0.55f, green = 0.42f, blue = 0.69f)  // courage violet
    "relationship_issues" -> Color(red = 0.82f, green = 0.45f, blue = 0.55f)  // rose
    "career_confusion"    -> Color(red = 0.83f, green = 0.58f, blue = 0.27f)  // amber
    "exams"               -> BhaktiThemeTokens.AccentPrimary                  // brand orange
    "discipline"          -> Color(red = 0.46f, green = 0.42f, blue = 0.40f)  // stone
    else                  -> BhaktiThemeTokens.AccentPrimary
}
