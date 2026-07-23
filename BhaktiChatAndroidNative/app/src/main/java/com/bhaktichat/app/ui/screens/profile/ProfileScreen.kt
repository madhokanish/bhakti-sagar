package com.bhaktichat.app.ui.screens.profile

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.os.Build
import android.widget.NumberPicker
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.bhaktichat.app.BhaktiChatApplication
import com.bhaktichat.app.BuildConfig
import com.bhaktichat.app.LocalThemeController
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import com.bhaktichat.app.util.AuthState
import com.bhaktichat.app.util.DailyReminderScheduler
import com.bhaktichat.app.util.ThemePreferences
import com.bhaktichat.app.util.decodeSampledBitmapFromBytes
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    authState: AuthState,
    onBack: () -> Unit,
    onSignIn: (name: String, email: String, photoUrl: String) -> Unit,
    onSignOut: () -> Unit,
    onSignInWithApple: () -> Unit = {}
) {
    val context = LocalContext.current
    val googleSignInClient = rememberGoogleSignInClient(context)
    var error by remember { mutableStateOf<String?>(null) }
    var isSigningIn by remember { mutableStateOf(false) }
    var isSigningOut by remember { mutableStateOf(false) }
    var showLogoutConfirmation by rememberSaveable { mutableStateOf(false) }

    val signInLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        isSigningIn = false
        if (result.resultCode != Activity.RESULT_OK) {
            error = "Google sign in was canceled."
            return@rememberLauncherForActivityResult
        }

        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        val account = runCatching {
            task.getResult(ApiException::class.java)
        }.getOrElse {
            error = "Google sign in failed. Check your Google Cloud OAuth setup."
            return@rememberLauncherForActivityResult
        }

        val name = account.displayName?.trim().orEmpty().ifBlank { "BhaktiChat User" }
        val email = account.email?.trim().orEmpty()
        if (email.isBlank()) {
            error = "Google account email was not available."
            return@rememberLauncherForActivityResult
        }

        error = null
        onSignIn(name, email, account.photoUrl?.toString().orEmpty())
        onBack()
    }

    if (showLogoutConfirmation) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirmation = false },
            title = { Text("Log out of Bhakti Chat?") },
            text = { Text("You can sign back in at any time.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutConfirmation = false
                        isSigningOut = true
                        googleSignInClient.signOut().addOnCompleteListener {
                            isSigningOut = false
                            onSignOut()
                            onBack()
                        }
                    }
                ) {
                    Text(
                        text = "Log out",
                        color = BhaktiThemeTokens.AccentError,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutConfirmation = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Scaffold(
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0),
        topBar = {
            AppTopBar(
                title = if (authState.isLoggedIn) "Account" else "",
                leftContent = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = BhaktiThemeTokens.TextPrimary
                        )
                    }
                },
                centerContent = {
                    // When signed out the sign-in hero acts as the page title,
                    // so we suppress the centered text. When signed in we keep
                    // the "Account" header so the user knows where they are.
                    if (authState.isLoggedIn) {
                        Text(
                            text = "Account",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = BhaktiThemeTokens.TextPrimary
                        )
                    } else {
                        Spacer(modifier = Modifier.height(1.dp))
                    }
                },
                rightContent = { Spacer(modifier = Modifier.size(42.dp)) }
            )
        }
    ) { innerPadding ->
        val themeController = LocalThemeController.current
        val themePrefs = remember(context) { ThemePreferences(context) }
        var themeMode by remember { mutableStateOf(themePrefs.themeMode) }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(
                    start = 16.dp,
                    end = 16.dp,
                    top = 12.dp,
                    bottom = BhaktiBottomNavBarDefaults.overlayClearance + 24.dp
                )
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (authState.isLoggedIn) {
                SignedInAccountCard(
                    authState = authState,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onBack,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Back to app")
                    }
                    Button(
                        onClick = { showLogoutConfirmation = true },
                        enabled = !isSigningOut,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BhaktiThemeTokens.AccentError.copy(alpha = 0.85f),
                            contentColor = Color.White
                        )
                    ) {
                        if (isSigningOut) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = Color.White
                            )
                        } else {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Logout,
                                contentDescription = "Log out"
                            )
                            Text(
                                text = "Log out",
                                modifier = Modifier.padding(start = 8.dp),
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }

                // Theme + Notifications only render when signed in — keeps the
                // signed-out hero focused on the OAuth choice.
                ThemeSection(
                    currentMode = themeMode,
                    onSelectMode = { mode ->
                        themeMode = mode
                        themeController(mode)
                    }
                )

                NotificationsSection()
            } else {
                SignedOutContent(
                    error = error,
                    isGoogleSigningIn = isSigningIn,
                    onSignInWithApple = onSignInWithApple,
                    onSignInWithGoogle = {
                        val activity = context.findActivity()
                        if (activity == null) {
                            error = "Unable to open Google sign in on this device."
                            return@SignedOutContent
                        }
                        error = null
                        isSigningIn = true
                        signInLauncher.launch(googleSignInClient.signInIntent)
                    }
                )
            }
        }
    }
}

