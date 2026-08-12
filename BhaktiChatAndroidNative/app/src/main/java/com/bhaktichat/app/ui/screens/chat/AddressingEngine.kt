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

        return !alreadyAddressed
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
        firstName: String,
        language: ConversationLanguage
    ): String? {
        val cleanedName = firstName.trim()
        // The name is used in every language, Hindi included. This previously excluded
        // Hindi in favour of the devotional tokens below, but sign-in is mandatory now and
        // being addressed by name reads warmly in Devanagari too ("अनीश, आज मन क्या कह रहा
        // है?"). The tokens remain the fallback when there is no name to use.
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

        val words = userMessage.lowercase().split(Regex("[^a-z]+")).filter { it.length >= 2 }

        // A Roman-Hindi marker is a signal on its own: "haan" or "theek" is unambiguous even
        // alone.
        if (words.any { it in hinglishMarkers }) return ConversationLanguage.HINGLISH

        // Otherwise Latin input means Latin script back, and that means Hinglish.
        //
        // This used to return ENGLISH for Latin text without a marker word, which meant "I feel
        // stressed about work" was answered in textbook English even though the only Latin
        // option the picker offers is labelled English but *is* Hinglish.
        //
        // Two words minimum: one Latin word is not a language signal. "ok", "hmm" and "thanks"
        // get typed in Latin by Hindi users constantly, and treating them as a switch flipped a
        // Hindi reader to Hinglish mid-conversation. Below that, callers fall through to the
        // language the user chose.
        if (words.size >= 2) return ConversationLanguage.HINGLISH

        return null
    }

    /**
     * Resolves the conversation language for [userMessage].
     *
     * A clear signal in the message wins, so the guide follows the user's script the moment
     * they switch: Devanagari gets Hindi back, Latin gets Hinglish back. Failing that it
     * inherits the recent thread, so a bare "ok" mid-conversation does not flip languages.
     *
     * With no signal anywhere it falls back to [appLanguage], the language the user actually
     * chose. That fallback used to be a hard-coded Hindi, which is why an English-selecting
     * user who sent "ok" or an emoji got a Devanagari reply, and why changing the language
     * setting appeared to do nothing at all: the setting was never consulted.
     */
    fun resolveLanguage(
        userMessage: String,
        @Suppress("UNUSED_PARAMETER") recentUserMessages: List<String>,
        appLanguage: AppLanguage = AppLanguage.HINDI
    ): ConversationLanguage {
        detectLanguage(userMessage)?.let { return it }

        // The chosen language, not the thread's history.
        //
        // Inheriting from the last four messages used to sit here, and it silently outranked
        // the setting: switching the app to Hindi mid-conversation changed nothing, because
        // the thread was still full of Latin and every ambiguous message inherited Hinglish
        // from it. Verified on device — the interface was fully Devanagari while the guide
        // kept answering "Achha hai, Google!".
        //
        // Changing the language setting is a deliberate act, so it outranks whatever the
        // conversation happened to be doing before. Flip-flopping is still contained by
        // detectLanguage above: a real Latin sentence keeps its Hinglish answer, and only
        // genuinely ambiguous messages ("ok", an emoji) fall through to the setting.
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
}
