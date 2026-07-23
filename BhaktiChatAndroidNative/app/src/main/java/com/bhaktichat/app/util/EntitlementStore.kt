package com.bhaktichat.app.util

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Tracks free-tier usage (messages sent + divine images generated) and decides when to
 * surface the BhaktiChat Pro paywall.
 *
 * Mirrors the iOS [EntitlementStore]:
 *  - Hard limits are 100 chat messages or 5 divine images (free tier).
 *  - Once a hard limit is crossed, the paywall is non-dismissible and gated features
 *    (chat send, divine image generation) refuse to run until the user subscribes.
 *  - A manual soft-dismiss respects a 24h cooldown so we don't pester the user.
 *  - Successful purchase flips [isPro]; failures and errors must NOT burn quota — call
 *    sites must only invoke [recordMessageSent] / [recordImageGenerated] on success.
 *
 * Persisted via [android.content.SharedPreferences] under "bhakti_entitlements" so the
 * state survives relaunch. [MutableStateFlow]s mirror persisted values so Compose
 * collectors recompose on every change.
 */
class EntitlementStore(context: Context) {
    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    enum class PaywallTrigger {
        /** User tapped the PRO pill in a top bar. */
        MANUAL,
        /** User hit the free-tier chat message threshold. */
        MESSAGE_QUOTA,
        /** User hit the free-tier divine-image threshold. */
        IMAGE_QUOTA
    }

    // --- Persisted, observable state --------------------------------------

    // REVIEW: existing subscriber handling — decide before removing.
    // The app has pivoted to an ad-based model; all features are now free for everyone
    // (see the always-open gates below). This [isPro] flag is intentionally KEPT so that
    // users who already purchased a subscription are still recognized (SubscriptionManager
    // reconciles it against Play on launch). It no longer gates any feature, but is
    // preserved for grandfathering / analytics until you decide how to treat existing
    // subscribers (honor until lapse vs. refund/notify).
    private val _isPro = MutableStateFlow(prefs.getBoolean(KEY_PRO_ACTIVE, false))
    val isPro: StateFlow<Boolean> = _isPro.asStateFlow()

    // Set once the server reports the free message limit is exhausted. Persisted so the
    // hard gate survives relaunch and backstops the local counter (which resets on a
    // reinstall / clear-data). See [markChatLimitReached].
    private var serverChatLimitReached = prefs.getBoolean(KEY_SERVER_CHAT_LIMIT, false)

    private val _messagesUsed = MutableStateFlow(prefs.getInt(KEY_MESSAGES_USED, 0))
    val messagesUsed: StateFlow<Int> = _messagesUsed.asStateFlow()

    private val _imagesUsed = MutableStateFlow(prefs.getInt(KEY_IMAGES_USED, 0))
    val imagesUsed: StateFlow<Int> = _imagesUsed.asStateFlow()

    private val _shouldShowPaywall = MutableStateFlow(false)
    val shouldShowPaywall: StateFlow<Boolean> = _shouldShowPaywall.asStateFlow()

    private val _paywallTrigger = MutableStateFlow(PaywallTrigger.MANUAL)
    val paywallTrigger: StateFlow<PaywallTrigger> = _paywallTrigger.asStateFlow()

    // --- Derived gating ---------------------------------------------------
    //
    // Ad-based model: there are no more free-tier limits. All of these are hard-wired
    // to the "unlimited / free" answer so every feature is available to every user.
    // The usage counters below still increment (harmless — useful for ad-frequency
    // decisions later), but they no longer gate anything.

    /** No chat limit under the ad model. */
    val isOverChatLimit: Boolean
        get() = false

    /** No divine-image limit under the ad model. */
    val isOverImageLimit: Boolean
        get() = false

    /** No hard limit under the ad model. */
    val isOverHardLimit: Boolean
        get() = false

    /** Chat is free for everyone. */
    val canUseChat: Boolean
        get() = true

    /** Divine image is free for everyone. */
    val canUseDivineImage: Boolean
        get() = true

    /** No paywall is ever shown, so dismissibility is moot (kept for API compatibility). */
    val paywallIsDismissible: Boolean
        get() = true

    // --- Derived counters -------------------------------------------------

    val messagesRemaining: Int
        get() = if (serverChatLimitReached) 0
        else (FREE_MESSAGE_QUOTA - _messagesUsed.value).coerceAtLeast(0)

    val imagesRemaining: Int
        get() = (FREE_IMAGE_QUOTA - _imagesUsed.value).coerceAtLeast(0)

    // --- Usage recording --------------------------------------------------

    /** Call after a chat message has been *successfully* sent. No-op for Pro users. */
    fun recordMessageSent() {
        if (_isPro.value) return
        val next = _messagesUsed.value + 1
        prefs.edit().putInt(KEY_MESSAGES_USED, next).apply()
        _messagesUsed.value = next
        evaluate(PaywallTrigger.MESSAGE_QUOTA)
    }

