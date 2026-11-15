package com.bhaktichat.app.util

import com.bhaktichat.app.domain.AppLanguage
import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class HindiTimeFormatterTest {
    @Test
    fun `formats morning without English letters`() {
        val formatted = HindiTimeFormatter.format(ZonedDateTime.parse("2026-08-01T05:43:00+01:00"), AppLanguage.HINDI)

        assertEquals("5:43 पूर्वाह्न", formatted)
        assertFalse(formatted.any { it in 'A'..'Z' || it in 'a'..'z' })
    }

    @Test
    fun `formats afternoon without English letters`() {
        val formatted = HindiTimeFormatter.format(ZonedDateTime.parse("2026-08-01T17:24:00+01:00"), AppLanguage.HINDI)

        assertEquals("5:24 अपराह्न", formatted)
        assertFalse(formatted.any { it in 'A'..'Z' || it in 'a'..'z' })
    }

    @Test
    fun `uses AM and PM outside Hindi`() {
        val morning = ZonedDateTime.parse("2026-08-01T05:43:00+01:00")
        val evening = ZonedDateTime.parse("2026-08-01T17:24:00+01:00")

        assertEquals("5:43 AM", HindiTimeFormatter.format(morning, AppLanguage.ENGLISH))
        assertEquals("5:24 PM", HindiTimeFormatter.format(evening, AppLanguage.HINGLISH))
    }
}
