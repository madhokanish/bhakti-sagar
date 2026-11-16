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
import com.bhaktichat.app.domain.AppLanguage
import com.bhaktichat.app.ui.i18n.str
import com.bhaktichat.app.ui.i18n.translate
import com.bhaktichat.app.util.EntitlementStore
import com.bhaktichat.app.util.LanguageStore
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Play's localized price for the legacy Play subscription. Still refreshed from
 * [ProductDetails] on connect, but nothing in the UI reads it any more — the current
 * चढ़ावा subscription is sold via Razorpay web checkout (SubscriptionRepository).
 *
 * [anchorPrice] is a cosmetic struck-through reference only (there is no Play-side discount).
 */
data class PricingInfo(
    val price: String,            // ongoing localized price — "₹99" / "£1.99"
    val period: String,           // billing period — "month"
    val anchorPrice: String?,     // cosmetic reference price — "₹250" / "£3.50" (or null)
    val freeTrialLabel: String?   // trial length — "3 days" (or null when no trial)
)

// REVIEW: grandfathered-subscriber handling — decide before removing.
// New चढ़ावा subscriptions go through Razorpay (SubscriptionRepository); there is no Play
// purchase entry point in the UI, so [purchase]/[restorePurchases]/[pricing] are unreachable.
// This class is KEPT only so users who bought the Play subscription before the switch are
// still reconciled against Play on launch ([reconcileEntitlement]) and keep the Play rail of
// [EntitlementStore.isPro]. Remove it (and the billing dependency) once you've decided how to
// treat those subscribers.
/**
 * Wraps Google Play Billing for the legacy "Monthly Chadhawa" Play subscription.
 *
 * On every connect it reconciles against Play (the source of truth for this rail): an active
 * purchase calls [EntitlementStore.grantPro], none calls [EntitlementStore.revokePro]. Both
 * touch only the Play flag, so a Razorpay subscriber is never revoked by this.
 *
 * NOTE (security): this grants entitlement client-side after acknowledge. For hardened
 * anti-fraud, POST `purchase.purchaseToken` to the backend and verify it with the Google
 * Play Developer API before calling grantPro(). Hook that in at [handlePurchase].
 */
class SubscriptionManager(
    context: Context,
    private val entitlementStore: EntitlementStore,
    private val languageStore: LanguageStore
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
                period = billingPeriodLabel(paidPhase.billingPeriod, languageStore.language.value),
                // The ₹250 anchor is an INR-only cosmetic reference; never show it beside a
                // non-INR localized price (avoids a nonsensical "£1.99 ₹250" card).
                anchorPrice = _pricing.value.anchorPrice?.takeIf { paidPhase.priceCurrencyCode == "INR" },
                freeTrialLabel = trialPhase?.let { trialLabel(it.billingPeriod, languageStore.language.value) }
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
                return PurchaseOutcome.Failed(languageStore.str("billing_checkout_failed"))
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
        return PurchaseOutcome.Failed(languageStore.str("billing_store_not_ready"))
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

    /** Releases the Play connection. Called when the owning AppContainer is torn down. */
    fun close() {
        billingClient.endConnection()
    }

    companion object {
        const val MONTHLY_CHADHAWA_PRODUCT_ID: String = "com.bhaktichat.chadhawa.monthly"

        /** ISO-8601 billing period ("P1M") → a human label ("month"). */
        private fun billingPeriodLabel(period: String, language: AppLanguage): String = translate(
            when (period) {
                "P1W" -> "period_week"
                "P1M" -> "period_month"
                "P3M" -> "period_3_months"
                "P6M" -> "period_6_months"
                "P1Y" -> "period_year"
                else -> "period_month"
            },
            language
        )

        /** ISO-8601 trial period ("P3D") → a trial label ("3 days"). */
        private fun trialLabel(period: String, language: AppLanguage): String {
            val amount = period.filter { it.isDigit() }.toIntOrNull()
                ?: return translate("trial_free", language)
            val unit = translate(
                when (period.lastOrNull()) {
                    'D' -> "unit_day"
                    'W' -> "unit_week"
                    'M' -> "unit_month"
                    'Y' -> "unit_year"
                    else -> "unit_day"
                },
                language
            )
            return "$amount $unit"
        }
    }
}