    /** Call after a divine image has been *successfully* generated. No-op for Pro users. */
    fun recordImageGenerated() {
        if (_isPro.value) return
        val next = _imagesUsed.value + 1
        prefs.edit().putInt(KEY_IMAGES_USED, next).apply()
        _imagesUsed.value = next
        evaluate(PaywallTrigger.IMAGE_QUOTA)
    }

    // --- Paywall presentation --------------------------------------------

    // --- Paywall presentation (neutralized under the ad model) ------------
    //
    // These are kept as no-ops so existing call sites keep compiling, but the paywall
    // is never shown. The paywall UI and its call sites are being removed as part of the
    // ad-model pivot; these stubs are the backstop.

    /** No-op: the purchase paywall has been removed (ad-based model). */
    fun presentManually() {
        // no-op
    }

    /** No-op: no intro upsell under the ad model. */
    fun maybePresentIntro() {
        // no-op
    }

    /** No-op: features are no longer gated, so nothing is ever "blocked". */
    fun presentForBlockedFeature(trigger: PaywallTrigger) {
        // no-op
    }

    /**
     * No-op for the paywall. NOTE: the backend (`/api/bhaktigpt/chat`) still enforces its
     * own server-side free message cap and can return `limitReached`. Truly unlimited chat
     * requires lifting that limit on the backend — this client stub only ensures no paywall
     * is shown when the server reports the cap.
     */
    fun markChatLimitReached() {
        // no-op
    }

    /**
     * User dismissed without subscribing. Suppresses re-triggering for
     * [PAYWALL_COOLDOWN_MS] — UNLESS the user is over the hard limit, in which case
     * the paywall snaps back open immediately (it must not be escapable until they
     * subscribe).
     */
    fun dismissPaywall() {
        if (isOverHardLimit) {
            // Hard gate: do not actually dismiss; do not start cooldown.
            _shouldShowPaywall.value = true
            return
        }
        _shouldShowPaywall.value = false
        prefs.edit().putLong(KEY_DISMISSED_AT, System.currentTimeMillis()).apply()
    }

    /**
     * Mock subscription success. Replace with real billing logic in
     * [com.bhaktichat.app.data.billing.SubscriptionManager.purchase]; this flips the
     * persisted flag and closes the paywall.
     */
    fun grantPro() {
        serverChatLimitReached = false
        prefs.edit()
            .putBoolean(KEY_PRO_ACTIVE, true)
            .putBoolean(KEY_SERVER_CHAT_LIMIT, false)
            .apply()
        _isPro.value = true
        _shouldShowPaywall.value = false
    }

    // --- Debug / QA helpers ----------------------------------------------
    //
    // Exposed unconditionally because the project keeps QA tooling lightweight,
    // but only the DEBUG profile screen / future debug menu should call these.

    /** Zero out usage counters and clear cooldown — for QA flows. */
    fun resetUsageCounters() {
        serverChatLimitReached = false
        prefs.edit()
            .putInt(KEY_MESSAGES_USED, 0)
            .putInt(KEY_IMAGES_USED, 0)
            .putLong(KEY_DISMISSED_AT, 0L)
            .putBoolean(KEY_SERVER_CHAT_LIMIT, false)
            .apply()
        _messagesUsed.value = 0
        _imagesUsed.value = 0
    }

    /** Revoke Pro entitlement for QA. */
    fun revokePro() {
        prefs.edit().putBoolean(KEY_PRO_ACTIVE, false).apply()
        _isPro.value = false
    }

    /** Clear the "intro paywall shown" flag so the first-open sheet reappears — for QA. */
    fun resetIntroPaywall() {
        prefs.edit().putBoolean(KEY_INTRO_SHOWN, false).apply()
    }

    // --- Internal ---------------------------------------------------------

    private fun evaluate(trigger: PaywallTrigger) {
        // Ad-based model: usage no longer triggers a paywall. Kept as a no-op so the
        // recordMessageSent()/recordImageGenerated() call sites stay unchanged.
    }

    companion object {
        const val FREE_MESSAGE_QUOTA: Int = 100
        const val FREE_IMAGE_QUOTA: Int = 5
        private const val PAYWALL_COOLDOWN_MS: Long = 24L * 60L * 60L * 1000L

        private const val PREFS_NAME = "bhakti_entitlements"
        private const val KEY_PRO_ACTIVE = "bhakti_pro_active"
        private const val KEY_MESSAGES_USED = "bhakti_free_messages_used"
        private const val KEY_IMAGES_USED = "bhakti_free_images_used"
        private const val KEY_DISMISSED_AT = "bhakti_paywall_dismissed_at"
        private const val KEY_SERVER_CHAT_LIMIT = "bhakti_server_chat_limit_reached"
        private const val KEY_INTRO_SHOWN = "bhakti_intro_paywall_shown"
    }
}
