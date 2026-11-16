package com.bhaktichat.app.data.remote

import com.bhaktichat.app.domain.StreamEvent
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
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

    override fun streamChat(request: SendChatRequest): Flow<StreamEvent> = channelFlow {
        val payload = JSONObject().apply {
            put("guideId", request.guideId)
            put("chatLang", request.chatLang)
            put("message", request.message)
            put("forceNewConversation", request.forceNewConversation)
            if (!request.conversationId.isNullOrBlank()) {
                put("conversationId", request.conversationId)
            }
            if (!request.systemPrompt.isNullOrBlank()) {
                put("systemPrompt", request.systemPrompt)
            }
            if (!request.developerPrompt.isNullOrBlank()) {
                put("developerPrompt", request.developerPrompt)
            }
            if (!request.languageInstruction.isNullOrBlank()) {
                put("languageInstruction", request.languageInstruction)
            }
            if (!request.guidePersonaPrompt.isNullOrBlank()) {
                put("guidePersonaPrompt", request.guidePersonaPrompt)
            }
            if (!request.modeInstruction.isNullOrBlank()) {
                put("modeInstruction", request.modeInstruction)
            }
            if (!request.systemPromptStack.isNullOrBlank()) {
                put("systemPromptStack", request.systemPromptStack)
            }
            if (!request.stateAnchor.isNullOrBlank()) {
                put("stateAnchor", request.stateAnchor)
            }
            if (!request.earlierSummary.isNullOrBlank()) {
                put("earlierSummary", request.earlierSummary)
            }
            if (!request.firstName.isNullOrBlank()) {
                put("firstName", request.firstName)
            }
            if (!request.secondaryGuard.isNullOrBlank()) {
                put("secondaryGuard", request.secondaryGuard)
            }
            if (!request.optionalRewriteDirective.isNullOrBlank()) {
                put("optionalRewriteDirective", request.optionalRewriteDirective)
            }
        }.toString()
        val req = Request.Builder()
            .url(chatEndpoint)
            .post(payload.toRequestBody(jsonMedia))
            .addHeader("Accept", "text/event-stream")
            .build()

        // execute() blocks an IO thread and ignores coroutine cancellation, so without this a
        // closed screen would leave the socket reading until the server finished. This child is
        // cancelled the moment the collector goes away and aborts the call, which unblocks the
        // read. UNDISPATCHED so it is armed before execute() starts.
        val call = httpClient.newCall(req)
        val cancelOnClose = launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                call.cancel()
            }
        }

        withContext(Dispatchers.IO) {
            try {
                call.execute().use { response ->
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
            } catch (cancellation: CancellationException) {
                // Cooperative cancellation (e.g. screen closed mid-stream) must propagate,
                // not be reported as a network error into an already-closing flow.
                throw cancellation
            } catch (throwable: Throwable) {
                send(StreamEvent.Error(throwable.message ?: "Network error"))
            }
        }
        // channelFlow waits for its children, so release the watcher once the stream ends.
        // (Any failure above cancels the producer scope, which cancels it anyway.)
        cancelOnClose.cancel()
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
                    // A whitespace-only token (e.g. a lone space between words) is real
                    // content; only fall back to the raw data when it isn't JSON at all.
                    val tokenText = payload?.optString("text") ?: dataText
                    if (tokenText.isNotEmpty()) emit(StreamEvent.Token(tokenText))
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
            emit(StreamEvent.LimitReached)
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
