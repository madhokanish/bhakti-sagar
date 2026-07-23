package com.bhaktichat.app

import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import com.bhaktichat.app.ui.navigation.BhaktiChatApp
import com.bhaktichat.app.ui.theme.BhaktiChatTheme
import com.bhaktichat.app.util.AdsConsentManager
import com.bhaktichat.app.util.ThemePreferences

/**
 * Allows any composable to update the current theme mode. The MainActivity owns the
 * mutable state at the root of the composition so that a change immediately recomposes
 * the entire UI with the new color scheme.
 */
val LocalThemeController = staticCompositionLocalOf<(String) -> Unit> {
    { /* no-op outside MainActivity */ }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // App forces a light theme regardless of system dark mode (see themes.xml), so status/
        // nav bar icons must always render dark — explicit here now instead of via the theme's
        // deprecated android:statusBarColor/navigationBarColor/windowLightStatusBar attributes,
        // which Play Console's pre-launch report flagged.
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
        )
        // Gather ad consent (UMP) once at start; resolves immediately where no form applies.
        AdsConsentManager.gather(this) { /* consent resolved — ad requests may proceed */ }
        val themePrefs = ThemePreferences(this)
        setContent {
            var themeMode by remember { mutableStateOf(themePrefs.themeMode) }
            val setMode: (String) -> Unit = { mode ->
                themePrefs.themeMode = mode
                themeMode = mode
            }
            CompositionLocalProvider(LocalThemeController provides setMode) {
                BhaktiChatTheme(themeMode = themeMode) {
                    BhaktiChatApp()
                }
            }
        }
    }
}
