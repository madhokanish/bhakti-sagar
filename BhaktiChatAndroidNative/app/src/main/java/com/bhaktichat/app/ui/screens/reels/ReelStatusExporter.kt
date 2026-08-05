package com.bhaktichat.app.ui.screens.reels

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.bhaktichat.app.BuildConfig
import com.bhaktichat.app.domain.Reel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URL

/**
 * Downloads a reel's video to the app cache and hands it to the system share sheet —
 * mirrors iOS's `ReelStatusExporter`. WhatsApp only offers its "Add to Status" action for
 * locally-held media, not a remote URL, so sharing `reel.videoUrl` directly would just share
 * a link; downloading first is what makes both "Share" and "Set as Status" actually work.
 */
object ReelStatusExporter {
    suspend fun export(context: Context, reel: Reel, chooserTitle: String): Boolean {
        val uri = withContext(Dispatchers.IO) {
            val urlString = reel.videoUrl ?: return@withContext null
            runCatching {
                val outputDir = File(context.cacheDir, "reel_export").apply { mkdirs() }
                val ext = urlString.substringAfterLast('.', "mp4").substringBefore('?')
                val file = File(outputDir, "${reel.slug}.$ext")
                URL(urlString).openStream().use { input ->
                    file.outputStream().use { output -> input.copyTo(output) }
                }
                FileProvider.getUriForFile(context, "${BuildConfig.APPLICATION_ID}.fileprovider", file)
            }.getOrNull()
        } ?: return false

        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            // The Aarti feed is audio-only; sharing it as video/mp4 made Android offer the
            // wrong targets. Reel status exports remain video, while Aarti sharing is audio.
            type = if (reel.hasVideoTrack) "video/mp4" else "audio/mpeg"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(sendIntent, chooserTitle))
        return true
    }
}
