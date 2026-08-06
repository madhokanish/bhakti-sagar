package com.bhaktichat.app.ui.screens.chadhaava

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.subscription.CreatedSubscription
import com.bhaktichat.app.data.subscription.SubscriptionApiException
import com.bhaktichat.app.data.subscription.SubscriptionRepository
import com.bhaktichat.app.data.subscription.SubscriptionSummary
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/** Which gated feature sent the user here, so the screen can lead with it. */
enum class BlockedFeature { WALLPAPERS, CHAT_QUOTA, IMAGE_QUOTA }

sealed interface ChadhaavaUiState {
    data object Loading : ChadhaavaUiState

    /** Not subscribed. [blockedBy] is set when the user arrived from a gated feature. */
    data class Offer(val blockedBy: BlockedFeature? = null) : ChadhaavaUiState

    /** Handed off to a UPI app; can legitimately last 30–60s. */
    data class Processing(val elapsedSeconds: Int) : ChadhaavaUiState

    data class Active(
        val summary: SubscriptionSummary,
        val isTrial: Boolean,
        val daysRemaining: Int?
    ) : ChadhaavaUiState

    /**
     * Payment did not complete. Carries no gateway detail on purpose — the copy shown is
     * always ours, so a raw error payload can never leak into the UI.
     */
    data object Failed : ChadhaavaUiState
}

/** Emitted when the screen should hand off to Razorpay Checkout. */
data class CheckoutRequest(val subscriptionId: String, val keyId: String, val hostedUrl: String?)

class ChadhaavaViewModel(
    private val repository: SubscriptionRepository,
    private val blockedBy: BlockedFeature? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow<ChadhaavaUiState>(ChadhaavaUiState.Loading)
    val uiState: StateFlow<ChadhaavaUiState> = _uiState.asStateFlow()

    /**
     * Consumed by the host Activity, which owns the Razorpay SDK. Kept as an event rather
     * than state so a configuration change can't re-launch checkout.
     */
    private val _checkoutRequests = MutableSharedFlow<CheckoutRequest>(extraBufferCapacity = 1)
    val checkoutRequests: SharedFlow<CheckoutRequest> = _checkoutRequests.asSharedFlow()

    private var pollJob: Job? = null

    init {
        viewModelScope.launch {
            repository.refresh()
            render(repository.state.value)
        }
        viewModelScope.launch {
            repository.state.collect { summary ->
                // Never let a background refresh yank the user out of the UPI wait or an
                // error sheet — those are resolved explicitly.
                if (_uiState.value is ChadhaavaUiState.Processing) return@collect
                if (_uiState.value is ChadhaavaUiState.Failed) return@collect
                render(summary)
            }
        }
    }

    /** Creates the subscription server-side and asks the host to open Razorpay Checkout. */
    fun startCheckout() {
        if (_uiState.value is ChadhaavaUiState.Processing) return
        viewModelScope.launch {
            try {
                val created: CreatedSubscription = repository.createSubscription()
                _uiState.value = ChadhaavaUiState.Processing(elapsedSeconds = 0)
                startPolling()
                _checkoutRequests.emit(CheckoutRequest(created.subscriptionId, created.keyId, created.hostedUrl))
            } catch (error: SubscriptionApiException) {
                // 409 means a mandate already exists; the repository has already adopted the
                // server's state, so just render it rather than showing an error.
                if (error.code == "ALREADY_SUBSCRIBED") render(repository.state.value)
                else {
                    Log.w(TAG, "Create subscription failed: ${error.code} ${error.message}")
                    _uiState.value = ChadhaavaUiState.Failed
                }
            } catch (error: Exception) {
                Log.w(TAG, "Create subscription failed", error)
                _uiState.value = ChadhaavaUiState.Failed
            }
        }
    }

    /**
     * Checkout reported a failure.
     *
     * The gateway's [description] is a raw JSON blob meant for developers — it is logged,
     * never shown. Users only ever see our own copy, which leads with "nothing was
     * deducted". A user backing out of the payment sheet is not an error, so that returns
     * quietly to the offer instead of raising an alarming screen.
     */
    fun onCheckoutFailed(code: Int, description: String?) {
        pollJob?.cancel()
        Log.w(TAG, "Checkout failed (code=$code): $description")
        _uiState.value = if (code == CODE_PAYMENT_CANCELLED) {
            ChadhaavaUiState.Offer(blockedBy)
        } else {
            ChadhaavaUiState.Failed
        }
    }

    /**
     * The user says they approved it. Forces a gateway-reconciling read rather than waiting
     * for the next poll tick.
     */
    fun checkNow() {
        viewModelScope.launch { repository.refresh(reconcileWithGateway = true) }
    }

    fun dismissError() {
        _uiState.value = ChadhaavaUiState.Offer(blockedBy)
    }

    fun cancelSubscription() {
        viewModelScope.launch {
            runCatching { repository.cancel() }
        }
    }

    /**
     * Polls while the user is in their UPI app. The mandate is approved outside the app and
     * confirmed by a webhook, so there's no callback to wait on — [reconcileWithGateway]
     * asks the server to read Razorpay directly, covering the window before the webhook
     * lands. Gives up at 3 minutes; the design asks for no timeout under 90s.
     */
    private fun startPolling() {
        pollJob?.cancel()
        pollJob = viewModelScope.launch {
            var elapsed = 0
            while (isActive && elapsed < POLL_TIMEOUT_SECONDS) {
                delay(TimeUnit.SECONDS.toMillis(POLL_INTERVAL_SECONDS.toLong()))
                elapsed += POLL_INTERVAL_SECONDS
                (_uiState.value as? ChadhaavaUiState.Processing)?.let {
                    _uiState.value = ChadhaavaUiState.Processing(elapsed)
                } ?: return@launch

                repository.refresh(reconcileWithGateway = true)
                if (repository.state.value.isPro) {
                    render(repository.state.value)
                    return@launch
                }
            }
            if (_uiState.value is ChadhaavaUiState.Processing) {
                _uiState.value = ChadhaavaUiState.Failed
            }
        }
    }

    private fun render(summary: SubscriptionSummary) {
        _uiState.value = if (summary.isPro) {
            val isTrial = summary.status == "trialing"
            ChadhaavaUiState.Active(
                summary = summary,
                isTrial = isTrial,
                daysRemaining = summary.trialEndMillis?.let { daysUntil(it) }
            )
        } else {
            ChadhaavaUiState.Offer(blockedBy)
        }
    }

    private fun daysUntil(millis: Long): Int {
        val remaining = millis - System.currentTimeMillis()
        if (remaining <= 0) return 0
        return TimeUnit.MILLISECONDS.toDays(remaining).toInt() + 1
    }

    override fun onCleared() {
        pollJob?.cancel()
        super.onCleared()
    }

    private companion object {
        const val TAG = "Chadhaava"
        /** com.razorpay.Checkout.PAYMENT_CANCELED — user dismissed the payment sheet. */
        const val CODE_PAYMENT_CANCELLED = 0
        const val POLL_INTERVAL_SECONDS = 3
        const val POLL_TIMEOUT_SECONDS = 180
    }
}

class ChadhaavaViewModelFactory(
    private val repository: SubscriptionRepository,
    private val blockedBy: BlockedFeature? = null
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ChadhaavaViewModel::class.java)) {
            return ChadhaavaViewModel(repository, blockedBy) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
