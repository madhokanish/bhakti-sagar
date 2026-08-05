package com.bhaktichat.app.playback

import com.bhaktichat.app.util.LanguageStore

import com.bhaktichat.app.ui.i18n.translate

import android.content.ComponentName
import android.content.Context
import android.os.Bundle
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.domain.Deity
import com.bhaktichat.app.util.Analytics
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

private const val EXTRA_IMAGE_ASSET_NAME = "imageAssetName"
private const val EXTRA_DEITY = "deity"

/**
 * What the UI needs to render the mini-player / now-playing state. Artwork identity travels as
 * [imageAssetName]/[deity] (sourced from the MediaItem's own metadata, see [toMediaItem]) rather
 * than a full [Aarti] object, so the app-root full-screen player can render correctly without
 * needing the whole aarti list loaded at that level — only the Aartis screen loads that.
 */
data class AartiPlayerState(
    val currentAartiId: String? = null,
    val title: String = "",
    val subtitle: String = "",
    val imageAssetName: String? = null,
    val deity: Deity = Deity.OTHER,
    val isPlaying: Boolean = false,
    val isBuffering: Boolean = false,
    val hasQueue: Boolean = false,
    /** Whether the Spotify-style full-screen "now playing" overlay is open. Lives here (not in
     * a screen-local state) so both the Aartis screen and the app root can read/drive it without
     * threading a callback through the nav graph. */
    val isFullScreen: Boolean = false
)

/**
 * App-side handle to the [AartiPlaybackService]. Binds a [MediaController] to the session and
 * exposes a simple [StateFlow] + play/pause/next/prev API. ExoPlayer auto-advances through the
 * queue, which gives the "one aarti after another" continuous playback for free.
 */
