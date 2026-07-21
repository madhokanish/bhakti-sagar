package com.bhaktichat.app.ui.screens.aartis.components

import android.graphics.Color as AndroidColor
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
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
        "https://www.youtube-nocookie.com/embed/$videoId?modestbranding=1&rel=0&playsinline=1"
    }
    val embedHtml = remember(embedUrl, title) {
        """
        <!doctype html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background: #000000;
              }
              iframe {
                border: 0;
                width: 100%;
                height: 100%;
              }
            </style>
          </head>
          <body>
            <iframe
              src="$embedUrl"
              title="$title"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
          </body>
        </html>
        """.trimIndent()
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
                    setBackgroundColor(AndroidColor.BLACK)
                    settings.apply {
                        javaScriptEnabled = true
                        javaScriptCanOpenWindowsAutomatically = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        setSupportZoom(false)
                        mediaPlaybackRequiresUserGesture = false
                        allowFileAccess = false
                        mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                        cacheMode = WebSettings.LOAD_DEFAULT
                    }
                    // YouTube's mobile embed player switches to fullscreen on tap-to-play via
                    // onShowCustomView/onHideCustomView. A bare WebChromeClient() doesn't
                    // implement these, so the tap silently does nothing — the player renders
                    // but never actually starts. This adds the fullscreen video container the
                    // callback expects, hosted on the Activity's own decor view.
                    webChromeClient = object : WebChromeClient() {
                        private var customView: android.view.View? = null
                        private var customViewCallback: CustomViewCallback? = null

                        override fun onShowCustomView(view: android.view.View?, callback: CustomViewCallback?) {
                            val decorView = (context as? android.app.Activity)
                                ?.window?.decorView as? android.view.ViewGroup ?: return
                            if (customView != null || view == null) {
                                callback?.onCustomViewHidden()
                                return
                            }
                            customView = view
                            customViewCallback = callback
                            decorView.addView(
                                view,
                                android.widget.FrameLayout.LayoutParams(
                                    android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                                    android.widget.FrameLayout.LayoutParams.MATCH_PARENT
                                )
                            )
                        }

                        override fun onHideCustomView() {
                            val decorView = (context as? android.app.Activity)
                                ?.window?.decorView as? android.view.ViewGroup ?: return
                            customView?.let { decorView.removeView(it) }
                            customView = null
                            customViewCallback?.onCustomViewHidden()
                            customViewCallback = null
                        }
                    }
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(
                            view: WebView?,
                            request: WebResourceRequest?
                        ): Boolean = false

                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            if (request?.isForMainFrame == true) {
                                loadFailed = true
                            }
                        }

                        override fun onReceivedHttpError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            errorResponse: WebResourceResponse?
                        ) {
                            if (request?.isForMainFrame == true && errorResponse?.statusCode ?: 200 >= 400) {
                                loadFailed = true
                            }
                        }
                    }
                    tag = videoId
                    loadDataWithBaseURL(
                        "https://www.youtube-nocookie.com",
                        embedHtml,
                        "text/html",
                        "utf-8",
                        null
                    )
                }
            },
            update = { webView ->
                if (webView.tag != videoId) {
                    webView.tag = videoId
                    loadFailed = false
                    webView.loadDataWithBaseURL(
                        "https://www.youtube-nocookie.com",
                        embedHtml,
                        "text/html",
                        "utf-8",
                        null
                    )
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
