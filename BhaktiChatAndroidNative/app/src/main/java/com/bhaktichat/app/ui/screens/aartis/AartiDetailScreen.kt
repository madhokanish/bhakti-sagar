package com.bhaktichat.app.ui.screens.aartis

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.data.repo.AartiRepository
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.ui.screens.aartis.components.YouTubePlayerEmbed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AartiDetailScreen(
    aartiId: String,
    repository: AartiRepository,
    onBack: () -> Unit,
    onAskKrishna: (String) -> Unit
) {
    var aarti by remember { mutableStateOf<Aarti?>(null) }
    val clipboard = LocalClipboardManager.current
    val uriHandler = LocalUriHandler.current

    LaunchedEffect(aartiId) {
        aarti = repository.loadAartis().firstOrNull { it.id == aartiId }
    }

    val currentAarti = aarti ?: return
    val watchUrl = currentAarti.youtubeVideoId?.let { "https://www.youtube.com/watch?v=$it" }

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text(currentAarti.title) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back"
                    )
                }
            },
            actions = {
                TextButton(
                    onClick = {
                        clipboard.setText(
                            androidx.compose.ui.text.AnnotatedString(
                                currentAarti.lyrics.joinToString("\n")
                            )
                        )
                    }
                ) {
                    Text("Copy")
                }
            }
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp)
        ) {
            item("header") {
                Column(
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = currentAarti.title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    currentAarti.subtitle?.let { subtitle ->
                        Text(
                            text = subtitle,
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            item("video-cta") {
                Button(
                    onClick = {
                        watchUrl?.let(uriHandler::openUri)
                    },
                    enabled = watchUrl != null,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Play video")
                }
            }

            item("player") {
                YouTubePlayerEmbed(
                    videoId = currentAarti.youtubeVideoId,
                    title = currentAarti.title,
                    onOpenExternal = watchUrl?.let { url ->
                        { uriHandler.openUri(url) }
                    }
                )
            }

            item("ask-krishna") {
                Button(
                    onClick = {
                        val prefill = currentAarti.title
                            .trim()
                            .takeIf { it.isNotBlank() }
                            ?.let { "Explain $it aarti to me" }
                            ?: "Explain this aarti to me"
                        onAskKrishna(prefill)
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Ask Krishna about this aarti")
                }
            }

            item("lyrics") {
                Surface(
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp),
                    tonalElevation = 1.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Lyrics",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = currentAarti.lyrics.joinToString("\n"),
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
            }
        }
    }
}
