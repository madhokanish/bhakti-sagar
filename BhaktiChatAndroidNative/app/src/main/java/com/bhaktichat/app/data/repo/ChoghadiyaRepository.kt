package com.bhaktichat.app.data.repo

import com.bhaktichat.app.domain.ChoghadiyaCity
import com.bhaktichat.app.domain.ChoghadiyaSlot
import com.bhaktichat.app.util.ChoghadiyaCalculator
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
import java.util.Locale

data class ChoghadiyaDayData(
    val slots: List<ChoghadiyaSlot>,
    val sunrise: String,
    val sunset: String,
    val nextSunrise: String
)

class ChoghadiyaRepository(
    private val baseUrl: String,
    private val httpClient: OkHttpClient
) {
    private val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE
    private val timeFormatter = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH)

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

            val sunriseInstant = Instant.parse(sunrise)
            val sunsetInstant = Instant.parse(sunset)
            val nextSunriseInstant = Instant.parse(nextSunrise)

            ChoghadiyaDayData(
                slots = ChoghadiyaCalculator.buildSlots(
                    sunrise = sunriseInstant,
                    sunset = sunsetInstant,
                    nextSunrise = nextSunriseInstant,
                    zoneId = zoneId
                ),
                sunrise = sunriseInstant.atZone(zoneId).format(timeFormatter),
                sunset = sunsetInstant.atZone(zoneId).format(timeFormatter),
                nextSunrise = nextSunriseInstant.atZone(zoneId).format(timeFormatter)
            )
        }
    }
}
