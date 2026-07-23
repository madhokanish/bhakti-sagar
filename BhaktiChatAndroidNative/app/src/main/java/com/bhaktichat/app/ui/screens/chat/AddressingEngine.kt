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
        previousAssistantMessage: MessageEntity?,
        recentUserMessages: List<String> = emptyList()
    ): MessageContext {
        val normalized = userMessage.trim().lowercase(Locale.getDefault())
        val token = resolveToken(guideId, isAuthenticated, firstName)

        return MessageContext(
            guideId = guideId,
            isAuthenticated = isAuthenticated,
            firstName = firstName.trim(),
            userMessage = userMessage,
            detectedLanguage = resolveLanguage(userMessage, recentUserMessages),
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
            "shiv" -> "karmayogi"
            "hanuman" -> "karmayogi"
            else -> null
        }
    }

    // Common romanized-Hindi tokens. If a Latin-script message contains any of these we
    // treat it as Hinglish. Kept identical to iOS's ChatPromptSupport.hinglishMarkers —
    // update both together.
    private val hinglishMarkers = setOf(
        "hai", "hain", "kya", "kyu", "kyun", "mujhe", "mera", "meri", "mere", "nahi", "nahin",
        "kaise", "kaisa", "kaisi", "tum", "tumhe", "tumhara", "aap", "ap", "aapka", "hum",
        "kar", "karo", "karna", "raha", "rahi", "rahe", "ho", "hona", "hoon", "hun",
        "acha", "accha", "achha", "theek", "thik", "bhagwan", "bhagavan", "ji", "aur", "par",
        "bas", "matlab", "kuch", "chahiye", "zindagi", "dil", "mann", "pyaar", "pyar", "dukh",
        "pareshani", "pareshan", "uljhan", "batao", "samajh", "kripya", "namaste", "namaskar",
        "prabhu", "maa", "daan", "seva", "puja", "haan", "bolo", "tha", "thi", "aaj", "sab",
        "dharma"
    )

    /**
     * Returns a clear language signal for [userMessage], or null when the message is too
     * short/ambiguous to tell (e.g. "hi", "thanks", "ok") — callers should fall back to
     * [resolveLanguage]'s thread-aware default in that case.
     */
    private fun detectLanguage(userMessage: String): ConversationLanguage? {
        val hasDevanagari = userMessage.any { Character.UnicodeBlock.of(it) == Character.UnicodeBlock.DEVANAGARI }
        if (hasDevanagari) return ConversationLanguage.HINDI

        val words = userMessage.lowercase().split(Regex("[^a-z]+")).filter { it.isNotBlank() }
        if (words.any { it in hinglishMarkers }) return ConversationLanguage.HINGLISH

        // A substantive Latin-script sentence with no Hindi/Hinglish loanwords at all is
        // confidently plain English — respect it so English-typing users get English.
        // Anything shorter/ambiguous (greetings, one-word replies) is not a strong enough
        // signal on its own; resolveLanguage() decides those from context.
        if (words.size >= 4) return ConversationLanguage.ENGLISH

        return null
    }

    /**
     * Resolves the conversation language for [userMessage]: a clear per-message signal
     * always wins; otherwise inherits whatever language the recent thread has been using
     * (so a short "thanks" mid-English-conversation doesn't flip back to Hinglish); with no
     * signal anywhere (e.g. the very first message being a bare greeting), defaults to
     * Hinglish — the app's default voice.
     */
    fun resolveLanguage(userMessage: String, recentUserMessages: List<String>): ConversationLanguage {
        detectLanguage(userMessage)?.let { return it }
        recentUserMessages.asReversed().take(4).forEach { message ->
            detectLanguage(message)?.let { return it }
        }
        return ConversationLanguage.HINGLISH
    }

    private fun detectSentiment(normalizedMessage: String): SentimentTag = when {
        containsAny(normalizedMessage, emotionalKeywords) -> SentimentTag.DISTRESSED
        containsAny(normalizedMessage, informationalKeywords) -> SentimentTag.INFORMATIONAL
        else -> SentimentTag.NEUTRAL
    }

    private fun containsAny(haystack: String, needles: List<String>): Boolean =
        needles.any { haystack.contains(it.lowercase(Locale.getDefault())) }
}
