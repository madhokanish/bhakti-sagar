package com.bhaktichat.app.ui.screens.chat

import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.AppLanguage
import com.bhaktichat.app.domain.ChatRole
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AddressingEngineTest {

    @Test
    fun guestKrishnaEmotionalMessageUsesPriye() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "krishna",
            isAuthenticated = false,
            firstName = "",
            userMessage = "I feel anxious and confused. Please help me.",
            previousAssistantMessage = null,
            appLanguage = AppLanguage.HINGLISH
        )

        assertEquals("priye", AddressingEngine.getAddressingToken(context))
    }

    @Test
    fun signedInKrishnaEmotionalMessageUsesFirstName() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "krishna",
            isAuthenticated = true,
            firstName = "Anish Madhok",
            userMessage = "I am stressed about my life and need help.",
            previousAssistantMessage = null
        )

        assertEquals("Anish", AddressingEngine.getAddressingToken(context))
    }

    @Test
    fun signedInLakshmiInformationalMessageSkipsName() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "lakshmi",
            isAuthenticated = true,
            firstName = "Anish",
            userMessage = "What is the best time for Lakshmi puja today?",
            previousAssistantMessage = null
        )

        assertNull(AddressingEngine.getAddressingToken(context))
    }

    @Test
    fun repeatedNonDistressedAssistantMessagesSkipAddressing() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "shani",
            isAuthenticated = false,
            firstName = "",
            userMessage = "Tell me the steps for Saturday fasting.",
            previousAssistantMessage = assistantMessage("Karmayogi, stay steady and follow one discipline.")
        )

        assertNull(AddressingEngine.getAddressingToken(context))
    }

    @Test
    fun repeatedDistressedMessagesCanStillUseAddressing() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "shani",
            isAuthenticated = false,
            firstName = "",
            userMessage = "I still feel scared and unlucky. Please help.",
            previousAssistantMessage = assistantMessage("Karmayogi, hold your ground."),
            appLanguage = AppLanguage.HINGLISH
        )

        assertEquals("karmayogi", AddressingEngine.getAddressingToken(context))
    }

    @Test
    fun greetingMessageUsesGuestPrefix() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "lakshmi",
            isAuthenticated = false,
            firstName = "",
            userMessage = "Good morning Lakshmi ji",
            previousAssistantMessage = null,
            appLanguage = AppLanguage.HINGLISH
        )

        assertEquals("vats", AddressingEngine.getAddressingToken(context))
    }

    @Test
    fun blankSignedInNameFallsBackToGuestPrefix() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "krishna",
            isAuthenticated = true,
            firstName = "   ",
            userMessage = "I am worried about my relationship.",
            previousAssistantMessage = null,
            appLanguage = AppLanguage.HINGLISH
        )

        assertEquals("priye", AddressingEngine.getAddressingToken(context))
    }

    @Test
    fun informationalHindiQuestionStaysInformational() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "krishna",
            isAuthenticated = false,
            firstName = "",
            userMessage = "आज कृष्ण आरती का समय क्या है?",
            previousAssistantMessage = null
        )

        assertEquals(ConversationLanguage.HINDI, context.detectedLanguage)
        assertNull(AddressingEngine.getAddressingToken(context))
    }

    @Test
    fun languageSettingOutranksRomanisedHindi() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "krishna",
            isAuthenticated = false,
            firstName = "",
            userMessage = "Mujhe aaj bahut chinta ho rahi hai",
            previousAssistantMessage = null,
            appLanguage = AppLanguage.HINDI
        )

        assertEquals(ConversationLanguage.HINDI, context.detectedLanguage)
    }

    @Test
    fun languageSettingOutranksDevanagariScript() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "krishna",
            isAuthenticated = false,
            firstName = "",
            userMessage = "मुझे आज बहुत चिंता हो रही है",
            previousAssistantMessage = null,
            appLanguage = AppLanguage.HINGLISH
        )

        assertEquals(ConversationLanguage.HINGLISH, context.detectedLanguage)
    }

    @Test
    fun ambiguousMessageDefaultsToHindiDevanagari() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "krishna",
            isAuthenticated = false,
            firstName = "",
            userMessage = "🙏",
            previousAssistantMessage = null
        )

        assertEquals(ConversationLanguage.HINDI, context.detectedLanguage)
    }

    @Test
    fun hindiGreetingUsesDevanagariAddressing() {
        val context = AddressingEngine.buildMessageContext(
            guideId = "krishna",
            isAuthenticated = false,
            firstName = "",
            userMessage = "नमस्ते",
            previousAssistantMessage = null
        )

        assertEquals("प्रिय", AddressingEngine.getAddressingToken(context))
    }

    @Test
    fun greetingWordInsideAnotherWordIsNotAGreeting() {
        // "hi" sits inside both "nahi" and "chahiye".
        assertFalse(context(userMessage = "Mujhe nahi chahiye").isGreeting)
    }

    @Test
    fun wholeWordGreetingIsAGreeting() {
        assertTrue(context(userMessage = "Hi Krishna").isGreeting)
    }

    @Test
    fun prefixIsNotDuplicatedWhenStreamAlreadyStartsWithToken() {
        assertFalse(AddressingEngine.shouldPrependPrefix("Anish, ", "Anish, take one calm step first."))
        assertTrue(AddressingEngine.shouldPrependPrefix("Anish, ", "Take one calm step first."))
    }

    @Test
    fun prefixIsSkippedWhenReplyOpensWithItsOwnVocative() {
        assertFalse(AddressingEngine.shouldPrependPrefix("Karmayogi, ", "Haan, bolo."))
        assertFalse(AddressingEngine.shouldPrependPrefix("Priye, ", "Mitra, “Houd ha” se mera matlab haan tha."))
        assertFalse(AddressingEngine.shouldPrependPrefix("कर्मयोगी, ", "हाँ, मैं सुन रहा हूँ।"))
        assertTrue(AddressingEngine.shouldPrependPrefix("Karmayogi, ", "Main yahin hoon, beta."))
        assertTrue(AddressingEngine.shouldPrependPrefix("कर्मयोगी, ", "मैं यहीं हूँ।"))
    }

    private fun context(userMessage: String) = AddressingEngine.buildMessageContext(
        guideId = "krishna",
        isAuthenticated = false,
        firstName = "",
        userMessage = userMessage,
        previousAssistantMessage = null,
        appLanguage = AppLanguage.HINGLISH
    )

    private fun assistantMessage(content: String) = MessageEntity(
        id = "assistant-1",
        guideId = "krishna",
        role = ChatRole.ASSISTANT.wire,
        content = content,
        createdAt = 1L
    )
}
