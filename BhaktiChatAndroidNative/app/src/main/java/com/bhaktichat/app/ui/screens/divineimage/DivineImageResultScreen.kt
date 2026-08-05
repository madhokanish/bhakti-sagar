package com.bhaktichat.app.ui.screens.divineimage
import com.bhaktichat.app.ui.i18n.LocalAppLanguage
import com.bhaktichat.app.ui.i18n.t

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.IosShare
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.ThumbDown
import androidx.compose.material.icons.outlined.ThumbUp
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bhaktichat.app.BhaktiChatApplication
import com.bhaktichat.app.domain.CreationStatus
import com.bhaktichat.app.ui.components.ads.findActivity
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import kotlinx.coroutines.flow.Flow
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DivineImageResultScreen(
    uiState: DivineImageResultUiState,
    uiEvents: Flow<DivineImageResultUiEvent>,
    onBack: () -> Unit,
    onBackToHome: () -> Unit,
    onCancel: () -> Unit,
    onRegenerate: () -> Unit,
    onSave: () -> Unit,
    onShareToInstagram: () -> Unit,
    onShareToWhatsApp: () -> Unit,
    onShareWithSystem: () -> Unit,
    onFeedback: (String) -> Unit = {}
) {
    val context = LocalContext.current
    val creation = uiState.creation

    // Ad-model: show the interstitial once, over the generation wait. It plays while the
    // backend generates in parallel, so the result reveal underneath stays uninterrupted.
    // Only fires for a fresh generation (arriving in GENERATING) — not when viewing history.
    var interstitialShown by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(creation?.status) {
        if (!interstitialShown && creation?.status == CreationStatus.GENERATING) {
            interstitialShown = true
            context.findActivity()?.let { activity ->
                (context.applicationContext as BhaktiChatApplication).container
                    .interstitialAdManager.loadThenShow(activity, placement = "divine_generation")
            }
        }
    }

    // Resolved in composition; the collector below runs outside it.
    val savedMessage = t("di_saved")
    val saveFailedMessage = t("di_save_failed")
    val shareCaption = t("di_share_caption")
    val shareChooserTitle = t("di_share")
    val noShareAppMessage = t("di_no_share_app")

    LaunchedEffect(uiEvents) {
        uiEvents.collect { event ->
            when (event) {
                DivineImageResultUiEvent.NavigateHome -> onBackToHome()
                is DivineImageResultUiEvent.SaveImage -> {
                    saveImageToDevice(context, Uri.parse(event.uri), saveFailedMessage)
                    Toast.makeText(context, savedMessage, Toast.LENGTH_SHORT).show()
                }
                is DivineImageResultUiEvent.ShareImage -> {
                    shareImage(
                        context = context,
                        uri = Uri.parse(event.uri),
                        targetPackage = event.targetPackage,
                        caption = shareCaption,
                        chooserTitle = shareChooserTitle,
                        noAppMessage = noShareAppMessage
                    )
                }
            }
        }
    }

    val status = creation?.status ?: CreationStatus.GENERATING
    val topTitle = if (status == CreationStatus.GENERATING) t("di_generating_ellipsis") else t("di_result_title")

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item("topbar") {
            AppTopBar(
                title = topTitle,
                leftContent = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Outlined.ArrowBack,
                            contentDescription = t("go_back"),
                            tint = DivineImagePalette.TextPrimary
                        )
                    }
                },
                rightContent = {
                    if (status == CreationStatus.SUCCESS) {
                        IconButton(onClick = onShareWithSystem) {
                            Icon(
                                imageVector = Icons.Filled.IosShare,
                                contentDescription = t("common_share"),
                                tint = DivineImagePalette.DeepAccent
                            )
                        }
                    }
                }
            )
        }

        when (status) {
            CreationStatus.GENERATING -> {
                item("generating") {
                    GeneratingState(
                        inputImageUri = creation?.inputImageUri,
                        onCancel = onCancel
                    )
                }
            }

            CreationStatus.SUCCESS -> {
                if (creation != null) {
                    item("result_image") {
                        ResultImageCard(uriString = creation.outputImageUri)
                    }

                    item("result_title") {
                        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(
                                text = divineChoiceDisplayText(creation.templateTitle, LocalAppLanguage.current).ifBlank { t("di_your_darshan") },
                                fontSize = 19.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = DivineImagePalette.TextPrimary
                            )
                            Text(
                                text = t("di_just_created"),
                                fontSize = 12.5.sp,
                                color = DivineImagePalette.TextSecondary
                            )
                        }
                    }

                    if (creation.variant != null && creation.requestId != null) {
                        item("feedback") {
                            FeedbackRow(
                                submitted = uiState.feedbackSubmitted,
                                onFeedback = onFeedback
                            )
                        }
                    }

                    item("primary_actions") {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            GradientActionButton(
                                label = t("common_save"),
                                icon = Icons.Filled.Download,
                                modifier = Modifier.weight(1f),
                                onClick = onSave
                            )
                            OutlineActionButton(
                                label = t("common_share"),
                                icon = Icons.Filled.IosShare,
                                modifier = Modifier.weight(1f),
                                onClick = onShareWithSystem
                            )
                        }
                    }

                    item("secondary_actions") {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(22.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Spacer(modifier = Modifier.weight(1f))
                            TextIconAction(
                                label = t("di_regenerate"),
                                icon = Icons.Filled.Refresh,
                                onClick = onRegenerate
                            )
                            TextIconAction(
                                label = t("di_make_another"),
                                icon = Icons.Filled.Add,
                                onClick = onBackToHome
                            )
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }

                    // Quota note removed — ad-based model, no image limit.
                }
            }

            CreationStatus.FAILED,
            CreationStatus.IDLE -> {
                item("failed") {
                    val failureMessage = creation?.errorMessage
                        ?.takeIf { it.isNotBlank() }
                        ?: t("di_err_generate_failed")
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = DivineImagePalette.Card,
                        border = androidx.compose.foundation.BorderStroke(1.dp, DivineImagePalette.CardBorderStrong)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text(
                                text = failureMessage,
                                fontSize = 15.sp,
                                color = DivineImagePalette.TextPrimary
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                GradientActionButton(
                                    label = t("di_try_again"),
                                    icon = Icons.Filled.Refresh,
                                    modifier = Modifier.weight(1f),
                                    onClick = onRegenerate
                                )
                                OutlineActionButton(
                                    label = t("go_back"),
                                    icon = null,
                                    modifier = Modifier.weight(1f),
                                    onClick = onBackToHome
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Generating wait state (STEP 4) ---------------------------------------

@Composable
private fun GeneratingState(
    inputImageUri: String?,
    onCancel: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(360.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0xFF3A1E4E),
                            Color(0xFF7A2F2C),
                            Color(0xFFC24A16)
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            // Faint user photo behind the wash.
            if (!inputImageUri.isNullOrBlank()) {
                UriPreviewImage(
                    uriString = inputImageUri,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxSize()
                        .alpha(0.18f),
                    contentScale = ContentScale.Crop,
                    decodeMaxPx = 720
                )
            }
            ShimmerSweep()

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                CircularProgressIndicator(
                    modifier = Modifier.size(54.dp),
                    strokeWidth = 3.dp,
                    color = Color(0xFFFFD873),
                    trackColor = Color.White.copy(alpha = 0.25f)
                )
                Text(
                    text = t("di_result_creating"),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }

        LinearProgressIndicator(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(999.dp)),
            color = DivineImagePalette.NumberHighlight,
            trackColor = DivineImagePalette.NumberHighlight.copy(alpha = 0.14f)
        )

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = Icons.Outlined.Schedule,
                contentDescription = null,
                tint = DivineImagePalette.TextSecondary,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = t("di_result_eta"),
                fontSize = 13.sp,
                color = DivineImagePalette.TextSecondary
            )
        }
        Text(
            text = t("di_keep_open"),
            fontSize = 12.sp,
            color = DivineImagePalette.TextMuted
        )

        Text(
            text = t("common_cancel"),
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = DivineImagePalette.TextMuted,
            modifier = Modifier
                .clip(RoundedCornerShape(999.dp))
                .clickable(onClick = onCancel)
                .padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

/** Diagonal shimmer sweep that loops across the wait card. */
@Composable
private fun ShimmerSweep() {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val progress by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmerProgress"
    )
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        Color.Transparent,
                        Color.White.copy(alpha = 0.14f),
                        Color.Transparent
                    ),
                    start = Offset(progress * 1200f - 400f, 0f),
                    end = Offset(progress * 1200f, 400f)
                )
            )
    )
}

