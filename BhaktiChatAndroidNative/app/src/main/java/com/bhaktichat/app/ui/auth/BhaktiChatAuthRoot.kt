package com.bhaktichat.app.ui.auth

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
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bhaktichat.app.BhaktiChatApplication
import com.bhaktichat.app.R
import com.bhaktichat.app.data.auth.AuthState
import com.bhaktichat.app.ui.components.ads.findActivity
import com.bhaktichat.app.ui.navigation.BhaktiChatApp
import com.bhaktichat.app.util.Analytics
import kotlinx.coroutines.launch

@Composable
fun BhaktiChatAuthRoot() {
    val context = LocalContext.current
    val application = context.applicationContext as BhaktiChatApplication
    val repository = application.authRepository
    val state by repository.state.collectAsStateWithLifecycle()
    val activity = context.findActivity()
    val actionScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        repository.restoreSession()
    }

    when (val current = state) {
        AuthState.Checking -> AuthLoadingScreen("Checking your account…")
        is AuthState.SigningIn -> SignInScreen(
            isLoading = true,
            loadingMessage = current.message,
            errorMessage = null,
            onGoogle = {},
            onAccess = { _, _ -> }
        )
        is AuthState.SignedOut -> {
            LaunchedEffect(Unit) { Analytics.screen("sign_in") }
            SignInScreen(
                isLoading = false,
                loadingMessage = null,
                errorMessage = current.message,
                onGoogle = {
                    if (activity != null) {
                        actionScope.launch { repository.signInWithGoogle(activity, explicitButton = true) }
                    }
                },
                onAccess = { login, password ->
                    actionScope.launch { repository.signInWithAccess(login, password) }
                }
            )
        }
        is AuthState.Authenticated -> {
            val container = remember(current.session.user.id) {
                application.activateUser(current.session.user.id)
            }
            BhaktiChatApp(
                appContainer = container,
                currentUser = current.session.user,
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

@Composable
private fun SignInScreen(
    isLoading: Boolean,
    loadingMessage: String?,
    errorMessage: String?,
    onGoogle: () -> Unit,
    onAccess: (String, String) -> Unit
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
            Spacer(Modifier.height(44.dp))

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

            // DEBUG ONLY — pre-auth entry point for the UPI diagnostic. Checkout needs no
            // user session (it uses a fixed order), so exposing it here lets the payment
            // sheet be tested on an emulator without signing in. Never in release.
            if (com.bhaktichat.app.BuildConfig.DEBUG) {
                val diagActivity = LocalContext.current.findActivity()
                TextButton(
                    onClick = {
                        val host = diagActivity ?: return@TextButton
                        com.bhaktichat.app.data.subscription.launchOrderDiagnostic(
                            activity = host,
                            keyId = com.bhaktichat.app.BuildConfig.RAZORPAY_KEY_ID,
                            orderId = com.bhaktichat.app.BuildConfig.RAZORPAY_DIAGNOSTIC_ORDER_ID,
                            prefillEmail = null
                        )
                    }
                ) {
                    Text(
                        text = "DEBUG: UPI checkout test",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.error
                    )
                }
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
