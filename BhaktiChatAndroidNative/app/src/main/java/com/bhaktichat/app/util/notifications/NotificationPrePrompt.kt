package com.bhaktichat.app.util.notifications

import android.content.Context
import android.os.Build

/** The two moments of value at which we ask for notification permission. */
enum class PrePromptTrigger(val wire: String) {
    /** Right after the guide's first reply in a chat. */
    CHAT("chat"),

    /** Right after an aarti finishes playing. */
    AARTI("aarti")
}

/**
 * Decides when to show the guide-voiced pre-prompt before Android 13's permission dialog.
 * Asked once; if declined, once more at least 7 days later and only at the other moment.
 * Android 12 and older need no permission, so they never see it (the planner just runs).
 */
object NotificationPrePrompt {
    private const val KEY_ASKED_COUNT = "preprompt_asked_count"
    private const val KEY_ASKED_AT = "preprompt_asked_at"
    private const val KEY_ASKED_TRIGGER = "preprompt_asked_trigger"
    private const val RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000L

    fun shouldAsk(context: Context, trigger: PrePromptTrigger): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return false
        if (NotificationPlanner.hasPermission(context)) return false
        // Switched off on Profile: they told us already.
        if (!NotificationPlanner.isEnabled(context)) return false
        val prefs = NotificationPlanner.prefs(context)
        return when (prefs.getInt(KEY_ASKED_COUNT, 0)) {
            0 -> true
            1 -> prefs.getString(KEY_ASKED_TRIGGER, null) != trigger.wire &&
                System.currentTimeMillis() - prefs.getLong(KEY_ASKED_AT, 0L) >= RETRY_AFTER_MS
            else -> false
        }
    }

    fun markAsked(context: Context, trigger: PrePromptTrigger) {
        val prefs = NotificationPlanner.prefs(context)
        prefs.edit()
            .putInt(KEY_ASKED_COUNT, prefs.getInt(KEY_ASKED_COUNT, 0) + 1)
            .putLong(KEY_ASKED_AT, System.currentTimeMillis())
            .putString(KEY_ASKED_TRIGGER, trigger.wire)
            .apply()
    }
}
