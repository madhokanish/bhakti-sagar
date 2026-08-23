package com.bhaktichat.app.util

import android.content.Context
import java.util.concurrent.TimeUnit

/**
 * Persisted cooldown for the in-chat चढ़ावा nudge.
 *
 * Separate from [MembershipPromoStore] on purpose: that one paces the launch interstitial,
 * this one paces a card that appears mid-conversation. Sharing a cooldown would let one
 * surface silence the other for days.
 *
 * A dismissal is a real signal — the user saw the offer and said no — so it buys a full day
 * of quiet rather than a per-session flag that a relaunch would clear.
 */
class ChatNudgeStore(context: Context) {
    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun shouldShow(now: Long = System.currentTimeMillis()): Boolean =
        now >= prefs.getLong(KEY_NEXT_ELIGIBLE_MILLIS, 0L)

    fun markDismissed(now: Long = System.currentTimeMillis()) {
        prefs.edit().putLong(KEY_NEXT_ELIGIBLE_MILLIS, now + COOLDOWN_MS).apply()
    }

    companion object {
        private const val PREFS_NAME = "bhakti_chat_nudge"
        private const val KEY_NEXT_ELIGIBLE_MILLIS = "next_eligible_millis"
        private val COOLDOWN_MS = TimeUnit.DAYS.toMillis(1)
    }
}
