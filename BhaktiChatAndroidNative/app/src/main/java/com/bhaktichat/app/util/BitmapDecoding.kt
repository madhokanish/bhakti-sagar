package com.bhaktichat.app.util

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import kotlin.math.max

/**
 * Decodes [bytes] into a [Bitmap] downsampled so its largest edge is roughly [maxDimensionPx],
 * instead of decoding at full resolution and scaling down afterward. Network-sourced images
 * (profile photos, generated Divine Images) can be arbitrarily large, and a naive
 * `BitmapFactory.decodeByteArray(bytes, 0, bytes.size)` with no options allocates the full-size
 * bitmap regardless — a real OOM/perf risk flagged by Play Console's pre-launch report.
 *
 * Uses the standard two-pass approach: decode bounds only, compute `inSampleSize`, then decode
 * for real. Mirrors the sampling logic already used for local photo picks in DivineImageUi.kt's
 * `decodeSampledBitmap` (Uri-based there; this is the byte-array equivalent for network data).
 */
fun decodeSampledBitmapFromBytes(bytes: ByteArray, maxDimensionPx: Int): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

    val largestEdge = max(bounds.outWidth, bounds.outHeight)
    val sampleSize = max(1, largestEdge / maxDimensionPx)
    val decodeOptions = BitmapFactory.Options().apply {
        inSampleSize = sampleSize
    }
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, decodeOptions)
}
