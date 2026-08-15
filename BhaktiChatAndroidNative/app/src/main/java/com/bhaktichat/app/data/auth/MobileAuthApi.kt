package com.bhaktichat.app.data.auth

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

class MobileAuthApi(
    baseUrl: String,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()
) {
    private val apiBase = baseUrl.trimEnd('/') + "/api/mobile"
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    suspend fun createChallenge(): AuthChallenge = post("$apiBase/auth/challenge", JSONObject()) { json ->
        AuthChallenge(
            challengeId = json.getString("challengeId"),
            nonce = json.getString("nonce")
        )
    }

    suspend fun exchangeGoogle(challengeId: String, idToken: String): MobileSession = post(
        "$apiBase/auth/google",
        JSONObject().put("challengeId", challengeId).put("idToken", idToken)
    ) { parseSession(it) }

    suspend fun exchangeAccess(login: String, password: String): MobileSession = post(
        "$apiBase/auth/access",
        JSONObject().put("login", login).put("password", password)
    ) { parseSession(it) }

    // Firebase has already verified the code by the time we get here, so the phone route
    // takes just the resulting ID token — no challenge/nonce like Google (the token carries
    // its own audience and expiry). Response shape is identical to the other exchanges.
    suspend fun exchangePhone(idToken: String): MobileSession = post(
        "$apiBase/auth/phone",
        JSONObject().put("idToken", idToken)
    ) { parseSession(it) }

    suspend fun validate(accessToken: String): MobileSession = request(
        Request.Builder()
            .url("$apiBase/me")
            .get()
            .header("Authorization", "Bearer $accessToken")
            .header("Accept", "application/json")
            .build()
    ) { json ->
        MobileSession(
            accessToken = accessToken,
            expiresAtMillis = parseIsoMillis(json.getString("expiresAt")),
            user = parseUser(json.getJSONObject("user"))
        )
    }

    suspend fun logout(accessToken: String) {
        postAuthorized("$apiBase/auth/logout", accessToken)
    }

    suspend fun deleteAccount(accessToken: String) {
        request<Unit>(
            Request.Builder()
                .url("$apiBase/account")
                .delete()
                .header("Authorization", "Bearer $accessToken")
                .header("Accept", "application/json")
                .build()
        ) { Unit }
    }

    private suspend fun postAuthorized(url: String, accessToken: String) {
        request<Unit>(
            Request.Builder()
                .url(url)
                .post("{}".toRequestBody(jsonMedia))
                .header("Authorization", "Bearer $accessToken")
                .header("Accept", "application/json")
                .build()
        ) { Unit }
    }

    private suspend fun <T> post(url: String, body: JSONObject, parse: (JSONObject) -> T): T =
        request(
            Request.Builder()
                .url(url)
                .post(body.toString().toRequestBody(jsonMedia))
                .header("Accept", "application/json")
                .build(),
            parse
        )

    private suspend fun <T> request(request: Request, parse: (JSONObject) -> T): T =
        withContext(Dispatchers.IO) {
            client.newCall(request).execute().use { response ->
                val raw = response.body?.string().orEmpty()
                val json = runCatching { JSONObject(raw) }.getOrElse { JSONObject() }
                if (!response.isSuccessful) {
                    throw AuthApiException(
                        code = json.optString("code").ifBlank { "HTTP_${response.code}" },
                        status = response.code,
                        message = json.optString("error").ifBlank { "Sign-in service error (${response.code})." }
                    )
                }
                parse(json)
            }
        }

    private fun parseSession(json: JSONObject): MobileSession = MobileSession(
        accessToken = json.getString("accessToken"),
        expiresAtMillis = parseIsoMillis(json.getString("expiresAt")),
        user = parseUser(json.getJSONObject("user"))
    )

    private fun parseUser(json: JSONObject): MobileUser = MobileUser(
        id = json.getString("id"),
        email = json.optNullableString("email"),
        name = json.optNullableString("name"),
        image = json.optNullableString("image"),
        isReviewer = json.optBoolean("isReviewer", false)
    )

    private fun parseIsoMillis(value: String): Long {
        val formats = listOf("yyyy-MM-dd'T'HH:mm:ss.SSSX", "yyyy-MM-dd'T'HH:mm:ssX")
        return formats.firstNotNullOfOrNull { pattern ->
            runCatching {
                SimpleDateFormat(pattern, Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                    isLenient = false
                }.parse(value)?.time
            }.getOrNull()
        } ?: throw IllegalArgumentException("Invalid session expiry")
    }

    private fun JSONObject.optNullableString(key: String): String? =
        if (isNull(key)) null else optString(key).takeIf { it.isNotBlank() }
}
