package com.bhaktichat.app.ui.screens.chat

import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.ChatRole
import java.util.Locale

object AddressingEngine {
    private val emotionalKeywords = listOf(
        "anxious", "anxiety", "stressed", "stress", "sad", "confused", "afraid", "fear",
        "worried", "worry", "lonely", "hurt", "pain", "money trouble", "money problems",
        "bad luck", "relationship", "forgive", "forgiveness", "please help",
        "help me", "what should i do", "lost", "scared",
        "चिंता", "डर", "परेशान", "दुख", "उदास", "मदद", "क्या करूँ", "क्या करूं"
    )

    private val greetingKeywords = listOf(
        "hello", "hi", "hey", "good morning", "good night", "good evening",
        "namaste", "radhe", "hare krishna", "जय श्री कृष्ण", "प्रणाम", "नमस्ते"
    )

    private val closingKeywords = listOf(
        "bye", "good night", "thanks", "thank you", "shukriya", "धन्यवाद", "शुभ रात्रि"
    )

    private val informationalKeywords = listOf(
        "steps", "list", "timings", "time", "meaning", "definition", "how many",
        "what is", "when is", "show me", "tell me the", "schedule", "choghadiya",
        "aarti lyrics", "lyrics", "who is", "which", "duration", "facts"
    )

    fun buildMessageContext(
        guideId: String,
        isAuthenticated: Boolean,
        firstName: String,
        userMessage: String,
        previousAssistantMessage: MessageEntity?
    ): MessageContext {
        val normalized = userMessage.trim().lowercase(Locale.getDefault())
        val token = resolveToken(guideId, isAuthenticated, firstName)

        return MessageContext(
            guideId = guideId,
            isAuthenticated = isAuthenticated,
            firstName = firstName.trim(),
            userMessage = userMessage,
            detectedLanguage = detectLanguage(userMessage),
            sentimentTag = detectSentiment(normalized),
            isGreeting = containsAny(normalized, greetingKeywords),
            isClosing = containsAny(normalized, closingKeywords),
            asksForHelp = containsAny(normalized, listOf("please help", "help me", "what should i do", "guide me", "मदद", "क्या करूँ", "क्या करूं")),
            isInformational = containsAny(normalized, informationalKeywords),
            isNewTopic = containsAny(normalized, listOf("another question", "new topic", "also", "one more thing")),
            usedAddressingInPreviousAssistantMessage = token != null &&
                didUseAddressing(previousAssistantMessage?.content.orEmpty(), token)
        )
    }

    fun getAddressingToken(context: MessageContext): String? {
        val baseToken = resolveToken(
            guideId = context.guideId,
            isAuthenticated = context.isAuthenticated,
            firstName = context.firstName
        ) ?: return null

        if (!shouldUseAddressing(context)) return null
        return baseToken
    }

    fun buildAddressPrefix(context: MessageContext): String? {
        val token = getAddressingToken(context) ?: return null
        return "${token.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() }}, "
    }

    fun shouldUseAddressing(context: MessageContext): Boolean {
        if (context.isGreeting || context.isClosing) return true

        if (context.sentimentTag == SentimentTag.DISTRESSED) return true
        if (context.asksForHelp) return true

        if (context.usedAddressingInPreviousAssistantMessage && context.sentimentTag != SentimentTag.DISTRESSED) {
            return false
        }

        if (context.isInformational) return false

        return context.isNewTopic && !context.usedAddressingInPreviousAssistantMessage
    }

    fun shouldPrependPrefix(prefix: String, firstChunk: String): Boolean {
        val normalizedPrefix = prefix.trim().removeSuffix(",").lowercase(Locale.getDefault())
        val normalizedChunk = firstChunk.trimStart().lowercase(Locale.getDefault())
        return !normalizedChunk.startsWith(normalizedPrefix)
    }

    fun didUseAddressing(message: String, token: String): Boolean {
        val normalized = message.trimStart().lowercase(Locale.getDefault())
        val normalizedToken = token.lowercase(Locale.getDefault())
        return normalized.startsWith("$normalizedToken,") ||
            normalized.startsWith("$normalizedToken ") ||
            normalized.startsWith("$normalizedToken.")
    }

    private fun resolveToken(
        guideId: String,
        isAuthenticated: Boolean,
        firstName: String
    ): String? {
        val cleanedName = firstName.trim()
        if (isAuthenticated && cleanedName.isNotBlank()) {
            return cleanedName.substringBefore(' ').trim()
        }

        return when (guideId) {
            "krishna" -> "priye"
            "lakshmi" -> "vats"
            "shani" -> "karmayogi"
            else -> null
        }
    }

    private fun detectLanguage(userMessage: String): ConversationLanguage {
        val hasDevanagari = userMessage.any { Character.UnicodeBlock.of(it) == Character.UnicodeBlock.DEVANAGARI }
        if (hasDevanagari) return ConversationLanguage.HINDI

        val normalized = userMessage.lowercase(Locale.getDefault())
        return if (containsAny(normalized, listOf("dharma", "bhagwan", "krishna", "shanti", "karma", "darshan", "man", "dil"))) {
            ConversationLanguage.HINGLISH
        } else {
            ConversationLanguage.ENGLISH
        }
    }

    private fun detectSentiment(normalizedMessage: String): SentimentTag = when {
        containsAny(normalizedMessage, emotionalKeywords) -> SentimentTag.DISTRESSED
        containsAny(normalizedMessage, informationalKeywords) -> SentimentTag.INFORMATIONAL
        else -> SentimentTag.NEUTRAL
    }

    private fun containsAny(haystack: String, needles: List<String>): Boolean =
        needles.any { haystack.contains(it.lowercase(Locale.getDefault())) }
}
