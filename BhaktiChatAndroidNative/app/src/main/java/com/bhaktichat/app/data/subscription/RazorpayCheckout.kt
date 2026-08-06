package com.bhaktichat.app.data.subscription

import android.app.Activity
import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
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

    // Kept to the minimal documented set for subscription checkout. amount, currency and
    // the billing schedule all come from subscription_id — restating them here is at best
    // redundant and at worst conflicting input for the checkout form.
    val options = JSONObject().apply {
        put("name", "BhaktiChat")
        put("description", "Chadhava")
        put("subscription_id", request.subscriptionId)
        // Explicitly ask for UPI. The Android Standard Checkout docs call for this to
        // activate the UPI Intent flow; without it the SDK can fall back to showing only
        // card/eMandate even when the account has UPI enabled.
        put("method", JSONObject().put("upi", true))
        put("theme", JSONObject().put("color", "#EA580C"))
        if (!prefillEmail.isNullOrBlank()) {
            put("prefill", JSONObject().put("email", prefillEmail))
        }
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


/**
 * Opens Razorpay's own hosted checkout page in a Chrome Custom Tab.
 *
 * Preferred over [launchRazorpayCheckout]: the native SDK does not offer UPI for
 * subscription checkout on this account, while this page — the same one mobile web serves —
 * offers the full UPI app list. A Custom Tab keeps the user inside the app (our colours, a
 * close button, no app switch) rather than throwing them out to a browser.
 *
 * Returns false if no browser can handle it, so the caller can fall back to the SDK.
 */
fun launchHostedCheckout(activity: Activity, hostedUrl: String): Boolean = runCatching {
    val tab = CustomTabsIntent.Builder()
        .setShowTitle(true)
        .setUrlBarHidingEnabled(false)
        .setDefaultColorSchemeParams(
            CustomTabColorSchemeParams.Builder()
                .setToolbarColor(CHADHAAVA_ACCENT)
                .build()
        )
        .build()
    tab.launchUrl(activity, Uri.parse(hostedUrl))
    true
}.getOrElse {
    Log.e("RazorpayCheckout", "Custom Tab failed; caller should fall back to the SDK", it)
    false
}

private const val CHADHAAVA_ACCENT = 0xFFEA580C.toInt()
