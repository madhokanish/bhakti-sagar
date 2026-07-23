package com.bhaktichat.app.util

import android.content.Context
import java.util.UUID

/**
 * Stable anonymous user key used for A/B testing the Divine Image experience.
 * Generated once per install and persisted in SharedPreferences.
 */
object AnonUserKey {
    private const val PREFS_NAME = "bhakti_anon"
    private const val KEY_ANON_USER_KEY = "anon_user_key"

    fun get(context: Context): String {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val existing = prefs.getString(KEY_ANON_USER_KEY, null)
        if (!existing.isNullOrBlank()) return existing
        val fresh = UUID.randomUUID().toString()
        prefs.edit().putString(KEY_ANON_USER_KEY, fresh).apply()
        return fresh
    }
}
