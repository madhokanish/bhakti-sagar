package com.bhaktichat.app.domain

import java.util.Locale
import java.util.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Test

class ChoghadiyaCitiesTest {
    @Test
    fun recommendedCityPrefersCurrentTimezoneOverLocaleRegion() {
        val originalLocale = Locale.getDefault()
        val originalTimeZone = TimeZone.getDefault()
        try {
            Locale.setDefault(Locale.US)
            TimeZone.setDefault(TimeZone.getTimeZone("Europe/London"))

            assertEquals("london", ChoghadiyaCities.recommendedCity().slug)
        } finally {
            Locale.setDefault(originalLocale)
            TimeZone.setDefault(originalTimeZone)
        }
    }
}