/**
 * Industry-standard sign-in layout (mirrors the iOS `signedOutContent`):
 *   - Centered brand medallion + welcome copy
 *   - OAuth buttons stacked, Apple first (per Apple HIG)
 *   - Trust note, inline error slot, terms footer
 */
@Composable
private fun SignedOutContent(
    error: String?,
    isGoogleSigningIn: Boolean,
    onSignInWithApple: () -> Unit,
    onSignInWithGoogle: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(28.dp))

        BhaktiBrandMedallion()

        Spacer(modifier = Modifier.height(36.dp))

        Text(
            text = "Welcome to BhaktiChat",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = BhaktiThemeTokens.TextPrimary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Sign in to save your conversations, sync across devices, and keep your guides close.",
            fontSize = 15.sp,
            color = BhaktiThemeTokens.TextSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 32.dp)
        )

        Spacer(modifier = Modifier.height(36.dp))

        // OAuth buttons — Apple first (HIG: "If you offer third-party sign-in
        // services, Sign in with Apple must also appear").
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            AppleSignInButton(onClick = onSignInWithApple)

            GoogleSignInButton(
                enabled = !isGoogleSigningIn,
                isLoading = isGoogleSigningIn,
                onClick = onSignInWithGoogle
            )
        }

        Spacer(modifier = Modifier.height(18.dp))

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.Lock,
                contentDescription = null,
                tint = BhaktiThemeTokens.AccentPrimary,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = "Secure sign in. Your account never leaves this device.",
                style = MaterialTheme.typography.bodySmall,
                color = BhaktiThemeTokens.TextSecondary
            )
        }

        if (!error.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = error,
                style = MaterialTheme.typography.bodySmall,
                color = BhaktiThemeTokens.AccentError,
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        TermsFooter()
    }
}

/**
 * Centered brand mark for the sign-in hero. Mirrors the iOS
 * `BhaktiBrandMedallion`: two soft pulsing concentric ring circles, a warm
 * radial halo, and a saffron disc with the Devanagari Om glyph.
 */
@Composable
private fun BhaktiBrandMedallion() {
    val transition = rememberInfiniteTransition(label = "medallion-pulse")

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(170.dp),
        contentAlignment = Alignment.Center
    ) {
        // Two soft pulsing concentric rings — staggered phase so they breathe
        // gently rather than in lockstep.
        listOf(0, 1).forEach { index ->
            val baseSize = 132 + index * 28
            val ringScale by transition.animateFloat(
                initialValue = 1.0f,
                targetValue = 1.04f,
                animationSpec = infiniteRepeatable(
                    animation = tween(
                        durationMillis = 2600,
                        delayMillis = index * 300,
                        easing = FastOutSlowInEasing
                    ),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "ring-scale-$index"
            )
            val ringAlpha by transition.animateFloat(
                initialValue = 1.0f,
                targetValue = 0.85f,
                animationSpec = infiniteRepeatable(
                    animation = tween(
                        durationMillis = 2600,
                        delayMillis = index * 300,
                        easing = FastOutSlowInEasing
                    ),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "ring-alpha-$index"
            )
            Box(
                modifier = Modifier
                    .size(baseSize.dp)
                    .scale(ringScale)
                    .border(
                        width = 1.dp,
                        color = BhaktiThemeTokens.AccentPrimary
                            .copy(alpha = (0.18f - index * 0.06f) * ringAlpha),
                        shape = CircleShape
                    )
            )
        }

        // Warm halo behind the disc
        Box(
            modifier = Modifier
                .size(170.dp)
                .blur(6.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            BhaktiThemeTokens.AccentPrimary.copy(alpha = 0.28f),
                            BhaktiThemeTokens.AccentPrimary.copy(alpha = 0.04f),
                            Color.Transparent
                        )
                    ),
                    shape = CircleShape
                )
        )

        // Saffron disc with subtle inner ring
        Box(
            modifier = Modifier
                .size(104.dp)
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            BhaktiThemeTokens.AccentGradientStart,
                            BhaktiThemeTokens.AccentGradientEnd
                        )
                    ),
                    shape = CircleShape
                )
                .border(
                    width = 1.dp,
                    color = Color.White.copy(alpha = 0.35f),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "ॐ",
                fontSize = 64.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White
            )
        }
    }
}

