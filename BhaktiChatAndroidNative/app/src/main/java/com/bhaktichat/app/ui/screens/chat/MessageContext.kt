package com.bhaktichat.app.ui.screens.chat

import java.util.Locale

enum class ConversationLanguage {
    ENGLISH,
    HINGLISH,
    HINDI
}

enum class ChatTurnMode {
    CASUAL,
    PLAYFUL,
    WISDOM,
    TEACHINGS,
    STORY
}

enum class SentimentTag {
    INFORMATIONAL,
    NEUTRAL,
    DISTRESSED
}

data class MessageContext(
    val guideId: String,
    val isAuthenticated: Boolean,
    val firstName: String,
    val userMessage: String,
    val detectedLanguage: ConversationLanguage,
    val sentimentTag: SentimentTag,
    val isGreeting: Boolean,
    val isClosing: Boolean,
    val asksForHelp: Boolean,
    val isInformational: Boolean,
    val isNewTopic: Boolean,
    val usedAddressingInPreviousAssistantMessage: Boolean
)

data class ChatStoryState(
    val active: Boolean = false,
    val title: String? = null,
    val seed: String? = null,
    val entities: String? = null,
    val summary: String? = null,
    val lastBeat: String? = null,
    val beatCount: Int = 0
)

data class ChatRelationshipState(
    val warmth: Int = 1,
    val playfulness: Int = 1,
    val firmness: Int = 1
)

data class ChatGuardrailsState(
    val recentQuestionEnds: Int = 0,
    val recentOpenLoops: Int = 0,
    val recentFirstLines: List<String> = emptyList()
)

data class ChatConversationState(
    val locale: ConversationLanguage = ConversationLanguage.HINGLISH,
    val mode: ChatTurnMode = ChatTurnMode.CASUAL,
    val story: ChatStoryState = ChatStoryState(),
    val relationship: ChatRelationshipState = ChatRelationshipState(),
    val guardrails: ChatGuardrailsState = ChatGuardrailsState()
) {
    fun toStateAnchorJson(): String {
        return buildString {
            append("{\n")
            append("  \"locale\": \"").append(locale.wireValue()).append("\",\n")
            append("  \"mode\": \"").append(mode.wireValue()).append("\",\n")
            append("  \"story\": {\n")
            append("    \"active\": ").append(story.active).append(",\n")
            append("    \"title\": ").append(story.title.toJsonValue()).append(",\n")
            append("    \"seed\": ").append(story.seed.toJsonValue()).append(",\n")
            append("    \"entities\": ").append(story.entities.toJsonValue()).append(",\n")
            append("    \"summary\": ").append(story.summary.toJsonValue()).append(",\n")
            append("    \"lastBeat\": ").append(story.lastBeat.toJsonValue()).append(",\n")
            append("    \"beatCount\": ").append(story.beatCount).append("\n")
            append("  },\n")
            append("  \"relationship\": {\n")
            append("    \"warmth\": ").append(relationship.warmth).append(",\n")
            append("    \"playfulness\": ").append(relationship.playfulness).append(",\n")
            append("    \"firmness\": ").append(relationship.firmness).append("\n")
            append("  },\n")
            append("  \"guardrails\": {\n")
            append("    \"recentQuestionEnds\": ").append(guardrails.recentQuestionEnds).append(",\n")
            append("    \"recentOpenLoops\": ").append(guardrails.recentOpenLoops).append(",\n")
            append("    \"recentFirstLines\": ").append(guardrails.recentFirstLines.toJsonArray()).append("\n")
            append("  }\n")
            append("}")
        }
    }

    companion object {
        fun fromStoredPayload(rawPayload: String?): ChatConversationState {
            if (rawPayload.isNullOrBlank()) return ChatConversationState()

            return ChatConversationState(
                locale = rawPayload.extractConversationLanguage("locale") ?: ConversationLanguage.HINGLISH,
                mode = rawPayload.extractTurnMode("mode") ?: ChatTurnMode.CASUAL,
                story = ChatStoryState(
                    active = rawPayload.extractBoolean("active"),
                    title = rawPayload.extractNullableString("title"),
                    seed = rawPayload.extractNullableString("seed"),
                    entities = rawPayload.extractNullableString("entities"),
                    summary = rawPayload.extractNullableString("summary"),
                    lastBeat = rawPayload.extractNullableString("lastBeat"),
                    beatCount = rawPayload.extractInt("beatCount", 0)
                ),
                relationship = ChatRelationshipState(
                    warmth = rawPayload.extractInt("warmth", 1),
                    playfulness = rawPayload.extractInt("playfulness", 1),
                    firmness = rawPayload.extractInt("firmness", 1)
                ),
                guardrails = ChatGuardrailsState(
                    recentQuestionEnds = rawPayload.extractInt("recentQuestionEnds", 0),
                    recentOpenLoops = rawPayload.extractInt("recentOpenLoops", 0),
                    recentFirstLines = rawPayload.extractStringArray("recentFirstLines")
                )
            )
        }
    }
}

