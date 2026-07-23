package com.bhaktichat.app.util

import android.content.Context

/**
 * Persists the user's preferred theme mode. One of:
 *  - "system" (default): follow [androidx.compose.foundation.isSystemInDarkTheme]
 *  - "light"
 *  - "dark"
 */
class ThemePreferences(context: Context) {
    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var themeMode: String
        get() = prefs.getString(KEY_THEME_MODE, DEFAULT_MODE) ?: DEFAULT_MODE
        set(value) {
            prefs.edit().putString(KEY_THEME_MODE, value).apply()
        }

    companion object {
        const val MODE_SYSTEM = "system"
        const val MODE_LIGHT = "light"
        const val MODE_DARK = "dark"

        private const val PREFS_NAME = "theme_prefs"
        private const val KEY_THEME_MODE = "theme_mode"
        private const val DEFAULT_MODE = MODE_SYSTEM
    }
}