@Composable
private fun TermsFooter() {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "By continuing you agree to our",
            fontSize = 11.sp,
            color = BhaktiThemeTokens.TextTertiary
        )
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(
                onClick = {},
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp)
            ) {
                Text(
                    text = "Terms of Service",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BhaktiThemeTokens.AccentPrimary
                )
            }
            Text(
                text = "·",
                fontSize = 11.sp,
                color = BhaktiThemeTokens.TextTertiary
            )
            TextButton(
                onClick = {},
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp)
            ) {
                Text(
                    text = "Privacy Policy",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BhaktiThemeTokens.AccentPrimary
                )
            }
        }
    }
}

@Composable
private fun AppleSignInButton(onClick: () -> Unit) {
    // TODO(apple-oauth): Real Apple Sign-In on Android uses Apple's web OAuth flow
    // (Sign in with Apple JS). Recommended approach: open Chrome Custom Tabs to
    // https://appleid.apple.com/auth/authorize?... then handle the redirect URL
    // in the activity, exchange the code server-side for an Apple identity token.
    // Until then this callback is wired to the UI but the navigation/web flow is
    // not implemented.
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(54.dp),
        shape = RoundedCornerShape(18.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Black,
            contentColor = Color.White
        )
    ) {
        // Icons.Filled.Apple is in material-icons-extended which the project
        // does not depend on, so we use AutoMirrored.Login as a graceful
        // visual fallback (a small "login" glyph on the black pill).
        Icon(
            imageVector = Icons.AutoMirrored.Filled.Login,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(20.dp)
        )
        Text(
            text = "Continue with Apple",
            modifier = Modifier.padding(start = 10.dp),
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            color = Color.White
        )
    }
}

