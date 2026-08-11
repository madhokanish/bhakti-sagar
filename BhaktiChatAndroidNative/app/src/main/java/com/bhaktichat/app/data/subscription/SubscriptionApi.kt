package com.bhaktichat.app.data.subscription

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit

/**
 * Bearer-authenticated client for the Chadhaava subscription endpoints. Deliberately mirrors
 * [com.bhaktichat.app.data.auth.MobileAuthApi] — same OkHttp + org.json shape, same error
 * envelope ({ error, code }) — so there's one networking idiom in the app.
 */
class SubscriptionApi(
    baseUrl: String,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()
) {
    private val apiBase = baseUrl.trimEnd('/') + "/api/mobile/subscription"
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    /** Creates a Razorpay subscription and returns what Checkout needs to open. */
    suspend fun create(accessToken: String): CreatedSubscription = request(
        Request.Builder()
            .url("$apiBase/create")
            .post("{}".toRequestBody(jsonMedia))
            .authorized(accessToken)
            .build()
    ) { json ->
        CreatedSubscription(
            subscriptionId = json.getString("subscriptionId"),
            keyId = json.getString("keyId"),
            hostedUrl = json.optNullableString("hostedUrl"),
            trialEndMillis = json.optIsoMillis("trialEnd")
        )
    }

    /**
     * Mints a single-use URL that opens web checkout already signed in as this user.
     *
     * Needed because the Custom Tab runs in the browser's own process and cookie jar —
     * the app cannot sign the user in there directly, so the server issues a short-lived
     * handoff token in the URL and exchanges it for a session cookie.
     */
    suspend fun webCheckoutLink(accessToken: String): String = request(
        Request.Builder()
            .url("$apiBase/web-checkout-link")
            .post("{}".toRequestBody(jsonMedia))
            .authorized(accessToken)
            .build()
    ) { json -> json.getString("url") }

    /**
     * Reads current entitlement. [refresh] additionally reconciles against Razorpay
     * server-side — use it right after the user returns from approving a mandate in their
     * UPI app, when the webhook may not have landed yet.
     */
    suspend fun status(accessToken: String, refresh: Boolean = false): SubscriptionSummary {
        val url = if (refresh) "$apiBase/status?refresh=1" else "$apiBase/status"
        return request(
            Request.Builder().url(url).get().authorized(accessToken).build()
        ) { json -> parseSummary(json.getJSONObject("subscription")) }
    }

    suspend fun cancel(accessToken: String): CancelOutcome = request(
        Request.Builder()
            .url("$apiBase/cancel")
            .post("{}".toRequestBody(jsonMedia))
            .authorized(accessToken)
            .build()
    ) { json ->
        CancelOutcome(
            cancelledImmediately = json.optBoolean("cancelledImmediately", true),
            accessUntilMillis = json.optIsoMillis("accessUntil")
        )
    }

    private fun Request.Builder.authorized(accessToken: String) = this
        .header("Authorization", "Bearer $accessToken")
        .header("Accept", "application/json")

    private suspend fun <T> request(request: Request, parse: (JSONObject) -> T): T =
        withContext(Dispatchers.IO) {
            client.newCall(request).execute().use { response ->
                val raw = response.body?.string().orEmpty()
                val json = runCatching { JSONObject(raw) }.getOrElse { JSONObject() }
                if (!response.isSuccessful) {
                    throw SubscriptionApiException(
                        code = json.optString("code").ifBlank { "HTTP_${response.code}" },
                        status = response.code,
                        message = json.optString("error")
                            .ifBlank { "Membership service error (${response.code})." },
                        subscription = json.optJSONObject("subscription")?.let(::parseSummary)
                    )
                }
                parse(json)
            }
        }

    private fun parseSummary(json: JSONObject): SubscriptionSummary = SubscriptionSummary(
        isPro = json.optBoolean("isPro", false),
        status = json.optString("status").ifBlank { "inactive" },
        subscriptionId = json.optNullableString("subscriptionId"),
        trialEndMillis = json.optIsoMillis("trialEnd"),
        currentPeriodEndMillis = json.optIsoMillis("currentPeriodEnd")
    )

    private fun JSONObject.optNullableString(key: String): String? =
        if (isNull(key)) null else optString(key).takeIf { it.isNotBlank() }

    /** Parses an ISO-8601 timestamp, tolerating a missing/null field or an unexpected format. */
    private fun JSONObject.optIsoMillis(key: String): Long? {
        val value = optNullableString(key) ?: return null
        val formats = listOf("yyyy-MM-dd'T'HH:mm:ss.SSSX", "yyyy-MM-dd'T'HH:mm:ssX")
        return formats.firstNotNullOfOrNull { pattern ->
            runCatching {
                SimpleDateFormat(pattern, Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                    isLenient = false
                }.parse(value)?.time
            }.getOrNull()
        }
    }
}
