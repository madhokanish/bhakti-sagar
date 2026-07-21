package com.bhaktichat.app.util

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.TimeZone
import java.util.concurrent.TimeUnit

/**
 * Tracks a daily "darshan" streak — the number of consecutive local days the user has
 * opened the app. A devotional daily-ritual mechanic (nitya darshan); loss-aversion on
 * the streak is a strong daily-return hook.
 */
class StreakStore(context: Context) {
    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _currentStreak = MutableStateFlow(prefs.getInt(KEY_CURRENT, 0))
    val currentStreak: StateFlow<Int> = _currentStreak.asStateFlow()

    private val _longestStreak = MutableStateFlow(prefs.getInt(KEY_LONGEST, 0))
    val longestStreak: StateFlow<Int> = _longestStreak.asStateFlow()

    private val _isBannerDismissedToday =
        MutableStateFlow(prefs.getLong(KEY_DISMISSED_DAY, Long.MIN_VALUE) == todayEpochDay())
    /** True once the user has closed today's streak banner; resets automatically the next day. */
    val isBannerDismissedToday: StateFlow<Boolean> = _isBannerDismissedToday.asStateFlow()

    /** Hides the streak banner for the rest of today only — reappears on the next day's visit. */
    fun dismissBannerForToday() {
        prefs.edit().putLong(KEY_DISMISSED_DAY, todayEpochDay()).apply()
        _isBannerDismissedToday.value = true
    }

    /**
     * Call once per app open. First visit of a new day increments the streak; a visit the
     * day after the last counts as consecutive, a longer gap resets to 1. Same-day repeat
     * opens are no-ops.
     */
    fun recordVisit() {
        val today = todayEpochDay()
        val lastDay = prefs.getLong(KEY_LAST_DAY, Long.MIN_VALUE)
        if (lastDay == today) return

        val current = prefs.getInt(KEY_CURRENT, 0)
        val next = if (lastDay == today - 1) current + 1 else 1
        val longest = maxOf(prefs.getInt(KEY_LONGEST, 0), next)

        prefs.edit()
            .putLong(KEY_LAST_DAY, today)
            .putInt(KEY_CURRENT, next)
            .putInt(KEY_LONGEST, longest)
            .apply()
        _currentStreak.value = next
        _longestStreak.value = longest
    }

    /** Local-day index (midnight in the device timezone), avoiding any java.time dependency. */
    private fun todayEpochDay(): Long {
        val nowUtc = System.currentTimeMillis()
        val localOffset = TimeZone.getDefault().getOffset(nowUtc)
        return (nowUtc + localOffset) / TimeUnit.DAYS.toMillis(1)
    }

    companion object {
        private const val PREFS_NAME = "bhakti_streak"
        private const val KEY_LAST_DAY = "last_visit_epoch_day"
        private const val KEY_CURRENT = "current_streak"
        private const val KEY_LONGEST = "longest_streak"
        private const val KEY_DISMISSED_DAY = "banner_dismissed_epoch_day"
    }
}
