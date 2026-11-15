package com.bhaktichat.app.util

import com.bhaktichat.app.domain.AppLanguage
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

/** Formats a clock time without Android's locale-dependent AM/PM abbreviations: Hindi gets
 *  पूर्वाह्न/अपराह्न, Hinglish and English get a plain AM/PM. */
object HindiTimeFormatter {
    private val clockFormatter = DateTimeFormatter.ofPattern("h:mm", Locale.forLanguageTag("hi-IN"))

    fun format(time: ZonedDateTime, language: AppLanguage): String {
        val morning = time.hour < 12
        val period = when (language) {
            AppLanguage.HINDI -> if (morning) "पूर्वाह्न" else "अपराह्न"
            else -> if (morning) "AM" else "PM"
        }
        return "${time.format(clockFormatter)} $period"
    }
}
