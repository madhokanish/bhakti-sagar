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

    /** Ties subsequent events to a persistent person profile. Call once per successful auth. */
    fun identify(userId: String, email: String?, name: String?) {
        if (!enabled) return
        PostHog.identify(
            distinctId = userId,
            userProperties = buildMap {
                email?.let { put("email", it) }
                name?.let { put("name", it) }
            }
        )
    }

    // --- Semantic helpers (keep event names in one place) -----------------

    /** [method] is "google" or "access" (email/username + password). */
    fun authSucceeded(method: String) =
        capture("auth_succeeded", mapOf("method" to method))

    /** [reason] is a short machine code, e.g. "network_error", "no_credential", or the API's error code. */
    fun authFailed(method: String, reason: String) =
        capture("auth_failed", mapOf("method" to method, "reason" to reason))

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

    fun reelOpened() = capture("reel_opened")

    fun reelViewed(reelId: String, feed: String) =
        capture("reel_viewed", mapOf("reel_id" to reelId, "feed" to feed))

    fun reelShared() = capture("reel_shared")

    fun reelSetAsStatus() = capture("reel_set_as_status")

    fun aartiPlayStarted(aartiId: String) =
        capture("aarti_play_started", mapOf("aarti_id" to aartiId))

    fun aartiPlayCompleted(aartiId: String, durationSeconds: Long) =
        capture("aarti_play_completed", mapOf("aarti_id" to aartiId, "duration_seconds" to durationSeconds))

    /** Fired when the user manually skips off a track (next/previous) before it finished. */
    fun aartiSkipped(aartiId: String, positionSeconds: Long) =
        capture("aarti_skipped", mapOf("aarti_id" to aartiId, "position_seconds" to positionSeconds))

    // --- Ads (stubs — call these from the AdMob callbacks when ads land) ---
    // [format] e.g. "banner"/"interstitial"/"rewarded"/"app_open";
    // [placement] e.g. "result_return"/"chat_exit"/"aartis_list".

    fun adShown(format: String, placement: String) =
        capture("ad_shown", mapOf("format" to format, "placement" to placement))

    fun adClicked(format: String, placement: String) =
        capture("ad_clicked", mapOf("format" to format, "placement" to placement))
}
