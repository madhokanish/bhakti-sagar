package com.bhaktichat.app.ui.screens.aartis

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.playback.AartiPlayerController
import com.bhaktichat.app.playback.AartiPlayerState
import com.bhaktichat.app.ui.i18n.t
import com.bhaktichat.app.ui.screens.aartis.components.aartiImageRes
import kotlinx.coroutines.delay

/**
 * Full-screen "now playing" surface, Spotify-style: large artwork, a scrubber with time labels,
 * and previous / play-pause / next transport. Rendered at the app root (see BhaktiChatApp.kt) as
 * a plain composable overlay — NOT an Android `Dialog` — because a `Dialog` opened from inside a
 * NavHost destination composes inside that destination's own fade-transition graphicsLayer, and
 * on at least this device/emulator that lets the Aartis screen behind bleed through the dialog's
 * own content. Living at the root avoids that entirely: same window, same composition, drawn on
 * top of the Scaffold in z-order — exactly how the mini-player itself already renders cleanly.
 */
@Composable
fun AartiNowPlayingScreen(
    state: AartiPlayerState,
    playerController: AartiPlayerController,
    onDismiss: () -> Unit
) {
    var elapsedMillis by remember { mutableLongStateOf(0L) }
    var durationMillis by remember { mutableLongStateOf(0L) }
    var scrubFraction by remember { mutableFloatStateOf(0f) }
    var isScrubbing by remember { mutableStateOf(false) }

    // This overlay isn't a Dialog/nav destination, so the system back button doesn't reach it
    // for free — intercept it explicitly to minimize instead of doing nothing / navigating away
    // whatever's underneath.
    androidx.activity.compose.BackHandler(onBack = onDismiss)

    LaunchedEffect(Unit) {
        while (true) {
            durationMillis = playerController.durationMillis()
            elapsedMillis = playerController.positionMillis()
            if (!isScrubbing && durationMillis > 0L) {
                scrubFraction = (elapsedMillis.toFloat() / durationMillis.toFloat()).coerceIn(0f, 1f)
            }
            delay(500)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            // A plain solid Modifier.background(Color) is the one mechanism confirmed (by direct
            // on-device testing) to render fully opaque here with zero bleed-through from the
            // screen behind. A Brush.verticalGradient — even one explicitly bounded to this
            // Box's own measured height via drawWithCache — still let the screen behind partly
            // show through in testing; not worth the risk for a purely cosmetic top tint.
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Header(onDismiss = onDismiss)

            Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                Artwork(state)
            }

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp)
            ) {
                Text(
                    text = state.title.ifBlank { t("aarti_fallback_title") },
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onBackground,
                    maxLines = 2
                )
                Text(
                    text = state.subtitle.ifBlank { t("bhaktichat_aartis_subtitle") },
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }

            Column(modifier = Modifier.fillMaxWidth().padding(top = 20.dp)) {
                Slider(
                    value = scrubFraction,
                    onValueChange = {
                        isScrubbing = true
                        scrubFraction = it
                    },
                    onValueChangeFinished = {
                        playerController.seekToFraction(scrubFraction)
                        isScrubbing = false
                    },
                    colors = SliderDefaults.colors(
                        thumbColor = MaterialTheme.colorScheme.primary,
                        activeTrackColor = MaterialTheme.colorScheme.primary,
                        inactiveTrackColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                    )
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = formatTime(
                            if (durationMillis > 0) (scrubFraction * durationMillis).toLong() else elapsedMillis
                        ),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = if (state.isBuffering) t("buffering") else formatTime(durationMillis),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(44.dp),
                modifier = Modifier.padding(vertical = 28.dp)
            ) {
                IconButton(onClick = { playerController.previous() }, modifier = Modifier.size(48.dp)) {
                    Icon(
                        imageVector = Icons.Filled.SkipPrevious,
                        contentDescription = t("previous_aarti_content_description"),
                        tint = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.size(36.dp)
                    )
                }
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(76.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary)
                ) {
                    IconButton(onClick = { playerController.togglePlayPause() }) {
                        Icon(
                            imageVector = if (state.isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                            contentDescription = if (state.isPlaying) t("pause_label") else t("play_label"),
                            tint = MaterialTheme.colorScheme.onPrimary,
                            modifier = Modifier.size(34.dp)
                        )
                    }
                }
                IconButton(onClick = { playerController.next() }, modifier = Modifier.size(48.dp)) {
                    Icon(
                        imageVector = Icons.Filled.SkipNext,
                        contentDescription = t("next_aarti_content_description"),
                        tint = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.size(36.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun Header(onDismiss: () -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            // This overlay isn't inset-aware by default (it's a plain root-level composable, not
            // a Scaffold destination), so without this the minimize button sits directly under
            // the status bar — both visually overlapping its icons and, on at least this device/
            // emulator, in a zone where taps don't reach the button at all.
            .statusBarsPadding()
            .padding(top = 12.dp, bottom = 4.dp)
    ) {
        IconButton(onClick = onDismiss) {
            Icon(
                imageVector = Icons.Filled.KeyboardArrowDown,
                contentDescription = t("minimize_player_content_description"),
                tint = MaterialTheme.colorScheme.onBackground
            )
        }
        Column(
            modifier = Modifier.weight(1f),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = t("playing_from"),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
            )
            Text(
                text = t("bhaktichat_aartis_subtitle"),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onBackground
            )
        }
        Box(modifier = Modifier.size(48.dp))
    }
}

@Composable
private fun Artwork(state: AartiPlayerState) {
    val context = LocalContext.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .clip(RoundedCornerShape(28.dp))
    ) {
        if (state.currentAartiId != null) {
            Image(
                painter = painterResource(
                    id = remember(state.imageAssetName, state.deity) {
                        aartiImageRes(context, state.imageAssetName, state.deity)
                    }
                ),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.surfaceVariant)
            )
        }
    }
}

private fun formatTime(millis: Long): String {
    if (millis <= 0L) return "0:00"
    val totalSeconds = millis / 1000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "%d:%02d".format(minutes, seconds)
}
