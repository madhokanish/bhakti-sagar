package com.bhaktichat.app.data.billing

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.bhaktichat.app.BuildConfig
import com.bhaktichat.app.util.EntitlementStore
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Everything the paywall needs to render prices — sourced here so the UI never hardcodes
 * amounts. On launch the mock defaults are shown; once the BillingClient connects and
 * queries [ProductDetails], [pricing] is updated with Play's per-country, already
 * localized strings (e.g. "£1.99" for a UK account, "₹99" for India), so the paywall
 * becomes correct in every country with no UI change.
 *
 * [anchorPrice] is a cosmetic struck-through reference only (there is no Play-side
 * discount). If you want a real per-country discount, configure a Play intro offer and
 * read its two pricing phases instead of setting this by hand.
 */
data class PricingInfo(
    val price: String,            // ongoing localized price — "₹99" / "£1.99"
    val period: String,           // billing period — "month"
    val anchorPrice: String?,     // cosmetic reference price — "₹250" / "£3.50" (or null)
    val freeTrialLabel: String?   // trial length — "3 days" (or null when no trial)
)

// REVIEW: existing subscriber handling — decide before removing.
// The app has pivoted to an ad-based model; the paywall and all purchase entry points
// have been removed, so [purchase] is no longer reachable from the UI. This whole class
// is intentionally KEPT so that:
//   1. users who already bought the subscription are still reconciled against Play on
//      launch ([reconcileEntitlement]) and keep [EntitlementStore.isPro] = true, and
//   2. you retain a working restore/reconcile path while you decide whether to honor
//      existing subscriptions until they lapse or refund/notify those users.
// [purchase]/[restorePurchases] are now dead UI paths — remove them (and the billing-ktx
// dependency) only once you've decided how to treat existing subscribers.
/**
 * Wraps Google Play Billing for the single "Monthly Chadhawa" subscription.
 *
 * Purchases resolve asynchronously through [PurchasesUpdatedListener]; a completed,
 * acknowledged purchase flips [EntitlementStore.grantPro], which dismisses the paywall.
 * On every connect we also reconcile against Play (the source of truth) so a user who
 * subscribed on another device — or whose local flag drifted — is granted/revoked
 * correctly.
 *
 * NOTE (security): this grants entitlement client-side after acknowledge. For hardened
 * anti-fraud, POST `purchase.purchaseToken` to the backend and verify it with the Google
 * Play Developer API before calling grantPro(). Hook that in at [handlePurchase].
 */
