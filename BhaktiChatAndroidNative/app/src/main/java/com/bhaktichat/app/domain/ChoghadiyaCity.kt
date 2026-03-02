package com.bhaktichat.app.domain

import java.util.Locale
import java.util.TimeZone

data class ChoghadiyaCity(
    val slug: String,
    val name: String,
    val lat: Double,
    val lon: Double,
    val tz: String
)

object ChoghadiyaCities {
    val all: List<ChoghadiyaCity> = listOf(
        ChoghadiyaCity("london", "London, UK", 51.5072, -0.1276, "Europe/London"),
        ChoghadiyaCity("new-york", "New York, USA", 40.7128, -74.0060, "America/New_York"),
        ChoghadiyaCity("toronto", "Toronto, Canada", 43.6532, -79.3832, "America/Toronto"),
        ChoghadiyaCity("dubai", "Dubai, UAE", 25.2048, 55.2708, "Asia/Dubai"),
        ChoghadiyaCity("sydney", "Sydney, Australia", -33.8688, 151.2093, "Australia/Sydney"),
        ChoghadiyaCity("singapore", "Singapore", 1.3521, 103.8198, "Asia/Singapore"),
        ChoghadiyaCity("delhi", "Delhi, India", 28.6139, 77.2090, "Asia/Kolkata"),
        ChoghadiyaCity("mumbai", "Mumbai, India", 19.0760, 72.8777, "Asia/Kolkata")
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

        return when {
            zoneId.contains("Kolkata", ignoreCase = true) || country.equals("IN", ignoreCase = true) -> {
                all.first { it.slug == "delhi" }
            }

            zoneId.contains("New_York", ignoreCase = true) || country.equals("US", ignoreCase = true) -> {
                all.first { it.slug == "new-york" }
            }

            zoneId.contains("Toronto", ignoreCase = true) || country.equals("CA", ignoreCase = true) -> {
                all.first { it.slug == "toronto" }
            }

            zoneId.contains("London", ignoreCase = true) || country.equals("GB", ignoreCase = true) -> {
                all.first { it.slug == "london" }
            }

            zoneId.contains("Dubai", ignoreCase = true) || country.equals("AE", ignoreCase = true) -> {
                all.first { it.slug == "dubai" }
            }

            zoneId.contains("Singapore", ignoreCase = true) || country.equals("SG", ignoreCase = true) -> {
                all.first { it.slug == "singapore" }
            }

            zoneId.contains("Sydney", ignoreCase = true) || country.equals("AU", ignoreCase = true) -> {
                all.first { it.slug == "sydney" }
            }

            else -> defaultCity()
        }
    }
}
