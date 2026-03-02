package com.bhaktichat.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.outlined.AutoStories
import androidx.compose.material.icons.outlined.Chat
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.ui.graphics.vector.ImageVector

data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector = icon,
    val emphasize: Boolean = false
)

val bottomNavItems = listOf(
    BottomNavItem(
        route = NavDestinations.CHAT_ENTRY,
        label = "Chat",
        icon = Icons.Outlined.Chat,
        selectedIcon = Icons.Filled.Chat
    ),
    BottomNavItem(
        route = NavDestinations.CHOGHADIYA,
        label = "Choghadiya",
        icon = Icons.Outlined.Schedule,
        selectedIcon = Icons.Filled.Schedule
    ),
    BottomNavItem(
        route = NavDestinations.HOME,
        label = "Home",
        icon = Icons.Outlined.Home,
        selectedIcon = Icons.Filled.Home,
        emphasize = true
    ),
    BottomNavItem(
        route = NavDestinations.AARTIS,
        label = "Aartis",
        icon = Icons.Outlined.AutoStories,
        selectedIcon = Icons.Filled.AutoStories
    ),
    BottomNavItem(
        route = NavDestinations.PROFILE,
        label = "Profile",
        icon = Icons.Outlined.Person,
        selectedIcon = Icons.Filled.Person
    )
)
