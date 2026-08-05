package com.bhaktichat.app.ui.navigation

import androidx.annotation.DrawableRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.SmartDisplay
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.SmartDisplay
import androidx.compose.ui.graphics.vector.ImageVector
import com.bhaktichat.app.R

data class BottomNavItem(
    val route: String,
    /** Fallback only — the nav bar resolves each route's label through the translation
     *  table (see BhaktiBottomNavBar). Never rendered while every route has a key. */
    val label: String,
    val icon: ImageVector? = null,
    val selectedIcon: ImageVector? = icon,
    @DrawableRes val drawableRes: Int? = null,
    val isCenterpiece: Boolean = false
)

/**
 * BhaktiChat 2.0's 4-tab IA: Home · BhaktiChat · Reels · Explore. History's conversation
 * list is absorbed into the BhaktiChat tab (its own tab slot is retired); Reels takes the
 * freed slot. Divine Image, Aartis, Choghadiya (and future Rashifal/Kundli) live under Explore.
 */
val bottomNavItems = listOf(
    BottomNavItem(
        route = NavDestinations.HOME,
        label = "Home",
        icon = Icons.Outlined.Home,
        selectedIcon = Icons.Filled.Home
    ),
    BottomNavItem(
        route = NavDestinations.BHAKTI_CHAT_BASE,
        label = "BhaktiChat",
        icon = Icons.AutoMirrored.Outlined.Chat,
        selectedIcon = Icons.AutoMirrored.Filled.Chat
    ),
    BottomNavItem(
        route = NavDestinations.REELS,
        label = "Reels",
        icon = Icons.Outlined.SmartDisplay,
        selectedIcon = Icons.Filled.SmartDisplay
    ),
    BottomNavItem(
        route = NavDestinations.EXPLORE,
        label = "Explore",
        icon = Icons.Outlined.Explore,
        selectedIcon = Icons.Filled.Explore
    ),
    BottomNavItem(
        route = NavDestinations.CHADHAAVA_BASE,
        label = "Chadhava",
        // A drawn diya rather than a Material glyph — see ic_diya.xml.
        drawableRes = R.drawable.ic_diya
    )
)
