package com.bhaktichat.app.ui.components.shell
import com.bhaktichat.app.ui.i18n.t

import com.bhaktichat.app.ui.components.GuideAvatar
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.ui.navigation.BottomNavItem
import com.bhaktichat.app.ui.navigation.NavDestinations
import com.bhaktichat.app.ui.navigation.bottomNavItems
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens

@Composable
fun AppTopBar(
    title: String,
    modifier: Modifier = Modifier,
    leftContent: @Composable (() -> Unit)? = null,
    centerContent: @Composable (() -> Unit)? = null,
    rightContent: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.width(72.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            leftContent?.invoke()
        }
        Box(
            modifier = Modifier.weight(1f),
            contentAlignment = Alignment.Center
        ) {
            centerContent?.invoke() ?: Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }
        Box(
            modifier = Modifier.widthIn(min = 72.dp),
            contentAlignment = Alignment.CenterEnd
        ) {
            rightContent?.invoke()
        }
    }
}

// ProPillButton ("Get Pro" / "Try Pro free" / "PRO") removed — upgrades start from the
// चढ़ावा tab or a feature gate's quick-checkout sheet instead.

@Composable
fun SectionHeaderRow(
    title: String,
    actionLabel: String? = null,
    onActionClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(modifier = Modifier.weight(1f))
        if (!actionLabel.isNullOrBlank() && onActionClick != null) {
            Text(
                text = actionLabel,
                style = MaterialTheme.typography.labelMedium,
                color = BhaktiThemeTokens.TextSecondary,
                modifier = Modifier.clickable(onClick = onActionClick)
            )
        }
    }
}

/**
 * Compact horizontal "Life Situation" card used on the Home screen.
 *
 * Layout matches the iOS [SituationCardView] redesign:
 *   ╭──╮  Title
 *   │💰│  Guide name
 *   ╰──╯
 *
 * The card is ~76dp tall (vs the previous 132dp vertical layout), and each
 * card is tinted with a per-situation [accentColor] so the grid reads as a
 * varied set rather than a wall of identical orange chips. The accent color
 * is applied to:
 *   • the icon medallion (14% fill, full-color icon)
 *   • a subtle background gradient (top-left surface → 6% accent bottom-right)
 */
