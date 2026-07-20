package com.bhaktichat.app.ui.screens.bhaktichat

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Balance
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Loop
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.QuestionAnswer
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.bhaktichat.app.ui.components.GuideAvatar
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import com.bhaktichat.app.util.SpeechInputManager
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// MARK: - Helpers

/** Relative timestamp for the "Continue your chats" row. */
private fun relativeTime(date: Date): String {
    val secs = (System.currentTimeMillis() - date.time) / 1000L
    return when {
        secs < 60         -> "just now"
        secs < 3600       -> "${secs / 60}m ago"
        secs < 86_400     -> "${secs / 3600}h ago"
        secs < 2 * 86_400 -> "yesterday"
        secs < 7 * 86_400 -> "${secs / 86_400}d ago"
        else              -> SimpleDateFormat("d MMM", Locale.getDefault()).format(date)
    }
}

/**
 * Maps a prompt's keywords to a Material icon so each chip card has a unique
 * micro-icon — adds visual variety without color-coding.
 * Mirrors iOS BhaktiChatHubScreen.promptIcon(for:).
 */
private fun promptIcon(prompt: String): ImageVector {
    val p = prompt.lowercase()
    return when {
        listOf("money", "save", "financial", "career").any { p.contains(it) }    -> Icons.Filled.AccountBalanceWallet
        listOf("fear", "protect").any { p.contains(it) }                          -> Icons.Filled.Shield
        p.contains("courage")                                                     -> Icons.Filled.LocalFireDepartment
        listOf("discipline", "consistent").any { p.contains(it) }                 -> Icons.Filled.Balance
        listOf("calm", "peace", "still", "detach", "ease").any { p.contains(it) } -> Icons.Outlined.Spa
        listOf("dharma", "gita", "verse", "mahabharata", "story").any { p.contains(it) } -> Icons.Filled.MenuBook
        listOf("karma", "lesson").any { p.contains(it) }                          -> Icons.Filled.Loop
        p.contains("bless")                                                       -> Icons.Filled.AutoAwesome
        p.contains("confusion")                                                   -> Icons.Outlined.QuestionAnswer
        else                                                                      -> Icons.Filled.AutoAwesome
    }
}