class AartiPlayerController(private val context: Context,
    private val languageStore: LanguageStore
) {
    private var controller: MediaController? = null
    private var isConnecting = false
    private var pendingPlayback: Triple<List<Aarti>, String?, Long>? = null
    private val _state = MutableStateFlow(AartiPlayerState())
    val state: StateFlow<AartiPlayerState> = _state.asStateFlow()

    // Analytics bookkeeping for the currently-playing track. trackStartedAtMillis is a wall-clock
    // timestamp, not player position, so a paused-and-resumed track slightly over-counts elapsed
    // time — acceptable for analytics, not worth threading exact position through for.
    private var currentTrackId: String? = null
    private var trackStartedAtMillis: Long = 0L

    private val listener = object : Player.Listener {
        override fun onEvents(player: Player, events: Player.Events) = updateState()

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            currentTrackId?.let { previousId ->
                val elapsedSeconds = (System.currentTimeMillis() - trackStartedAtMillis) / 1000
                when (reason) {
                    Player.MEDIA_ITEM_TRANSITION_REASON_AUTO ->
                        Analytics.aartiPlayCompleted(previousId, elapsedSeconds)
                    Player.MEDIA_ITEM_TRANSITION_REASON_SEEK ->
                        Analytics.aartiSkipped(previousId, elapsedSeconds)
                }
            }
            currentTrackId = mediaItem?.mediaId
            trackStartedAtMillis = System.currentTimeMillis()
            mediaItem?.mediaId?.let { Analytics.aartiPlayStarted(it) }
        }
    }

    /** Idempotent — safe to call from the Aartis screen every time it appears. */
    fun initialize() {
        if (controller != null || isConnecting) return
        isConnecting = true
        val token = SessionToken(context, ComponentName(context, AartiPlaybackService::class.java))
        val future = MediaController.Builder(context, token).buildAsync()
        future.addListener({
            controller = runCatching { future.get() }.getOrNull()?.also { it.addListener(listener) }
            isConnecting = false
            updateState()
            pendingPlayback?.let { (aartis, startId, startPositionMillis) ->
                pendingPlayback = null
                playQueue(aartis, startId, startPositionMillis)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    /** Plays the audio-having aartis as a queue, starting at [startId] (or the first one). */
    fun playQueue(aartis: List<Aarti>, startId: String?, startPositionMillis: Long = 0L) {
        val playable = aartis.filter { it.hasAudio }
        if (playable.isEmpty()) return
        val c = controller
        if (c == null) {
            pendingPlayback = Triple(playable, startId, startPositionMillis.coerceAtLeast(0L))
            initialize()
            return
        }
        val startIndex = startId
            ?.let { id -> playable.indexOfFirst { it.id == id } }
            ?.takeIf { it >= 0 } ?: 0
        c.setMediaItems(
            playable.map(::toMediaItem),
            startIndex,
            startPositionMillis.coerceAtLeast(0L)
        )
        c.prepare()
        c.play()
    }

    fun togglePlayPause() {
        val c = controller ?: return
        if (c.isPlaying) c.pause() else c.play()
    }

    fun next() = controller?.seekToNextMediaItem() ?: Unit
    fun previous() = controller?.seekToPreviousMediaItem() ?: Unit

    /** Current track progress as 0f..1f for the mini-player bar; 0f when duration is unknown. */
    fun positionFraction(): Float {
        val c = controller ?: return 0f
        val dur = c.duration
        if (dur <= 0L) return 0f
        return (c.currentPosition.toFloat() / dur.toFloat()).coerceIn(0f, 1f)
    }

    /** Current playback position, for the full-screen player's elapsed-time label. */
    fun positionMillis(): Long = controller?.currentPosition ?: 0L

    /** Current track duration, or 0 while unknown (e.g. still buffering). */
    fun durationMillis(): Long = controller?.duration?.takeIf { it > 0L } ?: 0L

    /** Seeks within the current track to [fraction] (0f..1f) — used by the scrubber. */
    fun seekToFraction(fraction: Float) {
        val c = controller ?: return
        val dur = c.duration
        if (dur <= 0L) return
        c.seekTo((dur * fraction.toDouble()).toLong())
    }

    fun stop() {
        controller?.apply {
            stop()
            clearMediaItems()
        }
        _state.update { it.copy(isFullScreen = false) }
    }

    fun expandFullScreen() = _state.update { it.copy(isFullScreen = true) }
    fun collapseFullScreen() = _state.update { it.copy(isFullScreen = false) }

    private fun toMediaItem(a: Aarti): MediaItem =
        MediaItem.Builder()
            .setMediaId(a.id)
            .setUri(a.audioUrl)
            .setMediaMetadata(
                MediaMetadata.Builder()
                    .setTitle(a.title)
                    .setArtist(a.subtitle?.takeIf { it.isNotBlank() } ?: translate("aarti", languageStore.language.value))
                    .setExtras(
                        Bundle().apply {
                            putString(EXTRA_IMAGE_ASSET_NAME, a.imageAssetName)
                            putString(EXTRA_DEITY, a.deity.name)
                        }
                    )
                    .build()
            )
            .build()

    private fun updateState() {
        val c = controller
        // isFullScreen is UI state, not derived from the player — preserve it across rebuilds.
        val wasFullScreen = _state.value.isFullScreen
        if (c == null) {
            _state.value = AartiPlayerState(isFullScreen = wasFullScreen)
            return
        }
        val item = c.currentMediaItem
        val extras = item?.mediaMetadata?.extras
        _state.value = AartiPlayerState(
            currentAartiId = item?.mediaId,
            title = item?.mediaMetadata?.title?.toString().orEmpty(),
            subtitle = item?.mediaMetadata?.artist?.toString().orEmpty(),
            imageAssetName = extras?.getString(EXTRA_IMAGE_ASSET_NAME),
            deity = extras?.getString(EXTRA_DEITY)?.let { name ->
                runCatching { Deity.valueOf(name) }.getOrNull()
            } ?: Deity.OTHER,
            isPlaying = c.isPlaying,
            isBuffering = c.playbackState == Player.STATE_BUFFERING,
            hasQueue = c.mediaItemCount > 0,
            isFullScreen = wasFullScreen
        )
    }

    fun release() {
        controller?.removeListener(listener)
        controller?.release()
        controller = null
        isConnecting = false
        pendingPlayback = null
        currentTrackId = null
    }
}
