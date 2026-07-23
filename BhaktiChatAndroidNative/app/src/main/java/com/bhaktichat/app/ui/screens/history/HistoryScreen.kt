package com.bhaktichat.app.ui.screens.history

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.bhaktichat.app.R
import com.bhaktichat.app.domain.CreationStatus
import com.bhaktichat.app.domain.Deity
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults
import com.bhaktichat.app.ui.components.shell.HistoryRowItem
import com.bhaktichat.app.ui.screens.divineimage.UriPreviewImage
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import com.bhaktichat.app.util.BookmarkStore

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun HistoryRoute(
    factory: HistoryViewModelFactory,
    bookmarkStore: BookmarkStore,
    onOpenProfile: () -> Unit,
    onOpenThread: (String) -> Unit,
    onOpenCreation: (String) -> Unit
) {
    val vm: HistoryViewModel = viewModel(factory = factory)
    val uiState = vm.uiState.collectAsStateWithLifecycle().value
    var showClearAllConfirmation by rememberSaveable { mutableStateOf(false) }

    val filteredItems = remember(uiState.items, uiState.query) {
        if (uiState.query.isBlank()) uiState.items
        else uiState.items.filter {
            it.guideName.contains(uiState.query, ignoreCase = true) ||
                it.preview.contains(uiState.query, ignoreCase = true)
        }
    }

    val filteredCreationItems = remember(uiState.creationItems, uiState.query) {
        if (uiState.query.isBlank()) uiState.creationItems
        else uiState.creationItems.filter {
            it.title.contains(uiState.query, ignoreCase = true) ||
                it.subtitle.contains(uiState.query, ignoreCase = true)
        }
    }

    val filteredSavedMessages = remember(uiState.savedMessages, uiState.query) {
        if (uiState.query.isBlank()) uiState.savedMessages
        else uiState.savedMessages.filter {
            it.guideName.contains(uiState.query, ignoreCase = true) ||
                it.preview.contains(uiState.query, ignoreCase = true)
        }
    }

    val filteredSavedAartis = remember(uiState.savedAartis, uiState.query) {
        if (uiState.query.isBlank()) uiState.savedAartis
        else uiState.savedAartis.filter {
            it.title.contains(uiState.query, ignoreCase = true) ||
                it.subtitle.contains(uiState.query, ignoreCase = true)
        }
    }

    val currentTabHasContent = when (uiState.selectedTab) {
        HistoryTab.CHATS -> uiState.items.isNotEmpty()
        HistoryTab.CREATIONS -> uiState.creationItems.isNotEmpty()
        HistoryTab.SAVED -> false
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 16.dp,
            end = 16.dp,
            top = 12.dp,
            bottom = BhaktiBottomNavBarDefaults.overlayClearance + 8.dp
        ),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item("topbar") {
            AppTopBar(
                title = "History",
                leftContent = {
                    IconButton(onClick = onOpenProfile) {
                        Icon(
                            imageVector = Icons.Outlined.Person,
                            contentDescription = "Profile"
                        )
                    }
                },
                rightContent = {
                    if (currentTabHasContent) {
                        TextButton(onClick = { showClearAllConfirmation = true }) {
                            Text(
                                text = "Clear all",
                                style = MaterialTheme.typography.labelLarge,
                                color = BhaktiThemeTokens.AccentError
                            )
                        }
                    }
                }
            )
        }

        item("history_ad") {
            com.bhaktichat.app.ui.components.ads.BannerAd(placement = "history_list")
        }

        item("history_tabs") {
            HistoryTabs(
                selectedTab = uiState.selectedTab,
                onSelectTab = vm::selectTab
            )
        }

        item("search_bar") {
            OutlinedTextField(
                value = uiState.query,
                onValueChange = vm::onQueryChanged,
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text(
                        text = "Search…",
                        style = MaterialTheme.typography.bodyMedium,
                        color = BhaktiThemeTokens.TextSecondary
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Outlined.Search,
                        contentDescription = "Search",
                        tint = BhaktiThemeTokens.TextSecondary
                    )
                },
                singleLine = true,
                shape = RoundedCornerShape(14.dp)
            )
        }

        if (uiState.isLoading) {
            items(3, key = { "skeleton_$it" }) {
                HistorySkeletonItem()
            }
        } else {
            when (uiState.selectedTab) {
                HistoryTab.CHATS -> {
                    if (filteredItems.isEmpty()) {
                        item("empty_chats") {
                            Text(
                                text = if (uiState.query.isBlank())
                                    "No conversations yet. Start with Home or Bhakti Chat."
                                else
                                    "No chats match your search.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        item("header-all") {
                            Text(
                                text = "All chats",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onBackground,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                        items(
                            items = filteredItems,
                            key = { it.threadId }
                        ) { historyItem ->
                            val dismissState = rememberSwipeToDismissBoxState(
                                confirmValueChange = { value ->
                                    if (value == SwipeToDismissBoxValue.EndToStart) {
                                        vm.deleteThread(historyItem.threadId)
                                        true
                                    } else {
                                        false
                                    }
                                }
                            )
                            SwipeToDismissBox(
                                state = dismissState,
                                enableDismissFromStartToEnd = false,
                                enableDismissFromEndToStart = true,
                                backgroundContent = {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(
                                                color = Color(0xFFD32F2F),
                                                shape = RoundedCornerShape(14.dp)
                                            )
                                            .padding(end = 20.dp),
                                        contentAlignment = Alignment.CenterEnd
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Delete,
                                            contentDescription = "Delete",
                                            tint = Color.White
                                        )
                                    }
                                }
                            ) {
                                HistoryRowItem(
                                    title = historyItem.guideName,
                                    subtitle = historyItem.preview,
                                    timeLabel = historyItem.timeLabel,
                                    imageRes = historyItem.avatarRes,
                                    fallbackLetter = historyItem.guideName.take(1),
                                    onClick = { onOpenThread(historyItem.threadId) }
                                )
                            }
                        }
                    }
                }

                HistoryTab.SAVED -> {
                    val nothingSaved = filteredSavedMessages.isEmpty() && filteredSavedAartis.isEmpty()
                    if (nothingSaved) {
                        item("empty_saved") {
                            Text(
                                text = if (uiState.query.isBlank())
                                    "Nothing saved yet. Bookmark a message or aarti to find it here."
                                else
                                    "No saved items match your search.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        if (filteredSavedMessages.isNotEmpty()) {
                            item("header-saved-msgs") {
                                Text(
                                    text = "Saved messages",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                            }
                            items(
                                items = filteredSavedMessages,
                                key = { "saved_msg_${it.messageId}" }
                            ) { saved ->
                                SavedMessageRow(
                                    item = saved,
                                    onClick = { onOpenThread(saved.threadId) },
                                    onRemoveBookmark = { bookmarkStore.toggleMessage(saved.messageId) }
                                )
                            }
                        }
                        if (filteredSavedAartis.isNotEmpty()) {
                            item("header-saved-aartis") {
                                Text(
                                    text = "Saved aartis",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                            }
                            items(
                                items = filteredSavedAartis,
                                key = { "saved_aarti_${it.aartiId}" }
                            ) { savedAarti ->
                                SavedAartiRow(
                                    item = savedAarti,
                                    onRemoveBookmark = { bookmarkStore.toggleAarti(savedAarti.aartiId) }
                                )
                            }
                        }
                    }
                }

                HistoryTab.CREATIONS -> {
                    if (filteredCreationItems.isEmpty()) {
                        item("empty_creations") {
                            Text(
                                text = if (uiState.query.isBlank())
                                    "No divine creations yet. Open Divine Image to generate one."
                                else
                                    "No creations match your search.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        item("header-creations") {
                            Text(
                                text = "Your creations",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onBackground,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                        items(
                            items = filteredCreationItems,
                            key = { it.creationId }
                        ) { creationItem ->
                            val dismissState = rememberSwipeToDismissBoxState(
                                confirmValueChange = { value ->
                                    if (value == SwipeToDismissBoxValue.EndToStart) {
                                        vm.deleteCreation(creationItem.creationId)
                                        true
                                    } else {
                                        false
                                    }
                                }
                            )
                            SwipeToDismissBox(
                                state = dismissState,
                                enableDismissFromStartToEnd = false,
                                enableDismissFromEndToStart = true,
                                backgroundContent = {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(
                                                color = Color(0xFFD32F2F),
                                                shape = RoundedCornerShape(14.dp)
                                            )
                                            .padding(end = 20.dp),
                                        contentAlignment = Alignment.CenterEnd
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Delete,
                                            contentDescription = "Delete",
                                            tint = Color.White
                                        )
                                    }
                                }
                            ) {
                                CreationHistoryRowItem(
                                    item = creationItem,
                                    onClick = { onOpenCreation(creationItem.creationId) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showClearAllConfirmation) {
        val (dialogTitle, _) = when (uiState.selectedTab) {
            HistoryTab.CREATIONS -> "Clear all creations?" to "creations"
            else -> "Clear all chats?" to "chats"
        }
        AlertDialog(
            onDismissRequest = { showClearAllConfirmation = false },
            title = { Text(text = dialogTitle) },
            text = { Text(text = "This cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        when (uiState.selectedTab) {
                            HistoryTab.CREATIONS -> vm.deleteAllDivineCreations()
                            else -> vm.deleteAllThreads()
                        }
                        showClearAllConfirmation = false
                    }
                ) {
                    Text(text = "Clear all", color = BhaktiThemeTokens.AccentError)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearAllConfirmation = false }) {
                    Text(text = "Cancel")
                }
            }
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun SavedMessageRow(
    item: SavedMessageItem,
    onClick: () -> Unit,
    onRemoveBookmark: () -> Unit
) {
    var menuOpen by remember { mutableStateOf(false) }
    Box {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .combinedClickable(
                    onClick = onClick,
                    onLongClick = { menuOpen = true }
                ),
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
                    Box(contentAlignment = Alignment.CenterStart) {
                        Image(
                            painter = painterResource(id = item.avatarRes),
                            contentDescription = item.guideName,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = item.guideName,
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = item.preview,
                        style = MaterialTheme.typography.bodySmall,
                        color = BhaktiThemeTokens.TextSecondary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = item.timeLabel,
                    style = MaterialTheme.typography.labelSmall,
                    color = BhaktiThemeTokens.TextSecondary
                )
            }
        }
        DropdownMenu(
            expanded = menuOpen,
            onDismissRequest = { menuOpen = false }
        ) {
            DropdownMenuItem(
                text = { Text("Remove bookmark") },
                onClick = {
                    menuOpen = false
                    onRemoveBookmark()
                }
            )
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun SavedAartiRow(
    item: SavedAartiItem,
    onRemoveBookmark: () -> Unit
) {
    var menuOpen by remember { mutableStateOf(false) }
    val thumbnailRes = aartiThumbnailRes(item.deity)
    Box {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .combinedClickable(
                    onClick = { /* Detail navigation not wired in route */ },
                    onLongClick = { menuOpen = true }
                ),
            shape = RoundedCornerShape(14.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Image(
                    painter = painterResource(id = thumbnailRes),
                    contentDescription = "${item.title} icon",
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = item.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = BhaktiThemeTokens.TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
        DropdownMenu(
            expanded = menuOpen,
            onDismissRequest = { menuOpen = false }
        ) {
            DropdownMenuItem(
                text = { Text("Remove bookmark") },
                onClick = {
                    menuOpen = false
                    onRemoveBookmark()
                }
            )
        }
    }
}

internal fun aartiThumbnailRes(deity: Deity): Int = when (deity) {
    Deity.GANESH -> R.drawable.ic_ganesh_top_aarti
    Deity.SHIV -> R.drawable.ic_shiv_top_aarti
    Deity.LAKSHMI -> R.drawable.ic_lakshmi_top_aarti
    else -> R.drawable.ic_default_aarti
}

@Composable
private fun HistorySkeletonItem() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar placeholder
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(10.dp)
                    )
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Title placeholder
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.45f)
                        .height(12.dp)
                        .background(
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(6.dp)
                        )
                )
                // Subtitle placeholder
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.75f)
                        .height(10.dp)
                        .background(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                            shape = RoundedCornerShape(6.dp)
                        )
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            // Time label placeholder
            Box(
                modifier = Modifier
                    .width(36.dp)
                    .height(10.dp)
                    .background(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(6.dp)
                    )
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HistoryTabs(
    selectedTab: HistoryTab,
    onSelectTab: (HistoryTab) -> Unit
) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            HistoryTab.entries.forEach { tab ->
                val selected = tab == selectedTab
                val tabLabel = when (tab) {
                    HistoryTab.CHATS -> "All chats"
                    HistoryTab.CREATIONS -> "Your creations"
                    HistoryTab.SAVED -> "Saved"
                }
                Surface(
                    onClick = { onSelectTab(tab) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    color = if (selected) BhaktiThemeTokens.AccentPrimary.copy(alpha = 0.18f) else Color.Transparent
                ) {
                    Box(
                        modifier = Modifier.padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tabLabel,
                            style = MaterialTheme.typography.labelLarge,
                            color = if (selected) BhaktiThemeTokens.AccentPrimary else BhaktiThemeTokens.TextSecondary,
                            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreationHistoryRowItem(
    item: HistoryCreationItem,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
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
                modifier = Modifier.size(44.dp),
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
            ) {
                if (!item.previewUri.isNullOrBlank()) {
                    UriPreviewImage(
                        uriString = item.previewUri,
                        contentDescription = item.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop,
                        decodeMaxPx = 160
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(MaterialTheme.colorScheme.surfaceVariant),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = item.status.shortLabel(),
                            style = MaterialTheme.typography.labelSmall,
                            color = BhaktiThemeTokens.TextSecondary
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.size(12.dp))
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = item.subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = BhaktiThemeTokens.TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.size(12.dp))
            Text(
                text = item.timeLabel,
                style = MaterialTheme.typography.labelSmall,
                color = BhaktiThemeTokens.TextSecondary
            )
        }
    }
}

private fun CreationStatus.shortLabel(): String = when (this) {
    CreationStatus.GENERATING -> "..."
    CreationStatus.FAILED -> "!"
    else -> "✓"
}
