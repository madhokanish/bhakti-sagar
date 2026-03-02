package com.bhaktichat.app.ui.screens.aartis.components

import android.graphics.Color as AndroidColor
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.unit.dp

@Composable
fun YouTubePlayerEmbed(
    videoId: String?,
    title: String,
    modifier: Modifier = Modifier,
    onOpenExternal: (() -> Unit)? = null
) {
    if (videoId.isNullOrBlank()) {
        VideoPlaceholder(
            title = "Video coming soon",
            body = "Read the lyrics below while the video is being prepared.",
            modifier = modifier
        )
        return
    }

    var loadFailed by remember(videoId) { mutableStateOf(false) }
    var webViewRef by remember(videoId) { mutableStateOf<WebView?>(null) }
    val embedUrl = remember(videoId) {
        "https://www.youtube.com/embed/$videoId?modestbranding=1&rel=0&playsinline=1"
    }

    DisposableEffect(videoId) {
        onDispose {
            webViewRef?.destroy()
            webViewRef = null
        }
    }

    if (loadFailed) {
        VideoPlaceholder(
            title = "Unable to load video",
            body = "Use YouTube directly for playback.",
            modifier = modifier,
            actionLabel = if (onOpenExternal != null) "Open in YouTube" else null,
            onAction = onOpenExternal
        )
        return
    }

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
                WebView(context).apply {
                    webViewRef = this
                    setBackgroundColor(AndroidColor.TRANSPARENT)
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        mediaPlaybackRequiresUserGesture = false
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        cacheMode = WebSettings.LOAD_DEFAULT
                    }
                    webChromeClient = WebChromeClient()
                    webViewClient = object : WebViewClient() {
                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            if (request?.isForMainFrame == true) {
                                loadFailed = true
                            }
                        }
                    }
                    loadUrl(embedUrl)
                }
            },
            update = { webView ->
                if (webView.url != embedUrl) {
                    webView.loadUrl(embedUrl)
                }
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
