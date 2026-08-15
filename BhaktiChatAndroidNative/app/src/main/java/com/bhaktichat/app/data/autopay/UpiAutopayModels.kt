package com.bhaktichat.app.data.autopay

/** Server-verified membership state returned by the direct UPI AutoPay rail. */
data class UpiAutopaySummary(
    val isPro: Boolean,
    val status: String,
    val mandateId: String?,
    val trialEndMillis: Long?,
    val currentPeriodEndMillis: Long?
) {
    companion object {
        val NONE = UpiAutopaySummary(false, "inactive", null, null, null)
    }
}

/** The `upi://mandate` link is generated server-side by Razorpay and never persisted locally. */
data class UpiAutopayAuthorization(val mandateId: String, val intentUrl: String)

data class UpiAutopayCancelOutcome(
    val cancelledImmediately: Boolean,
    val accessUntilMillis: Long?
)

class UpiAutopayApiException(
    val code: String,
    val status: Int,
    override val message: String,
    val subscription: UpiAutopaySummary? = null
) : Exception(message)
