package com.bhaktichat.app.util.notifications

import android.Manifest
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.bhaktichat.app.data.repo.MessagesRepository
import com.bhaktichat.app.data.repo.ThreadsRepository
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.util.Analytics
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/** The three week-1 notifications. Each has its own channel, alarm and notification id. */
enum class NotifType(val wire: String, val channelId: String, val notificationId: Int, val requestCode: Int) {
    /** A: the weekday's deity sends a blessing, 7:00 (time set on Profile). */
    MORNING("morning", "bhakti_morning", 1001, 1111),

    /** B: sandhya aarti at 19:00, with a "▶ Aarti suniye" action. */
    AARTI("aarti", "bhakti_aarti", 1002, 1112),

    /** C: the guide's own unanswered question, 3 hours after the user left. Takes B's slot. */
    UNANSWERED("unanswered", "bhakti_guide", 1003, 1113);

    companion object {
        fun fromWire(wire: String?): NotifType? = entries.firstOrNull { it.wire == wire }
    }
}

/**
 * Works out the day's notifications on the phone and arms one alarm per slot. Nothing is
 * sent from a server, so this costs nothing to run.
 *
 * At most two a day: the morning blessing, plus one evening message — the aarti, or the
 * unanswered question in its place. Re-planned at every app open, after a reboot or update,
 * and by each alarm for the next day, so a phone that kills alarms recovers on next open.
 */
object NotificationPlanner {
    // Same prefs file and keys as the old daily reminder, so a user's chosen time and on/off
    // switch carry over. The file is cleared on account deletion (BhaktiChatApplication).
    private const val PREFS_NAME = "bhakti_notifications"
    private const val KEY_ENABLED = "bhakti_notifications_enabled"
    private const val KEY_HOUR = "reminder_hour"
    private const val KEY_MINUTE = "reminder_minute"
    private const val KEY_FAVORITE_GUIDE = "favorite_guide"
    private const val KEY_EVENING_USED_DAY = "evening_used_day"
    private const val KEY_C_GUIDE = "c_guide"
    private const val KEY_C_TEXT = "c_text"
    private const val KEY_C_MESSAGE_ID = "c_message_id"
    private const val KEY_C_FIRE_AT = "c_fire_at"
    private const val KEY_C_LAST_SENT_ID = "c_last_sent_message_id"
    private const val KEY_SCHEDULED_PREFIX = "scheduled_at_"

    const val EVENING_HOUR = 19
    private const val DEFAULT_MORNING_HOUR = 7
    private const val EVENING_WINDOW_MS = 10 * 60 * 1000L
    private const val UNANSWERED_DELAY_MS = 3 * 60 * 60 * 1000L
    // An old question isn't worth bringing back; the user has moved on.
    private const val UNANSWERED_MAX_AGE_MS = 48 * 60 * 60 * 1000L

    // The old daily reminder: one repeating alarm on this request code.
    private const val LEGACY_REQUEST_ALARM = 1101
    private const val LEGACY_RECEIVER = "com.bhaktichat.app.util.DailyReminderReceiver"

    fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, true)

    fun setEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
    }

    fun morningHour(context: Context): Int = prefs(context).getInt(KEY_HOUR, DEFAULT_MORNING_HOUR)
    fun morningMinute(context: Context): Int = prefs(context).getInt(KEY_MINUTE, 0)

    fun setMorningTime(context: Context, hour: Int, minute: Int) {
        prefs(context).edit().putInt(KEY_HOUR, hour).putInt(KEY_MINUTE, minute).apply()
    }

    /** Android 13+ needs the runtime grant; older versions have notifications on by default. */
    fun hasPermission(context: Context): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

    fun canPost(context: Context): Boolean =
        isEnabled(context) && hasPermission(context) &&
            NotificationManagerCompat.from(context).areNotificationsEnabled()

    /** Arms the next morning and evening slots (today's if still ahead). Idempotent. */
    fun replan(context: Context) {
        cancelLegacyReminder(context)
        if (!canPost(context)) {
            cancelAll(context)
            return
        }
        BhaktiNotifications.ensureChannels(context)
        val morningAt = nextOccurrence(morningHour(context), morningMinute(context))
        arm(context, NotifType.MORNING, morningAt, guideForDay(context, morningAt))
        val eveningAt = nextOccurrence(EVENING_HOUR, 0)
        arm(context, NotifType.AARTI, eveningAt, guideForDay(context, eveningAt))
    }

    fun cancelAll(context: Context) {
        NotifType.entries.forEach { cancel(context, it) }
    }

    /** The user came back: whatever they left unanswered, they can answer in the app now. */
    fun onAppForegrounded(context: Context) {
        cancel(context, NotifType.UNANSWERED)
        prefs(context).edit()
            .remove(KEY_C_GUIDE).remove(KEY_C_TEXT).remove(KEY_C_MESSAGE_ID).remove(KEY_C_FIRE_AT)
            .apply()
        replan(context)
    }

    /**
     * The user left. If the guide's last reply asked them something they didn't answer, bring
     * that exact question back 3 hours later, read from the local chat database — no AI call.
     * Also refreshes the most-chatted guide, who sends Sunday's blessing.
     */
    suspend fun onAppBackgrounded(
        context: Context,
        threadsRepository: ThreadsRepository,
        messagesRepository: MessagesRepository
    ) {
        val threads = threadsRepository.listThreads()
        val userCounts = threads.associateWith { thread ->
            messagesRepository.listMessages(thread.id).count { it.role == ChatRole.USER.wire }
        }
        userCounts.filterValues { it > 0 }.maxByOrNull { it.value }?.key?.let { favorite ->
            prefs(context).edit().putString(KEY_FAVORITE_GUIDE, favorite.guideId).apply()
        }

        if (!canPost(context)) return
        val thread = threads.firstOrNull() ?: return
        val messages = messagesRepository.listMessages(thread.id)
        val last = messages.lastOrNull() ?: return
        val now = System.currentTimeMillis()
        if (last.role != ChatRole.ASSISTANT.wire || last.isTypingIndicator) return
        // The opening scene ends in a question too; only a real conversation counts.
        if ((userCounts[thread] ?: 0) == 0) return
        if (now - last.createdAt > UNANSWERED_MAX_AGE_MS) return
        if (prefs(context).getString(KEY_C_LAST_SENT_ID, null) == last.id) return
        val question = lastQuestion(last.content) ?: return

        val fireAt = unansweredFireTime(now)
        prefs(context).edit()
            .putString(KEY_C_GUIDE, thread.guideId)
            .putString(KEY_C_TEXT, question)
            .putString(KEY_C_MESSAGE_ID, last.id)
            .putLong(KEY_C_FIRE_AT, fireAt)
            .apply()
        arm(context, NotifType.UNANSWERED, fireAt, thread.guideId)
    }

    /** Called by [NotificationReceiver] when an alarm goes off. */
    internal fun onAlarm(context: Context, type: NotifType) {
        val now = System.currentTimeMillis()
        val today = dayKey(now)
        val p = prefs(context)
        // The alarm that just fired is spent; forget its time so the next one is reported.
        p.edit().remove(KEY_SCHEDULED_PREFIX + type.wire).apply()
        when (type) {
            NotifType.MORNING -> {
                if (canPost(context)) BhaktiNotifications.showMorning(context, guideForDay(context, now), now)
            }
            NotifType.AARTI -> {
                // The evening slot belongs to the unanswered question when it is due today —
                // even at this same instant, or later because its alarm was shifted. The key
                // is cleared once C posts or the user comes back.
                val cAt = p.getLong(KEY_C_FIRE_AT, 0L)
                val cPendingToday = cAt > 0L && dayKey(cAt) == today
                if (canPost(context) && p.getString(KEY_EVENING_USED_DAY, null) != today && !cPendingToday) {
                    BhaktiNotifications.showAarti(context, guideForDay(context, now))
                    p.edit().putString(KEY_EVENING_USED_DAY, today).apply()
                }
            }
            NotifType.UNANSWERED -> {
                val guideId = p.getString(KEY_C_GUIDE, null) ?: return
                val text = p.getString(KEY_C_TEXT, null) ?: return
                if (p.getString(KEY_EVENING_USED_DAY, null) == today) {
                    // Today's evening message already went out: keep the question for tomorrow's.
                    val tomorrow = nextOccurrence(EVENING_HOUR, 0, from = now + 60_000L)
                    p.edit().putLong(KEY_C_FIRE_AT, tomorrow).apply()
                    arm(context, NotifType.UNANSWERED, tomorrow, guideId)
                    return
                }
                if (canPost(context)) {
                    BhaktiNotifications.showUnanswered(context, guideId, text)
                    p.edit()
                        .putString(KEY_EVENING_USED_DAY, today)
                        .putString(KEY_C_LAST_SENT_ID, p.getString(KEY_C_MESSAGE_ID, null))
                        .remove(KEY_C_GUIDE).remove(KEY_C_TEXT).remove(KEY_C_MESSAGE_ID).remove(KEY_C_FIRE_AT)
                        .apply()
                }
                return
            }
        }
        replan(context)
    }

    /**
     * Mon Shiv ji, Tue Hanuman ji, Wed/Thu Shri Krishna, Fri Lakshmi ji, Sat Shani Dev — the
     * traditional weekday deities. Sunday is the guide the user talks to most.
     */
    fun guideForDay(context: Context, atMillis: Long): String {
        val day = Calendar.getInstance().apply { timeInMillis = atMillis }.get(Calendar.DAY_OF_WEEK)
        return when (day) {
            Calendar.MONDAY -> "shiv"
            Calendar.TUESDAY -> "hanuman"
            Calendar.WEDNESDAY, Calendar.THURSDAY -> "krishna"
            Calendar.FRIDAY -> "lakshmi"
            Calendar.SATURDAY -> "shani"
            else -> prefs(context).getString(KEY_FAVORITE_GUIDE, null) ?: "krishna"
        }
    }

    private fun arm(context: Context, type: NotifType, atMillis: Long, guideId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pending = alarmIntent(context, type)
        runCatching {
            // Exact when the platform allows it without a special permission (below Android 12,
            // or if the user granted it). Otherwise Android may deliver up to an hour late:
            // fine for the morning blessing, which must fire while the phone sleeps, but the
            // evening slot is the 19:00 peak, so it gets a 10-minute window (the phone is
            // awake then; a window alarm doesn't fire in Doze).
            val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
            when {
                exact -> alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending)
                type == NotifType.MORNING ->
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending)
                else -> alarmManager.setWindow(AlarmManager.RTC_WAKEUP, atMillis, EVENING_WINDOW_MS, pending)
            }
        }
        // Re-planning happens on every app open; only a new time counts as scheduled.
        val key = KEY_SCHEDULED_PREFIX + type.wire
        if (prefs(context).getLong(key, 0L) != atMillis) {
            prefs(context).edit().putLong(key, atMillis).apply()
            Analytics.capture(
                "notif_scheduled",
                mapOf(
                    "type" to type.wire,
                    "guide_id" to guideId,
                    "fire_at" to SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date(atMillis))
                )
            )
        }
    }

    private fun cancel(context: Context, type: NotifType) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(alarmIntent(context, type))
        prefs(context).edit().remove(KEY_SCHEDULED_PREFIX + type.wire).apply()
    }

    private fun alarmIntent(context: Context, type: NotifType): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            type.requestCode,
            Intent(context, NotificationReceiver::class.java).putExtra(NotificationReceiver.EXTRA_TYPE, type.wire),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

    private fun cancelLegacyReminder(context: Context) {
        val legacy = PendingIntent.getBroadcast(
            context,
            LEGACY_REQUEST_ALARM,
            Intent().setClassName(context, LEGACY_RECEIVER),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_NO_CREATE
        ) ?: return
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(legacy)
        legacy.cancel()
    }

    /** 3 hours after leaving, unless that lands in quiet hours (22:00–06:30): then the next 19:00. */
    private fun unansweredFireTime(now: Long): Long {
        val at = now + UNANSWERED_DELAY_MS
        val cal = Calendar.getInstance().apply { timeInMillis = at }
        val minutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
        val quiet = minutes >= 22 * 60 || minutes < 6 * 60 + 30
        return if (quiet) nextOccurrence(EVENING_HOUR, 0, from = at) else at
    }

    private fun nextOccurrence(hour: Int, minute: Int, from: Long = System.currentTimeMillis()): Long =
        Calendar.getInstance().apply {
            timeInMillis = from
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= from) add(Calendar.DAY_OF_YEAR, 1)
        }.timeInMillis

    private fun dayKey(millis: Long): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(millis))

    /** The last sentence of a reply that asks something, or null if it doesn't end on a question. */
    internal fun lastQuestion(reply: String): String? {
        val cleaned = reply.replace(Regex("[*_#>`“”\"]"), "").trim()
        // Emoji and the like often follow the question mark ("…kya hai? 🙏").
        val body = cleaned.trimEnd { !it.isLetterOrDigit() && it != '?' && it != '？' }
        if (!body.endsWith("?") && !body.endsWith("？")) return null
        val start = body.dropLast(1).indexOfLast { it == '\n' || it == '.' || it == '।' || it == '!' || it == '?' }
        val question = body.substring(start + 1).trim().trimStart('…', '.', ' ')
        return question.takeIf { it.length >= 8 }?.take(220)
    }

    internal fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}

/** Every notification alarm lands here; [NotificationPlanner] decides what, if anything, to show. */
class NotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val type = NotifType.fromWire(intent.getStringExtra(EXTRA_TYPE)) ?: return
        NotificationPlanner.onAlarm(context, type)
    }

    companion object {
        const val EXTRA_TYPE = "notif_type"
    }
}
