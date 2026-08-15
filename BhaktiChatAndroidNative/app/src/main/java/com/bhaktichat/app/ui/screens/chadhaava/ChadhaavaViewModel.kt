package com.bhaktichat.app.ui.screens.chadhaava

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.autopay.UpiAutopayApiException
import com.bhaktichat.app.data.autopay.UpiAutopayAuthorization
import com.bhaktichat.app.data.autopay.UpiAutopayRepository
import com.bhaktichat.app.data.autopay.UpiAutopaySummary
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
        val summary: UpiAutopaySummary,
        val isTrial: Boolean,
        val daysRemaining: Int?
    ) : ChadhaavaUiState

    /**
     * Payment did not complete. Carries no gateway detail on purpose — the copy shown is
     * always ours, so a raw error payload can never leak into the UI.
     */
    data object Failed : ChadhaavaUiState
}

/** Emitted after the server has created a Razorpay UPI AutoPay authorization. */
data class UpiAuthorizationRequest(val intentUrl: String)

class ChadhaavaViewModel(
    private val repository: UpiAutopayRepository,
    private val blockedBy: BlockedFeature? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow<ChadhaavaUiState>(ChadhaavaUiState.Loading)
    val uiState: StateFlow<ChadhaavaUiState> = _uiState.asStateFlow()

    /** Kept as an event so a configuration change cannot re-open the customer's UPI app. */
    private val _authorizationRequests = MutableSharedFlow<UpiAuthorizationRequest>(extraBufferCapacity = 1)
    val authorizationRequests: SharedFlow<UpiAuthorizationRequest> = _authorizationRequests.asSharedFlow()

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

    /** Creates a fresh direct UPI AutoPay authorization and asks Android to open its URI. */
    fun startAuthorization(contact: String) {
        if (_uiState.value is ChadhaavaUiState.Processing) return
        viewModelScope.launch {
            try {
                val created: UpiAutopayAuthorization = repository.authorize(contact)
                _uiState.value = ChadhaavaUiState.Processing(elapsedSeconds = 0)
                startPolling()
                _authorizationRequests.emit(UpiAuthorizationRequest(created.intentUrl))
            } catch (error: UpiAutopayApiException) {
                if (error.code == "ALREADY_SUBSCRIBED") render(repository.state.value)
                else {
                    Log.w(TAG, "Create UPI AutoPay authorization failed: ${error.code} ${error.message}")
                    _uiState.value = ChadhaavaUiState.Failed
                }
            } catch (error: Exception) {
                Log.w(TAG, "Create UPI AutoPay authorization failed", error)
                _uiState.value = ChadhaavaUiState.Failed
            }
        }
    }

    /** Android could not find an installed app that handles the UPI mandate URI. */
    fun onUpiAppUnavailable() {
        pollJob?.cancel()
        _uiState.value = ChadhaavaUiState.Failed
    }

    /**
     * The user says they approved it. Forces a gateway-reconciling read rather than waiting
     * for the next poll tick.
     */
    fun checkNow() {
        viewModelScope.launch {
            repository.refresh(reconcileWithGateway = true)
            val summary = repository.state.value
            if (summary.isPro) render(summary)
        }
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
                // Only drives the visible timer while the wait screen is up. It deliberately
                // keeps polling once the user is back on the offer, so a mandate approved
                // late still promotes them without them doing anything.
                (_uiState.value as? ChadhaavaUiState.Processing)?.let {
                    _uiState.value = ChadhaavaUiState.Processing(elapsed)
                }

                repository.refresh(reconcileWithGateway = true)
                if (repository.state.value.isPro) {
                    render(repository.state.value)
                    return@launch
                }
            }
            // Timed out without ever seeing a payment. That is not evidence one failed —
            // most often the user simply backed out — so return to the offer rather than
            // accusing them of a failed payment we never observed.
            if (_uiState.value is ChadhaavaUiState.Processing) {
                _uiState.value = ChadhaavaUiState.Offer(blockedBy)
            }
        }
    }

    private fun render(summary: UpiAutopaySummary) {
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
        const val POLL_INTERVAL_SECONDS = 3
        const val POLL_TIMEOUT_SECONDS = 180
    }
}

class ChadhaavaViewModelFactory(
    private val repository: UpiAutopayRepository,
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
