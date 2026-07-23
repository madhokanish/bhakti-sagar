package com.bhaktichat.app.ui.navigation

import androidx.annotation.DrawableRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Home
import androidx.compose.ui.graphics.vector.ImageVector

data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector? = null,
    val selectedIcon: ImageVector? = icon,
    @DrawableRes val drawableRes: Int? = null,
    val isCenterpiece: Boolean = false
)

/**
 * The 4-tab IA (design_handoff_bhaktichat_ia): Home · Chat · Explore · History.
 * Divine Image, Aartis, Choghadiya (and future Rashifal/Kundli) live under Explore.
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
        label = "Chat",
        icon = Icons.AutoMirrored.Outlined.Chat,
        selectedIcon = Icons.AutoMirrored.Filled.Chat
    ),
    BottomNavItem(
        route = NavDestinations.EXPLORE,
        label = "Explore",
        icon = Icons.Outlined.Explore,
        selectedIcon = Icons.Filled.Explore
    ),
    BottomNavItem(
        route = NavDestinations.HISTORY,
        label = "History",
        icon = Icons.Outlined.History,
        selectedIcon = Icons.Filled.History
    )
)
