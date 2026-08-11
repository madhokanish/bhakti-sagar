package com.bhaktichat.app.data.subscription

import android.app.Activity
import android.net.Uri
import android.util.Log
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent

/**
 * Opens Chadhaava checkout in a Chrome Custom Tab.
 *
 * This is the live checkout path. Razorpay's native Android SDK offers only Cards and
 * EMandate for subscription checkout on this account, while the same account's web
 * checkout.js offers UPI, UPI QR, Cards and EMandate — verified live on 10 Aug 2026. See
 * Razorpay ticket 20247903 for the unresolved SDK-side issue.
 *
 * A Custom Tab rather than an embedded WebView, deliberately: UPI works by handing off to
 * GPay/PhonePe/Paytm via intents and coming back, which needs a real browser. A WebView
 * would also be a worse place to enter card details — no URL bar, no shared browser
 * security context.
 *
 * [url] must be a one-time handoff link from the backend; it signs the user in on arrival,
 * so it is a bearer credential and must never be logged or persisted.
 *
 * Returns false when no browser can handle it, so the caller can surface a real failure
 * rather than leaving the user on a spinner.
 */
fun launchHostedCheckout(activity: Activity, url: String): Boolean = runCatching {
    CustomTabsIntent.Builder()
        .setShowTitle(true)
        .setUrlBarHidingEnabled(false)
        .setDefaultColorSchemeParams(
            CustomTabColorSchemeParams.Builder()
                .setToolbarColor(CHADHAAVA_ACCENT)
                .build()
        )
        .build()
        .launchUrl(activity, Uri.parse(url))
    true
}.getOrElse { error ->
    // Deliberately does not log the URL — it is a single-use sign-in credential.
    Log.e("WebCheckout", "No browser could open checkout", error)
    false
}

private const val CHADHAAVA_ACCENT = 0xFFEA580C.toInt()
