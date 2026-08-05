package com.bhaktichat.app.data.auth

import android.app.Activity
import android.content.Context
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.bhaktichat.app.ui.i18n.str
import com.bhaktichat.app.util.Analytics
import com.bhaktichat.app.util.LanguageStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.IOException

class AuthRepository(
    context: Context,
    baseUrl: String,
    private val googleWebClientId: String,
    private val languageStore: LanguageStore
) {
    private val sessionStore = SecureSessionStore(context)
    private val api = MobileAuthApi(baseUrl)
    private val credentialManager = CredentialManager.create(context.applicationContext)
    private val _state = MutableStateFlow<AuthState>(AuthState.Checking)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    val currentSession: MobileSession?
        get() = (_state.value as? AuthState.Authenticated)?.session

    suspend fun restoreSession() {
        val stored = sessionStore.load()
        if (stored == null || stored.expiresAtMillis <= System.currentTimeMillis()) {
            sessionStore.clear()
            _state.value = AuthState.SignedOut()
            return
        }

        try {
            val validated = api.validate(stored.accessToken)
            sessionStore.save(validated)
            _state.value = AuthState.Authenticated(validated)
        } catch (_: IOException) {
            // A valid cached login may still use local/offline features during an outage.
            _state.value = AuthState.Authenticated(stored)
        } catch (error: AuthApiException) {
            if (error.status == 401) {
                sessionStore.clear()
                _state.value = AuthState.SignedOut(languageStore.str("auth_session_expired"))
            } else {
                _state.value = AuthState.Authenticated(stored)
            }
        } catch (_: Exception) {
            _state.value = AuthState.Authenticated(stored)
        }
    }

    suspend fun signInWithGoogle(activity: Activity, explicitButton: Boolean) {
        if (googleWebClientId.isBlank()) {
            _state.value = AuthState.SignedOut(languageStore.str("auth_google_not_configured"))
            return
        }
        _state.value = AuthState.SigningIn(languageStore.str("auth_adding_google"))
        try {
            val challenge = api.createChallenge()
            val option = if (explicitButton) {
                GetSignInWithGoogleOption.Builder(googleWebClientId)
                    .setNonce(challenge.nonce)
                    .build()
            } else {
                GetGoogleIdOption.Builder()
                    .setServerClientId(googleWebClientId)
                    .setFilterByAuthorizedAccounts(true)
                    .setAutoSelectEnabled(true)
                    .setNonce(challenge.nonce)
                    .build()
            }
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(option)
                .build()
            val response = credentialManager.getCredential(activity, request)
            val credential = response.credential
            if (credential !is CustomCredential ||
                credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                throw IllegalStateException("Unsupported Google credential")
            }
            val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)
            val session = api.exchangeGoogle(challenge.challengeId, googleCredential.idToken)
            sessionStore.save(session)
            _state.value = AuthState.Authenticated(session)
            Analytics.authSucceeded("google")
        } catch (_: GetCredentialCancellationException) {
            _state.value = AuthState.SignedOut()
        } catch (_: NoCredentialException) {
            _state.value = AuthState.SignedOut(
                if (explicitButton) languageStore.str("auth_no_google_account") else null
            )
            Analytics.authFailed("google", "no_credential")
        } catch (error: AuthApiException) {
            _state.value = AuthState.SignedOut(error.toHindiMessage())
            Analytics.authFailed("google", error.code)
        } catch (_: IOException) {
            _state.value = AuthState.SignedOut(languageStore.str("auth_check_connection"))
            Analytics.authFailed("google", "network_error")
        } catch (_: Exception) {
            _state.value = AuthState.SignedOut(languageStore.str("auth_google_failed"))
            Analytics.authFailed("google", "unknown_error")
        }
    }

    suspend fun signInWithAccess(login: String, password: String) {
        _state.value = AuthState.SigningIn(languageStore.str("auth_signing_in"))
        try {
            val session = api.exchangeAccess(login.trim(), password)
            sessionStore.save(session)
            _state.value = AuthState.Authenticated(session)
            Analytics.authSucceeded("access")
        } catch (error: AuthApiException) {
            _state.value = AuthState.SignedOut(error.message)
            Analytics.authFailed("access", error.code)
        } catch (_: IOException) {
            _state.value = AuthState.SignedOut(languageStore.str("auth_check_connection"))
            Analytics.authFailed("access", "network_error")
        } catch (_: Exception) {
            _state.value = AuthState.SignedOut(languageStore.str("auth_access_failed"))
            Analytics.authFailed("access", "unknown_error")
        }
    }

    suspend fun signOut() {
        val token = currentSession?.accessToken
        if (token != null) runCatching { api.logout(token) }
        sessionStore.clear()
        runCatching { credentialManager.clearCredentialState(ClearCredentialStateRequest()) }
        _state.value = AuthState.SignedOut()
    }

    suspend fun deleteAccount(): Result<String> {
        val session = currentSession ?: return Result.failure(IllegalStateException("Not signed in"))
        return runCatching {
            api.deleteAccount(session.accessToken)
            sessionStore.clear()
            runCatching { credentialManager.clearCredentialState(ClearCredentialStateRequest()) }
            _state.value = AuthState.SignedOut()
            session.user.id
        }
    }

    fun authorizationHeader(): String? = currentSession?.accessToken?.let { "Bearer $it" }

    private fun AuthApiException.toHindiMessage(): String = when (code) {
        "CHALLENGE_EXPIRED", "CHALLENGE_REUSED" -> languageStore.str("auth_challenge_expired")
        "INVALID_GOOGLE_TOKEN", "INVALID_NONCE" -> languageStore.str("auth_invalid_google_token")
        "VERIFIED_EMAIL_REQUIRED" -> languageStore.str("auth_verified_email_required")
        "ACCOUNT_LINK_REQUIRED" -> languageStore.str("auth_account_link_required")
        "AUTH_NOT_CONFIGURED" -> languageStore.str("auth_not_available")
        else -> message
    }
}
