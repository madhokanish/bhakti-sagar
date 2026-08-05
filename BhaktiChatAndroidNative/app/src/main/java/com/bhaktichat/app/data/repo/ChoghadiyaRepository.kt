package com.bhaktichat.app.data.repo

import com.bhaktichat.app.util.LanguageStore

import com.bhaktichat.app.domain.ChoghadiyaCity
import com.bhaktichat.app.domain.ChoghadiyaSlot
import com.bhaktichat.app.util.ChoghadiyaCalculator
import com.bhaktichat.app.util.HindiTimeFormatter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

data class ChoghadiyaDayData(
    val slots: List<ChoghadiyaSlot>,
    val sunrise: String,
    val sunset: String,
    val nextSunrise: String
)

class ChoghadiyaRepository(
    private val baseUrl: String,
    private val httpClient: OkHttpClient,
    private val languageStore: LanguageStore
) {
    private val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    suspend fun loadToday(city: ChoghadiyaCity): ChoghadiyaDayData = withContext(Dispatchers.IO) {
        val zoneId = ZoneId.of(city.tz)
        val dateIso = LocalDate.now(zoneId).format(dateFormatter)
        val endpoint = (baseUrl.trimEnd('/') + "/api/choghadiya/sun")
            .toHttpUrl()
            .newBuilder()
            .addQueryParameter("lat", city.lat.toString())
            .addQueryParameter("lon", city.lon.toString())
            .addQueryParameter("date", dateIso)
            .addQueryParameter("tz", city.tz)
            .build()

        val request = Request.Builder()
            .url(endpoint)
            .get()
            .addHeader("Accept", "application/json")
            .build()

        httpClient.newCall(request).execute().use { response ->
            val body = response.body?.string().orEmpty()
            val payload = runCatching { JSONObject(body) }.getOrNull()
            if (!response.isSuccessful || payload == null) {
                val error = payload?.optString("error").orEmpty().ifBlank { "Unable to load choghadiya." }
                throw IllegalStateException(error)
            }

            val sunrise = payload.optString("sunrise")
            val sunset = payload.optString("sunset")
            val nextSunrise = payload.optString("nextSunrise")

            if (sunrise.isBlank() || sunset.isBlank() || nextSunrise.isBlank()) {
                val error = payload.optString("error").ifBlank { "Invalid choghadiya data." }
                throw IllegalStateException(error)
            }

            // Guard against non-blank but malformed values: Instant.parse throws
            // DateTimeParseException, which would otherwise escape as an uncaught crash
            // instead of the graceful error the rest of this method uses.
            val (sunriseInstant, rawSunsetInstant, rawNextSunriseInstant) = runCatching {
                Triple(Instant.parse(sunrise), Instant.parse(sunset), Instant.parse(nextSunrise))
            }.getOrElse {
                throw IllegalStateException("Invalid choghadiya data.")
            }

            // Some western longitudes cross UTC midnight before local sunset. If the service
            // returns that clock time with the sunrise date, restore the chronological day so
            // current-slot selection and progress remain correct.
            val sunsetInstant = rawSunsetInstant.rollForwardUntilAfter(sunriseInstant)
            val nextSunriseInstant = rawNextSunriseInstant.rollForwardUntilAfter(sunsetInstant)

            ChoghadiyaDayData(
                slots = ChoghadiyaCalculator.buildSlots(
                    sunrise = sunriseInstant,
                    sunset = sunsetInstant,
                    nextSunrise = nextSunriseInstant,
                    zoneId = zoneId,
                    language = languageStore.language.value
                ),
                sunrise = HindiTimeFormatter.format(sunriseInstant.atZone(zoneId)),
                sunset = HindiTimeFormatter.format(sunsetInstant.atZone(zoneId)),
                nextSunrise = HindiTimeFormatter.format(nextSunriseInstant.atZone(zoneId))
            )
        }
    }

    private fun Instant.rollForwardUntilAfter(previous: Instant): Instant {
        var result = this
        while (!result.isAfter(previous)) {
            result = result.plus(1, ChronoUnit.DAYS)
        }
        return result
    }
}