// MARK: - Result pieces (STEP 5) -----------------------------------------------

@Composable
private fun ResultImageCard(uriString: String?) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(386.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(DivineImagePalette.Card)
            .border(1.dp, DivineImagePalette.CardBorderStrong, RoundedCornerShape(24.dp))
    ) {
        UriPreviewImage(
            uriString = uriString,
            contentDescription = t("di_result_title"),
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
            decodeMaxPx = 1200
        )
        // Soft top glow.
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(80.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(Color.White.copy(alpha = 0.12f), Color.Transparent)
                    )
                )
        )
    }
}

@Composable
private fun FeedbackRow(
    submitted: Boolean,
    onFeedback: (String) -> Unit
) {
    if (submitted) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = DivineImagePalette.Success.copy(alpha = 0.08f),
            border = androidx.compose.foundation.BorderStroke(1.dp, DivineImagePalette.Success.copy(alpha = 0.3f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp, horizontal = 16.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.CheckCircle,
                    contentDescription = null,
                    tint = DivineImagePalette.Success,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = t("di_feedback_thanks"),
                    fontSize = 13.sp,
                    color = DivineImagePalette.TextSecondary
                )
            }
        }
    } else {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedButton(onClick = { onFeedback("up") }, modifier = Modifier.weight(1f)) {
                Icon(imageVector = Icons.Outlined.ThumbUp, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(t("di_beautiful"))
            }
            OutlinedButton(onClick = { onFeedback("down") }, modifier = Modifier.weight(1f)) {
                Icon(imageVector = Icons.Outlined.ThumbDown, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(t("di_needs_work"))
            }
        }
    }
}

