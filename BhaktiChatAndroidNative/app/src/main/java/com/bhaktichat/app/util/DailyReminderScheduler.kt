package com.bhaktichat.app.util

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.bhaktichat.app.util.notifications.NotificationPlanner

/**
 * The Profile screen's switch and time picker. Notifications themselves are planned by
 * [NotificationPlanner]; the time chosen here is the morning blessing's.
 */
object DailyReminderScheduler {
    fun isEnabled(context: Context): Boolean = NotificationPlanner.isEnabled(context)

    fun setEnabled(context: Context, enabled: Boolean) = NotificationPlanner.setEnabled(context, enabled)

    fun reminderHour(context: Context): Int = NotificationPlanner.morningHour(context)
    fun reminderMinute(context: Context): Int = NotificationPlanner.morningMinute(context)

    fun setReminderTime(context: Context, hour: Int, minute: Int) =
        NotificationPlanner.setMorningTime(context, hour, minute)

    fun schedule(context: Context, hour: Int, minute: Int) {
        NotificationPlanner.setMorningTime(context, hour, minute)
        NotificationPlanner.replan(context)
    }

    fun cancel(context: Context) = NotificationPlanner.cancelAll(context)
}

/**
 * Re-arms the notifications after a reboot or an app update, both of which clear every
 * pending AlarmManager alarm. Without this they would silently stop until the next app open.
 */
class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            "android.intent.action.QUICKBOOT_POWERON" -> NotificationPlanner.replan(context)
        }
    }
}