@Composable
private fun GoogleSignInButton(
    enabled: Boolean,
    isLoading: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier
            .fillMaxWidth()
            .height(54.dp)
            .border(
                width = 1.dp,
                color = Color.Black.copy(alpha = 0.08f),
                shape = RoundedCornerShape(18.dp)
            ),
        shape = RoundedCornerShape(18.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.White,
            contentColor = Color(0xFF1F1F1F),
            disabledContainerColor = Color(0xFFF2F2F2),
            disabledContentColor = Color(0xFF5F6368)
        )
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = Color(0xFF1A73E8)
            )
        } else {
            GoogleMark()
            Text(
                text = "Continue with Google",
                modifier = Modifier.padding(start = 10.dp),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun GoogleMark() {
    Box(
        modifier = Modifier.size(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "G",
            style = MaterialTheme.typography.titleMedium,
            color = Color(0xFF1A73E8),
            fontWeight = FontWeight.Bold
        )
        Row(
            modifier = Modifier
                .matchParentSize()
                .padding(1.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Spacer(
                modifier = Modifier
                    .width(3.dp)
                    .height(14.dp)
                    .background(Color(0xFF34A853), CircleShape)
            )
            Spacer(
                modifier = Modifier
                    .width(3.dp)
                    .height(14.dp)
                    .background(Color(0xFFEA4335), CircleShape)
            )
        }
    }
}

@Composable
private fun SignedInAccountCard(
    authState: AuthState,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            ProfileAvatar(
                photoUrl = authState.photoUrl,
                fallbackLetter = authState.name.firstOrNull()?.toString()?.uppercase() ?: "B"
            )

            Text(
                text = authState.name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold
            )

            Text(
                text = authState.email,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            HorizontalDivider()

            Text(
                text = "Signed in with Google",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

/**
 * Circular profile avatar with accent-tinted ring. Loads `photoUrl` on a
 * background thread via [HttpURLConnection] so we don't need a third-party
 * image-loading dependency (the project doesn't ship Coil or Glide). Falls
 * back to the initials placeholder while loading or on failure.
 */
@Composable
private fun ProfileAvatar(
    photoUrl: String,
    fallbackLetter: String
) {
    val bitmap by produceState<ImageBitmap?>(initialValue = null, key1 = photoUrl) {
        if (photoUrl.isBlank()) {
            value = null
            return@produceState
        }
        value = withContext(Dispatchers.IO) {
            runCatching {
                val connection = (URL(photoUrl).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 10_000
                    readTimeout = 10_000
                    instanceFollowRedirects = true
                }
                val bytes = connection.inputStream.use { it.readBytes() }
                // Downsampled decode, not full-resolution — this is just a small circular
                // avatar, and Sign-In providers can return arbitrarily large profile photos.
                decodeSampledBitmapFromBytes(bytes, maxDimensionPx = 256)?.asImageBitmap()
            }.getOrNull()
        }
    }

    Box(
        modifier = Modifier
            .size(72.dp)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.primaryContainer)
            .border(
                width = 1.dp,
                color = BhaktiThemeTokens.AccentPrimary.copy(alpha = 0.25f),
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        val loaded = bitmap
        if (loaded != null) {
            Image(
                bitmap = loaded,
                contentDescription = "Profile photo",
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        } else {
            Text(
                text = fallbackLetter.ifBlank { "B" },
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun rememberGoogleSignInClient(context: Context): GoogleSignInClient {
    return remember(context) {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .build()
        GoogleSignIn.getClient(context, gso)
    }
}

private tailrec fun Context.findActivity(): Activity? {
    return when (this) {
        is Activity -> this
        is ContextWrapper -> baseContext.findActivity()
        else -> null
    }
}

// ---------------------------------------------------------------------------
// Theme section (Feature 1)
// ---------------------------------------------------------------------------

@Composable
private fun ThemeSection(
    currentMode: String,
    onSelectMode: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.Palette,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Appearance",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Text(
                text = "Choose how BhaktiChat looks on this device.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            val options = listOf(
                ThemePreferences.MODE_SYSTEM to "System default",
                ThemePreferences.MODE_LIGHT to "Light",
                ThemePreferences.MODE_DARK to "Dark"
            )
            options.forEach { (mode, label) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectable(
                            selected = currentMode == mode,
                            onClick = { onSelectMode(mode) }
                        )
                        .padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = currentMode == mode,
                        onClick = { onSelectMode(mode) }
                    )
                    Text(
                        text = label,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Notifications section (Feature 6)
// ---------------------------------------------------------------------------

@Composable
private fun NotificationsSection() {
    val context = LocalContext.current
    var enabled by remember { mutableStateOf(DailyReminderScheduler.isEnabled(context)) }
    var hour by remember { mutableStateOf(DailyReminderScheduler.reminderHour(context)) }
    var minute by remember { mutableStateOf(DailyReminderScheduler.reminderMinute(context)) }

    val notifPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            DailyReminderScheduler.setEnabled(context, true)
            DailyReminderScheduler.schedule(context, hour, minute)
            enabled = true
        } else {
            enabled = false
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Notifications,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Daily reminder",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Switch(
                    checked = enabled,
                    onCheckedChange = { wantEnabled ->
                        if (wantEnabled) {
                            val needsPermission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                                ContextCompat.checkSelfPermission(
                                    context,
                                    Manifest.permission.POST_NOTIFICATIONS
                                ) != PackageManager.PERMISSION_GRANTED
                            if (needsPermission) {
                                notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                            } else {
                                DailyReminderScheduler.setEnabled(context, true)
                                DailyReminderScheduler.schedule(context, hour, minute)
                                enabled = true
                            }
                        } else {
                            DailyReminderScheduler.setEnabled(context, false)
                            DailyReminderScheduler.cancel(context)
                            enabled = false
                        }
                    }
                )
            }
            Text(
                text = "Pick a time and BhaktiChat will gently nudge you each day.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // Hour + minute pickers using NumberPicker (lightweight, no extra deps).
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Reminder time",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.weight(1f)
                )
                AndroidView(
                    factory = { ctx ->
                        NumberPicker(ctx).apply {
                            minValue = 0
                            maxValue = 23
                            value = hour
                            setFormatter { String.format("%02d", it) }
                            setOnValueChangedListener { _, _, new ->
                                hour = new
                                DailyReminderScheduler.setReminderTime(context, new, minute)
                                if (enabled) DailyReminderScheduler.schedule(context, new, minute)
                            }
                        }
                    }
                )
                Text(":")
                AndroidView(
                    factory = { ctx ->
                        NumberPicker(ctx).apply {
                            minValue = 0
                            maxValue = 59
                            value = minute
                            setFormatter { String.format("%02d", it) }
                            setOnValueChangedListener { _, _, new ->
                                minute = new
                                DailyReminderScheduler.setReminderTime(context, hour, new)
                                if (enabled) DailyReminderScheduler.schedule(context, hour, new)
                            }
                        }
                    }
                )
            }
        }
    }
}
