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
import com.bhaktichat.app.data.subscription.PaymentOutcome
import com.bhaktichat.app.ui.auth.BhaktiChatAuthRoot
import com.bhaktichat.app.ui.theme.BhaktiChatTheme
import com.bhaktichat.app.util.ThemePreferences
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Allows any composable to update the current theme mode. The MainActivity owns the
 * mutable state at the root of the composition so that a change immediately recomposes
 * the entire UI with the new color scheme.
 */
val LocalThemeController = staticCompositionLocalOf<(String) -> Unit> {
    { /* no-op outside MainActivity */ }
}

/**
 * Razorpay delivers checkout results to the hosting Activity, not to whatever composable
 * started the flow, so [MainActivity] implements the listener and republishes outcomes as
 * events for the चढ़ावा screen to collect.
 *
 * These are UI signals only — entitlement is never granted from them. The screen confirms
 * with the backend (which in turn reconciles with Razorpay) before anything unlocks.
 */
class MainActivity : ComponentActivity(), PaymentResultWithDataListener {

    private val _paymentOutcomes = MutableSharedFlow<PaymentOutcome>(extraBufferCapacity = 4)
    val paymentOutcomes: SharedFlow<PaymentOutcome> = _paymentOutcomes.asSharedFlow()

    override fun onPaymentSuccess(razorpayPaymentId: String?, paymentData: PaymentData?) {
        _paymentOutcomes.tryEmit(PaymentOutcome.Success(razorpayPaymentId))
    }

    override fun onPaymentError(code: Int, description: String?, paymentData: PaymentData?) {
        _paymentOutcomes.tryEmit(PaymentOutcome.Failed(code, description))
    }

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
        val themePrefs = ThemePreferences(this)
        setContent {
            var themeMode by remember { mutableStateOf(themePrefs.themeMode) }
            val setMode: (String) -> Unit = { mode ->
                themePrefs.themeMode = mode
                themeMode = mode
            }
            CompositionLocalProvider(LocalThemeController provides setMode) {
                BhaktiChatTheme(themeMode = themeMode) {
                    BhaktiChatAuthRoot()
                }
            }
        }
    }
}
