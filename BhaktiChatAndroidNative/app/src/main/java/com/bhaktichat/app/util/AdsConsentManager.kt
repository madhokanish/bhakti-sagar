package com.bhaktichat.app.util

import android.app.Activity
import android.util.Log
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform

/**
 * Google User Messaging Platform (UMP) consent, gathered once per app start from an
 * Activity. Required before requesting ads for users in regions with consent laws
 * (EEA/UK); elsewhere (e.g. most of India) it typically resolves immediately with no form.
 *
 * Configure the actual consent message in AdMob → Privacy & messaging. Until that's set up,
 * this is a safe no-op that just calls [onResolved]. Ad requests should wait for [onResolved]
 * (our banners load on screen display, which is always after this app-start call).
 */
object AdsConsentManager {
    private const val TAG = "AdsConsent"

    fun gather(activity: Activity, onResolved: () -> Unit) {
        val params = ConsentRequestParameters.Builder().build()
        val consentInformation = UserMessagingPlatform.getConsentInformation(activity)
        consentInformation.requestConsentInfoUpdate(
            activity,
            params,
            {
                // Consent info updated — show the form if one is required, then continue.
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
                    if (formError != null) {
                        Log.w(TAG, "Consent form error: ${formError.message}")
                    }
                    onResolved()
                }
            },
            { requestError ->
                // Couldn't fetch consent info (e.g. network). Proceed without blocking ads;
                // Google's SDK still applies a conservative default.
                Log.w(TAG, "Consent info update failed: ${requestError.message}")
                onResolved()
            }
        )
    }
}