@Composable
fun SituationCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    accentColor: Color = BhaktiThemeTokens.AccentPrimary,
    // The default guide's portrait for this situation (e.g. Lakshmi Ji for "Money
    // stress"). When present, shown instead of the generic icon medallion so the
    // card reads at a glance which guide will respond.
    guideAvatarRes: Int? = null,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = modifier.heightIn(min = 76.dp),
        shape = RoundedCornerShape(16.dp),
        color = Color.Transparent,
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.surface,
                            accentColor.copy(alpha = 0.06f)
                        )
                    )
                )
                .padding(horizontal = 12.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Guide portrait when available, otherwise the icon medallion — circular,
            // tinted with the per-situation accent.
            if (guideAvatarRes != null) {
                GuideAvatar(
                    avatarRes = guideAvatarRes,
                    contentDescription = "",
                    sizeDp = 42
                )
            } else {
                Surface(
                    modifier = Modifier.size(42.dp),
                    shape = CircleShape,
                    color = accentColor.copy(alpha = 0.14f)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // Title + guide name
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                if (!subtitle.isNullOrBlank()) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.labelMedium,
                        color = BhaktiThemeTokens.TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
fun HistoryRowItem(
    title: String,
    subtitle: String,
    timeLabel: String,
    imageRes: Int?,
    fallbackLetter: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(40.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.surfaceVariant,
                border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    if (imageRes != null) {
                        Image(
                            painter = painterResource(id = imageRes),
                            contentDescription = title,
                            modifier = Modifier
                                .matchParentSize()
                                .clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Text(
                            text = fallbackLetter,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = BhaktiThemeTokens.TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = timeLabel,
                style = MaterialTheme.typography.labelSmall,
                color = BhaktiThemeTokens.TextSecondary
            )
        }
    }
}

/**
 * Static helpers and tokens for [BhaktiBottomNavBar]. Top-level `object` and `fun` with
 * the same name conflict in Kotlin's callable namespace, so we expose the constant on a
 * sibling `*Defaults` object — the same pattern Material3 uses (`SearchBar` +
 * `SearchBarDefaults`, etc.). Mirrors the iOS `BhaktiBottomNavBar.overlayClearance`
 * constant.
 *
 * [overlayClearance] is the bottom padding that scroll containers on screens sitting
 * behind the persistent bottom navigation should add so that the last row of content
 * isn't hidden behind the nav bar.
 */
object BhaktiBottomNavBarDefaults {
    val overlayClearance: androidx.compose.ui.unit.Dp = 96.dp
}

@Composable
fun BhaktiBottomNavBar(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .windowInsetsPadding(WindowInsets.navigationBars),
        color = MaterialTheme.colorScheme.background.copy(alpha = 0.98f),
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle.copy(alpha = 0.8f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 48.dp)
                .padding(horizontal = 16.dp, vertical = 6.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            bottomNavItems.forEach { item ->
                BottomNavBarItem(
                    item = item,
                    selected = isBottomNavSelected(item, currentRoute),
                    onClick = { onNavigate(item.route) }
                )
            }
        }
    }
}

@Composable
private fun RowScope.BottomNavBarItem(
    item: BottomNavItem,
    selected: Boolean,
    onClick: () -> Unit
) {
    val tint = if (selected) BhaktiThemeTokens.AccentPrimary else BhaktiThemeTokens.TextSecondary
    // Subtle spring scale on the centerpiece sparkle to mirror iOS's
    // selection feedback (see ShellComponents.swift `bottomLogoItem`).
    val iconScale by animateFloatAsState(
        targetValue = if (selected) 1.08f else 1.0f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMediumLow
        ),
        label = "bottomNavIconScale"
    )
    // Animated indicator-dot color so the transition between selected /
    // unselected feels continuous rather than snapping on/off.
    val dotColor by animateColorAsState(
        targetValue = if (selected) BhaktiThemeTokens.AccentPrimary else Color.Transparent,
        label = "bottomNavDotColor"
    )
    val label = com.bhaktichat.app.ui.i18n.t(
        when (item.route) {
            com.bhaktichat.app.ui.navigation.NavDestinations.HOME -> "nav_home"
            com.bhaktichat.app.ui.navigation.NavDestinations.BHAKTI_CHAT_BASE -> "nav_bhakti_chat"
            com.bhaktichat.app.ui.navigation.NavDestinations.REELS -> "nav_reels"
            com.bhaktichat.app.ui.navigation.NavDestinations.EXPLORE -> "nav_explore"
            com.bhaktichat.app.ui.navigation.NavDestinations.CHADHAAVA_BASE -> "nav_chadhaava"
            else -> item.label
        }
    )
    Column(
        modifier = Modifier
            .weight(1f)
            .heightIn(min = 48.dp)
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        // Icon — centerpiece sparkle gets a 26dp scaled glyph (iOS parity);
        // standard tabs use the 24dp outlined/filled pair.
        if (item.drawableRes != null) {
            // Tabs whose glyph is a drawn vector rather than a Material icon (चढ़ावा's diya).
            Icon(
                painter = androidx.compose.ui.res.painterResource(item.drawableRes),
                contentDescription = label,
                tint = tint,
                modifier = Modifier.size(24.dp)
            )
        } else if (item.isCenterpiece) {
            Icon(
                imageVector = item.selectedIcon ?: item.icon!!,
                contentDescription = label,
                tint = tint,
                modifier = Modifier
                    .size(26.dp)
                    .scale(iconScale)
            )
        } else {
            Icon(
                imageVector = if (selected) item.selectedIcon ?: item.icon!! else item.icon!!,
                contentDescription = label,
                tint = tint,
                modifier = Modifier.size(24.dp)
            )
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = tint,
            maxLines = 1
        )
        // Selected-tab indicator dot (iOS parity — ShellComponents.swift L342-344).
        Box(
            modifier = Modifier
                .size(4.dp)
                .clip(CircleShape)
                .background(dotColor)
        )
    }
}

private fun isBottomNavSelected(item: BottomNavItem, currentRoute: String): Boolean {
    return when (item.route) {
        NavDestinations.HOME -> currentRoute.startsWith(NavDestinations.HOME)
        NavDestinations.BHAKTI_CHAT_BASE -> {
            currentRoute.startsWith(NavDestinations.BHAKTI_CHAT_ROUTE_PREFIX) ||
                currentRoute.startsWith("thread/")
        }
        // Explore is the hub for everything ancillary — Aartis, Choghadiya, Festivals,
        // Panchang, Wallpapers and the Divine Image flow all select the Explore tab.
        NavDestinations.EXPLORE -> {
            currentRoute == NavDestinations.EXPLORE ||
                currentRoute == NavDestinations.AARTIS ||
                currentRoute.startsWith("aarti/") ||
                currentRoute == NavDestinations.CHOGHADIYA ||
                currentRoute == NavDestinations.FESTIVALS ||
                currentRoute == NavDestinations.PANCHANG ||
                currentRoute == NavDestinations.WALLPAPERS ||
                currentRoute.startsWith("wallpaper/") ||
                currentRoute.startsWith(NavDestinations.DIVINE_IMAGE_ROUTE_PREFIX)
        }
        else -> currentRoute.startsWith(item.route)
    }
}
