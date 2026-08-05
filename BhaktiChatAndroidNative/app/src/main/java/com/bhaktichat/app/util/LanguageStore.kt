package com.bhaktichat.app.util

import android.content.Context
import com.bhaktichat.app.domain.AppLanguage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * The user's chosen interface language, persisted across launches.
 *
 * Two choices are offered in the UI: Devanagari Hindi, and [AppLanguage.HINGLISH] — which
 * is presented to users as "English" because that is what it reads like to them: ordinary
 * Latin script, with devotional vocabulary (aarti, chadhava, Shri Krishna) left intact
 * rather than forced into literal English. [AppLanguage.ENGLISH] stays in the enum for the
 * chat backend's script matching and is deliberately not offered as an interface option.
 *
 * [hasChosenLanguage] is what the first-launch picker gates on, and is deliberately
 * separate from the value itself: "never asked" and "asked, and they picked Hindi" must be
 * distinguishable, otherwise anyone choosing the default would be prompted on every launch.
 */
class LanguageStore(context: Context) {
    // applicationContext is null when this is built from Application.attachBaseContext —
    // the Application isn't attached to its context yet at that point. Falling back to the
    // context we were handed is safe: SharedPreferences are per-process regardless.
    private val prefs = (context.applicationContext ?: context)
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _language = MutableStateFlow(readPersisted())
    val language: StateFlow<AppLanguage> = _language.asStateFlow()

    /** False until the user has made an explicit choice, on the picker or in Profile. */
    val hasChosenLanguage: Boolean
        get() = prefs.contains(KEY_LANGUAGE)

    fun setLanguage(language: AppLanguage) {
        prefs.edit().putString(KEY_LANGUAGE, language.wireValue).apply()
        _language.value = language
    }

    private fun readPersisted(): AppLanguage =
        AppLanguage.fromWireValue(prefs.getString(KEY_LANGUAGE, null)) ?: AppLanguage.default

    private companion object {
        const val PREFS_NAME = "bhakti_language"
        const val KEY_LANGUAGE = "bhakti_app_language"
    }
}
