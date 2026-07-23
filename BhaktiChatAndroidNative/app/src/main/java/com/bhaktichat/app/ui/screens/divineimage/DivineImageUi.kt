package com.bhaktichat.app.ui.screens.divineimage

import android.graphics.BitmapFactory
import android.net.Uri
import android.util.LruCache
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.max

@Composable
fun UriPreviewImage(
    uriString: String?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
    decodeMaxPx: Int = 720
) {
    val context = LocalContext.current
    val cacheKey = "$uriString#$decodeMaxPx"
    val imageBitmap by produceState<ImageBitmap?>(initialValue = null, key1 = cacheKey) {
        value = withContext(Dispatchers.IO) {
            if (uriString.isNullOrBlank()) return@withContext null
            ImageBitmapCache.get(cacheKey)?.let { return@withContext it }
            val bitmap = runCatching {
                decodeSampledBitmap(
                    uri = Uri.parse(uriString),
                    decodeMaxPx = decodeMaxPx,
                    decode = { uri, options ->
                        context.contentResolver.openInputStream(uri)?.use { stream ->
                            BitmapFactory.decodeStream(stream, null, options)
                        }
                    }
                )?.asImageBitmap()
            }.getOrNull()
            if (bitmap != null) {
                ImageBitmapCache.put(cacheKey, bitmap)
            }
            bitmap
        }
    }

    imageBitmap?.let { bitmap ->
        Image(
            bitmap = bitmap,
            contentDescription = contentDescription,
            modifier = modifier,
            contentScale = contentScale
        )
    }
}

private object ImageBitmapCache {
    private val cache = LruCache<String, ImageBitmap>(24)

    fun get(key: String): ImageBitmap? = cache.get(key)

    fun put(key: String, value: ImageBitmap) {
        cache.put(key, value)
    }
}

private fun decodeSampledBitmap(
    uri: Uri,
    decodeMaxPx: Int,
    decode: (Uri, BitmapFactory.Options) -> android.graphics.Bitmap?
): android.graphics.Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    decode(uri, bounds)

    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

    val largestEdge = max(bounds.outWidth, bounds.outHeight)
    val sampleSize = max(1, largestEdge / decodeMaxPx)
    val decodeOptions = BitmapFactory.Options().apply {
        inSampleSize = sampleSize
        inPreferredConfig = android.graphics.Bitmap.Config.RGB_565
    }
    return decode(uri, decodeOptions)
}
