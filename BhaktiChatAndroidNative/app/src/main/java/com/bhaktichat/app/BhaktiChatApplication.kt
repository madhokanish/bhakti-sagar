package com.bhaktichat.app

import android.app.Application
import androidx.lifecycle.ProcessLifecycleOwner
import com.bhaktichat.app.util.Analytics
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import kotlin.concurrent.thread

class BhaktiChatApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        // Analytics first, so early lifecycle events are captured. No-op if no key is set.
        Analytics.init(
            context = this,
            apiKey = BuildConfig.POSTHOG_API_KEY,
            host = BuildConfig.POSTHOG_HOST,
            debug = BuildConfig.DEBUG
        )
        container = AppContainer(this)
        // Tracks accumulated foreground time for the review-prompt eligibility check
        // (see ReviewPromptStore) — process-level, so it spans all Activities/Compose tabs.
        ProcessLifecycleOwner.get().lifecycle.addObserver(container.reviewPromptStore)

        // AdMob. initialize() does I/O, so run it off the main thread. It does NOT itself
        // request ads — actual ad loads happen on screen and are gated by UMP consent
        // (gathered in MainActivity). Emulators serve test ads automatically; in debug we
        // also mark this build as a test device so physical dev phones get test ads too.
        thread(name = "mobile-ads-init") {
            if (BuildConfig.DEBUG) {
                MobileAds.setRequestConfiguration(
                    RequestConfiguration.Builder()
                        .setTestDeviceIds(listOf("EMULATOR"))
                        .build()
                )
            }
            MobileAds.initialize(this) { }
        }
    }
}
