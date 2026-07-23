package com.bhaktichat.app.ui.screens.guidepicker

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.data.repo.ChatRepository
import com.bhaktichat.app.domain.Guides
import com.bhaktichat.app.ui.components.GuideAvatar
import com.bhaktichat.app.util.AuthState
import com.bhaktichat.app.util.formatTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatEntryScreen(
    repository: ChatRepository,
    authState: AuthState,
    onNavigateToGuide: (String) -> Unit,
    onNavigateToPicker: () -> Unit,
    onAccountClick: () -> Unit
) {
    Scaffold(
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0),
        topBar = {
            TopAppBar(
                title = { Text("Chats") },
                actions = {
                    TextButton(onClick = onAccountClick) {
                        Text(if (authState.isLoggedIn) "Account" else "Log in")
                    }
                }
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item("guide_picker_ad") {
                com.bhaktichat.app.ui.components.ads.BannerAd(placement = "guide_picker")
            }
            items(Guides.all, key = { it.id }) { guide ->
                val latestMessage = repository.observeLatestMessage(guide.id).collectAsStateWithLifecycle(initialValue = null).value
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateToGuide(guide.id) }
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            GuideAvatar(
                                avatarRes = guide.avatarRes,
                                contentDescription = guide.displayName,
                                sizeDp = 42,
                                verticalBias = guide.avatarVerticalBias
                            )
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(end = 8.dp)
                            ) {
                                Text(
                                    text = guide.displayName,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = latestMessage?.content?.ifBlank { guide.openingScene } ?: guide.openingScene,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                                val timeText = latestMessage?.createdAt?.let(::formatTime)
                                if (!timeText.isNullOrBlank()) {
                                    Text(
                                        text = timeText,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }

            item(key = "choose-guide") {
                Text(
                    text = "Need a new guide? Choose from all personas",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateToPicker() }
                        .padding(8.dp)
                )
            }
        }
    }
}
