package com.bhaktichat.app.ui.screens.chat
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddComment
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.AssistChip
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.ui.components.GuideAvatar
import com.bhaktichat.app.util.formatTime
import kotlinx.coroutines.flow.SharedFlow

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    uiState: ChatUiState,
    focusEvents: SharedFlow<Unit>,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit,
    onNewChat: () -> Unit,
    onSelectPrompt: (String) -> Unit,
    onSwitchGuide: () -> Unit,
    onOpenGuideProfile: () -> Unit
) {
    val guide = uiState.guide ?: return
    val listState = rememberLazyListState()
    val focusRequester = remember { FocusRequester() }
    val snackbarHostState = remember { SnackbarHostState() }
    var menuExpanded by remember { mutableStateOf(false) }

    val hasUserMessages by remember(uiState.messages) {
        derivedStateOf {
            uiState.messages.any { ChatRole.fromWire(it.role) == ChatRole.USER }
        }
    }

    val nearBottom by remember {
        derivedStateOf {
            val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val total = listState.layoutInfo.totalItemsCount
            total == 0 || lastVisible >= total - 2
        }
    }

    LaunchedEffect(uiState.messages.size, uiState.messages.lastOrNull()?.content, uiState.isStreaming) {
        if (nearBottom && uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.lastIndex)
        }
    }

    LaunchedEffect(Unit) {
        focusEvents.collect {
            focusRequester.requestFocus()
        }
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let { snackbarHostState.showSnackbar(it) }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0),
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable(onClick = onOpenGuideProfile)
                    ) {
                        GuideAvatar(
                            avatarRes = guide.avatarRes,
                            contentDescription = guide.displayName,
                            sizeDp = 34,
                            verticalBias = guide.avatarVerticalBias
                        )
                        Column(modifier = Modifier.padding(start = 10.dp)) {
                            Text(
                                text = guide.displayName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Online guide",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { menuExpanded = true }) {
                        Icon(Icons.Filled.MoreVert, contentDescription = "More")
                    }
                    DropdownMenu(expanded = menuExpanded, onDismissRequest = { menuExpanded = false }) {
                        DropdownMenuItem(
                            text = { Text("Switch guide") },
                            onClick = {
                                menuExpanded = false
                                onSwitchGuide()
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("New chat") },
                            onClick = {
                                menuExpanded = false
                                onNewChat()
                            }
                        )
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        floatingActionButton = {
            if (uiState.messages.isNotEmpty()) {
                SmallFloatingActionButton(onClick = onNewChat) {
                    Icon(Icons.Filled.AddComment, contentDescription = "Start new chat")
                }
            }
        },
        bottomBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .imePadding()
                    .padding(start = 12.dp, end = 12.dp, top = 4.dp)
            ) {
                if (!hasUserMessages && !uiState.isStreaming) {
                    SuggestedPromptsRow(
                        prompts = guide.suggestedPrompts,
                        onSelect = onSelectPrompt
                    )
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = if (!hasUserMessages && !uiState.isStreaming) 8.dp else 2.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    TextField(
                        value = uiState.inputText,
                        onValueChange = { value ->
                            if (value.contains('\n')) {
                                onInputChange(value.replace("\n", ""))
                                onSend()
                            } else {
                                onInputChange(value)
                            }
                        },
                        modifier = Modifier
                            .weight(1f)
                            .heightIn(min = 48.dp)
                            .focusRequester(focusRequester),
                        placeholder = { Text("Share what is on your mind...") },
                        maxLines = 4,
                        singleLine = false,
                        shape = RoundedCornerShape(24.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(onSend = { onSend() }),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = MaterialTheme.colorScheme.surface,
                            unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        )
                    )
                    FloatingActionButton(
                        onClick = onSend,
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier
                            .padding(start = 8.dp)
                            .size(48.dp)
                        ) {
                        Icon(Icons.Filled.Send, contentDescription = "Send")
                    }
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .consumeWindowInsets(innerPadding),
            state = listState,
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp, Alignment.Bottom)
        ) {
            itemsIndexed(uiState.messages, key = { _, message -> message.id }) { index, message ->
                MessageBubble(
                    message = message,
                    avatarRes = guide.avatarRes,
                    avatarBiasY = guide.avatarVerticalBias,
                    guideName = guide.displayName,
                    showFollowUps = !uiState.isStreaming &&
                        index == uiState.messages.lastIndex &&
                        ChatRole.fromWire(message.role) == ChatRole.ASSISTANT,
                    onSelectPrompt = onSelectPrompt
                )
            }

            if (uiState.isStreaming && uiState.messages.lastOrNull()?.content.isNullOrBlank()) {
                item(key = "typing-indicator") {
                    TypingIndicator(
                        avatarRes = guide.avatarRes,
                        avatarBiasY = guide.avatarVerticalBias,
                        guideName = guide.displayName
                    )
                }
            }
        }
    }
}

