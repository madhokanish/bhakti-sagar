package com.bhaktichat.app.util

import android.content.Context
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.TimeUnit

/**
 * Decides when to show the "Enjoying BhaktiChat?" prompt. Tapping "Yes" sends the user
 * straight to the Play Store listing to rate (see openPlayStoreListing in BhaktiChatApp) —
 * we no longer rely on Play's In-App Review API, which silently no-ops most of the time and
 * never actually opens the store.
 *
 * Trigger: at least [MESSAGE_THRESHOLD] messages sent, or at least
 * [FOREGROUND_MINUTES_THRESHOLD] minutes of accumulated foreground time (actual time with the
 * app open, not wall-clock since install).
 *
 * Cadence: instead of once-per-version, the prompt recurs on a cooldown so engaged users keep
 * getting a gentle nudge. A short cooldown after "Not now" ([DISMISS_COOLDOWN_MS]) re-asks
 * within a few days; a long cooldown after "Yes" ([ACCEPTED_COOLDOWN_MS]) backs off, since
 * they've most likely already rated.
 */
class ReviewPromptStore(context: Context) : DefaultLifecycleObserver {
    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _shouldShowPrompt = MutableStateFlow(false)
    val shouldShowPrompt: StateFlow<Boolean> = _shouldShowPrompt.asStateFlow()

    private var sessionStartMillis: Long? = null

    /** Call once per user message sent (success or not — the ask is about engagement, not luck). */
    fun recordMessageSent() {
        val next = prefs.getInt(KEY_MESSAGES_SENT, 0) + 1
        prefs.edit().putInt(KEY_MESSAGES_SENT, next).apply()
        checkEligibility()
    }

    override fun onStart(owner: LifecycleOwner) {
        sessionStartMillis = System.currentTimeMillis()
    }

    override fun onStop(owner: LifecycleOwner) {
        val start = sessionStartMillis ?: return
        sessionStartMillis = null
        val elapsed = System.currentTimeMillis() - start
        if (elapsed <= 0) return
        val total = prefs.getLong(KEY_FOREGROUND_MILLIS, 0L) + elapsed
        prefs.edit().putLong(KEY_FOREGROUND_MILLIS, total).apply()
        checkEligibility()
    }

    /** User tapped "Yes" and was sent to the store — back off for a long while. */
    fun markPromptAccepted() {
        prefs.edit()
            .putLong(KEY_NEXT_ELIGIBLE_MILLIS, System.currentTimeMillis() + ACCEPTED_COOLDOWN_MS)
            .apply()
        _shouldShowPrompt.value = false
    }

    /** User tapped "Not now" — ask again after a short cooldown. */
    fun markPromptDismissed() {
        prefs.edit()
            .putLong(KEY_NEXT_ELIGIBLE_MILLIS, System.currentTimeMillis() + DISMISS_COOLDOWN_MS)
            .apply()
        _shouldShowPrompt.value = false
    }

    private fun checkEligibility() {
        // Respect the cooldown after a previous prompt.
        if (System.currentTimeMillis() < prefs.getLong(KEY_NEXT_ELIGIBLE_MILLIS, 0L)) return

        val messagesSent = prefs.getInt(KEY_MESSAGES_SENT, 0)
        val foregroundMinutes = TimeUnit.MILLISECONDS.toMinutes(prefs.getLong(KEY_FOREGROUND_MILLIS, 0L))

        if (messagesSent >= MESSAGE_THRESHOLD || foregroundMinutes >= FOREGROUND_MINUTES_THRESHOLD) {
            _shouldShowPrompt.value = true
        }
    }

    companion object {
        private const val PREFS_NAME = "bhakti_review_prompt"
        private const val KEY_MESSAGES_SENT = "messages_sent"
        private const val KEY_FOREGROUND_MILLIS = "foreground_millis"
        private const val KEY_NEXT_ELIGIBLE_MILLIS = "next_eligible_millis"

        // Ask sooner than before (was 12/12) to gather more ratings from engaged users.
        private const val MESSAGE_THRESHOLD = 4
        private const val FOREGROUND_MINUTES_THRESHOLD = 3

        private val DISMISS_COOLDOWN_MS = TimeUnit.DAYS.toMillis(3)
        private val ACCEPTED_COOLDOWN_MS = TimeUnit.DAYS.toMillis(45)
    }
}
