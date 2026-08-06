package com.bhaktichat.app.util

import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class HindiTimeFormatterTest {
    @Test
    fun `formats morning without English letters`() {
        val formatted = HindiTimeFormatter.format(ZonedDateTime.parse("2026-08-01T05:43:00+01:00"))

        assertEquals("5:43 पूर्वाह्न", formatted)
        assertFalse(formatted.any { it in 'A'..'Z' || it in 'a'..'z' })
    }

    @Test
    fun `formats afternoon without English letters`() {
        val formatted = HindiTimeFormatter.format(ZonedDateTime.parse("2026-08-01T17:24:00+01:00"))

        assertEquals("5:24 अपराह्न", formatted)
        assertFalse(formatted.any { it in 'A'..'Z' || it in 'a'..'z' })
    }
}
