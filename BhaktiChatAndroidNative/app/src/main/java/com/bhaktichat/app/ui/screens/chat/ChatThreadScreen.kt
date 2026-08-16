package com.bhaktichat.app.ui.screens.chat
import com.bhaktichat.app.ui.i18n.t
import com.bhaktichat.app.ui.i18n.LocalAppLanguage

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import android.widget.Toast
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.core.content.ContextCompat
import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.ui.components.GuideAvatar
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import com.bhaktichat.app.util.SpeechInputManager
import com.bhaktichat.app.util.formatTime
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.Locale

// ---------------------------------------------------------------------------
// Chat list item sealed class for date separators
// ---------------------------------------------------------------------------

sealed class ChatListItem {
    data class MessageItem(val message: MessageEntity) : ChatListItem()
    data class DateSeparator(val label: String) : ChatListItem()
}

@Composable
fun buildChatListItems(messages: List<MessageEntity>): List<ChatListItem> {
    if (messages.isEmpty()) return emptyList()

    val result = mutableListOf<ChatListItem>()
    var lastDateLabel: String? = null

    val todayCal = Calendar.getInstance()
    val yesterdayCal = Calendar.getInstance().also { it.add(Calendar.DAY_OF_YEAR, -1) }

    for (message in messages) {
        val msgCal = Calendar.getInstance().also { it.timeInMillis = message.createdAt }

        val label = when {
            isSameDay(msgCal, todayCal) -> t("date_today")
            isSameDay(msgCal, yesterdayCal) -> t("date_yesterday")
            else -> {
                val day = msgCal.get(Calendar.DAY_OF_MONTH)
                val month = msgCal.getDisplayName(Calendar.MONTH, Calendar.SHORT, Locale.forLanguageTag("hi-IN"))
                    ?: ""
                "$day $month"
            }
        }

        if (label != lastDateLabel) {
            result.add(ChatListItem.DateSeparator(label))
            lastDateLabel = label
        }
        result.add(ChatListItem.MessageItem(message))
    }

    return result
}

