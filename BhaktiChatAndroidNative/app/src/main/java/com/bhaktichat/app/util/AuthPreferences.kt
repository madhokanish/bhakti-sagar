package com.bhaktichat.app.util

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class AuthState(
    val isLoggedIn: Boolean = false,
    val name: String = "",
    val email: String = "",
    val photoUrl: String = ""
)

class AuthPreferences(context: Context) {
    private val prefs = context.getSharedPreferences("bhaktichat_auth", Context.MODE_PRIVATE)
    private val _state = MutableStateFlow(readState())
    val state: StateFlow<AuthState> = _state.asStateFlow()

    fun signIn(name: String, email: String, photoUrl: String = "") {
        val cleanedName = name.trim()
        val cleanedEmail = email.trim().lowercase()
        val cleanedPhotoUrl = photoUrl.trim()
        prefs.edit()
            .putString(KEY_NAME, cleanedName)
            .putString(KEY_EMAIL, cleanedEmail)
            .putString(KEY_PHOTO_URL, cleanedPhotoUrl)
            .putBoolean(KEY_LOGGED_IN, true)
            .apply()
        _state.value = AuthState(
            isLoggedIn = true,
            name = cleanedName,
            email = cleanedEmail,
            photoUrl = cleanedPhotoUrl
        )
    }

    fun signOut() {
        prefs.edit()
            .remove(KEY_NAME)
            .remove(KEY_EMAIL)
            .remove(KEY_PHOTO_URL)
            .putBoolean(KEY_LOGGED_IN, false)
            .apply()
        _state.value = AuthState()
    }

    private fun readState(): AuthState {
        val isLoggedIn = prefs.getBoolean(KEY_LOGGED_IN, false)
        val name = prefs.getString(KEY_NAME, "").orEmpty()
        val email = prefs.getString(KEY_EMAIL, "").orEmpty()
        val photoUrl = prefs.getString(KEY_PHOTO_URL, "").orEmpty()
        return AuthState(isLoggedIn = isLoggedIn, name = name, email = email, photoUrl = photoUrl)
    }

    companion object {
        private const val KEY_LOGGED_IN = "logged_in"
        private const val KEY_NAME = "name"
        private const val KEY_EMAIL = "email"
        private const val KEY_PHOTO_URL = "photo_url"
    }
}
