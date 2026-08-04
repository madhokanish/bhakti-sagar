package com.bhaktichat.app.data.subscription

import com.bhaktichat.app.data.auth.AuthRepository
import com.bhaktichat.app.data.auth.AuthState
import com.bhaktichat.app.util.EntitlementStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Owns Chadhaava entitlement on the client.
 *
 * The backend is the source of truth: this never decides who is subscribed, it only fetches
 * that decision and mirrors it into [EntitlementStore] so feature gates and Compose UI can
 * read it synchronously. A client-reported "payment succeeded" is never enough to unlock —
 * entitlement only changes when the server says so.
 *
 * Signing out clears the server rail immediately, so a shared device can't leave the next
 * user with someone else's Pro access.
 */
class SubscriptionRepository(
    baseUrl: String,
    private val authRepository: AuthRepository,
    private val entitlementStore: EntitlementStore,
    private val api: SubscriptionApi = SubscriptionApi(baseUrl),
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
) {
    private val _state = MutableStateFlow(SubscriptionSummary.NONE)
    val state: StateFlow<SubscriptionSummary> = _state.asStateFlow()

    private val _syncing = MutableStateFlow(false)
    val syncing: StateFlow<Boolean> = _syncing.asStateFlow()

    // Serializes refreshes so a resume-triggered sync and a post-payment poll can't
    // interleave and write stale state over fresh state.
    private val refreshLock = Mutex()

    init {
        scope.launch {
            authRepository.state.collect { auth ->
                when (auth) {
                    is AuthState.Authenticated -> refresh()
                    is AuthState.SignedOut -> clearLocalEntitlement()
                    else -> Unit
                }
            }
        }
    }

    /**
     * Pulls entitlement from the backend and mirrors it locally.
     *
     * [reconcileWithGateway] asks the server to additionally re-read Razorpay before
     * answering. Use it right after the user returns from approving a mandate in their UPI
     * app — the webhook may not have landed yet, and without it the app would briefly show
     * "not subscribed" to someone who just paid.
     */
    suspend fun refresh(reconcileWithGateway: Boolean = false) {
        val token = authRepository.currentSession?.accessToken ?: return
        refreshLock.withLock {
            _syncing.value = true
            try {
                apply(api.status(token, refresh = reconcileWithGateway))
            } catch (_: Exception) {
                // Offline or a backend blip must not revoke a paying user's access. Keep the
                // last known state; the next successful refresh corrects it.
            } finally {
                _syncing.value = false
            }
        }
    }

    /** Creates a subscription server-side, ready to hand to Razorpay Checkout. */
    suspend fun createSubscription(): CreatedSubscription {
        val token = authRepository.currentSession?.accessToken
            ?: throw SubscriptionApiException("AUTH_REQUIRED", 401, "कृपया पहले साइन इन करें।")
        try {
            return api.create(token)
        } catch (error: SubscriptionApiException) {
            // 409 means a mandate already exists — adopt the state the server returned so the
            // UI can switch to the manage view instead of showing a confusing error.
            error.subscription?.let(::apply)
            throw error
        }
    }

    suspend fun cancel(): CancelOutcome {
        val token = authRepository.currentSession?.accessToken
            ?: throw SubscriptionApiException("AUTH_REQUIRED", 401, "कृपया पहले साइन इन करें।")
        val outcome = api.cancel(token)
        // Cancelling at cycle end leaves the user entitled until the period ends, so re-read
        // rather than assuming access is gone.
        refresh()
        return outcome
    }

    private fun apply(summary: SubscriptionSummary) {
        _state.value = summary
        entitlementStore.setServerPro(summary.isPro)
    }

    private fun clearLocalEntitlement() {
        _state.value = SubscriptionSummary.NONE
        entitlementStore.setServerPro(false)
    }
}
