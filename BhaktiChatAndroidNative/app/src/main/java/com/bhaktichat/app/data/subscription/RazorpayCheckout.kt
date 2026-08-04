package com.bhaktichat.app.data.subscription

import android.app.Activity
import android.content.Context
import android.util.Log
import com.razorpay.Checkout
import org.json.JSONObject

/** Result of a Razorpay Checkout attempt, surfaced by the hosting Activity. */
sealed interface PaymentOutcome {
    /**
     * Checkout reported success. Deliberately carries no entitlement meaning — the app
     * still confirms with the backend before unlocking anything, since a client-side
     * success signal can't be trusted on its own.
     */
    data class Success(val razorpayPaymentId: String?) : PaymentOutcome

    data class Failed(val code: Int, val description: String?) : PaymentOutcome
}

/**
 * Opens Razorpay Checkout for a subscription mandate.
 *
 * Passing `subscription_id` (rather than `order_id`) puts Checkout into subscription mode:
 * it registers a UPI AutoPay mandate and takes Razorpay's fixed, auto-refunded ₹5
 * authentication charge. The result arrives on the Activity's PaymentResultWithDataListener
 * callbacks, not here — mandate approval happens in a different app entirely.
 */
fun launchRazorpayCheckout(
    activity: Activity,
    request: CheckoutRequestData,
    prefillEmail: String?
) {
    val checkout = Checkout()
    checkout.setKeyID(request.keyId)

    val options = JSONObject().apply {
        put("name", "BhaktiChat")
        put("description", "चढ़ावा")
        put("subscription_id", request.subscriptionId)
        put("currency", "INR")
        // The subscription itself carries the amount and schedule; Checkout reads them
        // from subscription_id, so no amount is passed here.
        put("theme", JSONObject().put("color", "#EA580C"))
        if (!prefillEmail.isNullOrBlank()) {
            put("prefill", JSONObject().put("email", prefillEmail))
        }
        put("retry", JSONObject().put("enabled", false))
    }

    runCatching { checkout.open(activity, options) }
        .onFailure { Log.e("RazorpayCheckout", "Unable to open checkout", it) }
}

/** Minimal data the launcher needs, kept separate from the ViewModel's event type. */
data class CheckoutRequestData(val subscriptionId: String, val keyId: String)

/**
 * Warms the SDK ahead of the first checkout.
 *
 * Deliberately NOT called from Activity.onCreate: preload spins up a WebView and does I/O,
 * which was enough to trip an "ANR: failed to complete startup" on a slow device. Call it
 * when the चढ़ावा screen opens instead — still well ahead of the user tapping pay, but off
 * the app's startup path. Runs on a background thread since it is not main-thread cheap.
 */
fun preloadRazorpay(context: Context) {
    val appContext = context.applicationContext
    Thread { runCatching { Checkout.preload(appContext) } }.apply { isDaemon = true }.start()
}
