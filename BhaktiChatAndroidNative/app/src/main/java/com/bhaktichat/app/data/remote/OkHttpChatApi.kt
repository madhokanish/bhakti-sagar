package com.bhaktichat.app.data.remote

import com.bhaktichat.app.domain.StreamEvent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okio.BufferedSource
import org.json.JSONObject

class OkHttpChatApi(
    private val baseUrl: String,
    private val httpClient: OkHttpClient
) : ChatApi {

    private val jsonMedia = "application/json; charset=utf-8".toMediaType()
    private val chatEndpoint = baseUrl.trimEnd('/') + "/api/bhaktigpt/chat"

    override suspend fun loadConversation(
        guideId: String,
        conversationId: String?,
        forceNewConversation: Boolean,
        chatLang: String
    ): LoadConversationResult = withContext(Dispatchers.IO) {
        val urlBuilder = chatEndpoint.toHttpUrl().newBuilder()
            .addQueryParameter("guideId", guideId)
            .addQueryParameter("chatLang", chatLang)
        if (!conversationId.isNullOrBlank()) {
            urlBuilder.addQueryParameter("conversationId", conversationId)
        }
        if (forceNewConversation) {
            urlBuilder.addQueryParameter("new", "1")
        }

        val req = Request.Builder()
            .url(urlBuilder.build())
            .get()
            .addHeader("Accept", "application/json")
            .build()

        httpClient.newCall(req).execute().use { response ->
            val rawBody = response.body?.string().orEmpty()
            val json = rawBody.toJsonObject()
            if (!response.isSuccessful) {
                val errorMessage = json?.optString("error").orEmpty().ifBlank {
                    "Unable to load chat (${response.code})"
                }
                throw IllegalStateException(errorMessage)
            }
            if (json == null) {
                return@use LoadConversationResult(
                    conversationId = null,
                    messages = emptyList()
                )
            }
            val responseConversationId = json.optString("conversationId").takeIf { it.isNotBlank() }
            val messagesArray = json.optJSONArray("messages")
            val messages = buildList {
                if (messagesArray == null) return@buildList
                for (index in 0 until messagesArray.length()) {
                    val item = messagesArray.optJSONObject(index) ?: continue
                    add(
                        RemoteChatMessage(
                            id = item.optString("id").ifBlank { "server_${System.currentTimeMillis()}_$index" },
                            role = item.optString("role"),
                            content = item.optString("content"),
                            createdAt = item.optString("createdAt").ifBlank { null }
                        )
                    )
                }
            }
            LoadConversationResult(
                conversationId = responseConversationId,
                messages = messages
            )
        }
    }

    override fun streamChat(request: SendChatRequest): Flow<StreamEvent> = channelFlow {
        val payload = JSONObject().apply {
            put("guideId", request.guideId)
            put("chatLang", request.chatLang)
            put("message", request.message)
            put("forceNewConversation", request.forceNewConversation)
            if (!request.conversationId.isNullOrBlank()) {
                put("conversationId", request.conversationId)
            }
            if (!request.systemPromptStack.isNullOrBlank()) {
                put("systemPromptStack", request.systemPromptStack)
            }
            if (!request.clientMode.isNullOrBlank()) {
                put("clientMode", request.clientMode)
            }
            if (!request.stateAnchor.isNullOrBlank()) {
                put("stateAnchor", request.stateAnchor)
            }
            if (!request.earlierSummary.isNullOrBlank()) {
                put("earlierSummary", request.earlierSummary)
            }
        }.toString()
        val req = Request.Builder()
            .url(chatEndpoint)
            .post(payload.toRequestBody(jsonMedia))
            .addHeader("Accept", "text/event-stream")
            .build()

        withContext(Dispatchers.IO) {
            try {
                httpClient.newCall(req).execute().use { response ->
                    if (!response.isSuccessful) {
                        val raw = response.body?.string().orEmpty()
                        val errorMessage = raw.toJsonObject()?.optString("error").orEmpty().ifBlank {
                            "Server error: ${response.code}"
                        }
                        send(StreamEvent.Error(errorMessage))
                        return@use
                    }

                    val body = response.body ?: run {
                        send(StreamEvent.Error("Empty response body"))
                        return@use
                    }

                    val contentType = response.header("Content-Type")?.lowercase().orEmpty()
                    val hadError = if (contentType.contains("text/event-stream")) {
                        readSse(body.source()) { event -> send(event) }
                    } else {
                        readJsonFallback(body.source()) { event -> send(event) }
                    }
                    if (!hadError) {
                        send(StreamEvent.Done)
                    }
                }
            } catch (throwable: Throwable) {
                send(StreamEvent.Error(throwable.message ?: "Network error"))
            }
        }
    }

    private suspend fun readSse(
        source: BufferedSource,
        emit: suspend (StreamEvent) -> Unit
    ): Boolean {
        var eventName = "message"
        val dataLines = mutableListOf<String>()
        var sawError = false

        suspend fun flushEvent() {
            if (dataLines.isEmpty()) {
                eventName = "message"
                return
            }
            val dataText = dataLines.joinToString("\n")
            val payload = dataText.toJsonObject()
            when (eventName) {
                "token" -> {
                    val tokenText = payload?.optString("text").orEmpty().ifBlank { dataText }
                    if (tokenText.isNotBlank()) emit(StreamEvent.Token(tokenText))
                }

                "meta", "done" -> {
                    val conversationId = payload?.optString("conversationId").orEmpty().ifBlank { null }
                    emit(StreamEvent.ConversationId(conversationId))
                }

                "error" -> {
                    val message = payload?.optString("message").orEmpty().ifBlank {
                        "Unable to process your message right now."
                    }
                    emit(StreamEvent.Error(message))
                    sawError = true
                }

                else -> {
                    if (dataText.isNotBlank()) emit(StreamEvent.Token(dataText))
                }
            }
            dataLines.clear()
            eventName = "message"
        }

        while (!source.exhausted()) {
            val line = source.readUtf8Line() ?: break
            if (line.isBlank()) {
                flushEvent()
                continue
            }
            when {
                line.startsWith("event:") -> {
                    eventName = line.removePrefix("event:").trim()
                }

                line.startsWith("data:") -> {
                    dataLines += line.removePrefix("data:").trim()
                }
            }
        }

        flushEvent()
        return sawError
    }

    private suspend fun readJsonFallback(
        source: BufferedSource,
        emit: suspend (StreamEvent) -> Unit
    ): Boolean {
        val raw = source.readUtf8()
        val payload = raw.toJsonObject()
        if (payload == null) {
            if (raw.isNotBlank()) emit(StreamEvent.Token(raw))
            return false
        }

        if (payload.optBoolean("limitReached")) {
            emit(StreamEvent.Error("Free message limit reached. Please continue on bhaktichat.com."))
            return true
        }

        val conversationId = payload.optString("conversationId").ifBlank { null }
        emit(StreamEvent.ConversationId(conversationId))

        val assistantText = payload.optString("assistantMessage")
        if (assistantText.isNotBlank()) {
            emit(StreamEvent.Token(assistantText))
            return false
        }

        val error = payload.optString("error")
        return if (error.isNotBlank()) {
            emit(StreamEvent.Error(error))
            true
        } else {
            false
        }
    }

    private fun String.toJsonObject(): JSONObject? {
        return runCatching {
            if (isBlank()) null else JSONObject(this)
        }.getOrNull()
    }
}
