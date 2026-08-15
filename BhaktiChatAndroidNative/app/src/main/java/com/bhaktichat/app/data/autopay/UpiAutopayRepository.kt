package com.bhaktichat.app.data.autopay

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
 * Owns the direct UPI AutoPay membership state. Only the backend can grant entitlement;
 * an Android intent having been opened is never treated as a successful payment.
 */
class UpiAutopayRepository(
    baseUrl: String,
    private val authRepository: AuthRepository,
    private val entitlementStore: EntitlementStore,
    private val api: UpiAutopayApi = UpiAutopayApi(baseUrl),
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
) {
    private val _state = MutableStateFlow(UpiAutopaySummary.NONE)
    val state: StateFlow<UpiAutopaySummary> = _state.asStateFlow()
    private val refreshLock = Mutex()

    init {
        scope.launch {
            authRepository.state.collect { auth ->
                when (auth) {
                    is AuthState.Authenticated -> refresh()
                    is AuthState.SignedOut -> apply(UpiAutopaySummary.NONE)
                    else -> Unit
                }
            }
        }
    }

    suspend fun refresh(reconcileWithGateway: Boolean = false) {
        val token = authRepository.currentSession?.accessToken ?: return
        refreshLock.withLock {
            runCatching { api.status(token, refresh = reconcileWithGateway) }.onSuccess(::apply)
        }
    }

    suspend fun authorize(contact: String): UpiAutopayAuthorization {
        val token = authRepository.currentSession?.accessToken
            ?: throw UpiAutopayApiException("AUTH_REQUIRED", 401, "Please sign in to continue.")
        return try {
            api.authorize(token, contact)
        } catch (error: UpiAutopayApiException) {
            error.subscription?.let(::apply)
            throw error
        }
    }

    suspend fun cancel(): UpiAutopayCancelOutcome {
        val token = authRepository.currentSession?.accessToken
            ?: throw UpiAutopayApiException("AUTH_REQUIRED", 401, "Please sign in to continue.")
        return api.cancel(token).also { refresh() }
    }

    private fun apply(summary: UpiAutopaySummary) {
        _state.value = summary
        entitlementStore.setServerPro(summary.isPro)
    }
}
