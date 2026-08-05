package com.bhaktichat.app.ui.screens.aartis.components

import android.content.Context
import androidx.annotation.DrawableRes
import com.bhaktichat.app.R
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.domain.Deity

/**
 * Resolves the drawable for [aarti] — its own generated artwork when available, falling back to
 * a shared per-deity image for older data / lookup misses.
 */
@DrawableRes
fun aartiImageRes(context: Context, aarti: Aarti): Int =
    aartiImageRes(context, aarti.imageAssetName, aarti.deity)

/**
 * Same resolution, from primitives rather than a full [Aarti] — used by the app-root full-screen
 * player, which only has the playing track's metadata (via [com.bhaktichat.app.playback.AartiPlayerState]),
 * not the whole aarti list. Shared with the row thumbnail so both stay in sync.
 */
@DrawableRes
fun aartiImageRes(context: Context, imageAssetName: String?, deity: Deity): Int {
    val byName = imageAssetName?.let { name ->
        context.resources.getIdentifier(name, "drawable", context.packageName)
            .takeIf { it != 0 }
    }
    return byName ?: when (deity) {
        Deity.GANESH -> R.drawable.ic_ganesh_top_aarti
        Deity.SHIV -> R.drawable.ic_shiv_top_aarti
        Deity.LAKSHMI -> R.drawable.ic_lakshmi_top_aarti
        Deity.KRISHNA -> R.drawable.avatar_krishna
        Deity.HANUMAN -> R.drawable.hanumanji
        else -> R.drawable.ic_default_aarti
    }
}
