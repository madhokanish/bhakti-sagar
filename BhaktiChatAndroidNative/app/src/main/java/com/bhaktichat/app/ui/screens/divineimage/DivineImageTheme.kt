package com.bhaktichat.app.ui.screens.divineimage

import androidx.compose.ui.graphics.Color

/**
 * Warm devotional palette for the Divine Image flow (design handoff
 * "1a · Inspiration gallery"). The app's global [com.bhaktichat.app.ui.theme.BhaktiThemeTokens]
 * is a cool-grey Material scheme; the divine-image screens use this saffron/cream
 * palette on top of it. Accent + gradient values already match the global tokens,
 * so those are reused directly from BhaktiThemeTokens at the call sites — only the
 * warm neutrals and per-mode/deity gradients that don't exist globally live here.
 */
object DivineImagePalette {
    // Screen background gradient
    val ScreenBgTop = Color(0xFFFFFBF4)
    val ScreenBgBottom = Color(0xFFFFF4E6)

    // Surfaces & hairlines
    val Card = Color(0xFFFFFFFF)
    val CardBorder = Color(0x1A784028)      // rgba(120,80,40,0.10)
    val CardBorderStrong = Color(0x29784028) // rgba(120,80,40,0.16)

    // Text
    val TextPrimary = Color(0xFF2A1C15)
    val TextSecondary = Color(0xFF8A6F5C)
    val TextMuted = Color(0xFFBDA491)
    val Success = Color(0xFF57A075)

    // Deep accent (numbers, chevrons, tonal text) + number highlight
    val DeepAccent = Color(0xFFC2410C)
    val NumberHighlight = Color(0xFFEA580C)

    // Mode-card gradients
    val ModeGodStart = Color(0xFFF79A3E)
    val ModeGodEnd = Color(0xFFE15414)
    val ModeTempleStart = Color(0xFF8E6FC0)
    val ModeTempleEnd = Color(0xFF5B3E92)

    /** Deity monogram gradient (start, end) keyed by display name; null → generic saffron. */
    fun deityMonogram(deity: String): Pair<Color, Color>? = when (deity) {
        "Lord Krishna" -> Color(0xFF7FB0E0) to Color(0xFF3E6DA6)
        "Shiv Ji" -> Color(0xFF9BA3C9) to Color(0xFF5B639E)
        "Hanuman Ji" -> Color(0xFFF0A07A) to Color(0xFFC2410C)
        "Lakshmi Ji" -> Color(0xFFF0C67A) to Color(0xFFC98A2E)
        "Ganesh Ji" -> Color(0xFFE8A0A6) to Color(0xFFB5455C)
        else -> null
    }
}
