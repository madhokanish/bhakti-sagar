package com.bhaktichat.app.ui.auth

import android.app.Activity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import com.bhaktichat.app.data.auth.AuthRepository
import com.bhaktichat.app.ui.i18n.str
import com.bhaktichat.app.util.LanguageStore
import com.google.firebase.FirebaseException
import com.google.firebase.FirebaseTooManyRequestsException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * Host for the two phone-sign-in screens. This owns FirebaseAuth entirely (the screens are
 * pure UI): it fires [PhoneAuthProvider.verifyPhoneNumber], collects the code, exchanges the
 * Firebase ID token for a BhaktiChat session via [AuthRepository.signInWithPhone], and moves
 * between the number and code screens.
 *
 * Strings are resolved through [LanguageStore.str] rather than the composable `t()`, because
 * this runs before sign-in and `LocalAppLanguage` is only provided inside the signed-in app.
 *
 * On an emulator (no SIM, no Play Integrity), only a Firebase *test* phone number completes:
 * it returns a fixed code with no SMS. Console → Authentication → Sign-in method → Phone →
 * "Phone numbers for testing".
 *
 * @param hostMessage a message from the shared auth state (e.g. a session-expired notice, or a
 *   failed Google attempt) shown on the number screen until the user acts.
 */
private const val STEP_NUMBER = 0
private const val STEP_OTP = 1

@Composable
fun PhoneAuthFlow(
    activity: Activity,
    repository: AuthRepository,
    languageStore: LanguageStore,
    onUseGoogle: () -> Unit,
    onUseAccess: () -> Unit,
    hostMessage: String? = null
) {
    val scope = rememberCoroutineScope()
    val auth = remember { FirebaseAuth.getInstance() }

    var step by rememberSaveable { mutableStateOf(STEP_NUMBER) }
    var phone by rememberSaveable { mutableStateOf("") }
    var code by rememberSaveable { mutableStateOf("") }
    var verificationId by rememberSaveable { mutableStateOf<String?>(null) }
    var isSending by remember { mutableStateOf(false) }
    var isVerifying by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    // Not saveable; if a rotation drops it, a resend simply starts a fresh verification.
    var resendToken by remember { mutableStateOf<PhoneAuthProvider.ForceResendingToken?>(null) }

    // Exchanges a verified Firebase credential for a BhaktiChat session. On success the
    // repository publishes Authenticated and the root swaps this screen out, so we only ever
    // land back here on failure — with the OTP screen still up and an inline message to show.
    fun finishWithCredential(credential: PhoneAuthCredential) {
        isVerifying = true
        error = null
        auth.signInWithCredential(credential).addOnCompleteListener(activity) { signIn ->
            if (!signIn.isSuccessful) {
                isVerifying = false
                error = if (signIn.exception is FirebaseAuthInvalidCredentialsException) {
                    languageStore.str("phone_error_invalid_code")
                } else {
                    languageStore.str("auth_phone_failed")
                }
                return@addOnCompleteListener
            }
            val user = signIn.result?.user
            if (user == null) {
                isVerifying = false
                error = languageStore.str("auth_phone_failed")
                return@addOnCompleteListener
            }
            user.getIdToken(false).addOnCompleteListener { tokenTask ->
                val idToken = tokenTask.result?.token
                if (!tokenTask.isSuccessful || idToken.isNullOrBlank()) {
                    isVerifying = false
                    error = languageStore.str("auth_phone_failed")
                    return@addOnCompleteListener
                }
                scope.launch {
                    val message = repository.signInWithPhone(idToken)
                    if (message != null) {
                        isVerifying = false
                        error = message
                    }
                }
            }
        }
    }

    fun sendCode(isResend: Boolean) {
        // Hard re-entry guard: the button's disabled state only updates on the next
        // recomposition, so a fast double-tap (common while Play Integrity spins for a
        // second or two with no feedback) could otherwise fire verifyPhoneNumber twice and
        // send two SMS. isSending is set synchronously below, so a same-frame second tap
        // sees it already true and bails here.
        if (isSending) return
        if (phone.length != 10) {
            error = languageStore.str("phone_error_invalid_number")
            return
        }
        isSending = true
        error = null
        val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
            // Instant / auto-retrieval on a real device: Firebase hands us a ready credential
            // and there is no code to type.
            override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                credential.smsCode?.let { code = it }
                isSending = false
                finishWithCredential(credential)
            }

            override fun onVerificationFailed(e: FirebaseException) {
                isSending = false
                isVerifying = false
                error = when (e) {
                    is FirebaseAuthInvalidCredentialsException ->
                        languageStore.str("phone_error_invalid_number")
                    is FirebaseTooManyRequestsException ->
                        languageStore.str("phone_error_too_many")
                    else -> languageStore.str("phone_error_send_failed")
                }
            }

            override fun onCodeSent(id: String, token: PhoneAuthProvider.ForceResendingToken) {
                verificationId = id
                resendToken = token
                isSending = false
                error = null
                step = STEP_OTP
            }
        }
        val builder = PhoneAuthOptions.newBuilder(auth)
            .setPhoneNumber("+91$phone")
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(callbacks)
        if (isResend) resendToken?.let { builder.setForceResendingToken(it) }
        PhoneAuthProvider.verifyPhoneNumber(builder.build())
    }

    when (step) {
        STEP_OTP -> OtpScreen(
            phone = phone,
            code = code,
            onCodeChange = { code = it; error = null },
            onCodeComplete = {
                val id = verificationId
                if (id != null && !isVerifying) {
                    finishWithCredential(PhoneAuthProvider.getCredential(id, code))
                }
            },
            onResend = { code = ""; sendCode(isResend = true) },
            onChangeNumber = { step = STEP_NUMBER; code = ""; error = null },
            isVerifying = isVerifying,
            error = error,
            title = languageStore.str("phone_otp_title"),
            sentToLabel = languageStore.str("phone_sent_to"),
            changeNumberLabel = languageStore.str("phone_change_number"),
            resendLabel = languageStore.str("phone_resend"),
            resendInLabel = { secs -> languageStore.str("phone_resend_in").format(secs) }
        )
        else -> PhoneNumberScreen(
            phone = phone,
            onPhoneChange = { phone = it; error = null },
            onContinue = { sendCode(isResend = false) },
            onUseGoogle = onUseGoogle,
            isSending = isSending,
            error = error ?: hostMessage,
            title = languageStore.str("phone_title"),
            subtitle = languageStore.str("phone_subtitle"),
            continueLabel = languageStore.str("phone_continue"),
            googleLabel = languageStore.str("phone_use_google"),
            accessLabel = languageStore.str("phone_access_link"),
            onUseAccess = onUseAccess
        )
    }
}
