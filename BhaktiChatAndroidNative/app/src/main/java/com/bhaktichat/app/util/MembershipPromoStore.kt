package com.bhaktichat.app.util

import android.content.Context
import java.util.concurrent.TimeUnit

/**
 * Persisted cooldown for the membership promo interstitial so it isn't shown on every launch.
 * Once shown, it stays quiet for [COOLDOWN_MS]. Survives process death (unlike an in-memory
 * "shown this session" flag), so a user who force-quits and reopens won't see it again right
 * away.
 */
class MembershipPromoStore(context: Context) {
    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun shouldShow(now: Long = System.currentTimeMillis()): Boolean =
        now >= prefs.getLong(KEY_NEXT_ELIGIBLE_MILLIS, 0L)

    fun markShown(now: Long = System.currentTimeMillis()) {
        prefs.edit().putLong(KEY_NEXT_ELIGIBLE_MILLIS, now + COOLDOWN_MS).apply()
    }

    companion object {
        private const val PREFS_NAME = "bhakti_membership_promo"
        private const val KEY_NEXT_ELIGIBLE_MILLIS = "next_eligible_millis"

        /** How long to stay quiet after showing the promo once. */
        private val COOLDOWN_MS = TimeUnit.DAYS.toMillis(3)
    }
}