class SubscriptionManager(
    context: Context,
    private val entitlementStore: EntitlementStore
) {
    private val appContext = context.applicationContext

    sealed class PurchaseOutcome {
        object Success : PurchaseOutcome()
        object UserCancelled : PurchaseOutcome()
        object Pending : PurchaseOutcome()
        data class Failed(val message: String) : PurchaseOutcome()
    }

    private val _purchaseInFlight = MutableStateFlow(false)
    val purchaseInFlight: StateFlow<Boolean> = _purchaseInFlight.asStateFlow()

    // Shown until Play responds; then replaced with localized ProductDetails values.
    private val _pricing = MutableStateFlow(
        PricingInfo(
            price = "₹99",
            period = "month",
            anchorPrice = "₹250",
            freeTrialLabel = "7 days"
        )
    )
    val pricing: StateFlow<PricingInfo> = _pricing.asStateFlow()

    private var productDetails: ProductDetails? = null
    private var offerToken: String? = null

    private val purchasesListener = PurchasesUpdatedListener { result, purchases ->
        if (result.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            purchases.forEach { handlePurchase(it) }
        } else {
            // USER_CANCELED, or any error — Play already showed its own UI; just stop the spinner.
            _purchaseInFlight.value = false
        }
    }

    private val billingClient = BillingClient.newBuilder(appContext)
        .setListener(purchasesListener)
        .enablePendingPurchases(
            PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
        )
        .build()

    init {
        connect()
    }

    private fun connect() {
        if (billingClient.isReady) return
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryProduct()
                    reconcileEntitlement()
                }
            }

            override fun onBillingServiceDisconnected() {
                // Reconnect lazily on the next purchase/restore attempt.
            }
        })
    }

    /** Loads [ProductDetails] and republishes [pricing] from Play's localized values. */
    private fun queryProduct() {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                listOf(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(MONTHLY_CHADHAWA_PRODUCT_ID)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
                )
            )
            .build()

        billingClient.queryProductDetailsAsync(params) { result, queryResult ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) return@queryProductDetailsAsync
            val details = queryResult.productDetailsList.firstOrNull() ?: return@queryProductDetailsAsync
            val offer = details.subscriptionOfferDetails?.firstOrNull() ?: return@queryProductDetailsAsync

            productDetails = details
            offerToken = offer.offerToken

            val phases = offer.pricingPhases.pricingPhaseList
            val trialPhase = phases.firstOrNull { it.priceAmountMicros == 0L }
            val paidPhase = phases.lastOrNull { it.priceAmountMicros > 0L } ?: phases.last()

            _pricing.value = _pricing.value.copy(
                price = paidPhase.formattedPrice,
                period = billingPeriodLabel(paidPhase.billingPeriod),
                // The ₹250 anchor is an INR-only cosmetic reference; never show it beside a
                // non-INR localized price (avoids a nonsensical "£1.99 ₹250" card).
                anchorPrice = _pricing.value.anchorPrice?.takeIf { paidPhase.priceCurrencyCode == "INR" },
                freeTrialLabel = trialPhase?.let { trialLabel(it.billingPeriod) }
            )
        }
    }

    /**
     * Triggers the purchase flow. The real grant happens asynchronously in
     * [handlePurchase] via the [PurchasesUpdatedListener], so this returns [Pending]
     * once the Play flow is launched. In DEBUG builds where the store isn't available
     * (e.g. an emulator with no Play account), it falls back to a local mock grant so the
     * Pro UI stays testable. Release builds never mock.
     */
    @Suppress("UNUSED_PARAMETER")
    suspend fun purchase(productId: String, activity: Activity?): PurchaseOutcome {
        if (_purchaseInFlight.value) return PurchaseOutcome.Pending

        val details = productDetails
        val token = offerToken
        if (activity != null && details != null && token != null) {
            _purchaseInFlight.value = true
            val flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(
                    listOf(
                        BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(details)
                            .setOfferToken(token)
                            .build()
                    )
                )
                .build()
            val launch = billingClient.launchBillingFlow(activity, flowParams)
            if (launch.responseCode != BillingClient.BillingResponseCode.OK) {
                _purchaseInFlight.value = false
                return PurchaseOutcome.Failed("Could not open the purchase screen. Please try again.")
            }
            return PurchaseOutcome.Pending
        }

        // Store not ready.
        connect()
        if (BuildConfig.DEBUG) {
            // DEBUG-only mock so the paywall/Pro UI can be exercised without Play.
            _purchaseInFlight.value = true
            try {
                delay(650)
                entitlementStore.grantPro()
                return PurchaseOutcome.Success
            } finally {
                _purchaseInFlight.value = false
            }
        }
        return PurchaseOutcome.Failed("Store is not ready yet. Please try again in a moment.")
    }

    /** Re-grants Pro for an active subscription (e.g. after reinstall / new device). */
    suspend fun restorePurchases() {
        connect()
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        ) { result, purchases ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) return@queryPurchasesAsync
            reconcile(purchases)
        }
    }

    private fun reconcileEntitlement() {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        ) { result, purchases ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) return@queryPurchasesAsync
            reconcile(purchases)
        }
    }

    private fun reconcile(purchases: List<Purchase>) {
        val active = purchases.any { it.purchaseState == Purchase.PurchaseState.PURCHASED }
        if (active) {
            purchases.forEach { handlePurchase(it) }
        } else if (!BuildConfig.DEBUG) {
            // No active subscription per Play → ensure Pro is off. Skipped in DEBUG so a
            // mock grant during development isn't wiped by the reconcile.
            entitlementStore.revokePro()
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) {
            _purchaseInFlight.value = false
            return
        }
        // TODO(server): verify purchase.purchaseToken on the backend before granting.
        if (!purchase.isAcknowledged) {
            billingClient.acknowledgePurchase(
                AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()
            ) { /* acknowledged */ }
        }
        entitlementStore.grantPro()
        _purchaseInFlight.value = false
    }

    companion object {
        const val MONTHLY_CHADHAWA_PRODUCT_ID: String = "com.bhaktichat.chadhawa.monthly"

        /** ISO-8601 billing period ("P1M") → a human label ("month"). */
        private fun billingPeriodLabel(period: String): String = when (period) {
            "P1W" -> "week"
            "P1M" -> "month"
            "P3M" -> "3 months"
            "P6M" -> "6 months"
            "P1Y" -> "year"
            else -> "month"
        }

        /** ISO-8601 trial period ("P3D") → a trial label ("3 days"). */
        private fun trialLabel(period: String): String {
            val amount = period.filter { it.isDigit() }.toIntOrNull() ?: return "free trial"
            val unit = when (period.lastOrNull()) {
                'D' -> "day"
                'W' -> "week"
                'M' -> "month"
                'Y' -> "year"
                else -> "day"
            }
            return "$amount $unit${if (amount == 1) "" else "s"}"
        }
    }
}
