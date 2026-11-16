package com.bhaktichat.app.data.remote

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Matrix
import android.media.ExifInterface
import android.graphics.Paint
import android.net.Uri
import android.util.Log
import android.util.Base64
import androidx.core.content.FileProvider
import com.bhaktichat.app.BuildConfig
import com.bhaktichat.app.domain.DIVINE_IDENTITY_REALISM_PREFIX
import com.bhaktichat.app.domain.DivineImageResult
import com.bhaktichat.app.domain.DivineMode
import com.bhaktichat.app.util.AnonUserKey
import com.bhaktichat.app.util.decodeSampledBitmapFromBytes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.io.File
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread
import java.io.FileOutputStream
import java.util.UUID

interface DivineImageGenerator {
    suspend fun generate(
        mode: DivineMode,
        prompt: String,
        inputImageUri: Uri?
    ): Result<DivineImageResult>

    /**
     * Copies a picked photo into app storage, downsampled and upright, and returns its file
     * URI — or null if it can't be read. A GetContent URI is only readable while the picking
     * activity lives, so a later regenerate (or an app-scoped generation) could lose it.
     */
    suspend fun importInputPhoto(uri: Uri): Uri?
}

class RemoteDivineImageGenerator(
    context: Context,
    private val baseUrl: String,
    private val httpClient: OkHttpClient
) : DivineImageGenerator {
    private companion object {
        const val TAG = "DivineImageGenerator"
        const val INPUT_MAX_SIDE = 1536
    }
    private val appContext = context.applicationContext
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()
    private val endpoint = baseUrl.trimEnd('/') + "/api/bhaktigpt/divine-image"

    init {
        // Creations live only in memory, so every photo and result already on disk when a
        // container starts belongs to a creation that no longer exists. Each result is a
        // multi-megabyte PNG; without this the cache only ever grew. The hour of grace is for
        // a file another app may still be reading from a share.
        thread(name = "divine-cache-prune") {
            val cutoff = System.currentTimeMillis() - TimeUnit.HOURS.toMillis(1)
            listOf("divine_images", "divine_inputs").forEach { dir ->
                File(appContext.cacheDir, dir).listFiles()
                    ?.filter { it.isFile && it.lastModified() < cutoff }
                    ?.forEach { it.delete() }
            }
        }
    }

    override suspend fun generate(
        mode: DivineMode,
        prompt: String,
        inputImageUri: Uri?
    ): Result<DivineImageResult> = withContext(Dispatchers.IO) {
        runCatching {
            val finalPrompt = ensureIdentityRealismGuard(prompt)
            val userKey = AnonUserKey.get(appContext)
            val requestId = UUID.randomUUID().toString()
            val requestJson = JSONObject().apply {
                put("mode", mode.name)
                put("prompt", finalPrompt)
                put("userKey", userKey)
                put("requestId", requestId)
                if (inputImageUri != null) {
                    val dataUrl = encodeInputImageAsDataUrl(inputImageUri)
                        ?: error("Selected photo could not be read. Please choose a clear JPG or PNG photo and try again.")
                    put("inputImageDataUrl", dataUrl)
                }
            }
            if (BuildConfig.DEBUG) {
                Log.d(TAG, "Generating divine image with prompt: ${finalPrompt.take(600)}")
            }

            val responseJson = executeGenerationRequest(requestJson)
            val imageBytes = when {
                responseJson.optString("imageBase64").isNotBlank() -> {
                    Base64.decode(responseJson.optString("imageBase64"), Base64.DEFAULT)
                }

                responseJson.optString("imageUrl").isNotBlank() -> {
                    downloadImageBytes(responseJson.optString("imageUrl"))
                }

                else -> error("Image response missing image content.")
            }

            // Downsampled decode, not full-resolution — generated/downloaded images can be
            // arbitrarily large, and decoding at full size here (plus the ARGB_8888 copy
            // below) risks the memory spike Play Console's pre-launch report flagged. 2048px
            // is well above typical generation output, so save/share quality is unaffected.
            val sourceBitmap = decodeSampledBitmapFromBytes(imageBytes, maxDimensionPx = 2048)
                ?: error("Failed to decode generated image.")
            val bitmap = sourceBitmap.copy(Bitmap.Config.ARGB_8888, true)
            sourceBitmap.recycle()
            applyWatermark(bitmap)
            val savedUri = saveBitmapToCache(bitmap)
            bitmap.recycle()

            val variant = responseJson.optString("variant").takeIf { it.isNotBlank() }
            val responseRequestId = responseJson.optString("requestId").takeIf { it.isNotBlank() }
                ?: requestId
            val durationMs = if (responseJson.has("durationMs") && !responseJson.isNull("durationMs")) {
                responseJson.optLong("durationMs", -1L).takeIf { it >= 0L }
            } else {
                null
            }

            DivineImageResult(
                uri = savedUri,
                variant = variant,
                requestId = responseRequestId,
                durationMs = durationMs
            )
        }
    }

    private fun ensureIdentityRealismGuard(prompt: String): String {
        val trimmedPrompt = prompt.trim()
        if (trimmedPrompt.startsWith(DIVINE_IDENTITY_REALISM_PREFIX)) {
            return trimmedPrompt
        }
        return "$DIVINE_IDENTITY_REALISM_PREFIX\n\n$trimmedPrompt"
    }

    private fun executeGenerationRequest(payload: JSONObject): JSONObject {
        val request = Request.Builder()
            .url(endpoint)
            .post(payload.toString().toRequestBody(jsonMedia))
            .addHeader("Accept", "application/json")
            .build()

        httpClient.newCall(request).execute().use { response ->
            // Before parsing: a 402 whose body isn't JSON must still read as "needs membership".
            if (response.code == 402) throw SubscriptionRequiredException()
            val raw = response.body?.string().orEmpty()
            val json = raw.takeIf { it.isNotBlank() }?.let(::JSONObject) ?: JSONObject()
            if (!response.isSuccessful) {
                val error = json.optString("error").ifBlank {
                    "Divine image request failed (${response.code})"
                }
                error(error)
            }
            return json
        }
    }

    private fun downloadImageBytes(url: String): ByteArray {
        val request = Request.Builder()
            .url(url)
            .get()
            .build()
        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                error("Failed to download generated image (${response.code})")
            }
            return response.body?.bytes() ?: error("Generated image body is empty.")
        }
    }

    private fun encodeInputImageAsDataUrl(uri: Uri): String? {
        // Send a higher-fidelity reference so gpt-image-1's edit endpoint (with
        // input_fidelity=high) has more facial detail to preserve → better likeness.
        val outputBitmap = decodeInputPhoto(uri, maxSide = INPUT_MAX_SIDE)
        if (outputBitmap != null) {
            val outputStream = ByteArrayOutputStream()
            outputBitmap.compress(Bitmap.CompressFormat.JPEG, 92, outputStream)
            outputBitmap.recycle()

            val base64 = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
            return "data:image/jpeg;base64,$base64"
        }

        // Not decodable here (unusual format) — pass the original bytes through as before.
        val mimeType = appContext.contentResolver.getType(uri)?.ifBlank { null } ?: "image/jpeg"
        val rawBytes = appContext.contentResolver.openInputStream(uri)?.use(InputStream::readBytes)
            ?: return null
        val base64 = Base64.encodeToString(rawBytes, Base64.NO_WRAP)
        return "data:$mimeType;base64,$base64"
    }

    override suspend fun importInputPhoto(uri: Uri): Uri? = withContext(Dispatchers.IO) {
        runCatching {
            val bitmap = decodeInputPhoto(uri, maxSide = INPUT_MAX_SIDE) ?: return@runCatching null
            // cacheDir, alongside the generated outputs in divine_images/: creations live only
            // in memory, so nothing outlives the cache, and the OS can reclaim old photos.
            val outputDir = File(appContext.cacheDir, "divine_inputs").apply { mkdirs() }
            val file = File(outputDir, "input_${UUID.randomUUID()}.jpg")
            FileOutputStream(file).use { output ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 92, output)
            }
            bitmap.recycle()
            Uri.fromFile(file)
        }.getOrNull()
    }

    /**
     * Decodes [uri] subsampled (never at full camera resolution — 12MP+ photos OOM'd here),
     * caps the long edge at [maxSide] and applies EXIF rotation so faces aren't sent sideways.
     */
    private fun decodeInputPhoto(uri: Uri, maxSide: Int): Bitmap? {
        val resolver = appContext.contentResolver
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

        var sampleSize = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / (sampleSize * 2) >= maxSide) {
            sampleSize *= 2
        }
        val sampled = resolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sampleSize })
        } ?: return null
        val scaled = scaleDownToMaxSide(sampled, maxSide)
        if (scaled !== sampled) sampled.recycle()

        val rotation = runCatching {
            resolver.openInputStream(uri)?.use { stream ->
                when (ExifInterface(stream).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                    ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                    ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                    else -> 0f
                }
            }
        }.getOrNull() ?: 0f
        if (rotation == 0f) return scaled
        val rotated = Bitmap.createBitmap(
            scaled, 0, 0, scaled.width, scaled.height, Matrix().apply { postRotate(rotation) }, true
        )
        if (rotated !== scaled) scaled.recycle()
        return rotated
    }

    private fun scaleDownToMaxSide(bitmap: Bitmap, maxSide: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        val larger = maxOf(width, height)
        if (larger <= maxSide) return bitmap

        val ratio = maxSide.toFloat() / larger.toFloat()
        val scaledWidth = (width * ratio).toInt().coerceAtLeast(1)
        val scaledHeight = (height * ratio).toInt().coerceAtLeast(1)
        return Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)
    }

    private fun saveBitmapToCache(bitmap: Bitmap): Uri {
        val outputDir = File(appContext.cacheDir, "divine_images").apply { mkdirs() }
        val file = File(outputDir, "divine_${System.currentTimeMillis()}.png")
        FileOutputStream(file).use { output ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
        }
        return FileProvider.getUriForFile(
            appContext,
            "${BuildConfig.APPLICATION_ID}.fileprovider",
            file
        )
    }

    private fun applyWatermark(bitmap: Bitmap) {
        val canvas = Canvas(bitmap)
        val textSize = bitmap.width * 0.045f
        val padding = bitmap.width * 0.04f
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = android.graphics.Color.argb(205, 255, 255, 255)
            this.textSize = textSize
            textAlign = Paint.Align.RIGHT
            setShadowLayer(textSize * 0.18f, 0f, 0f, android.graphics.Color.argb(120, 0, 0, 0))
        }
        canvas.drawText(
            "BhaktiChat",
            bitmap.width - padding,
            bitmap.height - padding,
            paint
        )
    }
}
