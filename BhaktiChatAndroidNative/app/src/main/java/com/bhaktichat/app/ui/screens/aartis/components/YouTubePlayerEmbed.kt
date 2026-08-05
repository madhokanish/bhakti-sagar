package com.bhaktichat.app.ui.screens.aartis.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.bhaktichat.app.ui.i18n.t
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.PlayerConstants
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.YouTubePlayerCallback
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.options.IFramePlayerOptions
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView

/**
 * In-app YouTube playback via the IFrame Player API (through the android-youtube-player
 * wrapper), not a hand-rolled WebView+HTML embed — the earlier hand-rolled version rendered
 * as a solid black rectangle with no error on some devices/emulators. This wrapper handles the
 * JS bridge, playback state, and WebView quirks that the hand-rolled version got wrong.
 */
@Composable
fun YouTubePlayerEmbed(
    videoId: String?,
    title: String,
    modifier: Modifier = Modifier,
    onOpenExternal: (() -> Unit)? = null
) {
    if (videoId.isNullOrBlank()) {
        VideoPlaceholder(
            title = t("video_coming_soon"),
            body = t("video_coming_soon_body"),
            modifier = modifier
        )
        return
    }

    val lifecycleOwner = LocalLifecycleOwner.current

    Surface(
        shape = RoundedCornerShape(20.dp),
        tonalElevation = 1.dp,
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
    ) {
        AndroidView(
            modifier = Modifier.fillMaxWidth(),
            factory = { context ->
                YouTubePlayerView(context).apply {
                    tag = videoId
                    // The library loads its player HTML via loadDataWithBaseURL using this
                    // origin as the base URL. Left unset, videos with an "allowed domains"
                    // embedding restriction fail identically for every video (error 152) —
                    // a real, registered origin is required, not just any string.
                    enableAutomaticInitialization = false
                    lifecycleOwner.lifecycle.addObserver(this)
                    initialize(
                        object : AbstractYouTubePlayerListener() {
                            override fun onReady(youTubePlayer: YouTubePlayer) {
                                youTubePlayer.cueVideo(videoId, 0f)
                            }

                            override fun onError(
                                youTubePlayer: YouTubePlayer,
                                error: PlayerConstants.PlayerError
                            ) {
                                // Swallow — if playback genuinely fails, the "Watch on
                                // YouTube" fallback below the lyrics still gets users there.
                            }
                        },
                        IFramePlayerOptions.Builder()
                            .origin("https://bhaktichat.com")
                            .build()
                    )
                }
            },
            update = { view ->
                if (view.tag != videoId) {
                    view.tag = videoId
                    view.getYouTubePlayerWhenReady(object : YouTubePlayerCallback {
                        override fun onYouTubePlayer(youTubePlayer: YouTubePlayer) {
                            youTubePlayer.cueVideo(videoId, 0f)
                        }
                    })
                }
            },
            onRelease = { view ->
                lifecycleOwner.lifecycle.removeObserver(view)
                view.release()
            }
        )
    }
}

@Composable
private fun VideoPlaceholder(
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null
) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        tonalElevation = 1.dp,
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = body,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (!actionLabel.isNullOrBlank() && onAction != null) {
                    Button(onClick = onAction) {
                        Text(actionLabel)
                    }
                }
            }
        }
    }
}
