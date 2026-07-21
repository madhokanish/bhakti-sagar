package com.bhaktichat.app.ui.screens.discovery

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.Image
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.HorizontalDivider
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
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
    userName: String = "",
    isPro: Boolean = false,
    streak: Int = 0,
    longestStreak: Int = 0,
    isStreakBannerDismissed: Boolean = false,
    onDismissStreakBanner: () -> Unit = {},
    onOpenStreak: () -> Unit = {}
) {
    LazyColumn(
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
            // Explore/History/Bhakti Chat now (was previously a bespoke logo+wordmark
            // treatment unique to this screen; standardized per product review).
            AppTopBar(
                title = "Home",
                leftContent = {
                    IconButton(onClick = onOpenProfile) {
                        Icon(
                            imageVector = Icons.Outlined.Person,
                            contentDescription = "Profile",
                            tint = StreakDeepAccent
                        )
                    }
                }
            )
        }

        item("greeting") {
            val display = userName.trim().takeIf { it.isNotBlank() }?.substringBefore(" ")
            Text(
                text = buildAnnotatedString {
                    append("Namaste")
                    if (display != null) {
                        append(", ")
                        withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = StreakTextPrimary)) {
                            append(display)
                        }
                    }
                    append(" 🙏")
                },
                fontSize = 15.sp,
                color = Color(0xFF8A6F5C)
            )
        }

        if (streak > 0 && !isStreakBannerDismissed) {
            item("streak") {
                DarshanStreakHeroCard(
                    streak = streak,
                    longestStreak = longestStreak,
                    onDismiss = onDismissStreakBanner
                )
            }
        }

        item("guides-header") {
            SectionHeaderRow(
                title = "AI Spiritual Guides",
                actionLabel = "See all >",
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
            SectionHeaderRow(title = "Life Situations")
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
                                SituationCard(
                                    title = situation.title,
                                    icon = situation.icon,
                                    subtitle = guide?.displayName?.let { "Ask $it" }.orEmpty(),
                                    modifier = Modifier.width(cardWidth),
                                    accentColor = situationAccentColor(situation.id),
                                    guideAvatarRes = guide?.avatarRes,
                                    onClick = {
                                        onStartGuidedThread(
                                            situation.defaultGuideId,
                                            situation.prompt,
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

        item("today-widget") {
            TodayWidget(
                onOpenMuhurat = onOpenChoghadiya,
                onOpenAarti = onOpenAartis
            )
        }

        item("darshan-promo") {
            CreateDarshanPromoCard(onClick = onOpenDivineImage)
        }
    }
}

@Composable
private fun TodayWidget(onOpenMuhurat: () -> Unit, onOpenAarti: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = Color.White,
        border = BorderStroke(1.dp, StreakCardBorder),
        shadowElevation = 2.dp
    ) {
        Column {
            TodayRow(
                icon = Icons.Filled.WbSunny,
                iconTint = Color(0xFFD97706),
                title = "Best Muhurat now",
                value = "Amrit · 10:30 AM – 12:00 PM",
                onClick = onOpenMuhurat
            )
            HorizontalDivider(color = StreakCardBorder)
            TodayRow(
                icon = Icons.Filled.MusicNote,
                iconTint = Color(0xFFDC2626),
                title = "Aarti of the day",
                value = "Om Jai Jagdish Hare",
                onClick = onOpenAarti
            )
        }
    }
}

@Composable
private fun TodayRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    title: String,
    value: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(11.dp))
                .background(iconTint.copy(alpha = 0.14f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = iconTint, modifier = Modifier.size(20.dp))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, fontSize = 13.5.sp, fontWeight = FontWeight.SemiBold, color = StreakTextPrimary)
            Text(value, fontSize = 12.5.sp, color = Color(0xFF8A6F5C))
        }
        Icon(Icons.Filled.ChevronRight, null, tint = Color(0xFFBDA491), modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun CreateDarshanPromoCard(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(
                Brush.linearGradient(
                    listOf(Color(0xFF7C2D12), Color(0xFFC2410C), Color(0xFFEA580C))
                )
            )
            .clickable(onClick = onClick)
            .padding(18.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                Icon(Icons.Filled.AutoAwesome, null, tint = Color(0xFFFFE7C6), modifier = Modifier.size(14.dp))
                Text("DIVINE IMAGE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFFE7C6), letterSpacing = 1.sp)
            }
            Text("Create your darshan", fontSize = 19.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            Text("Turn your photo into a sacred moment with your deity.", fontSize = 13.sp, color = Color.White.copy(alpha = 0.9f))
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White)
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text("Try it now", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFFC2410C))
                Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = Color(0xFFC2410C), modifier = Modifier.size(15.dp))
            }
        }
    }
}

