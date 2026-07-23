package com.bhaktichat.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * Dark-mode aware token bag. Prefer reading via [LocalBhaktiTokens.current] from new code.
 *
 * The legacy [BhaktiThemeTokens] singleton is preserved (as light values) so that the rest
 * of the codebase that already references `BhaktiThemeTokens.X` keeps compiling untouched.
 */
data class BhaktiTokens(
    val background: Color,
    val surfaceCard: Color,
    val surfaceElevated: Color,
    val borderSubtle: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textTertiary: Color,
    val accentPrimary: Color,
    val accentWarm: Color,
    val accentError: Color,
    val accentSuccess: Color,
    val accentGradientStart: Color,
    val accentGradientEnd: Color
)

// Warm saffron/cream palette (design_handoff_bhaktichat_ia). Migrated from the earlier
// cool zinc set — background is warm cream, text warm-dark, borders warm hairlines.
private val LightTokens = BhaktiTokens(
    background = Color(0xFFFFFBF4),
    surfaceCard = Color(0xFFFFFFFF),
    surfaceElevated = Color(0xFFFFF4E6),
    borderSubtle = Color(0xFFEAE0D5),
    textPrimary = Color(0xFF2A1C15),
    textSecondary = Color(0xFF8A6F5C),
    textTertiary = Color(0xFFBDA491),
    accentPrimary = Color(0xFFF97316),
    accentWarm = Color(0xFFFBBF24),
    accentError = Color(0xFFDC2626),
    accentSuccess = Color(0xFF57A075),
    accentGradientStart = Color(0xFFFB923C),
    accentGradientEnd = Color(0xFFEA580C)
)

private val DarkTokens = BhaktiTokens(
    background = Color(0xFF0F0F11),
    surfaceCard = Color(0xFF1C1C1F),
    surfaceElevated = Color(0xFF26262A),
    borderSubtle = Color(0xFF27272A),
    textPrimary = Color(0xFFF4F4F5),
    textSecondary = Color(0xFFA1A1AA),
    textTertiary = Color(0xFF71717A),
    accentPrimary = Color(0xFFF97316),
    accentWarm = Color(0xFFFBBF24),
    accentError = Color(0xFFEF4444),
    accentSuccess = Color(0xFF22C55E),
    accentGradientStart = Color(0xFFFB923C),
    accentGradientEnd = Color(0xFFEA580C)
)

val LocalBhaktiTokens = staticCompositionLocalOf { LightTokens }

/**
 * Legacy accessor. Kept around as a pure singleton of light values so that the
 * existing screens which import individual color constants (and use them inside
 * non-composable code paths) keep compiling. New code should prefer
 * `LocalBhaktiTokens.current` for dark-mode awareness.
 */
object BhaktiThemeTokens {
    // Backgrounds
    val Background      = LightTokens.background
    val SurfaceCard     = LightTokens.surfaceCard
    val SurfaceElevated = LightTokens.surfaceElevated

    // Borders
    val BorderSubtle    = LightTokens.borderSubtle

    // Text
    val TextPrimary     = LightTokens.textPrimary
    val TextSecondary   = LightTokens.textSecondary
    val TextTertiary    = LightTokens.textTertiary

    // Accent
    val AccentPrimary   = LightTokens.accentPrimary
    val AccentWarm      = LightTokens.accentWarm
    val AccentError     = LightTokens.accentError
    val AccentSuccess   = LightTokens.accentSuccess

    // Gradient
    val AccentGradientStart = LightTokens.accentGradientStart
    val AccentGradientEnd   = LightTokens.accentGradientEnd
}

private val LightColors = lightColorScheme(
    primary              = LightTokens.accentPrimary,
    onPrimary            = Color.White,
    primaryContainer     = Color(0xFFFFF7ED),
    onPrimaryContainer   = Color(0xFF7C2D12),
    secondary            = LightTokens.accentWarm,
    onSecondary          = Color(0xFF451A03),
    tertiary             = LightTokens.accentWarm,
    onTertiary           = Color(0xFF451A03),
    background           = LightTokens.background,
    onBackground         = LightTokens.textPrimary,
    surface              = LightTokens.surfaceCard,
    onSurface            = LightTokens.textPrimary,
    surfaceVariant       = LightTokens.surfaceElevated,
    onSurfaceVariant     = LightTokens.textSecondary,
    outline              = LightTokens.borderSubtle,
    outlineVariant       = LightTokens.borderSubtle,
    error                = LightTokens.accentError,
    onError              = Color.White,
    errorContainer       = Color(0xFFFEE2E2),
    onErrorContainer     = Color(0xFF7F1D1D)
)

private val DarkColors = darkColorScheme(
    primary              = DarkTokens.accentPrimary,
    onPrimary            = Color.White,
    primaryContainer     = Color(0xFF7C2D12),
    onPrimaryContainer   = Color(0xFFFFEDD5),
    secondary            = DarkTokens.accentWarm,
    onSecondary          = Color(0xFF451A03),
    tertiary             = DarkTokens.accentWarm,
    onTertiary           = Color(0xFF451A03),
    background           = DarkTokens.background,
    onBackground         = DarkTokens.textPrimary,
    surface              = DarkTokens.surfaceCard,
    onSurface            = DarkTokens.textPrimary,
    surfaceVariant       = DarkTokens.surfaceElevated,
    onSurfaceVariant     = DarkTokens.textSecondary,
    outline              = DarkTokens.borderSubtle,
    outlineVariant       = DarkTokens.borderSubtle,
    error                = DarkTokens.accentError,
    onError              = Color.White,
    errorContainer       = Color(0xFF7F1D1D),
    onErrorContainer     = Color(0xFFFEE2E2)
)

/**
 * Resolves a string theme mode preference (one of "system", "light", "dark") into
 * the effective dark-mode boolean. Used by [BhaktiChatTheme].
 */
@Composable
fun resolveDarkMode(themeMode: String): Boolean = when (themeMode) {
    "light" -> false
    "dark" -> true
    else -> isSystemInDarkTheme()
}

@Composable
fun BhaktiChatTheme(
    themeMode: String = "system",
    content: @Composable () -> Unit
) {
    val isDark = resolveDarkMode(themeMode)
    val tokens = if (isDark) DarkTokens else LightTokens
    val colors = if (isDark) DarkColors else LightColors
    CompositionLocalProvider(LocalBhaktiTokens provides tokens) {
        MaterialTheme(
            colorScheme = colors,
            typography = Typography,
            content = content
        )
    }
}
