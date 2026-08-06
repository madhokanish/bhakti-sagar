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
 *  - Hard limits are 20 chat messages or 2 divine images (free tier).
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

    // Must run before any counter below is read, otherwise those properties capture the
    // pre-reset values and the migration silently does nothing for this session.
    init {
        migrateQuotaEpochIfNeeded()
    }

    enum class PaywallTrigger {
        /** User tapped the PRO pill in a top bar. */
        MANUAL,
        /** User hit the free-tier chat message threshold. */
        MESSAGE_QUOTA,
        /** User hit the free-tier divine-image threshold. */
        IMAGE_QUOTA
    }

    // --- Persisted, observable state --------------------------------------

    // Entitlement has two independent sources and they must not clobber each other:
    //
    //  - [playPro]   Google Play Billing, reconciled on every launch by SubscriptionManager.
    //                Only grandfathered subscribers from before the ad-model pivot have this.
    //  - [serverPro] The BhaktiChat backend (Razorpay UPI AutoPay mandate), synced by
    //                SubscriptionRepository. This is the current subscription rail.
    //
    // Keeping them separate matters: SubscriptionManager.reconcile() calls [revokePro] when
    // Play reports no active subscription — which is true for every Razorpay subscriber. If
    // both rails shared one flag, that launch-time reconcile would silently revoke Pro from
    // everyone who paid through Razorpay.
    private var playPro = prefs.getBoolean(KEY_PRO_ACTIVE, false)
    private var serverPro = prefs.getBoolean(KEY_SERVER_PRO_ACTIVE, false)

    private val _isPro = MutableStateFlow(playPro || serverPro)

    /** True when either rail grants entitlement. The only flag feature gates should read. */
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
    // Free tier: [FREE_MESSAGE_QUOTA] chat messages and [FREE_IMAGE_QUOTA] divine images.
    // Crossing either sends the user to चढ़ावा. Subscribers bypass all of it — every gate
    // below short-circuits on [isPro], so a Razorpay subscriber (or a grandfathered Play
    // one) is never limited.

    /** Free chat messages are exhausted. Always false for subscribers. */
    val isOverChatLimit: Boolean
        get() = !_isPro.value && (serverChatLimitReached || _messagesUsed.value >= FREE_MESSAGE_QUOTA)

    /** Free divine images are exhausted. Always false for subscribers. */
    val isOverImageLimit: Boolean
        get() = !_isPro.value && _imagesUsed.value >= FREE_IMAGE_QUOTA

    /** Either quota is exhausted — used to decide whether the paywall is escapable. */
    val isOverHardLimit: Boolean
        get() = isOverChatLimit || isOverImageLimit

    val canUseChat: Boolean
        get() = !isOverChatLimit

    val canUseDivineImage: Boolean
        get() = !isOverImageLimit

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
     * The backend reported its own free-message cap. Persisted so the gate survives a
     * relaunch and backstops the local counter, which a reinstall would otherwise clear.
     * Ignored for subscribers.
     */
    fun markChatLimitReached() {
        if (_isPro.value) return
        serverChatLimitReached = true
        prefs.edit().putBoolean(KEY_SERVER_CHAT_LIMIT, true).apply()
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
     * Grants entitlement from the **Google Play** rail. Called by
     * [com.bhaktichat.app.data.billing.SubscriptionManager] after an acknowledged purchase
     * or a launch-time reconcile. Does not touch the server rail.
     */
    fun grantPro() {
        playPro = true
        serverChatLimitReached = false
        prefs.edit()
            .putBoolean(KEY_PRO_ACTIVE, true)
            .putBoolean(KEY_SERVER_CHAT_LIMIT, false)
            .apply()
        recomputeIsPro()
        _shouldShowPaywall.value = false
    }

    /**
     * Applies entitlement from the **backend** (Razorpay subscription), the current rail.
     * Called by SubscriptionRepository whenever server truth is fetched. Does not touch the
     * Play rail, so a grandfathered Play subscriber is never revoked by a server response
     * and vice versa.
     */
    fun setServerPro(active: Boolean) {
        if (serverPro == active) return
        serverPro = active
        prefs.edit().putBoolean(KEY_SERVER_PRO_ACTIVE, active).apply()
        if (active) {
            serverChatLimitReached = false
            prefs.edit().putBoolean(KEY_SERVER_CHAT_LIMIT, false).apply()
            _shouldShowPaywall.value = false
        }
        recomputeIsPro()
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

    /**
     * Revokes the **Google Play** rail only — called by SubscriptionManager's launch-time
     * reconcile when Play reports no active subscription, and by QA tooling. A Razorpay
     * subscriber has no Play purchase, so this must not disturb [serverPro].
     */
    fun revokePro() {
        playPro = false
        prefs.edit().putBoolean(KEY_PRO_ACTIVE, false).apply()
        recomputeIsPro()
    }

    private fun recomputeIsPro() {
        _isPro.value = playPro || serverPro
    }

    /** Clear the "intro paywall shown" flag so the first-open sheet reappears — for QA. */
    fun resetIntroPaywall() {
        prefs.edit().putBoolean(KEY_INTRO_SHOWN, false).apply()
    }

    // --- Internal ---------------------------------------------------------

    /**
     * Zeroes usage counters when [QUOTA_EPOCH] moves. Runs before the counters are read, so
     * the in-memory state starts from the reset values rather than the stale persisted ones.
     */
    private fun migrateQuotaEpochIfNeeded() {
        if (prefs.getInt(KEY_QUOTA_EPOCH, 0) == QUOTA_EPOCH) return
        prefs.edit()
            .putInt(KEY_MESSAGES_USED, 0)
            .putInt(KEY_IMAGES_USED, 0)
            .putBoolean(KEY_SERVER_CHAT_LIMIT, false)
            .putInt(KEY_QUOTA_EPOCH, QUOTA_EPOCH)
            .commit()
    }

    private fun evaluate(trigger: PaywallTrigger) {
        // Ad-based model: usage no longer triggers a paywall. Kept as a no-op so the
        // recordMessageSent()/recordImageGenerated() call sites stay unchanged.
    }

    companion object {
        const val FREE_MESSAGE_QUOTA: Int = 20
        const val FREE_IMAGE_QUOTA: Int = 2

        /**
         * Bump to wipe everyone's usage counters once, on their next launch.
         *
         * The quotas are being reintroduced after a period of unlimited use, so existing
         * users are carrying large counts — someone on 50 messages would otherwise open the
         * update already locked out, having never seen a limit. Raising this gives everyone
         * a clean 20/2 from the moment they upgrade.
         */
        private const val QUOTA_EPOCH: Int = 1
        private const val PAYWALL_COOLDOWN_MS: Long = 24L * 60L * 60L * 1000L

        private const val PREFS_NAME = "bhakti_entitlements"
        private const val KEY_PRO_ACTIVE = "bhakti_pro_active"
        private const val KEY_SERVER_PRO_ACTIVE = "bhakti_server_pro_active"
        private const val KEY_QUOTA_EPOCH = "bhakti_quota_epoch"
        private const val KEY_MESSAGES_USED = "bhakti_free_messages_used"
        private const val KEY_IMAGES_USED = "bhakti_free_images_used"
        private const val KEY_DISMISSED_AT = "bhakti_paywall_dismissed_at"
        private const val KEY_SERVER_CHAT_LIMIT = "bhakti_server_chat_limit_reached"
        private const val KEY_INTRO_SHOWN = "bhakti_intro_paywall_shown"
    }
}