@Composable
private fun GradientActionButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector?,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(50.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.linearGradient(
                    listOf(
                        BhaktiThemeTokens.AccentGradientStart,
                        BhaktiThemeTokens.AccentGradientEnd
                    )
                )
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            icon?.let {
                Icon(imageVector = it, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
            }
            Text(text = label, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun OutlineActionButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector?,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(50.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(DivineImagePalette.Card)
            .border(1.dp, DivineImagePalette.CardBorderStrong, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            icon?.let {
                Icon(imageVector = it, contentDescription = null, tint = DivineImagePalette.DeepAccent, modifier = Modifier.size(18.dp))
            }
            Text(text = label, color = DivineImagePalette.DeepAccent, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun TextIconAction(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 6.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = DivineImagePalette.DeepAccent, modifier = Modifier.size(18.dp))
        Text(text = label, color = DivineImagePalette.DeepAccent, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
    }
}

// Copy is passed in already resolved: these run outside composition, and the caller is a
// composable that can read the current language.
private fun saveImageToDevice(
    context: Context,
    sourceUri: Uri,
    saveFailedMessage: String
) {
    val resolver = context.contentResolver
    val fileName = "bhakti_divine_${System.currentTimeMillis()}.png"

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
                    ?: error(saveFailedMessage)
                resolver.openOutputStream(outputUri)?.use { output ->
                    inputStream.copyTo(output)
                }
                contentValues.clear()
                contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(outputUri, contentValues, null, null)
            } else {
                val outputDir = File(
                    context.getExternalFilesDir(Environment.DIRECTORY_PICTURES),
                    "BhaktiChat"
                ).apply { mkdirs() }
                val outputFile = File(outputDir, fileName)
                FileOutputStream(outputFile).use { output ->
                    inputStream.copyTo(output)
                }
                MediaScannerConnection.scanFile(context, arrayOf(outputFile.absolutePath), null, null)
            }
        }
    }.onFailure {
        val fallbackDir = File(context.cacheDir, "saved_divine").apply { mkdirs() }
        val fallbackFile = File(fallbackDir, fileName)
        FileOutputStream(fallbackFile).use { output ->
            resolver.openInputStream(sourceUri)?.use { fallbackInput ->
                fallbackInput.copyTo(output)
            }
        }
    }
}

private fun shareImage(
    context: Context,
    uri: Uri,
    targetPackage: String? = null,
    caption: String,
    chooserTitle: String,
    noAppMessage: String
) {
    val sendIntent = Intent(Intent.ACTION_SEND).apply {
        type = "image/*"
        putExtra(Intent.EXTRA_STREAM, uri)
        // Attribution + install loop: a shared image should carry a caption and a link
        // back so viewers on WhatsApp/Instagram can find and install the app.
        putExtra(Intent.EXTRA_TEXT, caption)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

    if (!targetPackage.isNullOrBlank()) {
        sendIntent.setPackage(targetPackage)
        val hasHandler = sendIntent.resolveActivity(context.packageManager) != null
        if (hasHandler) {
            context.startActivity(sendIntent)
            return
        }
        Toast.makeText(context, noAppMessage, Toast.LENGTH_SHORT).show()
    }

    context.startActivity(
        Intent.createChooser(sendIntent, chooserTitle)
    )
}
