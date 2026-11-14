package com.bhaktichat.app.ui.screens.chat

import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.AppLanguage
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
        "hello", "hi", "hii", "hey", "heyy", "good morning", "good night", "good evening",
        "namaste", "radhe", "hare krishna", "जय श्री कृष्ण", "प्रणाम", "नमस्ते"
    )

    private val closingKeywords = listOf(
        "bye", "goodbye", "good night", "thanks", "thank you", "shukriya", "धन्यवाद", "शुभ रात्रि"
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
        recentUserMessages: List<String> = emptyList(),
        appLanguage: AppLanguage = AppLanguage.HINDI
    ): MessageContext {
        val normalized = userMessage.trim().lowercase(Locale.getDefault())
        val detectedLanguage = resolveLanguage(userMessage, recentUserMessages, appLanguage)
        val token = resolveToken(guideId, isAuthenticated, firstName, detectedLanguage)

        return MessageContext(
            guideId = guideId,
            isAuthenticated = isAuthenticated,
            firstName = firstName.trim(),
            userMessage = userMessage,
            detectedLanguage = detectedLanguage,
            sentimentTag = detectSentiment(normalized),
            isGreeting = containsAnyWord(normalized, greetingKeywords),
            isClosing = containsAnyWord(normalized, closingKeywords),
            asksForHelp = containsAny(normalized, listOf("please help", "help me", "what should i do", "guide me", "मदद", "क्या करूँ", "क्या करूं")),
            isInformational = containsAny(normalized, informationalKeywords),
            isNewTopic = containsAnyWord(normalized, listOf("another question", "new topic", "also", "one more thing")),
            usedAddressingInPreviousAssistantMessage = token != null &&
                didUseAddressing(previousAssistantMessage?.content.orEmpty(), token)
        )
    }

    fun getAddressingToken(context: MessageContext): String? {
        val baseToken = resolveToken(
            guideId = context.guideId,
            isAuthenticated = context.isAuthenticated,
            firstName = context.firstName,
            language = context.detectedLanguage
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

    /**
     * Whether the address prefix still needs adding to a reply.
     *
     * This used to test only [String.startsWith], which produced "Google, Namaste, Google!
     * Kaise ho?": the model had already greeted the user by name, but in second position, so
     * the start-anchored check missed it and the prefix went on anyway. The model is free to
     * place the name wherever the sentence wants it, so look for it anywhere in the opening
     * sentence instead of assuming it leads.
     *
     * Matched on word boundaries so a name that happens to be a substring of another word
     * ("Ram" inside "Rampal") does not count as already addressed.
     *
     * A reply that already opens with its own vocative or interjection ("Haan, …", "Mitra, …",
     * "हाँ, …") is left alone too: prefixing it gave "Karmayogi, Haan, bolo." in ~4% of
     * replies.
     */
    fun shouldPrependPrefix(prefix: String, firstChunk: String): Boolean {
        val token = prefix.trim().removeSuffix(",").trim()
        if (token.isBlank()) return false

        // Only the opening sentence counts. The same name appearing much later in a long
        // reply is a different sentence doing its own thing, not a greeting.
        val opening = firstChunk.trimStart().take(120)
        val alreadyAddressed = Regex(
            "(?<![\\p{L}])${Regex.escape(token)}(?![\\p{L}])",
            RegexOption.IGNORE_CASE
        ).containsMatchIn(opening)

        return !alreadyAddressed && !openingVocative.containsMatchIn(opening)
    }

    // One or two words then a comma at the very start of the reply. \p{M} keeps Devanagari
    // matras ("हाँ") inside the word.
    private val openingVocative = Regex("^[\\p{L}\\p{M}]+(?:\\s+[\\p{L}\\p{M}]+)?\\s*,")

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
        firstName: String,
        language: ConversationLanguage
    ): String? {
        val cleanedName = firstName.trim()
        // The name is used in every language, Hindi included. This previously excluded
        // Hindi in favour of the devotional tokens below, but being addressed by name reads
        // warmly in Devanagari too ("अनीश, आज मन क्या कह रहा है?"). Guests have no name, so
        // the tokens remain the fallback for them.
        if (isAuthenticated && cleanedName.isNotBlank()) {
            return cleanedName.substringBefore(' ').trim()
        }

        return when (language) {
            ConversationLanguage.HINDI -> when (guideId) {
                "krishna" -> "प्रिय"
                "lakshmi" -> "वत्स"
                "shani", "shiv", "hanuman" -> "कर्मयोगी"
                else -> null
            }
            ConversationLanguage.ENGLISH, ConversationLanguage.HINGLISH -> when (guideId) {
                "krishna" -> "priye"
                "lakshmi" -> "vats"
                "shani", "shiv", "hanuman" -> "karmayogi"
                else -> null
            }
        }
    }

    /**
     * Resolves the conversation language: always [appLanguage], the language the user
     * chose. [userMessage] and [recentUserMessages] are currently ignored (see below).
     *
     * The fallback used to be a hard-coded Hindi, which is why an English-selecting user who
     * sent "ok" or an emoji got a Devanagari reply, and why changing the language setting
     * appeared to do nothing at all: the setting was never consulted.
     */
    fun resolveLanguage(
        @Suppress("UNUSED_PARAMETER") userMessage: String,
        @Suppress("UNUSED_PARAMETER") recentUserMessages: List<String>,
        appLanguage: AppLanguage = AppLanguage.HINDI
    ): ConversationLanguage {
        // The chosen language wins outright — including over the script the user typed in.
        //
        // Script detection used to sit above this and take priority, which meant the setting
        // only decided genuinely ambiguous messages ("ok", an emoji). That looked reasonable
        // until you watch someone use it: most Hindi speakers type romanised because that is
        // what the keyboard gives them, so detection read Latin, answered in Latin, and the
        // हिंदी setting did nothing. Verified on device — interface fully Devanagari, guide
        // replying "Shanti paane ke liye pehle khud se milna zaroori hai".
        //
        // Mirroring the user's script is a decent guess in the absence of a preference. It is
        // the wrong answer when a preference exists, and now that the switch sits in the chat
        // top bar the preference is a deliberate, one-tap act. So it outranks the guess.
        //
        // The script-detection code was removed as dead; the unused parameters stay so a
        // "match my script" option could bring mirroring back without touching callers.
        return when (appLanguage) {
            AppLanguage.HINDI -> ConversationLanguage.HINDI
            AppLanguage.HINGLISH, AppLanguage.ENGLISH -> ConversationLanguage.HINGLISH
        }
    }

    private fun detectSentiment(normalizedMessage: String): SentimentTag = when {
        containsAny(normalizedMessage, emotionalKeywords) -> SentimentTag.DISTRESSED
        containsAny(normalizedMessage, informationalKeywords) -> SentimentTag.INFORMATIONAL
        else -> SentimentTag.NEUTRAL
    }

    private fun containsAny(haystack: String, needles: List<String>): Boolean =
        needles.any { haystack.contains(it.lowercase(Locale.getDefault())) }

    // Letters, matras and digits make a word, so Devanagari stays whole.
    private val wordSeparator = Regex("[^\\p{L}\\p{M}\\p{N}]+")

    /**
     * Like [containsAny], but a single-word needle must match a whole word. Plain substring
     * matching made "hi" fire inside "nahi", "abhi" and "chahiye", and "hey" inside "they",
     * so nearly every Hinglish message counted as a greeting and got an address prefix.
     * Multi-word needles ("good morning") still match as substrings.
     */
    private fun containsAnyWord(haystack: String, needles: List<String>): Boolean {
        val words = haystack.split(wordSeparator).toSet()
        return needles.any { needle ->
            val n = needle.lowercase(Locale.getDefault())
            if (n.contains(' ')) haystack.contains(n) else n in words
        }
    }
}
