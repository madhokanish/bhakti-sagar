package com.bhaktichat.app.data.local

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SavedAartisStore(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val _savedIds = MutableStateFlow(readSavedIds())

    val savedIds: StateFlow<Set<String>> = _savedIds.asStateFlow()

    fun toggleSaved(aartiId: String) {
        val updated = _savedIds.value.toMutableSet().apply {
            if (!add(aartiId)) remove(aartiId)
        }
        persist(updated)
    }

    fun isSaved(aartiId: String): Boolean = aartiId in _savedIds.value

    private fun persist(ids: Set<String>) {
        prefs.edit().putStringSet(KEY_SAVED_IDS, ids).apply()
        _savedIds.value = ids
    }

    private fun readSavedIds(): Set<String> = prefs.getStringSet(KEY_SAVED_IDS, emptySet())?.toSet().orEmpty()

    private companion object {
        const val PREFS_NAME = "saved_aartis"
        const val KEY_SAVED_IDS = "saved_ids"
    }
}
