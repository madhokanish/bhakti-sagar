package com.bhaktichat.app.ui.components.ads

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.util.Log
import com.bhaktichat.app.BuildConfig
import com.bhaktichat.app.util.Analytics
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback

/**
 * Loads and shows a single interstitial at a time, auto-preloading the next one after each
 * show. Not yet wired to any placement — create one instance (e.g. in the Activity or a
 * container), call [load] early, then [show] at a natural break such as the Divine-Image
 * result → back transition. Impressions/clicks flow to PostHog via [Analytics].
 *
 * IMPORTANT: never show an interstitial mid chat, mid aarti playback, or during the
 * divine-image generation wait — those are active devotional/anticipation moments.
 */
class InterstitialAdManager(
    private val adUnitId: String = BuildConfig.ADMOB_INTERSTITIAL_ID,
    /**
     * An ad-free experience is part of the Chadhaava subscription. Checked here rather than
     * at each call site so a future placement can't forget it, and read lazily so entitlement
     * gained mid-session takes effect without recreating this manager.
     */
    private val isPro: () -> Boolean = { false }
) {
    private var ad: InterstitialAd? = null
    private var loading = false
    private var pendingShowRequest: PendingShowRequest? = null

    private data class PendingShowRequest(
        val activity: Activity,
        val placement: String,
        val onDone: () -> Unit
    )

    /** Preloads an interstitial if one isn't already loaded/loading. Safe to call repeatedly. */
    fun load(context: Context) {
        if (isPro()) return
        if (ad != null || loading) return
        loading = true
        InterstitialAd.load(
            context,
            adUnitId,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(loaded: InterstitialAd) {
                    ad = loaded
                    loading = false
                    pendingShowRequest?.let { pending ->
                        pendingShowRequest = null
                        show(pending.activity, pending.placement, pending.onDone)
                    }
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.w(TAG, "Interstitial failed to load: ${error.message}")
                    ad = null
                    loading = false
                    pendingShowRequest?.let { pending ->
                        pendingShowRequest = null
                        pending.onDone()
                    }
                }
            }
        )
    }

    /**
     * Shows the interstitial if one is ready, otherwise invokes [onDone] immediately and
     * preloads for next time. [onDone] always runs (whether or not an ad showed) so callers
     * can continue their navigation uniformly.
     */
    fun show(activity: Activity, placement: String, onDone: () -> Unit = {}) {
        // Subscribers see no interstitial, but onDone must still run so their navigation
        // continues exactly as it would for a free user.
        if (isPro()) {
            onDone()
            return
        }
        val current = ad
        if (current == null) {
            load(activity)
            onDone()
            return
        }
        current.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdShowedFullScreenContent() = Analytics.adShown("interstitial", placement)
            override fun onAdClicked() = Analytics.adClicked("interstitial", placement)
            override fun onAdDismissedFullScreenContent() {
                ad = null
                load(activity)
                onDone()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                Log.w(TAG, "Interstitial failed to show: ${error.message}")
                ad = null
                onDone()
            }
        }
        current.show(activity)
    }

    /**
     * Like [show], but if the preload hasn't finished yet, waits for it (rather than giving
     * up immediately) and shows as soon as it lands. Use this at the placement where the
     * preload may have started only moments earlier — e.g. Divine Image generation, where a
     * fast path (a demo/preset photo) can reach the wait screen well before a real network
     * ad load finishes.
     */
    fun loadThenShow(activity: Activity, placement: String, onDone: () -> Unit = {}) {
        if (isPro()) {
            onDone()
            return
        }
        if (ad != null) {
            show(activity, placement, onDone)
            return
        }
        pendingShowRequest = PendingShowRequest(activity, placement, onDone)
        load(activity)
    }

    private companion object {
        const val TAG = "InterstitialAds"
    }
}

/** Unwraps a Compose [Context] (often a ContextWrapper) to the hosting [Activity], or null. */
fun Context.findActivity(): Activity? {
    var ctx = this
    while (ctx is ContextWrapper) {
        if (ctx is Activity) return ctx
        ctx = ctx.baseContext
    }
    return null
}
