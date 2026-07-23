package com.bhaktichat.app.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class DivineFeedbackClient(
    private val baseUrl: String,
    private val httpClient: OkHttpClient
) {
    private val jsonMedia = "application/json".toMediaType()
    private val endpoint = baseUrl.trimEnd('/') + "/api/bhaktigpt/divine-image/feedback"

    suspend fun submitFeedback(
        requestId: String,
        variant: String,
        rating: String,
        mode: String?,
        userKey: String?
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject().apply {
                put("requestId", requestId)
                put("variant", variant)
                put("rating", rating)
                if (mode != null) put("mode", mode)
                if (userKey != null) put("userKey", userKey)
            }
            val request = Request.Builder()
                .url(endpoint)
                .post(payload.toString().toRequestBody(jsonMedia))
                .build()
            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) error("Feedback ${response.code}")
            }
        }
    }
}
