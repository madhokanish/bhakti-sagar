package com.bhaktichat.app.util

import com.bhaktichat.app.domain.AppLanguage
import com.bhaktichat.app.ui.i18n.translate

import com.bhaktichat.app.domain.ChoghadiyaSlot
import java.time.DayOfWeek
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime

object ChoghadiyaCalculator {
    private val dayTable: Map<DayOfWeek, List<String>> = mapOf(
        DayOfWeek.SUNDAY to listOf("Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"),
        DayOfWeek.MONDAY to listOf("Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit"),
        DayOfWeek.TUESDAY to listOf("Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"),
        DayOfWeek.WEDNESDAY to listOf("Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh"),
        DayOfWeek.THURSDAY to listOf("Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh"),
        DayOfWeek.FRIDAY to listOf("Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char"),
        DayOfWeek.SATURDAY to listOf("Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal")
    )
    private val nightTable: Map<DayOfWeek, List<String>> = mapOf(
        DayOfWeek.SUNDAY to listOf("Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh"),
        DayOfWeek.MONDAY to listOf("Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char"),
        DayOfWeek.TUESDAY to listOf("Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal"),
        DayOfWeek.WEDNESDAY to listOf("Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg"),
        DayOfWeek.THURSDAY to listOf("Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit"),
        DayOfWeek.FRIDAY to listOf("Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog"),
        DayOfWeek.SATURDAY to listOf("Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh")
    )

    fun buildSlots(
        sunrise: Instant,
        sunset: Instant,
        nextSunrise: Instant,
        zoneId: ZoneId,
        language: AppLanguage
    ): List<ChoghadiyaSlot> {
        val sunriseLocal = sunrise.atZone(zoneId)
        val sunsetLocal = sunset.atZone(zoneId)
        val nextSunriseLocal = nextSunrise.atZone(zoneId)
        val weekday = sunriseLocal.dayOfWeek
        val dayNames = dayTable[weekday] ?: emptyList()
        val nightNames = nightTable[weekday] ?: emptyList()

        val dayStepMillis = Duration.between(sunriseLocal, sunsetLocal).toMillis() / 8.0
        val nightStepMillis = Duration.between(sunsetLocal, nextSunriseLocal).toMillis() / 8.0

        return buildList {
            dayNames.forEachIndexed { index, name ->
                val start = sunriseLocal.plus(Duration.ofMillis((dayStepMillis * index).toLong()))
                val end = if (index == 7) sunsetLocal else sunriseLocal.plus(Duration.ofMillis((dayStepMillis * (index + 1)).toLong()))
                add(
                    ChoghadiyaSlot(
                        label = name,
                        start = HindiTimeFormatter.format(start),
                        end = HindiTimeFormatter.format(end),
                        quality = qualityText(name, language),
                        startEpochMillis = start.toInstant().toEpochMilli(),
                        endEpochMillis = end.toInstant().toEpochMilli(),
                        isNight = false
                    )
                )
            }

            nightNames.forEachIndexed { index, name ->
                val start = sunsetLocal.plus(Duration.ofMillis((nightStepMillis * index).toLong()))
                val end = if (index == 7) nextSunriseLocal else sunsetLocal.plus(Duration.ofMillis((nightStepMillis * (index + 1)).toLong()))
                add(
                    ChoghadiyaSlot(
                        label = "$name (${translate("chogh_night", language)})",
                        start = HindiTimeFormatter.format(start),
                        end = HindiTimeFormatter.format(end),
                        quality = qualityText(name, language),
                        startEpochMillis = start.toInstant().toEpochMilli(),
                        endEpochMillis = end.toInstant().toEpochMilli(),
                        isNight = true
                    )
                )
            }
        }
    }

    private fun qualityText(label: String, language: AppLanguage): String = translate(when (label) {
        "Amrit" -> "chogh_best"
        "Shubh" -> "chogh_shubh"
        "Labh" -> "chogh_laabh"
        "Char" -> "chogh_normal"
        "Kaal" -> "chogh_loss"
        "Rog" -> "chogh_inauspicious"
        else -> "chogh_caution"
    }, language)
}