@Composable
fun BhaktiChatHubScreen(
    uiState: BhaktiChatHubUiState,
    uiEvents: Flow<BhaktiChatHubUiEvent>,
    onOpenProfile: () -> Unit,
    onSelectGuide: (String) -> Unit,
    onInputChange: (String) -> Unit,
    onStartThreadFromChip: (String) -> Unit,
    onStartThreadFromInput: () -> Unit,
    onOpenThread: (String) -> Unit,
    isPro: Boolean = false,
    onOpenSubscribe: () -> Unit = {}
) {
    LaunchedEffect(uiEvents) {
        uiEvents.collect { event ->
            when (event) {
                is BhaktiChatHubUiEvent.NavigateToThread -> onOpenThread(event.threadId)
            }
        }
    }

    val selectedGuide = uiState.selectedGuide ?: return
    val keyboardController = LocalSoftwareKeyboardController.current
    val haptics = LocalHapticFeedback.current
    val guideListState = rememberLazyListState()

    val context = LocalContext.current
    val guidePrefs = remember(context) { com.bhaktichat.app.util.GuidePreferences(context) }
    var pinnedIds by remember { mutableStateOf(guidePrefs.pinnedGuideIds()) }

    // Voice input — uses prefix-strip delta merge to avoid duplicate text (mirrors iOS).
    val speechManager = remember(context) { SpeechInputManager(context) }
    val voiceState by speechManager.state.collectAsState()
    var lastTranscript by remember { mutableStateOf("") }
    val applyTranscriptDelta: (String) -> Unit = { newTranscript ->
        if (newTranscript.isNotEmpty() && newTranscript != lastTranscript) {
            val delta = if (newTranscript.startsWith(lastTranscript)) {
                newTranscript.substring(lastTranscript.length)
            } else {
                newTranscript
            }
            if (delta.isNotEmpty()) {
                onInputChange(uiState.inputText + delta)
            }
            lastTranscript = newTranscript
        }
    }
    val recordAudioLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            speechManager.start { transcript -> applyTranscriptDelta(transcript) }
        } else {
            Toast.makeText(context, "Microphone permission denied", Toast.LENGTH_SHORT).show()
        }
    }
    // Reset the last-transcript anchor whenever recording stops so the next session starts clean.
    LaunchedEffect(voiceState.isRecording) {
        if (!voiceState.isRecording) lastTranscript = ""
    }
    // Surface voice errors so the mic never fails silently (e.g. recognition unavailable).
    LaunchedEffect(voiceState.error) {
        voiceState.error?.let { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() }
    }
    DisposableEffect(speechManager) {
        onDispose { speechManager.release() }
    }

    val sortedGuides = remember(uiState.guides, pinnedIds) {
        val pinned = uiState.guides.filter { it.id in pinnedIds }
        val rest = uiState.guides.filter { it.id !in pinnedIds }
        pinned + rest
    }

    val canSend = uiState.inputText.isNotBlank()
    val recentThreads = uiState.recentThreadsWithSelectedGuide

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        contentWindowInsets = WindowInsets(0),
        bottomBar = {
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
                        value = uiState.inputText,
                        onValueChange = onInputChange,
                        modifier = Modifier.weight(1f),
                        placeholder = {
                            Text(
                                "Ask ${selectedGuide.displayName} anything…",
                                color = BhaktiThemeTokens.TextTertiary
                            )
                        },
                        minLines = 1,
                        maxLines = 4,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(
                            onSend = {
                                if (canSend) {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    keyboardController?.hide()
                                    onStartThreadFromInput()
                                }
                            }
                        ),
                        shape = RoundedCornerShape(18.dp),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = MaterialTheme.colorScheme.surface,
                            unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        )
                    )
                    // Mic toggle
                    Surface(
                        onClick = {
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
                        modifier = Modifier.size(46.dp),
                        shape = CircleShape,
                        color = if (voiceState.isRecording) BhaktiThemeTokens.AccentError else MaterialTheme.colorScheme.surface,
                        border = if (voiceState.isRecording) null
                        else BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = if (voiceState.isRecording) Icons.Filled.MicOff else Icons.Filled.Mic,
                                contentDescription = if (voiceState.isRecording) "Stop voice input" else "Start voice input",
                                tint = if (voiceState.isRecording) Color.White else BhaktiThemeTokens.TextSecondary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    // Orange send button — dims when input is empty, shows a spinner while launching.
                    Surface(
                        onClick = {
                            if (canSend && !uiState.isLaunchingThread) {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                keyboardController?.hide()
                                onStartThreadFromInput()
                            }
                        },
                        modifier = Modifier
                            .size(46.dp)
                            .alpha(if (canSend) 1f else 0.38f),
                        shape = CircleShape,
                        color = BhaktiThemeTokens.AccentPrimary
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            if (uiState.isLaunchingThread) {
                                CircularProgressIndicator(
                                    color = Color.White,
                                    strokeWidth = 2.dp,
                                    modifier = Modifier.size(18.dp)
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.Send,
                                    contentDescription = "Start thread",
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // MARK: Top bar — slim: profile · "Bhakti Chat" · PRO pill
            item("topbar") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 2.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(onClick = onOpenProfile) {
                        Icon(
                            imageVector = Icons.Outlined.Person,
                            contentDescription = "Profile",
                            tint = BhaktiThemeTokens.TextPrimary
                        )
                    }

                    Text(
                        text = "Bhakti Chat",
                        style = MaterialTheme.typography.titleMedium,
                        color = BhaktiThemeTokens.TextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )

                    // Get-Pro pill removed (ad-based model). Spacer keeps the title
                    // centered within the SpaceBetween row (balances the leading icon).
                    Spacer(modifier = Modifier.width(48.dp))
                }
            }

            // MARK: Hero — slim contextual two-line block
            item("hero") {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "What would you like to ask ${selectedGuide.displayName}?",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = BhaktiThemeTokens.TextPrimary,
                        maxLines = 2
                    )
                }
            }

            // MARK: Guides section header (no "Swipe" label)
            item("guides-header") {
                Text(
                    text = "Your guides",
                    style = MaterialTheme.typography.titleMedium,
                    color = BhaktiThemeTokens.TextPrimary,
                    fontWeight = FontWeight.SemiBold
                )
            }

            // MARK: Guides row with right-edge background fade
            item("guides-row") {
                Box(modifier = Modifier.fillMaxWidth()) {
                    LazyRow(
                        state = guideListState,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(start = 2.dp, end = 20.dp)
                    ) {
                        items(sortedGuides, key = { it.id }) { guide ->
                            val isPinned = guide.id in pinnedIds
                            var showContextMenu by remember { mutableStateOf(false) }
                            Box {
                                CompactGuideSelectorItem(
                                    label = guide.displayName,
                                    avatarRes = guide.avatarRes,
                                    verticalBias = guide.avatarVerticalBias,
                                    selected = guide.id == uiState.selectedGuideId,
                                    isPinned = isPinned,
                                    onLongClick = { showContextMenu = true },
                                    onClick = { onSelectGuide(guide.id) }
                                )
                                DropdownMenu(
                                    expanded = showContextMenu,
                                    onDismissRequest = { showContextMenu = false }
                                ) {
                                    DropdownMenuItem(
                                        text = {
                                            Text(if (isPinned) "Unpin" else "Pin to top")
                                        },
                                        onClick = {
                                            guidePrefs.togglePinnedGuide(guide.id)
                                            pinnedIds = guidePrefs.pinnedGuideIds()
                                            showContextMenu = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Right-edge fade — hints at horizontal scroll without a literal label.
                    Box(
                        modifier = Modifier
                            .align(Alignment.CenterEnd)
                            .width(32.dp)
                            .fillMaxHeight()
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        MaterialTheme.colorScheme.background.copy(alpha = 0f),
                                        MaterialTheme.colorScheme.background
                                    )
                                )
                            )
                    )
                }
            }

            // MARK: Continue your chats (only when there are recent threads with the selected guide)
            if (recentThreads.isNotEmpty()) {
                item("recent-header") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Continue your chats",
                            style = MaterialTheme.typography.titleMedium,
                            color = BhaktiThemeTokens.TextPrimary,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "with ${selectedGuide.displayName}",
                            style = MaterialTheme.typography.bodySmall,
                            color = BhaktiThemeTokens.TextTertiary
                        )
                    }
                }

                item("recent-list") {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        recentThreads.forEach { thread ->
                            RecentThreadRow(
                                thread = thread,
                                guideAvatarRes = selectedGuide.avatarRes,
                                guideName = selectedGuide.displayName,
                                guideVerticalBias = selectedGuide.avatarVerticalBias,
                                onClick = { onOpenThread(thread.threadId) }
                            )
                        }
                    }
                }
            }

            // MARK: Prompts — heading flips based on context
            item("prompt-label") {
                Text(
                    text = if (recentThreads.isEmpty()) "Start with a prompt" else "Or start fresh",
                    style = MaterialTheme.typography.titleMedium,
                    color = BhaktiThemeTokens.TextPrimary,
                    fontWeight = FontWeight.SemiBold
                )
            }

            item("chips") {
                Crossfade(
                    targetState = uiState.selectedGuideId,
                    animationSpec = tween(durationMillis = 180),
                    label = "guidePromptCrossfade"
                ) {
                    PromptGrid(
                        prompts = uiState.chips,
                        onPromptClick = { prompt ->
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onStartThreadFromChip(prompt)
                        }
                    )
                }
            }
        }
    }
}

