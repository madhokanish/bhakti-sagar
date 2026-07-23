package com.bhaktichat.app.util

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Persists user-bookmarked chat messages and aartis in SharedPreferences. Exposes a
 * [StateFlow] of the currently-bookmarked ids so that screens can react to changes
 * without polling.
 */
class BookmarkStore(context: Context) {
    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _messageIds = MutableStateFlow(readSet(KEY_MESSAGES))
    val messageIds: StateFlow<Set<String>> = _messageIds.asStateFlow()

    private val _aartiIds = MutableStateFlow(readSet(KEY_AARTIS))
    val aartiIds: StateFlow<Set<String>> = _aartiIds.asStateFlow()

    fun bookmarkedMessageIds(): Set<String> = _messageIds.value
    fun bookmarkedAartiIds(): Set<String> = _aartiIds.value

    fun isMessageBookmarked(id: String): Boolean = id in _messageIds.value
    fun isAartiBookmarked(id: String): Boolean = id in _aartiIds.value

    fun toggleMessage(id: String) {
        if (id.isBlank()) return
        val updated = _messageIds.value.toMutableSet().apply {
            if (!add(id)) remove(id)
        }
        prefs.edit().putStringSet(KEY_MESSAGES, updated).apply()
        _messageIds.value = updated
    }

    fun toggleAarti(id: String) {
        if (id.isBlank()) return
        val updated = _aartiIds.value.toMutableSet().apply {
            if (!add(id)) remove(id)
        }
        prefs.edit().putStringSet(KEY_AARTIS, updated).apply()
        _aartiIds.value = updated
    }

    private fun readSet(key: String): Set<String> =
        prefs.getStringSet(key, emptySet())?.toSet().orEmpty()

    companion object {
        private const val PREFS_NAME = "bhakti_bookmarks"
        private const val KEY_MESSAGES = "messages"
        private const val KEY_AARTIS = "aartis"
    }
}