@Composable
private fun SuggestedPromptsRow(prompts: List<String>, onSelect: (String) -> Unit) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(prompts, key = { it }) { prompt ->
            AssistChip(
                onClick = { onSelect(prompt) },
                label = { Text(prompt) }
            )
        }
    }
}

@Composable
private fun MessageBubble(
    message: MessageEntity,
    avatarRes: Int,
    avatarBiasY: Float,
    guideName: String,
    showFollowUps: Boolean,
    onSelectPrompt: (String) -> Unit
) {
    val role = ChatRole.fromWire(message.role)
    val isUser = role == ChatRole.USER

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
        verticalAlignment = if (isUser) Alignment.Bottom else Alignment.Top
    ) {
        if (!isUser) {
            GuideAvatar(
                avatarRes = avatarRes,
                contentDescription = guideName,
                sizeDp = 28,
                verticalBias = avatarBiasY
            )
        }
        Column(
            modifier = Modifier
                .padding(start = if (isUser) 0.dp else 8.dp)
                .fillMaxWidth(if (isUser) 0.90f else 0.86f)
        ) {
            if (isUser) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(18.dp),
                    tonalElevation = 0.dp
                ) {
                    Text(
                        text = message.content,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 13.dp),
                        softWrap = true
                    )
                }
            } else {
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(horizontal = 2.dp, vertical = 4.dp),
                    softWrap = true
                )
                if (showFollowUps) {
                    FollowUpList(onSelectPrompt = onSelectPrompt)
                }
            }
            Text(
                text = formatTime(message.createdAt),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = if (isUser) TextAlign.End else TextAlign.Start,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 2.dp, start = 2.dp, end = 2.dp)
            )
        }
    }
}

@Composable
private fun FollowUpList(onSelectPrompt: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            text = "Follow up",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        listOf(
            "Explain with a Gita story",
            "Give me a practical step",
            "Short mantra for today"
        ).forEach { prompt ->
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                modifier = Modifier.clickable { onSelectPrompt(prompt) }
            ) {
                Text(
                    text = prompt,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                )
            }
        }
    }
}

@Composable
private fun TypingIndicator(avatarRes: Int, avatarBiasY: Float, guideName: String) {
    val transition = rememberInfiniteTransition(label = "typingDots")
    val dot1 by transition.animateFloat(
        initialValue = 0.30f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 900
                0.30f at 0
                1f at 220
                0.30f at 450
            },
            repeatMode = RepeatMode.Restart
        ),
        label = "dot1"
    )
    val dot2 by transition.animateFloat(
        initialValue = 0.30f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 900
                0.30f at 120
                1f at 360
                0.30f at 620
            },
            repeatMode = RepeatMode.Restart
        ),
        label = "dot2"
    )
    val dot3 by transition.animateFloat(
        initialValue = 0.30f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 900
                0.30f at 250
                1f at 520
                0.30f at 850
            },
            repeatMode = RepeatMode.Restart
        ),
        label = "dot3"
    )

    Row(verticalAlignment = Alignment.CenterVertically) {
        GuideAvatar(
            avatarRes = avatarRes,
            contentDescription = guideName,
            sizeDp = 28,
            verticalBias = avatarBiasY
        )
        Surface(
            modifier = Modifier
                .padding(start = 8.dp),
            shape = RoundedCornerShape(18.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.75f)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Dot(alpha = dot1)
                Dot(alpha = dot2)
                Dot(alpha = dot3)
            }
        }
    }
}

@Composable
private fun Dot(alpha: Float) {
    Box(
        modifier = Modifier
            .size(7.dp)
            .alpha(alpha)
            .background(MaterialTheme.colorScheme.onSurfaceVariant, CircleShape)
    )
}