private fun isSameDay(a: Calendar, b: Calendar): Boolean =
    a.get(Calendar.YEAR) == b.get(Calendar.YEAR) &&
        a.get(Calendar.DAY_OF_YEAR) == b.get(Calendar.DAY_OF_YEAR)

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatThreadScreen(
    uiState: ThreadUiState,
    onBack: () -> Unit,
    onInputChange: (String) -> Unit,
    onSend: (String) -> Unit,
    onRegenerate: () -> Unit = {},
    onClearChat: (() -> Unit)? = null,
    onOpenVoiceMode: (guideId: String, conversationId: String?) -> Unit = { _, _ -> }
) {
    val guide = uiState.guide
    val listState = rememberLazyListState()
    val keyboardController = LocalSoftwareKeyboardController.current
    val focusRequester = remember { FocusRequester() }
    val density = LocalDensity.current
    val configuration = LocalConfiguration.current
    val coroutineScope = rememberCoroutineScope()
    val clipboardManager = LocalClipboardManager.current
    val context = LocalContext.current
    var showThreadMenu by remember { mutableStateOf(false) }
    var selectedMessageId by remember { mutableStateOf<String?>(null) }

    // Voice input wiring (Feature 2) — prefix-strip delta merge mirrors iOS so we
    // don't duplicate text when partial transcripts grow.
    val resolvedGuideName = guide?.displayName(LocalAppLanguage.current).orEmpty()
    val micDeniedMessage = t("chat_mic_denied")
    val youLabel = t("chat_you")
    val copiedLatestMessage = t("chat_copied_latest")
    val copiedConvoMessage = t("chat_copied_convo")
    val copiedMessage = t("chat_copied")
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
            Toast.makeText(context, micDeniedMessage, Toast.LENGTH_SHORT).show()
        }
    }
    LaunchedEffect(voiceState.isRecording) {
        if (!voiceState.isRecording) lastTranscript = ""
    }
    // Surface voice errors (unavailable, no-match, permission, etc.) — otherwise the mic
    // fails silently and looks broken (notably on emulators, where recognition is absent).
    LaunchedEffect(voiceState.error) {
        voiceState.error?.let { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() }
    }
    DisposableEffect(speechManager) {
        onDispose { speechManager.release() }
    }

    // Regenerate (Feature 4): visible on the last non-typing assistant message.
    val lastAssistantId = remember(uiState.messages) {
        uiState.messages
            .lastOrNull { ChatRole.fromWire(it.role) == ChatRole.ASSISTANT && !it.isTypingIndicator }
            ?.id
    }
    val topAnchorOffset = remember(configuration.screenHeightDp, density) {
        with(density) { (configuration.screenHeightDp.dp / 3f).roundToPx() }
    }

    // buildChatListItems is @Composable (its date labels are translated), so it can't
    // live inside remember{}. It is cheap and only re-runs on message/language change.
    val chatListItems = buildChatListItems(uiState.messages)

    // Scroll-to-bottom FAB: true when already at (or past) the last item
    val isAtBottom by remember {
        derivedStateOf {
            val layoutInfo = listState.layoutInfo
            val totalItems = layoutInfo.totalItemsCount
            if (totalItems == 0) return@derivedStateOf true
            val lastVisibleIndex = layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            lastVisibleIndex >= totalItems - 1
        }
    }

    val isSendEnabled = uiState.inputText.isNotBlank()

    LaunchedEffect(uiState.messages.map { Triple(it.id, it.content, it.isTypingIndicator) }) {
        if (uiState.messages.isNotEmpty()) {
            val anchorIndex = anchoredMessageIndex(uiState.messages)
            // Offset by date separators that were inserted before this message index
            val adjustedIndex = anchorIndex + chatListItems
                .take(chatListItems.indexOfFirst {
                    it is ChatListItem.MessageItem && it.message == uiState.messages[anchorIndex]
                } + 1)
                .count { it is ChatListItem.DateSeparator }
            listState.animateScrollToItem(
                index = adjustedIndex.coerceAtLeast(0),
                scrollOffset = topAnchorOffset
            )
        }
    }

    LaunchedEffect(uiState.thread?.id) {
        if (uiState.thread != null) {
            focusRequester.requestFocus()
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        contentWindowInsets = WindowInsets(0),
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = t("go_back")
                        )
                    }
                },
                title = {
                    if (guide != null) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            GuideAvatar(
                                avatarRes = guide.avatarRes,
                                contentDescription = guide.displayName(LocalAppLanguage.current),
                                sizeDp = 34,
                                verticalBias = guide.avatarVerticalBias
                            )
                            Column(modifier = Modifier.padding(start = 10.dp)) {
                                Text(
                                    text = guide.displayName(LocalAppLanguage.current),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(Color(0xFF22C55E), CircleShape)
                                    )
                                    Text(
                                        text = guide.status(LocalAppLanguage.current).ifBlank { t("chat_available") },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    } else {
                        Text(text = "BhaktiChat")
                    }
                },
                actions = {
                    if (guide != null) {
                        IconButton(
                            onClick = {
                                onOpenVoiceMode(guide.serverPromptKey, uiState.thread?.remoteConversationId)
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Call,
                                contentDescription = t("chat_voice_call")
                            )
                        }
                    }
                    Box {
                        IconButton(onClick = { showThreadMenu = true }) {
                            Icon(
                                imageVector = Icons.Filled.MoreVert,
                                contentDescription = t("chat_options")
                            )
                        }
                        DropdownMenu(
                            expanded = showThreadMenu,
                            onDismissRequest = { showThreadMenu = false }
                        ) {
                            val latestAssistantReply = uiState.messages
                                .lastOrNull {
                                    ChatRole.fromWire(it.role) == ChatRole.ASSISTANT &&
                                        !it.isTypingIndicator &&
                                        it.content.isNotBlank()
                                }
                            if (latestAssistantReply != null) {
                                DropdownMenuItem(
                                    text = { Text(t("chat_copy_latest")) },
                                    onClick = {
                                        clipboardManager.setText(
                                            AnnotatedString(latestAssistantReply.content)
                                        )
                                        Toast.makeText(context, copiedLatestMessage, Toast.LENGTH_SHORT).show()
                                        showThreadMenu = false
                                    }
                                )
                            }
                            DropdownMenuItem(
                                text = { Text(t("chat_copy_convo")) },
                                onClick = {
                                    val guideName = resolvedGuideName
                                    val transcript = uiState.messages
                                        .filterNot { it.isTypingIndicator }
                                        .joinToString("\n\n") { msg ->
                                            val speaker = if (ChatRole.fromWire(msg.role) == ChatRole.USER) youLabel else guideName
                                            "$speaker: ${msg.content}"
                                        }
                                    clipboardManager.setText(AnnotatedString(transcript))
                                    Toast.makeText(context, copiedConvoMessage, Toast.LENGTH_SHORT).show()
                                    showThreadMenu = false
                                }
                            )
                            if (onClearChat != null) {
                                DropdownMenuItem(
                                    text = { Text(t("chat_delete")) },
                                    onClick = {
                                        onClearChat()
                                        showThreadMenu = false
                                    }
                                )
                            }
                        }
                    }
                }
            )
        },
        bottomBar = {
            Surface(
                color = MaterialTheme.colorScheme.background,
                tonalElevation = 0.dp,
                shadowElevation = 4.dp
            ) {
                Column(modifier = Modifier.imePadding()) {
                // Free-message quota hint removed — ad-based model, chat is free for all.
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 12.dp, end = 12.dp, top = 8.dp, bottom = 8.dp),
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TextField(
                        value = uiState.inputText,
                        onValueChange = onInputChange,
                        modifier = Modifier
                            .weight(1f)
                            .focusRequester(focusRequester),
                        placeholder = {
                            Text(
                                t("chat_input_hint"),
                                color = BhaktiThemeTokens.TextTertiary
                            )
                        },
                        minLines = 1,
                        maxLines = 4,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(
                            onSend = {
                                if (isSendEnabled) {
                                    keyboardController?.hide()
                                    onSend(uiState.inputText)
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
                    // Mic toggle (Feature 2)
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
                                contentDescription = if (voiceState.isRecording) t("chat_voice_stop") else t("chat_voice_start"),
                                tint = if (voiceState.isRecording) Color.White else BhaktiThemeTokens.TextSecondary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                    // Orange send button circle — disabled when input is blank
                    Surface(
                        onClick = {
                            if (isSendEnabled) {
                                keyboardController?.hide()
                                onSend(uiState.inputText)
                            }
                        },
                        modifier = Modifier
                            .size(46.dp)
                            .alpha(if (isSendEnabled) 1f else 0.4f),
                        shape = CircleShape,
                        color = BhaktiThemeTokens.AccentPrimary,
                        enabled = isSendEnabled
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Send,
                                contentDescription = t("chat_send"),
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
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = t("chat_loading"),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    state = listState,
                    contentPadding = PaddingValues(start = 12.dp, end = 12.dp, top = 12.dp, bottom = 96.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(
                        items = chatListItems,
                        key = { item ->
                            when (item) {
                                is ChatListItem.MessageItem -> item.message.id
                                is ChatListItem.DateSeparator -> "separator_${item.label}"
                            }
                        }
                    ) { item ->
                        when (item) {
                            is ChatListItem.DateSeparator -> DateSeparatorItem(label = item.label)
                            is ChatListItem.MessageItem -> ThreadMessageItem(
                                message = item.message,
                                avatarRes = guide?.avatarRes,
                                avatarBias = guide?.avatarVerticalBias ?: -1f,
                                guideName = guide?.displayName(LocalAppLanguage.current).orEmpty(),
                                isSelected = selectedMessageId == item.message.id,
                                isLastAssistant = item.message.id == lastAssistantId,
                                onTapBubble = {
                                    selectedMessageId =
                                        if (selectedMessageId == item.message.id) null else item.message.id
                                },
                                onCopyMessage = {
                                    clipboardManager.setText(AnnotatedString(item.message.content))
                                    Toast.makeText(context, copiedMessage, Toast.LENGTH_SHORT).show()
                                    selectedMessageId = null
                                },
                                onRegenerate = onRegenerate
                            )
                        }
                    }
                }

                // Scroll-to-bottom FAB
                AnimatedVisibility(
                    visible = !isAtBottom,
                    enter = fadeIn(),
                    exit = fadeOut(),
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(bottom = 16.dp, end = 16.dp)
                ) {
                    Surface(
                        onClick = {
                            coroutineScope.launch {
                                if (chatListItems.isNotEmpty()) {
                                    listState.animateScrollToItem(chatListItems.lastIndex)
                                }
                            }
                        },
                        shape = CircleShape,
                        color = BhaktiThemeTokens.AccentPrimary,
                        shadowElevation = 4.dp,
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Filled.KeyboardArrowDown,
                                contentDescription = t("chat_scroll_bottom"),
                                tint = Color.White,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Date separator composable
// ---------------------------------------------------------------------------

@Composable
private fun DateSeparatorItem(label: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = BhaktiThemeTokens.BorderSubtle
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = BhaktiThemeTokens.TextSecondary
        )
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = BhaktiThemeTokens.BorderSubtle
        )
    }
}

// ---------------------------------------------------------------------------
// Message item
// ---------------------------------------------------------------------------

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun ThreadMessageItem(
    message: MessageEntity,
    avatarRes: Int?,
    avatarBias: Float,
    guideName: String,
    isSelected: Boolean,
    isLastAssistant: Boolean = false,
    onTapBubble: () -> Unit,
    onCopyMessage: () -> Unit,
    onRegenerate: () -> Unit = {}
) {
    val role = ChatRole.fromWire(message.role)
    val isUser = role == ChatRole.USER
    val clipboardManager = LocalClipboardManager.current

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Top
    ) {
        if (!isUser && avatarRes != null) {
            GuideAvatar(
                avatarRes = avatarRes,
                contentDescription = guideName,
                sizeDp = 28,
                verticalBias = avatarBias
            )
        }

        Column(
            modifier = Modifier
                .padding(start = if (isUser || avatarRes == null) 0.dp else 8.dp)
                .fillMaxWidth(if (isUser) 0.84f else 0.88f)
        ) {
            if (isUser) {
                Surface(
                    color = BhaktiThemeTokens.AccentPrimary,
                    shape = RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp, bottomStart = 18.dp, bottomEnd = 4.dp),
                    modifier = Modifier.combinedClickable(
                        onClick = onTapBubble,
                        onLongClick = {
                            clipboardManager.setText(AnnotatedString(message.content))
                        }
                    )
                ) {
                    Text(
                        text = message.content,
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp)
                    )
                }
            } else if (message.isTypingIndicator) {
                AssistantTypingBubble()
            } else {
                val isError = message.content.trimStart().startsWith("Error:", ignoreCase = true)
                val errorRed = Color(0xFFEF4444)

                // Split long replies into several short bubbles instead of one big block —
                // mirrors iOS's GuideReplyFormatter/ChatBubbleRow.displaySegments. Errors stay
                // as a single bubble (they're short technical strings, not conversational text).
                val segments = if (isError) {
                    listOf(message.content)
                } else {
                    GuideReplyFormatter.format(message.content)
                        .split("\n\n")
                        .map { it.trim() }
                        .filter { it.isNotEmpty() }
                        .ifEmpty { listOf(message.content) }
                }

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    segments.forEach { segment ->
                        Surface(
                            color = if (isError) errorRed.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surface,
                            shape = RoundedCornerShape(topStart = 4.dp, topEnd = 18.dp, bottomStart = 18.dp, bottomEnd = 18.dp),
                            border = BorderStroke(1.dp, if (isError) errorRed.copy(alpha = 0.4f) else BhaktiThemeTokens.BorderSubtle),
                            modifier = Modifier.combinedClickable(
                                onClick = onTapBubble,
                                onLongClick = {
                                    clipboardManager.setText(AnnotatedString(message.content))
                                }
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (isError) {
                                    Icon(
                                        imageVector = Icons.Filled.ErrorOutline,
                                        contentDescription = null,
                                        tint = errorRed,
                                        modifier = Modifier.size(16.dp).padding(top = 2.dp)
                                    )
                                }
                                Text(
                                    text = segment,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = if (isError) errorRed else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }

            // Inline action row revealed when this bubble is tapped — keeps Copy
            // as the primary tap affordance.
            if (isSelected && !message.isTypingIndicator) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onCopyMessage) {
                        Icon(
                            imageVector = Icons.Filled.ContentCopy,
                            contentDescription = t("chat_copy_message"),
                            modifier = Modifier.size(18.dp),
                            tint = BhaktiThemeTokens.TextSecondary
                        )
                    }
                    Text(
                        text = t("chat_copy"),
                        style = MaterialTheme.typography.labelMedium,
                        color = BhaktiThemeTokens.TextSecondary,
                        modifier = Modifier.clickable(onClick = onCopyMessage)
                    )
                }
            }

            // Regenerate button is shown only beneath the latest assistant reply.
            if (!isUser && isLastAssistant && !message.isTypingIndicator) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    horizontalArrangement = Arrangement.Start,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        onClick = onRegenerate,
                        shape = RoundedCornerShape(999.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Refresh,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = BhaktiThemeTokens.TextSecondary
                            )
                            Text(
                                text = t("chat_regenerate"),
                                style = MaterialTheme.typography.labelMedium,
                                color = BhaktiThemeTokens.TextSecondary
                            )
                        }
                    }
                }
            }

            // Timestamp row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp, start = 4.dp, end = 4.dp),
                horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formatTime(message.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (isUser) {
                    Text(
                        text = t("chat_sent_suffix"),
                        style = MaterialTheme.typography.labelSmall,
                        color = BhaktiThemeTokens.TextSecondary
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Guide reply formatter — splits one long reply into several short bubbles.
// Mirrors iOS's GuideReplyFormatter in ChatThreadScreen.swift — keep both in sync.
// ---------------------------------------------------------------------------

private object GuideReplyFormatter {
    private val cache = java.util.concurrent.ConcurrentHashMap<String, String>()

    fun format(text: String): String {
        cache[text]?.let { return it }

        val normalized = text
            .replace("\r\n", "\n")
            .replace(Regex("\n{3,}"), "\n\n")
            .trim()

        if (normalized.length <= 170 && !normalized.contains("\n\n")) {
            cache[text] = normalized
            return normalized
        }

        // Group into a couple of balanced bubbles instead of preserving every break the
        // model chose verbatim. Models routinely put each short sentence on its own line —
        // if a model-inserted "\n\n" between every sentence were honored as-is, a compliant
        // 2 to 4 sentence reply would render as 3 to 4 stacked bubbles, which reads as far
        // longer than the same words in one or two bubbles would. So this regroups
        // model-native paragraph breaks the same way it regroups sentences it splits itself
        // — by a target length, not by whatever break the model happened to use.
        val parts = if (normalized.contains("\n\n")) {
            normalized.split("\n\n").map { it.trim() }.filter { it.isNotEmpty() }
        } else {
            normalized.split(Regex("(?<=[.!?।])\\s+")).map { it.trim() }.filter { it.isNotEmpty() }
        }

        if (parts.size >= 2) {
            val result = makeParagraphs(parts, targetLength = 140, separator = " ")
            cache[text] = result
            return result
        }

        val clauses = normalized.split(",")
            .map { it.trim() }
            .filter { it.isNotEmpty() }

        if (clauses.size >= 3) {
            val result = makeParagraphs(clauses, targetLength = 110, separator = ", ")
            cache[text] = result
            return result
        }

        val words = normalized.split(" ")
        if (words.size <= 35) {
            cache[text] = normalized
            return normalized
        }

        val chunks = mutableListOf<String>()
        var current = mutableListOf<String>()
        for (word in words) {
            val projected = (current + word).joinToString(" ")
            if (projected.length > 110 && current.isNotEmpty()) {
                chunks.add(current.joinToString(" "))
                current = mutableListOf(word)
            } else {
                current.add(word)
            }
        }
        if (current.isNotEmpty()) chunks.add(current.joinToString(" "))
        val result = chunks.joinToString("\n\n")
        cache[text] = result
        return result
    }

    private fun makeParagraphs(parts: List<String>, targetLength: Int, separator: String): String {
        val paragraphs = mutableListOf<String>()
        var current = mutableListOf<String>()
        for (part in parts) {
            val projected = (current + part).joinToString(separator)
            if (projected.length > targetLength && current.isNotEmpty()) {
                paragraphs.add(current.joinToString(separator))
                current = mutableListOf(part)
            } else {
                current.add(part)
            }
        }
        if (current.isNotEmpty()) paragraphs.add(current.joinToString(separator))
        return paragraphs.joinToString("\n\n")
    }
}

// ---------------------------------------------------------------------------
// Typing bubble
// ---------------------------------------------------------------------------

@Composable
private fun AssistantTypingBubble() {
    val transition = rememberInfiniteTransition(label = "assistantTyping")
    val dot1 by transition.animateFloat(
        initialValue = 0.25f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 900
                0.25f at 0
                1f at 200
                0.25f at 450
            },
            repeatMode = RepeatMode.Restart
        ),
        label = "dot1"
    )
    val dot2 by transition.animateFloat(
        initialValue = 0.25f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 900
                0.25f at 100
                1f at 320
                0.25f at 600
            },
            repeatMode = RepeatMode.Restart
        ),
        label = "dot2"
    )
    val dot3 by transition.animateFloat(
        initialValue = 0.25f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 900
                0.25f at 220
                1f at 460
                0.25f at 820
            },
            repeatMode = RepeatMode.Restart
        ),
        label = "dot3"
    )

    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 4.dp, topEnd = 18.dp, bottomStart = 18.dp, bottomEnd = 18.dp),
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TypingDot(alpha = dot1)
            TypingDot(alpha = dot2)
            TypingDot(alpha = dot3)
        }
    }
}

@Composable
private fun TypingDot(alpha: Float) {
    Box(
        modifier = Modifier
            .size(7.dp)
            .alpha(alpha)
            .background(BhaktiThemeTokens.TextSecondary, CircleShape)
    )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

private fun anchoredMessageIndex(messages: List<MessageEntity>): Int {
    if (messages.isEmpty()) return 0
    val lastUserIndex = messages.indexOfLast { ChatRole.fromWire(it.role) == ChatRole.USER }
    return when {
        lastUserIndex == -1 -> messages.lastIndex
        lastUserIndex < messages.lastIndex -> lastUserIndex
        else -> messages.lastIndex
    }
}
