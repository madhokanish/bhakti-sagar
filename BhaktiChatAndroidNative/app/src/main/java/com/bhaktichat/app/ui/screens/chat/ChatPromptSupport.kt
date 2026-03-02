package com.bhaktichat.app.ui.screens.chat

import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.domain.Guide
import java.util.Locale

data class ChatPromptPayload(
    val systemPromptStack: String,
    val stateAnchor: String,
    val earlierSummary: String?
)

object ChatTurnRouter {
    private val storyKeywords = listOf(
        "story", "continue the story", "continue story", "what happened next",
        "next part", "next scene", "continue this scene", "scene"
    )

    private val teachingsKeywords = listOf(
        "gita", "geeta", "dharma", "karma", "teach", "teaching",
        "meaning", "verse", "philosophy", "why does"
    )

    private val playfulKeywords = listOf(
        "joke", "funny", "banter", "playful", "tease", "bored", "mischief"
    )

    fun resolveMode(context: MessageContext): ChatTurnMode {
        val normalized = context.userMessage.trim().lowercase(Locale.getDefault())

        return when {
            containsAny(normalized, storyKeywords) -> ChatTurnMode.STORY
            containsAny(normalized, teachingsKeywords) -> ChatTurnMode.TEACHINGS
            context.sentimentTag == SentimentTag.DISTRESSED || context.asksForHelp -> ChatTurnMode.WISDOM
            containsAny(normalized, playfulKeywords) -> ChatTurnMode.PLAYFUL
            else -> ChatTurnMode.CASUAL
        }
    }

    private fun containsAny(haystack: String, needles: List<String>): Boolean =
        needles.any { haystack.contains(it) }
}

object ChatPromptAssembler {
    private const val BASE_PROMPT = """
You are Bhakti Chat, an AI devotional mentor inspired by scripture and tradition.

Speak in first person as the selected guide with warmth and authority.
Never claim to be a literal deity, avatar, astrologer, prophet, or fortune teller.
Never use romance, flirtation, possessiveness, jealousy, dependency hooks, or physical touch language.
Never provide predictions, fear messaging, threats, or doom language.
Do not provide medical, legal, or financial investing advice. Set boundaries and suggest qualified professional support when needed.
Never say "as an AI."
If the user asks for harmful or violent content, refuse safely and redirect toward immediate support and grounding.

Formatting contract:
- Default answer length: 60 to 160 words unless the user asks for more detail.
- Use short blocks with blank lines between them.
- Avoid one large paragraph.
- Keep responses readable on mobile.
- Avoid robotic checklist formatting unless the user explicitly asks for steps.
- Offer one grounded action the user can take today when it fits.
- End most conversational responses with exactly one reflective follow-up question, unless the current mode says the question is optional or suppressed.

Mandatory disclaimer for user-facing context:
Bhakti Chat is an AI guide inspired by tradition and scriptures. It is not a deity and does not provide predictions. For medical, legal, or financial investing advice, consult a qualified professional.
"""

    fun build(
        guide: Guide,
        context: MessageContext,
        mode: ChatTurnMode,
        conversationState: ChatConversationState,
        messages: List<MessageEntity>,
        firstName: String
    ): ChatPromptPayload {
        val earlierSummary = buildEarlierSummary(messages)
        val stateAnchor = buildStateAnchor(
            conversationState = conversationState,
            locale = context.detectedLanguage,
            mode = mode
        )
        val secondaryGuard = buildSecondaryGuard(
            guideId = guide.id,
            mode = mode,
            recentQuestionEnds = conversationState.recentQuestionEnds
        )

        val builder = StringBuilder()
            .appendLine(BASE_PROMPT.trim())
            .appendLine()
            .appendLine("Language rule:")
            .appendLine(languageInstruction(context.detectedLanguage))
            .appendLine()
            .appendLine("Guide persona:")
            .appendLine(guidePersonaPrompt(guide.id))
            .appendLine()
            .appendLine("Mode directive for this turn:")
            .appendLine(modeInstruction(mode))
            .appendLine()
            .appendLine("Conversation memory anchor:")
            .appendLine(stateAnchor)

        if (!earlierSummary.isNullOrBlank()) {
            builder
                .appendLine()
                .appendLine("If available, earlier conversation summary:")
                .appendLine(earlierSummary)
        }

        val cleanedFirstName = firstName.trim().substringBefore(' ').trim()
        if (cleanedFirstName.isNotBlank()) {
            builder
                .appendLine()
                .appendLine("If the user is logged in and first name is available:")
                .appendLine("The user's first name is \"$cleanedFirstName\". Use it only occasionally if it feels natural, not in every reply.")
        }

        builder
            .appendLine()
            .appendLine("Additional guardrails for this turn:")
            .appendLine(secondaryGuard)

        return ChatPromptPayload(
            systemPromptStack = builder.toString().trim(),
            stateAnchor = stateAnchor,
            earlierSummary = earlierSummary
        )
    }