// MARK: - Recent thread row

@Composable
private fun RecentThreadRow(
    thread: RecentHubThread,
    guideAvatarRes: Int,
    guideName: String,
    guideVerticalBias: Float,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = BhaktiThemeTokens.SurfaceCard,
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Guide avatar with faint accent stroke
            Surface(
                modifier = Modifier.size(40.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, BhaktiThemeTokens.AccentPrimary.copy(alpha = 0.2f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    GuideAvatar(
                        avatarRes = guideAvatarRes,
                        contentDescription = guideName,
                        sizeDp = 40,
                        verticalBias = guideVerticalBias
                    )
                }
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = thread.preview,
                    style = MaterialTheme.typography.bodyMedium,
                    color = BhaktiThemeTokens.TextPrimary,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = relativeTime(Date(thread.updatedAt)),
                    style = MaterialTheme.typography.labelSmall,
                    color = BhaktiThemeTokens.TextTertiary
                )
            }

            Icon(
                imageVector = Icons.Filled.ChevronRight,
                contentDescription = null,
                tint = BhaktiThemeTokens.TextTertiary,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun CompactGuideSelectorItem(
    label: String,
    avatarRes: Int,
    verticalBias: Float,
    selected: Boolean,
    isPinned: Boolean,
    onLongClick: () -> Unit,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(78.dp)
            .graphicsLayer {
                val scale = if (selected) 1.04f else 1f
                scaleX = scale
                scaleY = scale
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box {
            // Image fills the full circle; the selection ring is an overlay
            // on the image edge rather than a separate concentric stroke.
            // Mirrors the iOS GuideAvatarItemView fix — no visible "framed"
            // gap around the artwork.
            Surface(
                onClick = onClick,
                modifier = Modifier.size(62.dp),
                shape = CircleShape,
                color = Color.Transparent,
                border = BorderStroke(
                    width = if (selected) 2.5.dp else 1.dp,
                    color = if (selected) {
                        BhaktiThemeTokens.AccentPrimary
                    } else {
                        BhaktiThemeTokens.BorderSubtle.copy(alpha = 0.45f)
                    }
                )
            ) {
                GuideAvatar(
                    avatarRes = avatarRes,
                    contentDescription = label,
                    sizeDp = 62,
                    verticalBias = verticalBias
                )
            }
            if (isPinned) {
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(16.dp),
                    shape = CircleShape,
                    color = BhaktiThemeTokens.AccentPrimary
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Filled.PushPin,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(9.dp)
                        )
                    }
                }
            }
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = if (selected) BhaktiThemeTokens.AccentPrimary else BhaktiThemeTokens.TextSecondary,
            textAlign = TextAlign.Center,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun PromptGrid(
    prompts: List<String>,
    onPromptClick: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        prompts.chunked(2).take(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                row.forEach { prompt ->
                    PromptCard(
                        text = prompt,
                        icon = promptIcon(prompt),
                        modifier = Modifier.weight(1f),
                        onClick = { onPromptClick(prompt) }
                    )
                }
                if (row.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun PromptCard(
    text: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = modifier.heightIn(min = 90.dp),
        shape = RoundedCornerShape(16.dp),
        color = BhaktiThemeTokens.SurfaceCard,
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(BhaktiThemeTokens.AccentPrimary.copy(alpha = 0.13f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = BhaktiThemeTokens.AccentPrimary,
                    modifier = Modifier.size(16.dp)
                )
            }
            Text(
                text = text,
                style = MaterialTheme.typography.bodyMedium,
                color = BhaktiThemeTokens.TextPrimary,
                fontWeight = FontWeight.SemiBold,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}
