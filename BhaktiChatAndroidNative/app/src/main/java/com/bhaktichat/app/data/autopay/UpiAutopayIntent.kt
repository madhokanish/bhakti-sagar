package com.bhaktichat.app.data.autopay

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Log

/**
 * Opens the mandate in Android's native app chooser. This deliberately does not use
 * Razorpay Checkout: the returned `upi://mandate` URI goes directly to the installed UPI
 * apps (GPay, PhonePe, BHIM, etc.), which is the experience customers expect.
 */
fun launchUpiAutopayIntent(activity: Activity, intentUrl: String): Boolean = runCatching {
    val uri = Uri.parse(intentUrl)
    require(uri.scheme.equals("upi", ignoreCase = true) && uri.host.equals("mandate", ignoreCase = true)) {
        "Unexpected UPI mandate URI"
    }
    val intent = Intent(Intent.ACTION_VIEW, uri)
    if (intent.resolveActivity(activity.packageManager) == null) return false
    activity.startActivity(Intent.createChooser(intent, "Choose your UPI app"))
    true
}.getOrElse { error ->
    Log.w("UpiAutopayIntent", "Unable to open UPI mandate", error)
    false
}
