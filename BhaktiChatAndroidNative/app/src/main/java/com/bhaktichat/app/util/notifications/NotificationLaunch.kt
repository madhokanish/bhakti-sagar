package com.bhaktichat.app.util.notifications

import android.content.Intent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** A notification tap waiting for the app to act on it. */
data class NotificationTap(
    val type: String,
    val guideId: String,
    /** [NotificationLaunch.TARGET_CHAT], [NotificationLaunch.TARGET_AARTI] or anything else for Home. */
    val target: String,
    /** True for an action button ("▶ Aarti suniye"), false for a tap on the notification. */
    val isAction: Boolean
)

/**
 * Hands a notification tap from [com.bhaktichat.app.MainActivity] (cold start or onNewIntent)
 * to the Compose app, which may not exist yet when the intent arrives.
 */
object NotificationLaunch {
    const val EXTRA_TYPE = "bhakti_notif_type"
    const val EXTRA_GUIDE = "bhakti_notif_guide"
    const val EXTRA_TARGET = "bhakti_notif_target"
    const val EXTRA_IS_ACTION = "bhakti_notif_is_action"

    const val TARGET_CHAT = "chat"
    const val TARGET_AARTI = "aarti"
    const val TARGET_HOME = "home"

    private val _pending = MutableStateFlow<NotificationTap?>(null)
    val pending: StateFlow<NotificationTap?> = _pending.asStateFlow()

    /** Reads a tap out of [intent], if it carries one, and strips it so a recreation can't replay it. */
    fun offer(intent: Intent?) {
        val type = intent?.getStringExtra(EXTRA_TYPE) ?: return
        _pending.value = NotificationTap(
            type = type,
            guideId = intent.getStringExtra(EXTRA_GUIDE).orEmpty(),
            target = intent.getStringExtra(EXTRA_TARGET) ?: TARGET_HOME,
            isAction = intent.getBooleanExtra(EXTRA_IS_ACTION, false)
        )
        intent.removeExtra(EXTRA_TYPE)
    }

    fun consume(): NotificationTap? = _pending.value.also { _pending.value = null }
}
