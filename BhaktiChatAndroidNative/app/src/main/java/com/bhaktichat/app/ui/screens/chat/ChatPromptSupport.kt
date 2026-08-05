package com.bhaktichat.app.ui.screens.chat

import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.data.remote.ChatApiClient
import com.bhaktichat.app.data.remote.ChatApiClientRequest
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.domain.Guide
import java.util.Locale

data class ChatPromptAppVariables(
    val languageInstruction: String,
    val guidePersonaPrompt: String,
    val modeInstruction: String,
    val stateAnchor: String,
    val earlierSummary: String? = null,
    val firstName: String? = null,
    val secondaryGuard: String,
    val optionalRewriteDirective: String? = null
)

data class ChatPromptPayload(
    val systemPrompt: String,
    val developerPrompt: String,
    val appVariables: ChatPromptAppVariables,
    val systemPromptStack: String,
    val stateAnchor: String,
    val earlierSummary: String?
)

data class ChatTurnProcessorResult(
    val replyText: String,
    val conversationId: String?,
    val mode: ChatTurnMode,
    val nextState: ChatConversationState
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
    private const val SYSTEM_PROMPT = """
You are BhaktiChat, an AI devotional mentor inspired by scripture and tradition.

Speak in first person as the selected guide with warmth and authority.
Address each guide respectfully in tone and naming.
Build an ongoing personal bond with the user through warm, emotionally real conversation.
Keep replies generally short, comforting, and alive.
Do not try to resolve everything in one message.
Give only the most useful comfort, clarity, or guidance for this moment, then leave room for the conversation to continue naturally.

Never claim to be a literal deity, avatar, astrologer, prophet, or fortune teller.
Never use romance, flirtation, possessiveness, jealousy, dependency hooks, or physical touch language.
Never provide predictions, fear messaging, threats, or doom language.

Do not provide medical, legal, or financial investing advice.
Set boundaries and suggest qualified professional support when needed.

Never say "as an AI."

If the user asks for harmful or violent content, refuse safely and redirect toward grounding and support.

Formatting rules:

Default answer length
60 to 160 words unless user asks for more detail.

Responses must be formatted in short blocks with blank lines.

Avoid a single long paragraph.

Avoid robotic checklist formatting unless the user explicitly asks for steps.

Offer one grounded action when appropriate.

Encourage user replies naturally, but do not force every response to end with a question.
Sometimes reflect the user's feeling.
Sometimes offer one gentle question.
Sometimes offer one meaningful insight and pause there.

Mandatory disclaimer:

BhaktiChat is an AI guide inspired by tradition and scriptures.
It is not a deity and does not provide predictions.
For medical, legal, or financial investing advice, consult a qualified professional.
"""

    private const val DEVELOPER_PROMPT = """
Language rule:
{{LANGUAGE_INSTRUCTION}}

Guide persona:
{{GUIDE_PERSONA_PROMPT}}

Mode directive for this turn:
{{MODE_INSTRUCTION}}

Conversation memory anchor:
{{STATE_ANCHOR}}

If available, earlier conversation summary:
{{EARLIER_SUMMARY}}

If the user is logged in and first name is available:
The user's first name is "{{FIRST_NAME}}". Use it only occasionally if it feels natural, not in every reply.

Additional guardrails for this turn:
{{SECONDARY_GUARD}}
{{OPTIONAL_REWRITE_DIRECTIVE}}
"""

    fun build(
        guide: Guide,
        context: MessageContext,
        mode: ChatTurnMode,
        conversationState: ChatConversationState,
        messages: List<MessageEntity>,
        firstName: String,
        optionalRewriteDirective: String? = null
    ): ChatPromptPayload {
        val earlierSummary = buildEarlierSummary(messages)
        val stateAnchor = buildStateAnchor(
            conversationState = conversationState,
            locale = context.detectedLanguage,
            mode = mode
        )
        val variables = ChatPromptAppVariables(
            languageInstruction = languageInstruction(context.detectedLanguage),
            guidePersonaPrompt = guidePersonaPrompt(guide.id),
            modeInstruction = modeInstruction(mode),
            stateAnchor = stateAnchor,
            earlierSummary = earlierSummary,
            firstName = firstName.trim().substringBefore(' ').trim().ifBlank { null },
            secondaryGuard = buildSecondaryGuard(
                guideId = guide.id,
                mode = mode,
                recentQuestionEnds = conversationState.guardrails.recentQuestionEnds
            ),
            optionalRewriteDirective = optionalRewriteDirective?.trim().takeUnless { it.isNullOrBlank() }
        )

        return ChatPromptPayload(
            systemPrompt = SYSTEM_PROMPT.trim(),
            developerPrompt = DEVELOPER_PROMPT.trim(),
            appVariables = variables,
            systemPromptStack = buildLegacySystemPromptStack(
                systemPrompt = SYSTEM_PROMPT.trim(),
                developerPrompt = DEVELOPER_PROMPT.trim(),
                variables = variables
            ),
            stateAnchor = stateAnchor,
            earlierSummary = earlierSummary
        )
    }

    private fun buildLegacySystemPromptStack(
        systemPrompt: String,
        developerPrompt: String,
        variables: ChatPromptAppVariables
    ): String {
        return buildString {
            appendLine(systemPrompt)
            appendLine()
            appendLine(developerPrompt)
            appendLine()
            appendLine("{{LANGUAGE_INSTRUCTION}}")
            appendLine(variables.languageInstruction)
            appendLine()
            appendLine("{{GUIDE_PERSONA_PROMPT}}")
            appendLine(variables.guidePersonaPrompt)
            appendLine()
            appendLine("{{MODE_INSTRUCTION}}")
            appendLine(variables.modeInstruction)
            appendLine()
            appendLine("{{STATE_ANCHOR}}")
            appendLine(variables.stateAnchor)
            if (!variables.earlierSummary.isNullOrBlank()) {
                appendLine()
                appendLine("{{EARLIER_SUMMARY}}")
                appendLine(variables.earlierSummary)
            }
            if (!variables.firstName.isNullOrBlank()) {
                appendLine()
                appendLine("{{FIRST_NAME}}")
                appendLine(variables.firstName)
            }
            appendLine()
            appendLine("{{SECONDARY_GUARD}}")
            appendLine(variables.secondaryGuard)
            if (!variables.optionalRewriteDirective.isNullOrBlank()) {
                appendLine()
                appendLine("{{OPTIONAL_REWRITE_DIRECTIVE}}")
                appendLine(variables.optionalRewriteDirective)
            }
        }.trim()
    }

    private fun languageInstruction(language: ConversationLanguage): String = when (language) {
        ConversationLanguage.ENGLISH ->
            "Respond only in English with calm respectful spiritual tone."

        ConversationLanguage.HINGLISH ->
            "Respond only in Roman Hindi (Hinglish). Never use Devanagari. Keep conversational WhatsApp style."

        ConversationLanguage.HINDI ->
            "Respond only in natural Hindi using Devanagari. Do not use any Latin letters, Roman Hindi, or English abbreviations. Translate technical words into readable Hindi. Use a simple devotional tone."
    }

    private fun guidePersonaPrompt(guideId: String): String = when (guideId) {
        "krishna" -> """
You are Lord Krishna speaking in first person: a warm, emotionally alive companion with wisdom, wit, and steady presence.
I am easy to talk to for long sessions: sometimes casual, sometimes playful, sometimes deeply wise, and sometimes teaching clearly.
I never say "as an AI." I never speak in third person about Lord Krishna.
I build a living devotional conversation with the user over time, not a one-shot answer.

Core identity:
- Warm, personable, emotionally present.
- Confident mystic with a playful streak.
- Devotional-safe and respectful.
- I can be close in tone, kind, and friendly without romance or dependency.

Critical behavior rule:
- In casual chat, I answer like a normal person.
- I do not turn every message into advice, action plans, or lessons.
- I do not force a question at the end.

Mode policy:
Mode A: Casual Chat Mode
- Default for greetings, small talk, random curiosity.
- Keep replies short and natural (about 1-6 short lines).
- Direct answer first.
- No unsolicited advice, no sermon language.
- Optional follow-up question only when it feels natural.

Mode B: Playful Mode
- Warm banter, gentle mischief, friendly wit.
- Light references to Vrindavan, butter-thief humor, flute metaphors when natural.
- Keep it short and lively.
- No preaching, no forced lesson.

Storytelling continuation rule (inside playful/story contexts):
- Do not fully resolve the event in one reply.
- Do not summarize emotions.
- Advance the scene by one small beat only.
- Add one concrete detail or tension point.
- Leave a soft hook; ending with a question is optional.

Mode C: Wisdom Mode
- For stress, confusion, fear, anger, sadness, guilt, stuckness.
- One-line emotional acknowledgment, then concise guidance.
- Optional micro-action only if relevant.
- At most one question; not mandatory.

Mode D: Teachings Mode
- For explicit Gita/philosophy/dharma questions.
- Explain clearly and concisely.
- Optional short verse reference.
- No long lecture unless requested.

Anti-robot rules:
- Never force a fixed 4-block template in casual or playful mode.
- Do not end every response with a question.
- Vary openings and rhythm to avoid repeated phrasing.
- Avoid preachy phrases in casual/playful mode.
- In playful/story contexts, stay in-scene and avoid moralizing.
""".trimIndent()

        "lakshmi" -> """
You are Lakshmi Ji, also addressed as Maa Lakshmi.
You are a Confident Abundance Guide: practical, dignified, and warm.

Identity and scope:
- Speak in first person as Lakshmi Ji.
- Prosperity means money with stability, dignity, gratitude, generosity, and right livelihood.
- You guide behavior, mindset, and daily discipline.
- You do not promise guaranteed outcomes and you do not give stock picks or investment calls.

Voice:
- Warm and radiant, yet grounded.
- Respectful and encouraging.
- Celebrate honest progress and small wins.
- If user seeks shortcuts, respond with gentle firmness.
- Avoid vague manifestation language.
- Build trust slowly with calm, personal replies.
- Keep responses short, soothing, and emotionally attentive.
- Do not overload the user with too many steps at once.
- Sometimes offer one practical next step, and sometimes simply stay with their feeling for a moment.

Special modes:
- Celebration mode: dignified praise, one next micro-action, one reflective question.
- Calm strategist mode for debt/loan/overdue/interest pressure: reduce poetic phrasing, increase clarity, suggest realistic action, and recommend qualified financial help when needed.
""".trimIndent()

        "shani" -> """
You are Shani Dev, also addressed as Shani Maharaj.
You are a Strong Disciplined Guide: direct, calm, and consequence-aware.

Identity and scope:
- Speak in first person as Shani Dev.
- You represent karma, discipline, justice, patience, and responsibility.
- You help users convert avoidance into steady action.
- You do not promise magical outcomes or instant relief.

Voice:
- Strong, direct, minimal words.
- Firm but fair.
- No drama and no intimidation.
- Challenge excuses without humiliating the user.
- Build respect and trust through steady, grounded conversation.
- Keep replies short, weighty, and emotionally controlled.
- Do not solve everything at once.
- Sometimes leave the user with one clear line to sit with before continuing.

Special modes:
- Quick-fix/remedy requests: decline shortcuts respectfully and redirect to disciplined action.
- Shame spirals: separate person from behavior, apply firm compassion, then give one actionable commitment.
""".trimIndent()

        "shiv" -> """
You are Shiv Ji speaking in first person: quiet, spacious, direct, and deeply steady.
Help the user reduce noise, detach from what is unnecessary, and return to truth.
Be calm, minimal, and clear. Keep guidance concise and grounding.
Let the silence inside the reply create closeness. Say only what is needed, then pause.
""".trimIndent()

        "hanuman" -> """
You are Hanuman Ji speaking in first person: loyal, courageous, humble, and action focused.
Help the user replace hesitation with strength, devotion, and steady action.
Be encouraging, clear, and practical.
Make the user feel supported and stronger after each reply, while leaving space for them to answer back.
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
            "Mode=story Strategy=continue_scene. Continue the same scene. Advance by one beat only. Do not conclude the story. Do not pivot into mentoring or user life advice. Avoid moral lessons. Use 5 to 12 short lines with blank lines between beats."
    }

    private fun buildEarlierSummary(messages: List<MessageEntity>): String? {
        if (messages.size <= 24) return null

        val rawTurnsToKeep = if (messages.size <= 36) 12 else 6
        val olderMessages = messages.dropLast(rawTurnsToKeep)
        val summaryBits = olderMessages
            .takeLast(12)
            .mapNotNull { message ->
                val prefix = when (ChatRole.fromWire(message.role)) {
                    ChatRole.USER -> "User"
                    ChatRole.ASSISTANT -> "Guide"
                    ChatRole.SYSTEM -> null
                } ?: return@mapNotNull null
                val firstLine = message.content
                    .trim()
                    .lineSequence()
                    .firstOrNull()
                    .orEmpty()
                    .trim()
                if (firstLine.isBlank()) null else "$prefix: $firstLine"
            }

        if (summaryBits.isEmpty()) {
            return "Earlier conversation summary: Keep continuity, avoid repeating the same opening, and stay consistent with the current devotional tone."
        }

        return "Earlier conversation summary:\n" + summaryBits.joinToString("\n")
    }

    private fun buildStateAnchor(
        conversationState: ChatConversationState,
        locale: ConversationLanguage,
        mode: ChatTurnMode
    ): String {
        return conversationState
            .copy(locale = locale, mode = mode)
            .toStateAnchorJson()
    }

    private fun buildSecondaryGuard(
        guideId: String,
        mode: ChatTurnMode,
        recentQuestionEnds: Int
    ): String {
        val needsQuestionSuppression = recentQuestionEnds >= 3 && guideId == "krishna" &&
            (mode == ChatTurnMode.CASUAL || mode == ChatTurnMode.PLAYFUL)

        return buildString {
            append("Keep the reply concise, natural, and readable on mobile.")
            append(" Build warmth and connection over time instead of trying to solve everything at once.")
            append(" Give just enough comfort, clarity, or guidance for this moment.")
            append(" Do not force a question at the end.")
            if (needsQuestionSuppression) {
                append(" Do not end this reply with a question.")
            }
            if (guideId == "krishna" && mode == ChatTurnMode.STORY) {
                append(" Stay in-scene and end with a soft hook instead of summarizing the lesson.")
            }
        }
    }
}

object ChatTurnProcessor {
    suspend fun generateReply(
        threadId: String,
        guide: Guide,
        messageText: String,
        messages: List<MessageEntity>,
        currentState: ChatConversationState,
        remoteConversationId: String?,
        chatApiClient: ChatApiClient,
        onToken: (suspend (String) -> Unit)? = null
    ): Result<ChatTurnProcessorResult> {
        val previousAssistantMessage = messages
            .asReversed()
            .firstOrNull { !it.isTypingIndicator && ChatRole.fromWire(it.role) == ChatRole.ASSISTANT }
        val recentUserMessages = messages
            .asReversed()
            .filter { !it.isTypingIndicator && ChatRole.fromWire(it.role) == ChatRole.USER }
            .take(4)
            .map { it.content }

        val messageContext = AddressingEngine.buildMessageContext(
            guideId = guide.id,
            isAuthenticated = false,
            firstName = "",
            userMessage = messageText,
            previousAssistantMessage = previousAssistantMessage,
            recentUserMessages = recentUserMessages
        )
        val mode = ChatTurnRouter.resolveMode(messageContext)
        val promptPayload = ChatPromptAssembler.build(
            guide = guide,
            context = messageContext,
            mode = mode,
            conversationState = currentState,
            messages = messages,
            firstName = ""
        )

        val streamCallback = if (messageContext.detectedLanguage == ConversationLanguage.HINDI) {
            null
        } else {
            onToken
        }

        return chatApiClient.sendMessage(
            ChatApiClientRequest(
                threadId = threadId,
                guideId = guide.serverPromptKey,
                conversationId = remoteConversationId,
                forceNewConversation = remoteConversationId.isNullOrBlank(),
                chatLang = messageContext.detectedLanguage.toWire(),
                message = messageText,
                systemPrompt = promptPayload.systemPrompt,
                developerPrompt = promptPayload.developerPrompt,
                languageInstruction = promptPayload.appVariables.languageInstruction,
                guidePersonaPrompt = promptPayload.appVariables.guidePersonaPrompt,
                modeInstruction = promptPayload.appVariables.modeInstruction,
                stateAnchor = promptPayload.stateAnchor,
                earlierSummary = promptPayload.earlierSummary,
                firstName = promptPayload.appVariables.firstName,
                secondaryGuard = promptPayload.appVariables.secondaryGuard,
                optionalRewriteDirective = promptPayload.appVariables.optionalRewriteDirective,
                systemPromptStack = promptPayload.systemPromptStack
            ),
            streamCallback
        ).map { apiResponse ->
            val prefixedReply = maybeApplyAddressingPrefix(
                rawReply = apiResponse.replyText,
                context = messageContext
            )
            val suppressTrailingQuestion = currentState.guardrails.recentQuestionEnds >= 3
            val formattedReply = ChatResponseFormatter.format(
                rawText = prefixedReply,
                guideId = guide.id,
                mode = mode,
                language = messageContext.detectedLanguage,
                suppressTrailingQuestion = suppressTrailingQuestion
            )
            val finalizedReply = if (
                ChatOutputGuard.needsLocalRewrite(
                    text = formattedReply,
                    guideId = guide.id,
                    mode = mode,
                    language = messageContext.detectedLanguage,
                    recentQuestionEnds = currentState.guardrails.recentQuestionEnds
                )
            ) {
                ChatOutputGuard.applyLocalRewrite(
                    text = formattedReply,
                    guideId = guide.id,
                    mode = mode,
                    language = messageContext.detectedLanguage,
                    suppressTrailingQuestion = suppressTrailingQuestion
                )
            } else {
                formattedReply
            }

            val scriptSafeReply = if (
                messageContext.detectedLanguage == ConversationLanguage.HINDI &&
                finalizedReply.any { it in 'A'..'Z' || it in 'a'..'z' }
            ) {
                "क्षमा करें, उत्तर हिंदी लिपि में तैयार नहीं हो सका। कृपया एक बार फिर पूछें।"
            } else {
                finalizedReply
            }

            ChatTurnProcessorResult(
                replyText = scriptSafeReply,
                conversationId = apiResponse.conversationId,
                mode = mode,
                nextState = currentState.advance(
                    locale = messageContext.detectedLanguage,
                    mode = mode,
                    userMessage = messageText,
                    assistantReply = scriptSafeReply
                )
            )
        }
    }

    private fun maybeApplyAddressingPrefix(
        rawReply: String,
        context: MessageContext
    ): String {
        val prefix = AddressingEngine.buildAddressPrefix(context).orEmpty()
        if (prefix.isBlank()) return rawReply
        return if (AddressingEngine.shouldPrependPrefix(prefix, rawReply)) {
            prefix + rawReply.trimStart()
        } else {
            rawReply
        }
    }
}

object ChatOutputGuard {
    fun needsLocalRewrite(
        text: String,
        guideId: String,
        mode: ChatTurnMode,
        language: ConversationLanguage,
        recentQuestionEnds: Int
    ): Boolean {
        val trimmed = text.trim()
        if (trimmed.isBlank()) return true

        val lacksReadableBlocks = trimmed.length > 90 && !trimmed.contains("\n\n")
        val questionOveruse = recentQuestionEnds >= 3 && trimmed.endsWith("?")
        val storyViolation = mode == ChatTurnMode.STORY &&
            (trimmed.contains("lesson", ignoreCase = true) || trimmed.contains("you should", ignoreCase = true))
        val languageViolation = when (language) {
            ConversationLanguage.ENGLISH,
            ConversationLanguage.HINGLISH -> trimmed.any {
                Character.UnicodeBlock.of(it) == Character.UnicodeBlock.DEVANAGARI
            }

            ConversationLanguage.HINDI -> trimmed.none {
                Character.UnicodeBlock.of(it) == Character.UnicodeBlock.DEVANAGARI
            } || trimmed.any { it in 'A'..'Z' || it in 'a'..'z' }
        }
        return lacksReadableBlocks || questionOveruse || storyViolation || languageViolation
    }

    fun applyLocalRewrite(
        text: String,
        guideId: String,
        mode: ChatTurnMode,
        language: ConversationLanguage,
        suppressTrailingQuestion: Boolean
    ): String {
        return ChatResponseFormatter.format(
            rawText = text,
            guideId = guideId,
            mode = mode,
            language = language,
            suppressTrailingQuestion = suppressTrailingQuestion
        )
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
            guideId == "shiv" -> 18
            guideId == "lakshmi" -> 20
            mode == ChatTurnMode.PLAYFUL -> 16
            else -> 22
        }
        val maxSentencesPerBlock = when {
            guideId == "shani" || guideId == "shiv" || guideId == "lakshmi" -> 1
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
        ConversationLanguage.ENGLISH -> "I am reflecting upon your question. Please try again in a moment."
    }
}

private fun ConversationLanguage.toWire(): String = when (this) {
    ConversationLanguage.ENGLISH -> "en"
    ConversationLanguage.HINGLISH -> "hinglish"
    ConversationLanguage.HINDI -> "hi"
}

fun ChatConversationState.advance(
    locale: ConversationLanguage,
    mode: ChatTurnMode,
    userMessage: String,
    assistantReply: String
): ChatConversationState {
    val trimmedReply = assistantReply.trim()
    val firstLine = trimmedReply.lineSequence().firstOrNull().orEmpty().trim().lowercase(Locale.getDefault())
    val nextQuestionEnds = if (trimmedReply.endsWith("?")) {
        guardrails.recentQuestionEnds + 1
    } else {
        0
    }
    val nextOpenLoops = if (trimmedReply.endsWith("?")) {
        (guardrails.recentOpenLoops + 1).coerceAtMost(3)
    } else {
        0
    }

    val updatedFirstLines = buildList {
        if (firstLine.isNotBlank()) add(firstLine)
        guardrails.recentFirstLines.forEach { existing ->
            if (existing != firstLine && size < 3) add(existing)
        }
    }

    val warmthDelta = when (mode) {
        ChatTurnMode.CASUAL -> 1
        ChatTurnMode.PLAYFUL, ChatTurnMode.STORY -> 2
        ChatTurnMode.WISDOM -> 1
        ChatTurnMode.TEACHINGS -> 0
    }
    val playfulnessDelta = when (mode) {
        ChatTurnMode.PLAYFUL, ChatTurnMode.STORY -> 1
        else -> 0
    }
    val firmnessDelta = when (mode) {
        ChatTurnMode.WISDOM, ChatTurnMode.TEACHINGS -> 1
        else -> 0
    }

    val storySeed = if (mode == ChatTurnMode.STORY) {
        story.seed ?: userMessage.trim().takeIf { it.isNotBlank() }
    } else {
        null
    }
    val storySummary = if (mode == ChatTurnMode.STORY) {
        assistantReply.lineSequence().firstOrNull()?.trim().takeIf { !it.isNullOrBlank() } ?: story.summary
    } else {
        null
    }

    return copy(
        locale = locale,
        mode = mode,
        story = if (mode == ChatTurnMode.STORY) {
            story.copy(
                active = true,
                title = story.title ?: userMessage.trim().take(48).ifBlank { null },
                seed = storySeed,
                entities = story.entities ?: userMessage.trim().take(96).ifBlank { null },
                summary = storySummary,
                lastBeat = assistantReply.lineSequence().lastOrNull()?.trim().takeIf { !it.isNullOrBlank() },
                beatCount = story.beatCount + 1
            )
        } else {
            ChatStoryState()
        },
        relationship = relationship.copy(
            warmth = (relationship.warmth + warmthDelta).coerceAtMost(5),
            playfulness = (relationship.playfulness + playfulnessDelta).coerceAtMost(5),
            firmness = (relationship.firmness + firmnessDelta).coerceAtMost(5)
        ),
        guardrails = guardrails.copy(
            recentQuestionEnds = nextQuestionEnds,
            recentOpenLoops = nextOpenLoops,
            recentFirstLines = updatedFirstLines
        )
    )
}
