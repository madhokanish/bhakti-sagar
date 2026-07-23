package com.bhaktichat.app.ui.screens.explore

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.IosShare
import androidx.compose.material.icons.filled.Wallpaper
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import com.bhaktichat.app.BuildConfig
import com.bhaktichat.app.domain.Wallpapers
import java.io.File
import java.io.FileOutputStream

@Composable
fun WallpaperDetailScreen(
    wallpaperId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val wallpaper = Wallpapers.byId(wallpaperId) ?: run {
        onBack()
        return
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        Image(
            painter = painterResource(id = wallpaper.imageRes),
            contentDescription = wallpaper.title,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Fit
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0f to Color.Black.copy(alpha = 0.55f),
                        0.14f to Color.Transparent,
                        0.78f to Color.Transparent,
                        1f to Color.Black.copy(alpha = 0.75f)
                    )
                )
        )

        IconButton(
            onClick = onBack,
            modifier = Modifier.align(Alignment.TopStart).padding(10.dp)
        ) {
            Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back", tint = Color.White)
        }

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(horizontal = 18.dp, vertical = 22.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Column {
                Text(wallpaper.title, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                Text(wallpaper.subtitle, fontSize = 13.sp, color = Color.White.copy(alpha = 0.85f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                WallpaperAction(
                    icon = Icons.Filled.Download,
                    label = "Save",
                    modifier = Modifier.weight(1f),
                    onClick = {
                        val uri = drawableToCacheUri(context, wallpaper.imageRes, "wallpaper_${wallpaper.id}")
                        saveImageToDevice(context, uri)
                        Toast.makeText(context, "Saved to Photos", Toast.LENGTH_SHORT).show()
                    }
                )
                WallpaperAction(
                    icon = Icons.Filled.IosShare,
                    label = "Share",
                    modifier = Modifier.weight(1f),
                    onClick = {
                        val uri = drawableToCacheUri(context, wallpaper.imageRes, "wallpaper_${wallpaper.id}")
                        shareImage(context, uri)
                    }
                )
                WallpaperAction(
                    icon = Icons.Filled.Wallpaper,
                    label = "Set",
                    modifier = Modifier.weight(1f),
                    onClick = {
                        val uri = drawableToCacheUri(context, wallpaper.imageRes, "wallpaper_${wallpaper.id}")
                        setAsWallpaper(context, uri)
                    }
                )
            }
        }
    }
}

@Composable
private fun WallpaperAction(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier.clip(RoundedCornerShape(16.dp)),
        color = Color.White.copy(alpha = 0.14f),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.padding(horizontal = 4.dp))
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }
    }
}

/** Renders a bundled drawable to a PNG in the app's cache dir and returns a FileProvider URI —
 *  the same pattern DivineImageGenerator uses to turn generated bitmaps into shareable URIs. */
private fun drawableToCacheUri(context: Context, drawableRes: Int, fileNamePrefix: String): Uri {
    val bitmap = BitmapFactory.decodeResource(context.resources, drawableRes)
    val outputDir = File(context.cacheDir, "wallpapers").apply { mkdirs() }
    val file = File(outputDir, "${fileNamePrefix}_${System.currentTimeMillis()}.png")
    FileOutputStream(file).use { output ->
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
    }
    return FileProvider.getUriForFile(context, "${BuildConfig.APPLICATION_ID}.fileprovider", file)
}

private fun saveImageToDevice(context: Context, sourceUri: Uri) {
    val resolver = context.contentResolver
    val fileName = "bhakti_wallpaper_${System.currentTimeMillis()}.png"

    runCatching {
        resolver.openInputStream(sourceUri)?.use { inputStream ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                    put(MediaStore.Images.Media.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/BhaktiChat")
                    put(MediaStore.Images.Media.IS_PENDING, 1)
                }
                val outputUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                    ?: error("Unable to create MediaStore entry.")
                resolver.openOutputStream(outputUri)?.use { output -> inputStream.copyTo(output) }
                contentValues.clear()
                contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(outputUri, contentValues, null, null)
            } else {
                val outputDir = File(context.getExternalFilesDir(Environment.DIRECTORY_PICTURES), "BhaktiChat")
                    .apply { mkdirs() }
                val outputFile = File(outputDir, fileName)
                FileOutputStream(outputFile).use { output -> inputStream.copyTo(output) }
                MediaScannerConnection.scanFile(context, arrayOf(outputFile.absolutePath), null, null)
            }
        }
    }
}

private const val SHARE_CAPTION =
    "Sharing my BhaktiChat wallpaper 🙏\nGet yours free: https://bhaktichat.com"

private fun shareImage(context: Context, uri: Uri) {
    val sendIntent = Intent(Intent.ACTION_SEND).apply {
        type = "image/*"
        putExtra(Intent.EXTRA_STREAM, uri)
        putExtra(Intent.EXTRA_TEXT, SHARE_CAPTION)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    context.startActivity(Intent.createChooser(sendIntent, "Share wallpaper"))
}

/** Hands off to the system's own wallpaper picker/cropper via ACTION_ATTACH_DATA — works
 *  regardless of source image aspect ratio since the OS handles cropping, not us. */
private fun setAsWallpaper(context: Context, uri: Uri) {
    val intent = Intent(Intent.ACTION_ATTACH_DATA).apply {
        setDataAndType(uri, "image/*")
        putExtra("mimeType", "image/*")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    runCatching {
        context.startActivity(Intent.createChooser(intent, "Set as wallpaper"))
    }.onFailure {
        Toast.makeText(context, "No wallpaper app found on this device.", Toast.LENGTH_SHORT).show()
    }
}
