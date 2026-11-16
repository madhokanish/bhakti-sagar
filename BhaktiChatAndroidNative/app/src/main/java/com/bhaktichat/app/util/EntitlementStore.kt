package com.bhaktichat.app.util

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Tracks चढ़ावा entitlement and free-tier usage, and answers the feature gates.
 *
 *  - Free chat is capped at [DAILY_CHAT_LIMIT] messages per device-local day.
 *  - Divine images and voice are subscriber-only; there is no free allowance.
 *  - A gate that refuses sends the user to चढ़ावा (there is no separate paywall sheet).
 *  - [isPro] comes from either subscription rail; failures and errors must NOT burn quota —
 *    call sites must only invoke [recordMessageSent] / [recordImageGenerated] on success.
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

    // Lifetime free usage counters, reported to analytics only — nothing gates on them.
    private val _messagesUsed = MutableStateFlow(prefs.getInt(KEY_MESSAGES_USED, 0))
    val messagesUsed: StateFlow<Int> = _messagesUsed.asStateFlow()

    private val _imagesUsed = MutableStateFlow(prefs.getInt(KEY_IMAGES_USED, 0))
    val imagesUsed: StateFlow<Int> = _imagesUsed.asStateFlow()

    // --- Derived gating ---------------------------------------------------
    //
    // Free tier: [DAILY_CHAT_LIMIT] chat messages a day, and nothing else. Images and voice
    // need चढ़ावा. Hitting a gate sends the user to चढ़ावा. Subscribers bypass all of it — every gate
    // below short-circuits on [isPro], so a Razorpay subscriber (or a grandfathered Play
    // one) is never limited.

    /**
     * Free chat is capped at [DAILY_CHAT_LIMIT] messages a day; subscribers are unlimited.
     *
     * Daily rather than lifetime: the old lifetime cap of 20 sent everyone who hit it away
     * for good. A daily cap lets them come back tomorrow, while the heaviest chatters — the
     * people most likely to pay — meet चढ़ावा at their most engaged moment. Enforced on the
     * device only (the backend's ENFORCE_ANON_LIMIT stays false), so clearing app data resets
     * it; that is an accepted trade for a first version.
     */
    val isOverChatLimit: Boolean
        get() = !_isPro.value && messagesSentToday() >= DAILY_CHAT_LIMIT

    /** Successful free messages sent today (device-local calendar day). */
    fun messagesSentToday(): Int =
        if (prefs.getString(KEY_CHAT_DAY, null) == today()) prefs.getInt(KEY_CHAT_DAY_COUNT, 0) else 0

    // A free user who asks a guide for a bhajan gets one play of that guide's aarti a day;
    // after that the chat card opens चढ़ावा. Hearing it first sells better than a locked card.
    private val _freeChatAartiDay = MutableStateFlow(prefs.getString(KEY_FREE_CHAT_AARTI_DAY, null))
    val freeChatAartiDay: StateFlow<String?> = _freeChatAartiDay.asStateFlow()

    /** True while a free user still has today's in-chat aarti play. */
    fun hasFreeChatAartiToday(): Boolean = !_isPro.value && _freeChatAartiDay.value != today()

    fun recordFreeChatAartiPlayed() {
        val day = today()
        prefs.edit().putString(KEY_FREE_CHAT_AARTI_DAY, day).apply()
        _freeChatAartiDay.value = day
    }

    private fun today(): String =
        java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())

    /**
     * Divine images are चढ़ावा-only — there is no free allowance at all. The taster gave the
     * feature away to people who then had no reason to pay for it, and generation is one of
     * the most expensive calls we make.
     *
     * The server enforces the same rule (requireSubscribedUser on /api/bhaktigpt/divine-image),
     * so clearing app data no longer buys anyone a free generation.
     */
    val isOverImageLimit: Boolean
        get() = !_isPro.value

    val canUseDivineImage: Boolean
        get() = !isOverImageLimit

    /**
     * Reports a refusal. Called by the gates rather than computed from events, so a user
     * who is blocked repeatedly is counted each time — that repetition is itself the signal
     * that someone wants the feature badly enough to keep trying.
     */
    fun reportQuotaReached(kind: String) {
        Analytics.quotaReached(
            kind = kind,
            messagesUsed = _messagesUsed.value,
            imagesUsed = _imagesUsed.value
        )
    }

    // --- Usage recording --------------------------------------------------

    /** Call after a chat message has been *successfully* sent. No-op for Pro users. */
    fun recordMessageSent() {
        if (_isPro.value) return
        val next = _messagesUsed.value + 1
        prefs.edit()
            .putInt(KEY_MESSAGES_USED, next)
            .putString(KEY_CHAT_DAY, today())
            .putInt(KEY_CHAT_DAY_COUNT, messagesSentToday() + 1)
            .apply()
        _messagesUsed.value = next
        Analytics.usageRecorded(
            kind = "chat",
            messagesUsed = next,
            imagesUsed = _imagesUsed.value,
            remaining = (DAILY_CHAT_LIMIT - messagesSentToday()).coerceAtLeast(0),
            isPro = false
        )
    }

    /** Call after a divine image has been *successfully* generated. No-op for Pro users. */
    fun recordImageGenerated() {
        if (_isPro.value) return
        val next = _imagesUsed.value + 1
        prefs.edit().putInt(KEY_IMAGES_USED, next).apply()
        _imagesUsed.value = next
        Analytics.usageRecorded(
            kind = "divine_image",
            messagesUsed = _messagesUsed.value,
            imagesUsed = next,
            remaining = 0,
            isPro = false
        )
    }

    /**
     * No-op: the free chat cap is enforced on the device ([isOverChatLimit]), not from a
     * server-reported limit, so a server LimitReached is not persisted. Kept because the
     * streaming client can still surface a LimitReached event, and the two call sites use it
     * to drop the pending bubble cleanly rather than render a fake reply.
     */
    fun markChatLimitReached() {
        // no-op
    }

    /**
     * Grants entitlement from the **Google Play** rail. Called by
     * [com.bhaktichat.app.data.billing.SubscriptionManager] after an acknowledged purchase
     * or a launch-time reconcile. Does not touch the server rail.
     */
    fun grantPro() {
        playPro = true
        prefs.edit().putBoolean(KEY_PRO_ACTIVE, true).apply()
        recomputeIsPro()
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
        recomputeIsPro()
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
            .putInt(KEY_QUOTA_EPOCH, QUOTA_EPOCH)
            .commit()
    }

    companion object {
        /**
         * Bump to wipe everyone's usage counters once, on their next launch.
         *
         * The quotas are being reintroduced after a period of unlimited use, so existing
         * users are carrying large counts — someone on 50 messages would otherwise open the
         * update already locked out, having never seen a limit.
         *
         * Bumped again for the subscription-only model: the free image allowance drops from
         * 3 to 1, so anyone who had already generated 2 would install the update with no
         * free image at all and never see the feature that sells itself.
         *
         * And again for the chat cap dropping 100 -> 10. Existing users are carrying counts
         * well past 10 from the unlimited period, so without a reset they would open the
         * update already locked out of chat having never seen a limit — the worst possible
         * first impression of the paywall.
         */
        private const val QUOTA_EPOCH: Int = 4

        private const val PREFS_NAME = "bhakti_entitlements"
        private const val KEY_PRO_ACTIVE = "bhakti_pro_active"
        private const val KEY_SERVER_PRO_ACTIVE = "bhakti_server_pro_active"
        private const val KEY_QUOTA_EPOCH = "bhakti_quota_epoch"
        private const val KEY_MESSAGES_USED = "bhakti_free_messages_used"
        private const val KEY_CHAT_DAY = "bhakti_chat_day"
        private const val KEY_CHAT_DAY_COUNT = "bhakti_chat_day_count"
        const val DAILY_CHAT_LIMIT = 10
        private const val KEY_IMAGES_USED = "bhakti_free_images_used"
        private const val KEY_FREE_CHAT_AARTI_DAY = "bhakti_free_chat_aarti_day"
    }
}
