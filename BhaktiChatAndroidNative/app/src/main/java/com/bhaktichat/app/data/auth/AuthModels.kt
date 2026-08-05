package com.bhaktichat.app.data.auth

data class MobileUser(
    val id: String,
    val email: String?,
    val name: String?,
    val image: String?,
    val isReviewer: Boolean
)

data class MobileSession(
    val accessToken: String,
    val expiresAtMillis: Long,
    val user: MobileUser
)

sealed interface AuthState {
    data object Checking : AuthState
    data class SignedOut(val message: String? = null) : AuthState
    data class SigningIn(val message: String) : AuthState
    data class Authenticated(val session: MobileSession) : AuthState
}

data class AuthChallenge(
    val challengeId: String,
    val nonce: String
)

class AuthApiException(
    val code: String,
    val status: Int,
    override val message: String
) : Exception(message)