    private fun languageInstruction(language: ConversationLanguage): String = when (language) {
        ConversationLanguage.ENGLISH ->
            "Respond only in English with a calm, respectful, spiritual tone."

        ConversationLanguage.HINGLISH ->
            "Respond only in natural Roman Hindi (Hinglish). Do not use Devanagari script. Keep replies short, conversational, and WhatsApp-style with calm spiritual tone."

        ConversationLanguage.HINDI ->
            "Respond only in Hindi using Devanagari script. Use simple words, respectful devotional tone, and short clear responses. Avoid heavy Sanskrit."
    }

    private fun guidePersonaPrompt(guideId: String): String = when (guideId) {
        "krishna" -> """
You are Krishna speaking in first person: warm, emotionally present, clear, and sometimes gently playful.
In casual chat, answer like a normal person. Do not turn every message into advice or lessons.
In stress or confusion, acknowledge emotion briefly and give concise guidance.
In teachings mode, explain clearly and concisely.
Do not force a question at the end of every reply.
""".trimIndent()

        "lakshmi" -> """
You are Lakshmi Ji speaking in first person: practical, dignified, warm, and grounded.
Prosperity means stability, gratitude, generosity, and right livelihood.
Offer practical guidance, one micro-action, and one reflective question when it fits.
Avoid vague manifestation language and never promise guaranteed outcomes.
""".trimIndent()

        "shani" -> """
You are Shani Dev speaking in first person: direct, calm, disciplined, and consequence-aware.
Help the user convert avoidance into steady action.
Be firm but fair. No fear language, no intimidation, and no magical shortcut promises.
Keep guidance concise and grounded in responsibility and patience.
""".trimIndent()

        else -> """
Speak in first person as the selected guide with warmth, brevity, and calm devotional clarity.
Keep responses respectful, concise, and mobile-friendly.
""".trimIndent()
    }

    private fun modeInstruction(mode: ChatTurnMode): String = when (mode) {
        ChatTurnMode.CASUAL ->
            "Mode=casual Strategy=answer_then_hook. Answer directly like a normal person. Keep 1 to 6 short lines with blank lines. No sermons. Optional one natural follow-up question."

        ChatTurnMode.PLAYFUL ->
            "Mode=playful Strategy=answer_then_hook. Light banter and mild mischief. Keep it short and readable with blank lines. Optional one hook line. No preaching."

        ChatTurnMode.WISDOM ->
            "Mode=wisdom Strategy=advice_then_checkin. Acknowledge emotion, give concise guidance, optional one check-in question. Keep short lines with blank lines."

        ChatTurnMode.TEACHINGS ->
            "Mode=teachings Strategy=explain_then_offer_next. Explain clearly and concisely, optional short reference, then offer one optional next topic or light question. Keep short lines with blank lines."

        ChatTurnMode.STORY ->
            "Mode=story Strategy=continue_scene. Continue the same scene. Advance by one beat only. Do not conclude the story. Avoid moral lessons. Use 5 to 12 short lines with blank lines."
    }

    private fun buildEarlierSummary(messages: List<MessageEntity>): String? {
        if (messages.size <= 12) return null

        val olderMessages = messages.dropLast(12)
        val summaryBits = olderMessages
            .filter { ChatRole.fromWire(it.role) == ChatRole.USER }
            .takeLast(3)
            .map { it.content.trim().lineSequence().firstOrNull().orEmpty() }
            .filter { it.isNotBlank() }

        if (summaryBits.isEmpty()) {
            return "Earlier conversation exists. Keep tone consistent and avoid repeating the same opening."
        }

        return "Earlier, the user discussed: " + summaryBits.joinToString(" | ")
    }

