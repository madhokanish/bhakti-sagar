package com.bhaktichat.app.util.notifications

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.graphics.drawable.IconCompat
import com.bhaktichat.app.MainActivity
import com.bhaktichat.app.R
import com.bhaktichat.app.domain.Guides
import com.bhaktichat.app.ui.i18n.str
import com.bhaktichat.app.util.Analytics
import com.bhaktichat.app.util.LanguageStore
import java.util.Calendar

/**
 * Builds and posts the notifications. Each one is a chat message from the deity
 * ([NotificationCompat.MessagingStyle] with the guide as the sender), so it reads as
 * "Krishna ji ka sandesh", not as the app nagging.
 */
object BhaktiNotifications {
    private const val OLD_CHANNEL_ID = "bhakti_daily_reminder"
    private const val MORNING_LINES = 4

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val language = LanguageStore(context)
        // Re-created every time on purpose: that is how the names follow a change of app
        // language. The system keeps the user's own importance and sound settings.
        listOf(
            NotifType.MORNING to "notif_channel_morning",
            NotifType.AARTI to "notif_channel_aarti",
            NotifType.UNANSWERED to "notif_channel_guide"
        ).forEach { (type, key) ->
            manager.createNotificationChannel(
                NotificationChannel(type.channelId, language.str(key), NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = language.str("${key}_desc")
                }
            )
        }
        manager.deleteNotificationChannel(OLD_CHANNEL_ID)
    }

    /** A: the weekday deity's blessing. A different line each week, so it doesn't repeat. */
    fun showMorning(context: Context, guideId: String, atMillis: Long) {
        val dayOfYear = Calendar.getInstance().apply { timeInMillis = atMillis }.get(Calendar.DAY_OF_YEAR)
        val line = LanguageStore(context).str("notif_morning_${guideId}_${dayOfYear % MORNING_LINES + 1}")
        post(context, NotifType.MORNING, guideId, line, NotificationLaunch.TARGET_CHAT)
    }

    /** B: evening aarti, with a button that plays it straight away. */
    fun showAarti(context: Context, guideId: String) {
        val language = LanguageStore(context)
        val text = language.str("notif_aarti_body").format(guideName(language, guideId))
        post(context, NotifType.AARTI, guideId, text, NotificationLaunch.TARGET_AARTI) { builder ->
            builder.addAction(
                0,
                language.str("notif_aarti_action"),
                launchIntent(context, NotifType.AARTI, guideId, NotificationLaunch.TARGET_AARTI, isAction = true)
            )
        }
    }

    /** C: the guide's own question, sent back word for word. */
    fun showUnanswered(context: Context, guideId: String, question: String) {
        post(context, NotifType.UNANSWERED, guideId, question, NotificationLaunch.TARGET_CHAT)
    }

    @SuppressLint("MissingPermission") // canPost() is checked by the planner before every post.
    private fun post(
        context: Context,
        type: NotifType,
        guideId: String,
        text: String,
        target: String,
        extra: (NotificationCompat.Builder) -> Unit = {}
    ) {
        ensureChannels(context)
        val language = LanguageStore(context)
        val deity = Person.Builder()
            .setName(guideName(language, guideId))
            .setKey(guideId)
            .apply { guideIcon(context, guideId)?.let(::setIcon) }
            .build()
        val user = Person.Builder().setName(language.str("chat_you")).build()
        val style = NotificationCompat.MessagingStyle(user)
            .setGroupConversation(false)
            .addMessage(text, System.currentTimeMillis(), deity)

        val builder = NotificationCompat.Builder(context, type.channelId)
            .setSmallIcon(R.drawable.ic_stat_diya)
            .setStyle(style)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(launchIntent(context, type, guideId, target, isAction = false))
        extra(builder)
        NotificationManagerCompat.from(context).notify(type.notificationId, builder.build())
        Analytics.capture("notif_shown", mapOf("type" to type.wire, "guide_id" to guideId))
    }

    /** Opens the app on the right screen; [NotificationLaunch] carries the target across. */
    private fun launchIntent(
        context: Context,
        type: NotifType,
        guideId: String,
        target: String,
        isAction: Boolean
    ): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(NotificationLaunch.EXTRA_TYPE, type.wire)
            putExtra(NotificationLaunch.EXTRA_GUIDE, guideId)
            putExtra(NotificationLaunch.EXTRA_TARGET, target)
            putExtra(NotificationLaunch.EXTRA_IS_ACTION, isAction)
        }
        // Distinct request codes, or the action's PendingIntent would overwrite the tap's extras.
        val requestCode = type.requestCode * 10 + if (isAction) 1 else 0
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    private fun guideName(language: LanguageStore, guideId: String): String = language.str("guide_title_$guideId")

    /** The guide's portrait, cropped square from the top (where the face is) and kept small. */
    private fun guideIcon(context: Context, guideId: String): IconCompat? = runCatching {
        val resId = Guides.byId(guideId)?.avatarRes ?: return null
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeResource(context.resources, resId, bounds)
        var sample = 1
        while (minOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= ICON_PX) sample *= 2
        val full = BitmapFactory.decodeResource(
            context.resources,
            resId,
            BitmapFactory.Options().apply { inSampleSize = sample }
        ) ?: return null
        val side = minOf(full.width, full.height)
        val square = Bitmap.createBitmap(full, (full.width - side) / 2, 0, side, side)
        IconCompat.createWithBitmap(Bitmap.createScaledBitmap(square, ICON_PX, ICON_PX, true))
    }.getOrNull()

    private const val ICON_PX = 192
}
