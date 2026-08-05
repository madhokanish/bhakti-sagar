package com.bhaktichat.app.ui.screens.aartis

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.R
import com.bhaktichat.app.data.repo.AartiRepository
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.domain.Deity
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import com.bhaktichat.app.util.AartiSpeechPlayer
import com.bhaktichat.app.data.local.SavedAartisStore
import com.bhaktichat.app.ui.i18n.t
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
    val context = LocalContext.current

    LaunchedEffect(aartiId) {
        aarti = repository.loadAartis().firstOrNull { it.id == aartiId }
    }

    val currentAarti = aarti ?: return
    val watchUrl = currentAarti.youtubeVideoId?.let { "https://www.youtube.com/watch?v=$it" }
    val explainNamedPromptTemplate = t("aarti_explain_prompt_named")
    val explainGenericPrompt = t("aarti_explain_prompt_generic")

    // Text-to-speech (Feature 3)
    var isPlaying by remember { mutableStateOf(false) }
    val speechPlayer = remember(context) {
        AartiSpeechPlayer(
            context = context,
            onCompleted = { isPlaying = false }
        )
    }
    DisposableEffect(speechPlayer) {
        onDispose { speechPlayer.shutdown() }
    }

    // Save — unified with the Aartis list (both use SavedAartisStore) so a save on either
    // surface is reflected on the other.
    val savedStore = remember(context) { SavedAartisStore(context) }
    val savedAartiIds by savedStore.savedIds.collectAsState()
    val isBookmarked = currentAarti.id in savedAartiIds

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text(currentAarti.title) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = t("back")
                    )
                }
            },
            actions = {
                IconButton(
                    onClick = {
                        if (isPlaying) {
                            speechPlayer.stop()
                            isPlaying = false
                        } else {
                            val text = currentAarti.lyrics.joinToString(". ")
                            if (text.isNotBlank()) {
                                isPlaying = true
                                speechPlayer.speak(text)
                            }
                        }
                    }
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Filled.Stop else Icons.Filled.PlayArrow,
                        contentDescription = if (isPlaying) {
                            t("aarti_stop_reading_content_description")
                        } else {
                            t("aarti_read_aloud_content_description")
                        },
                        tint = if (isPlaying) BhaktiThemeTokens.AccentError else MaterialTheme.colorScheme.onSurface
                    )
                }
                TextButton(
                    onClick = {
                        clipboard.setText(
                            androidx.compose.ui.text.AnnotatedString(
                                currentAarti.lyrics.joinToString("\n")
                            )
                        )
                    }
                ) {
                    Text(t("copy"))
                }
            }
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(16.dp)
        ) {
            item("header-card") {
                AartiHeaderCard(aarti = currentAarti)
            }

            item("actions-row") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = {
                            val prefill = currentAarti.title
                                .trim()
                                .takeIf { it.isNotBlank() }
                                ?.let { explainNamedPromptTemplate.format(it) }
                                ?: explainGenericPrompt
                            onAskKrishna(prefill)
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(t("ask_lord_krishna"))
                    }
                    OutlinedButton(
                        onClick = { savedStore.toggleSaved(currentAarti.id) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = if (isBookmarked) {
                                BhaktiThemeTokens.AccentPrimary
                            } else {
                                MaterialTheme.colorScheme.onSurface
                            }
                        )
                    ) {
                        Icon(
                            imageVector = if (isBookmarked) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = if (isBookmarked) t("saved") else t("save"),
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
            }

            // Per-verse lyric cards. Verse splitting:
            //  • Android's Aarti.lyrics is already a List<String> of verses, so use that
            //    directly. If a single entry contains paragraph breaks we further split on
            //    "\n\n" so each stanza gets its own card, matching iOS lyricVerses behavior.
            val verses: List<String> = currentAarti.lyrics
                .flatMap { entry -> entry.split("\n\n") }
                .map { it.trim() }
                .filter { it.isNotBlank() }

            item("lyrics-header") {
                Text(
                    text = t("lyrics"),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }

            if (verses.isEmpty()) {
                item("lyrics-empty") {
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        tonalElevation = 1.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = t("aarti_lyrics_empty"),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            } else {
                items(verses.size) { index ->
                    VerseCard(index = index + 1, text = verses[index])
                }
            }

            if (currentAarti.youtubeVideoId != null) {
                item("video-section-title") {
                    Text(
                        text = t("video"),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
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

                if (watchUrl != null) {
                    item("watch-on-youtube") {
                        TextButton(
                            onClick = { uriHandler.openUri(watchUrl) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                imageVector = Icons.Filled.PlayArrow,
                                contentDescription = null,
                                modifier = Modifier.padding(end = 8.dp)
                            )
                            Text(t("watch_on_youtube"))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AartiHeaderCard(aarti: Aarti) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Image(
                    painter = painterResource(id = aartiThumbnailRes(aarti.deity)),
                    contentDescription = t("aarti_icon_content_description").format(aarti.title),
                    modifier = Modifier
                        .size(96.dp)
                        .clip(RoundedCornerShape(18.dp)),
                    contentScale = ContentScale.Crop
                )
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = aarti.title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = deityDisplayName(aarti.deity),
                        style = MaterialTheme.typography.titleSmall,
                        color = BhaktiThemeTokens.AccentPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                    aarti.subtitle?.let { subtitle ->
                        Text(
                            text = subtitle,
                            style = MaterialTheme.typography.bodyMedium,
                            color = BhaktiThemeTokens.TextSecondary
                        )
                    }
                }
            }
            val preview = aarti.preview
            if (preview.isNotBlank()) {
                Text(
                    text = preview,
                    style = MaterialTheme.typography.bodyMedium,
                    color = BhaktiThemeTokens.TextSecondary
                )
            }
        }
    }
}

@Composable
private fun VerseCard(index: Int, text: String) {
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = t("aarti_verse_label").format(index),
                style = MaterialTheme.typography.labelMedium,
                color = BhaktiThemeTokens.AccentPrimary,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = text,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

private fun aartiThumbnailRes(deity: Deity): Int = when (deity) {
    Deity.GANESH -> R.drawable.ic_ganesh_top_aarti
    Deity.SHIV -> R.drawable.ic_shiv_top_aarti
    Deity.LAKSHMI -> R.drawable.ic_lakshmi_top_aarti
    else -> R.drawable.ic_default_aarti
}

@Composable
private fun deityDisplayName(deity: Deity): String = when (deity) {
    Deity.KRISHNA -> t("deity_krishna")
    Deity.GANESH -> t("deity_ganesh")
    Deity.SHIV -> t("deity_shiv")
    Deity.LAKSHMI -> t("deity_lakshmi")
    Deity.DEVI -> t("deity_devi")
    Deity.VISHNU -> t("deity_vishnu")
    Deity.HANUMAN -> t("deity_hanuman")
    Deity.OTHER -> t("deity_other")
}
