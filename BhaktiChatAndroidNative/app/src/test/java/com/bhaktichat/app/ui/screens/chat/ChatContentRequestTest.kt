package com.bhaktichat.app.ui.screens.chat

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

// Inputs are real messages from the week of 2026-10-25.
class ChatContentRequestTest {
    @Test
    fun ringtoneAsksAreRingtone() {
        assertEquals(ChatContentRequest.RINGTONE, ChatContentRequest.detect("आप रिंगटोन भेजिए ना अच्छा सा हनुमान जी के"))
        assertEquals(ChatContentRequest.RINGTONE, ChatContentRequest.detect("Shiv Thakur ringtone"))
        assertEquals(ChatContentRequest.RINGTONE, ChatContentRequest.detect("लगन तुमसे लगा बैठे रिंगटोन"))
    }

    @Test
    fun songAsksAreAarti() {
        assertEquals(ChatContentRequest.AARTI, ChatContentRequest.detect("Hanuman Ji song"))
        assertEquals(ChatContentRequest.AARTI, ChatContentRequest.detect("कृष्ण जी का भक्ति गाना"))
        assertEquals(ChatContentRequest.AARTI, ChatContentRequest.detect("भगवान के भजन लगे हनुमान जी के"))
        assertEquals(ChatContentRequest.AARTI, ChatContentRequest.detect("Koi acche song Krishna ji wale"))
    }

    @Test
    fun pictureAsksAreWallpaper() {
        assertEquals(ChatContentRequest.WALLPAPER, ChatContentRequest.detect("Hanuman Ji mere ko na apna wallpaper lagana hai aapka kaise"))
        assertEquals(ChatContentRequest.WALLPAPER, ChatContentRequest.detect("Lakshmi Mata ka apne phone per photo kaise laga"))
        assertEquals(ChatContentRequest.WALLPAPER, ChatContentRequest.detect("mahade. ka. photo. Mera. photo"))
    }

    @Test
    fun otherPaidFeatures() {
        assertEquals(ChatContentRequest.DIVINE_IMAGE, ChatContentRequest.detect("Krishna ji ke saath meri photo banao"))
        assertEquals(ChatContentRequest.VOICE, ChatContentRequest.detect("aap mujhe call karo na"))
        assertEquals(ChatContentRequest.VOICE, ChatContentRequest.detect("आवाज़ में बात करो"))
        assertEquals(ChatContentRequest.REELS, ChatContentRequest.detect("Mahadev ka status video chahiye"))
        assertEquals(ChatContentRequest.FESTIVALS, ChatContentRequest.detect("एकादशी व्रत कब है"))
        // An aarti for a festival is an aarti, not the calendar.
        assertEquals(ChatContentRequest.AARTI, ChatContentRequest.detect("Diwali ki aarti sunao"))
    }

    @Test
    fun sourcesRoundTrip() {
        ChatContentRequest.entries.forEach { assertEquals(it, ChatContentRequest.fromSource(it.source)) }
        assertNull(ChatContentRequest.fromSource("aartis"))
    }

    @Test
    fun everydayMessagesAreNothing() {
        assertNull(ChatContentRequest.detect("Meri beti ke photo dekhkar piche pad Gaya tha"))
        assertNull(ChatContentRequest.detect("पैसों की चिंता से बाहर निकलने में मुझे बुद्धि और स्थिरता के साथ मार्गदर्शन दीजिए।"))
        assertNull(ChatContentRequest.detect("baba mujhe kisi or mohabbat ho gya"))
        assertNull(ChatContentRequest.detect("Ganapati bappa morya"))
    }
}
