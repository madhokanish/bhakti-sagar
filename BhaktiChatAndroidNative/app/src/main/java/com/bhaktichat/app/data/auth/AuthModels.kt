package com.bhaktichat.app.data.auth

data class MobileUser(
    val id: String,
    val email: String?,
    val name: String?,
    val phone: String?,
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

    /**
     * No account, and none is being asked for. This is the resting state for everyone who
     * has not signed in: the app opens straight into [Guest] and every feature that does not
     * need a server identity works exactly as it does for a member.
     *
     * Only checkout needs an account (a Razorpay mandate has to belong to a User row), so
     * [SignedOut] is now reached solely by an explicit request — see
     * [com.bhaktichat.app.data.auth.AuthRepository.requestSignIn].
     */
    data object Guest : AuthState

    /** The sign-in screen is up because the user asked for it. */
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
