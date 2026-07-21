package com.bhaktichat.app.util

import android.content.Context
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.bhaktichat.app.BuildConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.TimeUnit

/**
 * Decides when to show the "Enjoying BhaktiChat?" pre-prompt, so the native Play In-App
 * Review dialog only gets triggered for users who say yes — Play Store throttles how often
 * the real dialog can appear, so we don't want to waste that on someone who'd bounce off it.
 *
 * Trigger: at least [MESSAGE_THRESHOLD] messages sent, or at least [FOREGROUND_MINUTES_THRESHOLD]
 * minutes of accumulated foreground time (not wall-clock time since install — actual time
 * spent with the app open). Shown at most once per app version (resets on update, so a
 * returning happy user can be asked again after later releases).
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

    /** Marks the prompt as shown for this app version — never re-checked again until an update. */
    fun markPromptShown() {
        prefs.edit().putString(KEY_LAST_SHOWN_VERSION, BuildConfig.VERSION_NAME).apply()
        _shouldShowPrompt.value = false
    }

    private fun checkEligibility() {
        if (prefs.getString(KEY_LAST_SHOWN_VERSION, null) == BuildConfig.VERSION_NAME) return

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
        private const val KEY_LAST_SHOWN_VERSION = "last_shown_version"

        private const val MESSAGE_THRESHOLD = 12
        private const val FOREGROUND_MINUTES_THRESHOLD = 12
    }
}
