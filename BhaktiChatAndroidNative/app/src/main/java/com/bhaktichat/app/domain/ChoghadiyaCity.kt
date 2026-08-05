package com.bhaktichat.app.domain

import java.util.Locale
import java.util.TimeZone

/**
 * [nameKey] is a translation key, not display text — resolved as `t(city.nameKey)` so the
 * list reads in the user's script. [slug] stays the stable identifier used for lookup.
 */
data class ChoghadiyaCity(
    val slug: String,
    val nameKey: String,
    val lat: Double,
    val lon: Double,
    val tz: String
)

object ChoghadiyaCities {
    val all: List<ChoghadiyaCity> = listOf(
        ChoghadiyaCity("london", "city_london", 51.5072, -0.1276, "Europe/London"),
        ChoghadiyaCity("new-york", "city_newyork", 40.7128, -74.0060, "America/New_York"),
        ChoghadiyaCity("toronto", "city_toronto", 43.6532, -79.3832, "America/Toronto"),
        ChoghadiyaCity("dubai", "city_dubai", 25.2048, 55.2708, "Asia/Dubai"),
        ChoghadiyaCity("sydney", "city_sydney", -33.8688, 151.2093, "Australia/Sydney"),
        ChoghadiyaCity("singapore", "city_singapore", 1.3521, 103.8198, "Asia/Singapore"),
        ChoghadiyaCity("delhi", "city_delhi", 28.6139, 77.2090, "Asia/Kolkata"),
        ChoghadiyaCity("mumbai", "city_mumbai", 19.0760, 72.8777, "Asia/Kolkata")
    )

    fun defaultCity(): ChoghadiyaCity {
        return if (Locale.getDefault().country.equals("IN", ignoreCase = true)) {
            all.first { it.slug == "delhi" }
        } else {
            all.first()
        }
    }

    fun recommendedCity(): ChoghadiyaCity {
        val zoneId = TimeZone.getDefault().id
        val country = Locale.getDefault().country

        // The device timezone reflects where the user is now and must take precedence over a
        // language-region setting that may remain unchanged while travelling.
        val timezoneSlug = when {
            zoneId.contains("Kolkata", ignoreCase = true) -> "delhi"
            zoneId.contains("New_York", ignoreCase = true) -> "new-york"
            zoneId.contains("Toronto", ignoreCase = true) -> "toronto"
            zoneId.contains("London", ignoreCase = true) -> "london"
            zoneId.contains("Dubai", ignoreCase = true) -> "dubai"
            zoneId.contains("Singapore", ignoreCase = true) -> "singapore"
            zoneId.contains("Sydney", ignoreCase = true) -> "sydney"
            else -> null
        }
        if (timezoneSlug != null) return all.first { it.slug == timezoneSlug }

        val countrySlug = when (country.uppercase(Locale.ROOT)) {
            "IN" -> "delhi"
            "US" -> "new-york"
            "CA" -> "toronto"
            "GB" -> "london"
            "AE" -> "dubai"
            "SG" -> "singapore"
            "AU" -> "sydney"
            else -> null
        }
        return countrySlug?.let { slug -> all.first { it.slug == slug } } ?: defaultCity()
    }
}
