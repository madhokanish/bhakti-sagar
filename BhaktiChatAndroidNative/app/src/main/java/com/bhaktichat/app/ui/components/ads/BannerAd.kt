package com.bhaktichat.app.ui.components.ads

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bhaktichat.app.BhaktiChatApplication
import com.bhaktichat.app.BuildConfig
import com.bhaktichat.app.util.Analytics
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView

/**
 * A standard 320x50 AdMob banner as a Composable. Defaults to the (test) banner unit from
 * BuildConfig. [placement] is a stable label reported to analytics (e.g. "aartis_list").
 *
 * The [AdView] is remembered and destroyed on dispose so it isn't leaked across recompositions.
 * Impressions/clicks are forwarded to PostHog via [Analytics].
 *
 * An ad-free experience is part of the Chadhaava subscription, so this renders nothing for
 * entitled users. The check lives here rather than at each call site so a future placement
 * can't forget it.
 */
@Composable
fun BannerAd(
    placement: String,
    modifier: Modifier = Modifier,
    adUnitId: String = BuildConfig.ADMOB_BANNER_ID
) {
    val context = LocalContext.current
    val isPro by (context.applicationContext as BhaktiChatApplication)
        .container.entitlementStore.isPro.collectAsStateWithLifecycle()
    if (isPro) return

    val adView = remember {
        AdView(context).apply {
            setAdSize(AdSize.BANNER)
            this.adUnitId = adUnitId
            adListener = object : AdListener() {
                override fun onAdImpression() = Analytics.adShown("banner", placement)
                override fun onAdClicked() = Analytics.adClicked("banner", placement)
            }
        }
    }

    DisposableEffect(Unit) {
        adView.loadAd(AdRequest.Builder().build())
        onDispose { adView.destroy() }
    }

    AndroidView(
        factory = { adView },
        modifier = modifier.fillMaxWidth()
    )
}