// ── Daily-darshan streak row (design "2a") ──────────────────────────────────
private val StreakCardBorder = Color(0x29F97316)     // rgba(249,115,22,0.16)
private val StreakDeepAccent = Color(0xFFC2410C)
private val StreakNumber = Color(0xFFEA580C)
private val StreakTextPrimary = Color(0xFF2A1C15)
private val EmblemStart = Color(0xFFFFE7C6)
private val EmblemEnd = Color(0xFFFBBF7A)

private enum class DayState { OFF, LIT, TODAY }

/**
 * 7 slots, filled from the start: lit dots accumulate left→right as the streak grows, with
 * today as the last lit dot and empty slots trailing to the right. (Previously filled from the
 * end, which read as "streak trailing off" rather than "streak building up" — unintuitive per
 * product review.)
 */
private fun weekStates(streak: Int): List<DayState> {
    val litCount = streak.coerceIn(0, 7)
    return (0 until 7).map { index ->
        when {
            index == litCount - 1 -> DayState.TODAY
            index < litCount - 1 -> DayState.LIT
            else -> DayState.OFF
        }
    }
}

/** Big hero streak card (design_handoff_bhaktichat_ia · Home). */
@Composable
private fun DarshanStreakHeroCard(streak: Int, longestStreak: Int, onDismiss: () -> Unit = {}) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.linearGradient(listOf(EmblemStart, EmblemEnd)))
            .padding(18.dp)
    ) {
        // Dismiss — hides the banner for the rest of today only (see StreakStore.dismissBannerForToday).
        IconButton(
            onClick = onDismiss,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(28.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.Close,
                contentDescription = "Dismiss for today",
                tint = StreakDeepAccent,
                modifier = Modifier.size(18.dp)
            )
        }
        // Translucent flame emblem, top-right (inset from the dismiss button above it).
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 36.dp)
                .size(56.dp)
                .background(Color.White.copy(alpha = 0.4f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.LocalFireDepartment,
                contentDescription = null,
                tint = StreakDeepAccent,
                modifier = Modifier.size(28.dp)
            )
        }
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = "DAILY DARSHAN",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFB45309),
                letterSpacing = 1.sp
            )
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = streak.toString(),
                    fontSize = 42.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = StreakNumber
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "day darshan streak",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF7C3E12),
                    modifier = Modifier.padding(bottom = 7.dp)
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                weekStates(streak).forEach { HeroDot(it) }
            }
            Text(
                text = "Longest streak · $longestStreak days",
                fontSize = 12.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF92400E)
            )
        }
    }
}

@Composable
private fun HeroDot(state: DayState) {
    val lit = state != DayState.OFF
    Box(
        modifier = Modifier
            .size(24.dp)
            .then(
                if (lit) {
                    Modifier.background(StreakNumber, CircleShape)
                } else {
                    Modifier
                        .background(Color.White.copy(alpha = 0.55f), CircleShape)
                        .border(1.dp, Color(0x40B45309), CircleShape)
                }
            )
    )
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
                    contentDescription = guide.title,
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
            text = guide.title,
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
