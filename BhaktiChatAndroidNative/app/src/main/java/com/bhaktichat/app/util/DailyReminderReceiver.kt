package com.bhaktichat.app.util

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.bhaktichat.app.MainActivity
import com.bhaktichat.app.R
import java.util.Calendar

/**
 * Posts the daily "time for your reflection" notification. Triggered by [AlarmManager]
 * via [DailyReminderScheduler].
 */
class DailyReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        ensureChannel(context)

        // POST_NOTIFICATIONS is runtime-permission only on Android 13+. If we don't have
        // it (user revoked, etc.) just bail silently.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPending = PendingIntent.getActivity(
            context,
            REQUEST_CONTENT,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("🕉️ दैनिक चिंतन का समय")
            .setContentText("BhaktiChat के साथ कुछ पल शांत होकर बिताएँ।")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(contentPending)
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
    }

    companion object {
        const val CHANNEL_ID = "bhakti_daily_reminder"
        const val NOTIFICATION_ID = 1001
        private const val REQUEST_CONTENT = 2001

        fun ensureChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                    val channel = NotificationChannel(
                        CHANNEL_ID,
                        "दैनिक चिंतन",
                        NotificationManager.IMPORTANCE_DEFAULT
                    ).apply {
                        description = "चिंतन के लिए स्नेहपूर्ण दैनिक स्मरण।"
                    }
                    manager.createNotificationChannel(channel)
                }
            }
        }
    }
}

/**
 * Schedules or cancels the daily reminder via [AlarmManager.setRepeating]. Times use
 * the device's local timezone.
 */
object DailyReminderScheduler {
    private const val PREFS_NAME = "bhakti_notifications"
    private const val KEY_ENABLED = "bhakti_notifications_enabled"
    private const val KEY_HOUR = "reminder_hour"
    private const val KEY_MINUTE = "reminder_minute"
    private const val REQUEST_ALARM = 1101

    // Defaults to on, matching iOS's @AppStorage("bhakti_notifications_enabled") = true —
    // the user still has to grant the runtime POST_NOTIFICATIONS permission on Android 13+
    // (see NotificationsSection's launch effect), but the *setting* itself starts enabled
    // rather than requiring an opt-in tap first.
    fun isEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_ENABLED, true)

    fun setEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
    }

    fun reminderHour(context: Context): Int = prefs(context).getInt(KEY_HOUR, 8)
    fun reminderMinute(context: Context): Int = prefs(context).getInt(KEY_MINUTE, 0)

    fun setReminderTime(context: Context, hour: Int, minute: Int) {
        prefs(context).edit().putInt(KEY_HOUR, hour).putInt(KEY_MINUTE, minute).apply()
    }

    fun schedule(context: Context, hour: Int, minute: Int) {
        DailyReminderReceiver.ensureChannel(context)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = pendingIntent(context)

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        runCatching {
            alarmManager.setRepeating(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                AlarmManager.INTERVAL_DAY,
                pendingIntent
            )
        }
    }

    fun cancel(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(pendingIntent(context))
    }

    private fun pendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, DailyReminderReceiver::class.java)
        return PendingIntent.getBroadcast(
            context,
            REQUEST_ALARM,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}

/**
 * Reschedules the daily reminder after a device reboot or an app update — both of which
 * clear all pending AlarmManager alarms. Without this, the reminder silently stops
 * firing after the first reboot.
 */
class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            "android.intent.action.QUICKBOOT_POWERON" -> {
                if (DailyReminderScheduler.isEnabled(context)) {
                    DailyReminderScheduler.schedule(
                        context,
                        DailyReminderScheduler.reminderHour(context),
                        DailyReminderScheduler.reminderMinute(context)
                    )
                }
            }
        }
    }
}
