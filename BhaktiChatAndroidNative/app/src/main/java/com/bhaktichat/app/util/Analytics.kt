package com.bhaktichat.app.util

import android.content.Context
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig

/**
 * Thin wrapper over the PostHog SDK so the rest of the app never touches the raw client.
 *
 * Call [init] once from [com.bhaktichat.app.BhaktiChatApplication.onCreate]. If no API key
 * is configured (see local.properties → posthog.apiKey), [init] is a no-op and every
 * [capture]/[screen] call is silently ignored — the app runs fine with analytics off, so
 * debug builds and CI don't need a key.
 *
 * Event/property naming: use snake_case event names and keep property keys stable — PostHog
 * treats every distinct name as a new event/property in the dashboard.
 */
object Analytics {
    @Volatile
    private var enabled = false

    /** Initializes PostHog. Safe to call with a blank key (becomes a no-op). */
    fun init(context: Context, apiKey: String, host: String, debug: Boolean) {
        if (apiKey.isBlank()) return
        val config = PostHogAndroidConfig(apiKey = apiKey, host = host).apply {
            // We track screens manually per Compose route (this app is single-Activity, so
            // the SDK's Activity-level screen capture can't distinguish routes).
            captureScreenViews = false
            captureDeepLinks = true
            captureApplicationLifecycleEvents = true
            this.debug = debug
        }
        PostHogAndroid.setup(context.applicationContext, config)
        enabled = true
    }

    /** Records a custom event with optional properties. No-op when analytics is disabled. */
    fun capture(event: String, properties: Map<String, Any>? = null) {
        if (!enabled) return
        PostHog.capture(event = event, properties = properties)
    }

    /** Records a screen view. [name] should be a stable route/screen identifier. */
    fun screen(name: String, properties: Map<String, Any>? = null) {
        if (!enabled) return
        PostHog.screen(screenTitle = name, properties = properties)
    }

    /** Associates subsequent events with a known user id (e.g. after sign-in). */
    fun identify(distinctId: String, userProperties: Map<String, Any>? = null) {
        if (!enabled) return
        PostHog.identify(distinctId = distinctId, userProperties = userProperties)
    }

    /** Clears the current identity (e.g. on sign-out) so events go to a fresh anonymous id. */
    fun reset() {
        if (!enabled) return
        PostHog.reset()
    }

    // --- Semantic helpers (keep event names in one place) -----------------

    fun chatMessageSent(guideId: String?) =
        capture("chat_message_sent", buildMap { guideId?.let { put("guide_id", it) } })

    fun guideSelected(guideId: String) =
        capture("guide_selected", mapOf("guide_id" to guideId))

    fun aartiOpened(aartiId: String) =
        capture("aarti_opened", mapOf("aarti_id" to aartiId))

    fun choghadiyaOpened() =
        capture("choghadiya_opened")

    fun divineImageGenerationStarted(mode: String) =
        capture("divine_image_generation_started", mapOf("mode" to mode))

    fun divineImageGenerated(mode: String) =
        capture("divine_image_generated", mapOf("mode" to mode))

    fun divineImageRegenerated(mode: String) =
        capture("divine_image_regenerated", mapOf("mode" to mode))

    fun divineImageSaved(mode: String) =
        capture("divine_image_saved", mapOf("mode" to mode))

    /** [target] is "instagram", "whatsapp", or "system". */
    fun divineImageShared(target: String) =
        capture("divine_image_shared", mapOf("target" to target))

    // --- Ads (stubs — call these from the AdMob callbacks when ads land) ---
    // [format] e.g. "banner"/"interstitial"/"rewarded"/"app_open";
    // [placement] e.g. "result_return"/"chat_exit"/"aartis_list".

    fun adShown(format: String, placement: String) =
        capture("ad_shown", mapOf("format" to format, "placement" to placement))

    fun adClicked(format: String, placement: String) =
        capture("ad_clicked", mapOf("format" to format, "placement" to placement))
}
