package com.bhaktichat.app.data.subscription

/**
 * Server truth for the signed-in user's Chadhaava subscription, mirroring the payload from
 * `/api/mobile/subscription/status` and the `subscription` object on `/api/mobile/me`.
 *
 * [isPro] is the backend's own entitlement decision — the client must never re-derive it
 * from [status], so the rule for what counts as entitled lives in exactly one place.
 */
data class SubscriptionSummary(
    val isPro: Boolean,
    val status: String,
    val subscriptionId: String?,
    val trialEndMillis: Long?,
    val currentPeriodEndMillis: Long?
) {
    companion object {
        val NONE = SubscriptionSummary(
            isPro = false,
            status = "inactive",
            subscriptionId = null,
            trialEndMillis = null,
            currentPeriodEndMillis = null
        )
    }
}

/**
 * Everything needed to open Razorpay Checkout for a freshly created subscription.
 *
 * [keyId] comes from the server rather than BuildConfig so a Razorpay key rotation doesn't
 * require shipping a new build to the Play Store.
 */
data class CreatedSubscription(
    val subscriptionId: String,
    val keyId: String,
    /**
     * Razorpay's hosted checkout page for this subscription. Preferred over the native SDK:
     * the SDK does not offer UPI for subscription checkout on this account, while this page
     * does. Null only if Razorpay omits it, in which case we fall back to the SDK.
     */
    val hostedUrl: String?,
    val trialEndMillis: Long?
)

data class CancelOutcome(
    /** True when the mandate was cancelled outright (trial), false when it runs to cycle end. */
    val cancelledImmediately: Boolean,
    val accessUntilMillis: Long?
)

class SubscriptionApiException(
    val code: String,
    val status: Int,
    override val message: String,
    /** Present on 409 ALREADY_SUBSCRIBED so the caller can route straight to the manage view. */
    val subscription: SubscriptionSummary? = null
) : Exception(message)
