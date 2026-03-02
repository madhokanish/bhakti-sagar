package com.bhaktichat.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFFE57A00),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFFFE0BF),
    onPrimaryContainer = Color(0xFF331500),
    secondary = Color(0xFF7A5C2E),
    onSecondary = Color(0xFFFFFFFF),
    tertiary = Color(0xFF6E7C33),
    onTertiary = Color(0xFFFFFFFF),
    background = Color(0xFFFBF7F1),
    onBackground = Color(0xFF201A16),
    surface = Color(0xFFFFFBF6),
    onSurface = Color(0xFF201A16),
    surfaceVariant = Color(0xFFF3E9DA),
    onSurfaceVariant = Color(0xFF5A4A3B),
    outlineVariant = Color(0xFFE2D3BF)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFFFB877),
    onPrimary = Color(0xFF4A2400),
    primaryContainer = Color(0xFF653200),
    onPrimaryContainer = Color(0xFFFFDDBA),
    secondary = Color(0xFFD9C3A1),
    onSecondary = Color(0xFF3C2E1A),
    tertiary = Color(0xFFC8D19A),
    onTertiary = Color(0xFF2D3311),
    background = Color(0xFF16120D),
    onBackground = Color(0xFFEFE1D2),
    surface = Color(0xFF1E1812),
    onSurface = Color(0xFFEFE1D2),
    surfaceVariant = Color(0xFF352A21),
    onSurfaceVariant = Color(0xFFD9C8B6),
    outlineVariant = Color(0xFF514336)
)

@Composable
fun BhaktiChatTheme(content: @Composable () -> Unit) {
    val colors = if (isSystemInDarkTheme()) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        content = content
    )
}
