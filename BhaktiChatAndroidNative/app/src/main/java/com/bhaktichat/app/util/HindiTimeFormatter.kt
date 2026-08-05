package com.bhaktichat.app.util

import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

/** Formats a clock time without Android's locale-dependent English AM/PM abbreviations. */
object HindiTimeFormatter {
    private val clockFormatter = DateTimeFormatter.ofPattern("h:mm", Locale.forLanguageTag("hi-IN"))

    fun format(time: ZonedDateTime): String {
        val period = if (time.hour < 12) "पूर्वाह्न" else "अपराह्न"
        return "${time.format(clockFormatter)} $period"
    }
}
