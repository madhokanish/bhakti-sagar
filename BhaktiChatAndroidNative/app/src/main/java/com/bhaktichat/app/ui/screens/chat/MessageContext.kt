package com.bhaktichat.app.ui.screens.chat

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

data class ChatConversationState(
    val locale: ConversationLanguage = ConversationLanguage.ENGLISH,
    val mode: ChatTurnMode = ChatTurnMode.CASUAL,
    val recentQuestionEnds: Int = 0,
    val recentOpenLoops: Int = 0,
    val recentFirstLines: List<String> = emptyList(),
    val warmth: Int = 1,
    val playfulness: Int = 1,
    val firmness: Int = 1
)
