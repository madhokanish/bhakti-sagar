package com.bhaktichat.app.ui.auth

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bhaktichat.app.BhaktiChatApplication
import com.bhaktichat.app.R
import com.bhaktichat.app.data.auth.AuthState
import com.bhaktichat.app.ui.components.ads.findActivity
import com.bhaktichat.app.ui.i18n.str
import com.bhaktichat.app.ui.navigation.BhaktiChatApp
import com.bhaktichat.app.util.Analytics
import kotlinx.coroutines.launch

/**
 * Decides whether the app opens into itself or into the sign-in screen.
 *
 * It opens into itself. [AuthState.Guest] is the resting state for everyone without an
 * account, and it renders the full app — the mandatory sign-in wall that used to sit here
 * was where installs were being lost. Sign-in is now reached only on request, from चढ़ावा
 * checkout (which genuinely needs a server identity to bill) or from Settings.
 */
@Composable
fun BhaktiChatAuthRoot() {
    val context = LocalContext.current
    val application = context.applicationContext as BhaktiChatApplication
    val repository = application.authRepository
    val languageStore = application.languageStore
    val state by repository.state.collectAsStateWithLifecycle()
    val activity = context.findActivity()
    val actionScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        repository.restoreSession()
    }

    when (val current = state) {
        AuthState.Checking -> AuthLoadingScreen(languageStore.str("auth_loading"))

        AuthState.Guest -> {
            val container = remember { application.activateGuest() }
            BhaktiChatApp(
                appContainer = container,
                currentUser = null,
                onRequestSignIn = { forCheckout -> repository.requestSignIn(forCheckout) },
                onSignOut = { application.signOut() },
                onDeleteAccount = { application.deleteAccountAndLocalData() }
            )
        }

        is AuthState.SigningIn -> SignInScreen(
            isLoading = true,
            loadingMessage = current.message,
            errorMessage = null,
            reason = languageStore.str("auth_sign_in_reason"),
            dismissLabel = languageStore.str("auth_not_now"),
            onGoogle = {},
            onAccess = { _, _ -> },
            onDismiss = null
        )

        is AuthState.SignedOut -> {
            LaunchedEffect(Unit) { Analytics.screen("sign_in") }
            // Backing out returns to browsing, never to a blank screen — this is a step
            // inside checkout now, not the front door.
            BackHandler { repository.dismissSignIn() }
            SignInScreen(
                isLoading = false,
                loadingMessage = null,
                errorMessage = current.message,
                reason = languageStore.str("auth_sign_in_reason"),
                dismissLabel = languageStore.str("auth_not_now"),
                onGoogle = {
                    val host = activity ?: return@SignInScreen
                    actionScope.launch { repository.signInWithGoogle(host, explicitButton = true) }
                },
                onAccess = { login, password ->
                    actionScope.launch { repository.signInWithAccess(login, password) }
                },
                onDismiss = { repository.dismissSignIn() }
            )
        }

        is AuthState.Authenticated -> {
            val container = remember(current.session.user.id) {
                application.activateUser(current.session.user.id)
            }
            BhaktiChatApp(
                appContainer = container,
                currentUser = current.session.user,
                onRequestSignIn = { /* already signed in */ },
                // If this session started with a tap on subscribe, the app picks checkout
                // back up on its own rather than dropping the user on Home.
                consumePendingCheckout = repository::consumePendingCheckout,
                onSignOut = { application.signOut() },
                onDeleteAccount = { application.deleteAccountAndLocalData() }
            )
        }
    }
}

@Composable
private fun AuthLoadingScreen(message: String) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(16.dp))
            Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

/**
 * Google is the only sign-in method. Phone OTP was removed: Firebase billed for every SMS,
 * and with the app no longer gated the handful of people who reach this screen are here to
 * pay — a Google account they already have on the device is one tap, and costs nothing.
 * The email/username path below it remains for Play reviewers and managed accounts.
 */
@Composable
private fun SignInScreen(
    isLoading: Boolean,
    loadingMessage: String?,
    errorMessage: String?,
    reason: String,
    dismissLabel: String,
    onGoogle: () -> Unit,
    onAccess: (String, String) -> Unit,
    onDismiss: (() -> Unit)?
) {
    var showAccessDialog by rememberSaveable { mutableStateOf(false) }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Image(
                painter = painterResource(R.drawable.bhaktichat_logo),
                contentDescription = "BhaktiChat",
                modifier = Modifier.size(112.dp)
            )
            Spacer(Modifier.height(16.dp))
            Text(
                text = "BhaktiChat",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = reason,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(32.dp))

            Button(
                onClick = onGoogle,
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .border(1.dp, Color(0xFF747775), RoundedCornerShape(12.dp)),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = Color(0xFF1F1F1F),
                    disabledContainerColor = Color(0xFFF2F2F2),
                    disabledContentColor = Color(0xFF6F6F6F)
                )
            ) {
                Icon(
                    painter = painterResource(R.drawable.ic_google_g),
                    contentDescription = null,
                    tint = Color.Unspecified,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(Modifier.size(10.dp))
                Text("Continue with Google", fontWeight = FontWeight.Medium)
            }

            Spacer(Modifier.height(10.dp))
            TextButton(
                onClick = { showAccessDialog = true },
                enabled = !isLoading
            ) {
                Text(
                    text = "Enter email or username",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (isLoading) {
                Spacer(Modifier.height(18.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    Spacer(Modifier.size(10.dp))
                    Text(
                        loadingMessage.orEmpty(),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else if (!errorMessage.isNullOrBlank()) {
                Spacer(Modifier.height(14.dp))
                Text(
                    errorMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }

            if (onDismiss != null) {
                Spacer(Modifier.height(24.dp))
                TextButton(onClick = onDismiss, enabled = !isLoading) {
                    Text(
                        text = dismissLabel,
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }

    if (showAccessDialog) {
        AccessSignInDialog(
            onDismiss = { showAccessDialog = false },
            onSubmit = { login, password ->
                showAccessDialog = false
                onAccess(login, password)
            }
        )
    }
}

@Composable
private fun AccessSignInDialog(
    onDismiss: () -> Unit,
    onSubmit: (String, String) -> Unit
) {
    var login by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Sign in") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = login,
                    onValueChange = { login = it },
                    label = { Text("Email or username") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(autoCorrectEnabled = false),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSubmit(login, password) },
                enabled = login.isNotBlank() && password.isNotBlank()
            ) { Text("Sign in") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
