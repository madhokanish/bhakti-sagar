package com.bhaktichat.app.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.UUID

/** A short-lived OpenAI Realtime API session, minted server-side so the real API key
 *  never reaches the client. */
data class VoiceSession(
    val ephemeralKey: String,
    val model: String,
    val voicePresetId: String
)

class VoiceSessionApi(
    private val baseUrl: String,
    private val httpClient: OkHttpClient
) {
    private val jsonMedia = "application/json".toMediaType()
    private val sessionEndpoint = baseUrl.trimEnd('/') + "/api/bhaktigpt/voice/session"
    private val turnCompleteEndpoint = baseUrl.trimEnd('/') + "/api/bhaktigpt/voice/turn-complete"

    /**
     * @param lang "hi" or "en", the language the app is showing. The session was previously
     * started without it, so the model picked for itself and always spoke Devanagari Hindi.
     */
    suspend fun startSession(guideId: String, lang: String): Result<VoiceSession> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject().apply {
                put("guideId", guideId)
                // Tells the server which language to speak. Without it the model just
                // picked, and it always picked Devanagari Hindi.
                put("lang", lang)
                put("lang", lang)
                put("requestId", UUID.randomUUID().toString())
            }
            val request = Request.Builder()
                .url(sessionEndpoint)
                .post(payload.toString().toRequestBody(jsonMedia))
                .build()
            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    val message = runCatching { JSONObject(body).optString("error") }.getOrNull()
                    error(message?.takeIf { it.isNotBlank() } ?: "Voice session request failed (${response.code})")
                }
                val json = JSONObject(body)
                VoiceSession(
                    ephemeralKey = json.getString("ephemeralKey"),
                    model = json.getString("model"),
                    voicePresetId = json.optString("voicePresetId")
                )
            }
        }
    }

    /** Persists one voice turn into the same conversation history text chat uses. Best-effort —
     *  a failure here loses that turn from history but never affects the live call itself. */
    suspend fun reportTurnComplete(
        guideId: String,
        conversationId: String?,
        userTranscript: String,
        assistantTranscript: String,
        durationSeconds: Double?
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject().apply {
                put("guideId", guideId)
                if (conversationId != null) put("conversationId", conversationId)
                put("userTranscript", userTranscript)
                put("assistantTranscript", assistantTranscript)
                if (durationSeconds != null) put("durationSeconds", durationSeconds)
            }
            val request = Request.Builder()
                .url(turnCompleteEndpoint)
                .post(payload.toString().toRequestBody(jsonMedia))
                .build()
            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful) error("Turn-complete request failed (${response.code})")
                JSONObject(body).getString("conversationId")
            }
        }
    }
}