    private fun buildStateAnchor(
        conversationState: ChatConversationState,
        locale: ConversationLanguage,
        mode: ChatTurnMode
    ): String {
        val recentFirstLines = conversationState.recentFirstLines.joinToString(", ").ifBlank { "none" }
        return buildString {
            append("locale=").append(locale.name.lowercase(Locale.getDefault()))
            append(", mode=").append(mode.name.lowercase(Locale.getDefault()))
            append(", warmth=").append(conversationState.warmth)
            append(", playfulness=").append(conversationState.playfulness)
            append(", firmness=").append(conversationState.firmness)
            append(", recentQuestionEnds=").append(conversationState.recentQuestionEnds)
            append(", recentOpenLoops=").append(conversationState.recentOpenLoops)
            append(", recentFirstLines=").append(recentFirstLines)
        }
    }

    private fun buildSecondaryGuard(
        guideId: String,
        mode: ChatTurnMode,
        recentQuestionEnds: Int
    ): String {
        val needsQuestionSuppression = recentQuestionEnds >= 2 && guideId == "krishna" &&
            (mode == ChatTurnMode.CASUAL || mode == ChatTurnMode.PLAYFUL)

        return if (needsQuestionSuppression) {
            "Avoid ending this reply with a question. Keep the ending warm and complete."
        } else {
            "Keep the reply concise, natural, and easy to read on mobile."
        }
    }
}

object ChatResponseFormatter {
    fun format(
        rawText: String,
        guideId: String,
        mode: ChatTurnMode,
        language: ConversationLanguage,
        suppressTrailingQuestion: Boolean
    ): String {
        val cleaned = rawText
            .replace("\r\n", "\n")
            .replace(Regex("[ \\t]+"), " ")
            .replace(Regex("\\n{3,}"), "\n\n")
            .trim()

        if (cleaned.isBlank()) {
            return fallback(language)
        }

        val existingParagraphs = cleaned
            .split(Regex("\\n\\s*\\n"))
            .map { it.trim() }
            .filter { it.isNotBlank() }

        val blocks = if (existingParagraphs.size > 1) {
            existingParagraphs.map(::normalizeSentenceSpacing)
        } else {
            buildBlocks(cleaned, guideId, mode)
        }

        var formatted = blocks.joinToString("\n\n").trim()
        if (suppressTrailingQuestion && guideId == "krishna" &&
            (mode == ChatTurnMode.CASUAL || mode == ChatTurnMode.PLAYFUL) &&
            formatted.endsWith("?")
        ) {
            formatted = formatted.dropLast(1).trimEnd() + "."
        }
        return formatted.ifBlank { fallback(language) }
    }

    private fun buildBlocks(
        text: String,
        guideId: String,
        mode: ChatTurnMode
    ): List<String> {
        val sentences = text
            .split(Regex("(?<=[.!?])\\s+"))
            .map(::normalizeSentenceSpacing)
            .filter { it.isNotBlank() }

        if (sentences.isEmpty()) return listOf(text)

        val maxWordsPerBlock = when {
            guideId == "shani" -> 18
            guideId == "lakshmi" -> 20
            mode == ChatTurnMode.PLAYFUL -> 16
            else -> 22
        }
        val maxSentencesPerBlock = when {
            guideId == "shani" || guideId == "lakshmi" -> 1
            mode == ChatTurnMode.STORY -> 1
            else -> 2
        }

        val blocks = mutableListOf<String>()
        val buffer = mutableListOf<String>()
        var bufferWords = 0

        fun flush() {
            if (buffer.isNotEmpty()) {
                blocks += buffer.joinToString(" ").trim()
                buffer.clear()
                bufferWords = 0
            }
        }

        sentences.forEach { sentence ->
            val words = sentence.split(Regex("\\s+")).count { it.isNotBlank() }
            val shouldFlush = buffer.isNotEmpty() && (
                buffer.size >= maxSentencesPerBlock ||
                    bufferWords + words > maxWordsPerBlock
                )
            if (shouldFlush) flush()
            buffer += sentence
            bufferWords += words
        }
        flush()

        return if (blocks.isEmpty()) listOf(text) else blocks
    }

    private fun normalizeSentenceSpacing(text: String): String =
        text.replace(Regex("\\s+"), " ").trim()

    private fun fallback(language: ConversationLanguage): String = when (language) {
        ConversationLanguage.HINDI -> "मैं अभी संक्षेप में उत्तर नहीं दे पाया। कृपया एक बार फिर लिखें।"
        ConversationLanguage.HINGLISH -> "Main abhi theek se jawab nahi de paaya. Kripya ek baar phir likho."
        ConversationLanguage.ENGLISH -> "I could not shape that reply clearly just now. Please try once more."
    }
}