private fun ConversationLanguage.wireValue(): String = when (this) {
    ConversationLanguage.ENGLISH -> "en"
    ConversationLanguage.HINGLISH -> "hinglish"
    ConversationLanguage.HINDI -> "hi"
}

private fun ChatTurnMode.wireValue(): String = name.lowercase(Locale.getDefault())

private fun String?.toJsonValue(): String =
    if (this == null) "null" else "\"${escapeJson()}\""

private fun String.escapeJson(): String = buildString {
    for (char in this@escapeJson) {
        when (char) {
            '\\' -> append("\\\\")
            '"' -> append("\\\"")
            '\n' -> append("\\n")
            '\r' -> append("\\r")
            '\t' -> append("\\t")
            else -> append(char)
        }
    }
}

private fun List<String>.toJsonArray(): String =
    joinToString(prefix = "[", postfix = "]") { "\"${it.escapeJson()}\"" }

private fun String.extractBoolean(key: String): Boolean =
    Regex("\"$key\"\\s*:\\s*(true|false)")
        .find(this)
        ?.groupValues
        ?.getOrNull(1)
        ?.toBoolean()
        ?: false

private fun String.extractInt(key: String, defaultValue: Int): Int =
    Regex("\"$key\"\\s*:\\s*(-?\\d+)")
        .find(this)
        ?.groupValues
        ?.getOrNull(1)
        ?.toIntOrNull()
        ?: defaultValue

private fun String.extractNullableString(key: String): String? {
    val nullMatch = Regex("\"$key\"\\s*:\\s*null").find(this)
    if (nullMatch != null) return null

    return Regex("\"$key\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"")
        .find(this)
        ?.groupValues
        ?.getOrNull(1)
        ?.replace("\\\"", "\"")
        ?.replace("\\\\", "\\")
        ?.replace("\\n", "\n")
        ?.replace("\\r", "\r")
        ?.replace("\\t", "\t")
}

private fun String.extractStringArray(key: String): List<String> {
    val arrayText = Regex("\"$key\"\\s*:\\s*\\[(.*?)]", RegexOption.DOT_MATCHES_ALL)
        .find(this)
        ?.groupValues
        ?.getOrNull(1)
        ?.trim()
        ?: return emptyList()

    if (arrayText.isBlank()) return emptyList()

    return Regex("\"((?:\\\\.|[^\"])*)\"")
        .findAll(arrayText)
        .map { match ->
            match.groupValues[1]
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t")
        }
        .toList()
}

private fun String.extractConversationLanguage(key: String): ConversationLanguage? =
    when (extractNullableString(key)?.lowercase(Locale.getDefault())) {
        "en" -> ConversationLanguage.ENGLISH
        "hinglish" -> ConversationLanguage.HINGLISH
        "hi" -> ConversationLanguage.HINDI
        else -> null
    }

private fun String.extractTurnMode(key: String): ChatTurnMode? =
    runCatching { ChatTurnMode.valueOf(extractNullableString(key)?.uppercase(Locale.getDefault()).orEmpty()) }
        .getOrNull()
