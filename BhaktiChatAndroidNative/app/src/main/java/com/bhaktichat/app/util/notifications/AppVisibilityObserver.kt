package com.bhaktichat.app.util.notifications

import android.content.Context
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.bhaktichat.app.data.repo.MessagesRepository
import com.bhaktichat.app.data.repo.ThreadsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Registered on the process lifecycle for the active user. Opening the app re-plans the day
 * (and drops any pending "unanswered question"); leaving it looks for one to send back.
 */
class AppVisibilityObserver(
    context: Context,
    private val threadsRepository: ThreadsRepository,
    private val messagesRepository: MessagesRepository
) : DefaultLifecycleObserver {
    private val appContext = context.applicationContext
    // Outlives the screen that was open when the user left, so the database read finishes.
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onStart(owner: LifecycleOwner) {
        scope.launch { runCatching { NotificationPlanner.onAppForegrounded(appContext) } }
    }

    override fun onStop(owner: LifecycleOwner) {
        scope.launch {
            runCatching { NotificationPlanner.onAppBackgrounded(appContext, threadsRepository, messagesRepository) }
        }
    }
}
