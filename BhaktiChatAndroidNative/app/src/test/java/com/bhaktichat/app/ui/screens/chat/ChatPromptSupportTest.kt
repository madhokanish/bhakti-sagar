package com.bhaktichat.app.ui.screens.chat

import com.bhaktichat.app.domain.Guide
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ChatPromptSupportTest {

    @Test
    fun distressedMessageRoutesToWisdomMode() {
        val context = messageContext("I feel anxious and scared. Please help me.")

        assertEquals(ChatTurnMode.WISDOM, ChatTurnRouter.resolveMode(context))
    }

    @Test
    fun gitaQuestionRoutesToTeachingsMode() {
        val context = messageContext("What does the Gita say about karma?")

        assertEquals(ChatTurnMode.TEACHINGS, ChatTurnRouter.resolveMode(context))
    }

    @Test
    fun storyPromptRoutesToStoryMode() {
        val context = messageContext("Continue the story from the last scene.")

        assertEquals(ChatTurnMode.STORY, ChatTurnRouter.resolveMode(context))
    }

    @Test
    fun formatterSplitsLongParagraphIntoReadableBlocks() {
        val raw = "Take one calm breath first. Then slow your thoughts and look at the next honest step. You do not need to solve everything at once. Just move with steadiness today."

        val formatted = ChatResponseFormatter.format(
            rawText = raw,
            guideId = "krishna",
            mode = ChatTurnMode.WISDOM,
            language = ConversationLanguage.ENGLISH,
            suppressTrailingQuestion = false
        )

        assertTrue(formatted.contains("\n\n"))
        assertFalse(formatted.contains("  "))
    }

    @Test
    fun formatterSuppressesRepeatedKrishnaQuestionWhenRequested() {
        val formatted = ChatResponseFormatter.format(
            rawText = "Take one honest step now?",
            guideId = "krishna",
            mode = ChatTurnMode.CASUAL,
            language = ConversationLanguage.ENGLISH,
            suppressTrailingQuestion = true
        )

        assertFalse(formatted.endsWith("?"))
        assertTrue(formatted.endsWith("."))
    }

    @Test
    fun promptAssemblerInjectsModeAndFirstName() {
        val payload = ChatPromptAssembler.build(
            guide = sampleGuide("krishna"),
            context = messageContext("I need calm guidance right now."),
            mode = ChatTurnMode.CASUAL,
            conversationState = ChatConversationState(
                guardrails = ChatGuardrailsState(recentQuestionEnds = 3)
            ),
            messages = emptyList(),
            firstName = "Anish Madhok"
        )

        assertTrue(payload.systemPrompt.contains("You are BhaktiChat"))
        assertTrue(payload.developerPrompt.contains("{{LANGUAGE_INSTRUCTION}}"))
        assertEquals("Mode=casual Strategy=answer_then_hook. Answer directly like a normal person. Keep 1 to 6 short lines with blank lines. No sermons. Optional one natural follow-up question.", payload.appVariables.modeInstruction)
        assertEquals("Anish", payload.appVariables.firstName)
        assertTrue(payload.appVariables.secondaryGuard.contains("Do not end this reply with a question."))
        assertTrue(payload.stateAnchor.contains("\"guardrails\""))
    }

    private fun messageContext(message: String): MessageContext =
        AddressingEngine.buildMessageContext(
            guideId = "krishna",
            isAuthenticated = false,
            firstName = "",
            userMessage = message,
            previousAssistantMessage = null
        )

    private fun sampleGuide(id: String) = Guide(
        id = id,
        displayName = "Shri Krishna",
        status = "Online guide",
        avatarRes = 0,
        avatarVerticalBias = 0f,
        profileImageRes = 0,
        profileVerticalBias = 0f,
        description = "",
        teachings = emptyList(),
        openingScenes = emptyMap(),
        suggestedPrompts = emptyList(),
        serverPromptKey = id
    )
}
