package com.bhaktichat.app.data.autopay

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

/** Network client for the direct Razorpay UPI AutoPay API hosted by BhaktiChat's server. */
class UpiAutopayApi(
    baseUrl: String,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()
) {
    private val apiBase = baseUrl.trimEnd('/') + "/api/mobile/upi-autopay"
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    suspend fun authorize(accessToken: String, contact: String): UpiAutopayAuthorization = request(
        Request.Builder()
            .url("$apiBase/authorize")
            .post(JSONObject().put("contact", contact).toString().toRequestBody(jsonMedia))
            .authorized(accessToken)
            .build()
    ) { json ->
        UpiAutopayAuthorization(
            mandateId = json.getString("mandateId"),
            intentUrl = json.getString("upiIntentUrl")
        )
    }

    suspend fun status(accessToken: String, refresh: Boolean = false): UpiAutopaySummary = request(
        Request.Builder()
            .url(if (refresh) "$apiBase/status?refresh=1" else "$apiBase/status")
            .get()
            .authorized(accessToken)
            .build()
    ) { json -> parseSummary(json.getJSONObject("subscription")) }

    suspend fun cancel(accessToken: String): UpiAutopayCancelOutcome = request(
        Request.Builder()
            .url("$apiBase/cancel")
            .post("{}".toRequestBody(jsonMedia))
            .authorized(accessToken)
            .build()
    ) { json ->
        UpiAutopayCancelOutcome(
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
                    throw UpiAutopayApiException(
                        code = json.optString("code").ifBlank { "HTTP_${response.code}" },
                        status = response.code,
                        message = json.optString("error").ifBlank { "UPI AutoPay is unavailable right now." },
                        subscription = json.optJSONObject("subscription")?.let(::parseSummary)
                    )
                }
                parse(json)
            }
        }

    private fun parseSummary(json: JSONObject) = UpiAutopaySummary(
        isPro = json.optBoolean("isPro", false),
        status = json.optString("status").ifBlank { "inactive" },
        mandateId = json.optNullableString("subscriptionId"),
        trialEndMillis = json.optIsoMillis("trialEnd"),
        currentPeriodEndMillis = json.optIsoMillis("currentPeriodEnd")
    )

    private fun JSONObject.optNullableString(key: String): String? =
        if (isNull(key)) null else optString(key).takeIf { it.isNotBlank() }

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
