package com.bhaktichat.app.ui.screens.history

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
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
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.bhaktichat.app.R
import com.bhaktichat.app.domain.CreationStatus
import com.bhaktichat.app.domain.Deity
import com.bhaktichat.app.ui.components.GuideAvatar
import com.bhaktichat.app.ui.i18n.t
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults
import com.bhaktichat.app.ui.components.shell.HistoryRowItem
import com.bhaktichat.app.ui.navigation.DiscoveryGuideConfig
import com.bhaktichat.app.ui.navigation.discoveryGuideCatalog
import com.bhaktichat.app.ui.screens.divineimage.UriPreviewImage
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import com.bhaktichat.app.util.BookmarkStore
import com.bhaktichat.app.util.SpeechInputManager

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun HistoryRoute(
    factory: HistoryViewModelFactory,
    bookmarkStore: BookmarkStore,
    onOpenProfile: () -> Unit,
    onOpenThread: (String) -> Unit,
    onOpenCreation: (String) -> Unit,
    onStartFreshChat: (String) -> Unit,
    onSendPrompt: (guideId: String, prompt: String) -> Unit
) {
    val vm: HistoryViewModel = viewModel(factory = factory)
    val uiState = vm.uiState.collectAsStateWithLifecycle().value
    var showClearAllConfirmation by rememberSaveable { mutableStateOf(false) }

    // Tracks which guide the pinned composer sends to — updated whenever the user taps a
    // guide head in "Start a new chat" below. Scoped to this screen only, since (unlike iOS's
    // app-wide `selectedGuideId`) nothing else on Android currently needs to read it.
    var selectedGuideId by rememberSaveable {
        mutableStateOf(discoveryGuideCatalog.firstOrNull()?.id.orEmpty())
    }
    val selectedGuide = remember(selectedGuideId) {
        discoveryGuideCatalog.firstOrNull { it.id == selectedGuideId }
    }
    var composerText by rememberSaveable { mutableStateOf("") }

    val context = LocalContext.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val haptics = LocalHapticFeedback.current
    val speechManager = remember(context) { SpeechInputManager(
            context,
            (context.applicationContext as com.bhaktichat.app.BhaktiChatApplication).container.languageStore
        ) }
    val voiceState by speechManager.state.collectAsState()
    var lastTranscript by remember { mutableStateOf("") }
    val applyTranscriptDelta: (String) -> Unit = { newTranscript ->
        if (newTranscript.isNotEmpty() && newTranscript != lastTranscript) {
            val delta = if (newTranscript.startsWith(lastTranscript)) {
                newTranscript.substring(lastTranscript.length)
            } else {
                newTranscript
            }
            if (delta.isNotEmpty()) composerText += delta
            lastTranscript = newTranscript
        }
    }
    val microphonePermissionDeniedText = t("microphone_permission_denied")
    val recordAudioLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            speechManager.start { transcript -> applyTranscriptDelta(transcript) }
        } else {
            Toast.makeText(context, microphonePermissionDeniedText, Toast.LENGTH_SHORT).show()
        }
    }
    LaunchedEffect(voiceState.isRecording) {
        if (!voiceState.isRecording) lastTranscript = ""
    }
    LaunchedEffect(voiceState.error) {
        voiceState.error?.let { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() }
    }
    DisposableEffect(speechManager) {
        onDispose { speechManager.release() }
    }

    fun sendComposerPrompt() {
        val text = composerText.trim()
        if (text.isEmpty() || selectedGuideId.isEmpty()) return
        composerText = ""
        keyboardController?.hide()
        if (voiceState.isRecording) speechManager.stop()
        onSendPrompt(selectedGuideId, text)
    }

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

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        contentWindowInsets = WindowInsets(0),
        bottomBar = {
            ChatComposer(
                guideName = selectedGuide?.let { t("guide_title_${it.id}") } ?: t("your_guide"),
                text = composerText,
                onTextChange = { composerText = it },
                isRecording = voiceState.isRecording,
                onToggleMic = {
                    if (voiceState.isRecording) {
                        speechManager.stop()
                    } else {
                        val granted = ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.RECORD_AUDIO
                        ) == PackageManager.PERMISSION_GRANTED
                        if (granted) {
                            speechManager.start { transcript -> applyTranscriptDelta(transcript) }
                        } else {
                            recordAudioLauncher.launch(Manifest.permission.RECORD_AUDIO)
                        }
                    }
                },
                onSend = {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    sendComposerPrompt()
                }
            )
        }
    ) { innerPadding ->
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding),
        contentPadding = PaddingValues(
            start = 16.dp,
            end = 16.dp,
            top = 12.dp,
            bottom = 8.dp
        ),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item("topbar") {
            AppTopBar(
                title = t("bhakti_chat_title"),
                leftContent = {
                    IconButton(onClick = onOpenProfile) {
                        Icon(
                            imageVector = Icons.Outlined.Person,
                            contentDescription = t("profile_content_description")
                        )
                    }
                },
                rightContent = {
                    if (currentTabHasContent) {
                        TextButton(onClick = { showClearAllConfirmation = true }) {
                            Text(
                                text = t("clear_all"),
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

        item("start_new_chat_row") {
            StartNewChatRow(
                guides = discoveryGuideCatalog,
                selectedGuideId = selectedGuideId,
                onSelect = { guide ->
                    selectedGuideId = guide.id
                    onStartFreshChat(guide.id)
                }
            )
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
                        text = t("search"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = BhaktiThemeTokens.TextSecondary
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Outlined.Search,
                        contentDescription = t("search"),
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
                                    t("no_conversations_yet")
                                else
                                    t("no_chats_match_search"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        item("header-all") {
                            Text(
                                text = t("all_chats"),
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
                                            contentDescription = t("delete"),
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
                                    t("nothing_saved_yet")
                                else
                                    t("no_saved_match_search"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        if (filteredSavedMessages.isNotEmpty()) {
                            item("header-saved-msgs") {
                                Text(
                                    text = t("saved_messages"),
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
                                    text = t("saved_aartis"),
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
                                    t("no_divine_creations_yet")
                                else
                                    t("no_creations_match_search"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        item("header-creations") {
                            Text(
                                text = t("your_creations_header"),
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
                                            contentDescription = t("delete"),
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
    }

    if (showClearAllConfirmation) {
        val dialogTitle = when (uiState.selectedTab) {
            HistoryTab.CREATIONS -> t("clear_all_creations_confirm")
            else -> t("clear_all_chats_confirm")
        }
        AlertDialog(
            onDismissRequest = { showClearAllConfirmation = false },
            title = { Text(text = dialogTitle) },
            text = { Text(text = t("cannot_be_undone")) },
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
                    Text(text = t("clear_all"), color = BhaktiThemeTokens.AccentError)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearAllConfirmation = false }) {
                    Text(text = t("cancel"))
                }
            }
        )
    }
}

/** Floating guide heads, ahead of the conversation list — tapping one opens a clean, fresh
 * chat with that guide immediately (mirrors iOS's `startNewChatRow`) and redirects the
 * pinned composer below to that guide until another one is tapped. */
@Composable
private fun StartNewChatRow(
    guides: List<DiscoveryGuideConfig>,
    selectedGuideId: String,
    onSelect: (DiscoveryGuideConfig) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            text = t("start_a_new_chat"),
            style = MaterialTheme.typography.labelMedium,
            color = BhaktiThemeTokens.TextSecondary,
            fontWeight = FontWeight.SemiBold
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(end = 16.dp)
        ) {
            items(guides, key = { it.id }) { guide ->
                val guideTitle = t("guide_title_${guide.id}")
                Column(
                    modifier = Modifier.width(72.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        onClick = { onSelect(guide) },
                        modifier = Modifier.size(58.dp),
                        shape = CircleShape,
                        color = Color.Transparent,
                        border = BorderStroke(
                            width = if (guide.id == selectedGuideId) 2.dp else 1.dp,
                            color = if (guide.id == selectedGuideId) {
                                BhaktiThemeTokens.AccentPrimary
                            } else {
                                BhaktiThemeTokens.BorderSubtle.copy(alpha = 0.45f)
                            }
                        )
                    ) {
                        if (guide.imageRes != null) {
                            GuideAvatar(
                                avatarRes = guide.imageRes,
                                contentDescription = guideTitle,
                                sizeDp = 58
                            )
                        } else {
                            Box(contentAlignment = Alignment.Center) {
                                Text(text = t(guide.fallbackLetterKey), style = MaterialTheme.typography.titleMedium)
                            }
                        }
                    }
                    Text(
                        text = guideTitle,
                        style = MaterialTheme.typography.labelSmall,
                        color = BhaktiThemeTokens.TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

/** Pinned bottom composer — a quick way to message [guideName] without opening the guide row.
 * Mirrors iOS's `BhaktiChatScreen.composer` (text field + mic toggle + send). */
@Composable
private fun ChatComposer(
    guideName: String,
    text: String,
    onTextChange: (String) -> Unit,
    isRecording: Boolean,
    onToggleMic: () -> Unit,
    onSend: () -> Unit
) {
    Surface(
        color = MaterialTheme.colorScheme.background,
        tonalElevation = 0.dp,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .imePadding()
                .padding(start = 12.dp, end = 12.dp, top = 8.dp, bottom = 8.dp),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            TextField(
                value = text,
                onValueChange = onTextChange,
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text(t("ask_guide_anything").format(guideName), color = BhaktiThemeTokens.TextTertiary)
                },
                minLines = 1,
                maxLines = 4,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = { if (text.isNotBlank()) onSend() }),
                shape = RoundedCornerShape(18.dp),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent
                )
            )
            Surface(
                onClick = onToggleMic,
                modifier = Modifier.size(46.dp),
                shape = CircleShape,
                color = if (isRecording) BhaktiThemeTokens.AccentError else MaterialTheme.colorScheme.surface,
                border = if (isRecording) null else BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = if (isRecording) Icons.Filled.MicOff else Icons.Filled.Mic,
                        contentDescription = if (isRecording) t("stop_voice_input") else t("start_voice_input"),
                        tint = if (isRecording) Color.White else BhaktiThemeTokens.TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            Surface(
                onClick = onSend,
                modifier = Modifier
                    .size(46.dp)
                    .alpha(if (text.isNotBlank()) 1f else 0.38f),
                shape = CircleShape,
                color = BhaktiThemeTokens.AccentPrimary
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = t("send"),
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
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
                text = { Text(t("remove_bookmark")) },
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
                    contentDescription = "${item.title} का चिह्न",
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
                text = { Text(t("remove_bookmark")) },
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
                    HistoryTab.CHATS -> t("all_chats")
                    HistoryTab.CREATIONS -> t("your_creations")
                    HistoryTab.SAVED -> t("saved")
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
