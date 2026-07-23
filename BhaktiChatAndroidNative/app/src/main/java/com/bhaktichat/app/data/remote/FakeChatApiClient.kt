package com.bhaktichat.app.data.remote

import kotlinx.coroutines.delay

class FakeChatApiClient : ChatApiClient {
    override suspend fun sendMessage(
        request: ChatApiClientRequest,
        onToken: (suspend (String) -> Unit)?
    ): Result<ChatApiClientResponse> {
        delay(900)
        val lastUserText = request.message.ifBlank {
            ""
        }
        val response = when (request.guideId) {
            "krishna" -> {
                "Begin with the next truthful step, and let clarity follow action.\n\n" +
                    "Take one calm decision today instead of carrying all outcomes at once.\n\n" +
                    "What feels like the next right step for you?"
            }

            "lakshmi" -> {
                "Stability grows when your mind becomes ordered before your money does.\n\n" +
                    "Review one expense, one priority, and one act of gratitude today.\n\n" +
                    "Which part of your financial stress feels heaviest right now?"
            }

            "shiv" -> {
                "Stillness does not begin when life becomes silent. It begins when you stop obeying every restless thought.\n\n" +
                    "Take three slow breaths and let your shoulders soften.\n\n" +
                    "What is the thought you need to release first?"
            }

            "hanuman" -> {
                "Courage grows when you move before fear has finished speaking.\n\n" +
                    "Choose one small brave action today and complete it fully.\n\n" +
                    "Where do you need strength most right now?"
            }

            "shani" -> {
                "Do not rush to escape the lesson. Face it cleanly.\n\n" +
                    "Choose one disciplined action and repeat it without negotiation today.\n\n" +
                    "What responsibility have you been delaying?"
            }

            else -> {
                "I am reflecting with you.\n\nTake one steady step, then return for the next."
            }
        }

        return Result.success(
            ChatApiClientResponse(
                replyText = if (lastUserText.isBlank()) {
                    response
                } else {
                    "$response\n\nYou asked: $lastUserText"
                },
                conversationId = request.conversationId ?: request.threadId
            )
        )
    }
}
