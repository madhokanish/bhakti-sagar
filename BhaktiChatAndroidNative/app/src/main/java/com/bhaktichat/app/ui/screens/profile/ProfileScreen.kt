package com.bhaktichat.app.ui.screens.profile

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.widget.NumberPicker
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.compose.material.icons.filled.Language
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bhaktichat.app.BhaktiChatApplication
import com.bhaktichat.app.domain.AppLanguage
import com.bhaktichat.app.LocalThemeController
import com.bhaktichat.app.data.auth.AuthApiException
import com.bhaktichat.app.data.auth.MobileUser
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults
import com.bhaktichat.app.ui.i18n.t
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import com.bhaktichat.app.util.DailyReminderScheduler
import com.bhaktichat.app.util.ThemePreferences
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    currentUser: MobileUser,
    onBack: () -> Unit,
    onSignOut: suspend () -> Unit,
    onDeleteAccount: suspend () -> Result<Unit>
) {
    val context = LocalContext.current
    Scaffold(
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0),
        topBar = {
            AppTopBar(
                title = t("settings_title"),
                leftContent = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = t("back"),
                            tint = BhaktiThemeTokens.TextPrimary
                        )
                    }
                },
                centerContent = {
                    Text(
                        text = t("settings_title"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = BhaktiThemeTokens.TextPrimary
                    )
                },
                rightContent = { Spacer(modifier = Modifier.size(42.dp)) }
            )
        }
    ) { innerPadding ->
        val themeController = LocalThemeController.current
        val themePrefs = remember(context) { ThemePreferences(context) }
        var themeMode by remember { mutableStateOf(themePrefs.themeMode) }
        val actionScope = rememberCoroutineScope()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                // verticalScroll BEFORE padding, deliberately. With the padding applied
                // first it insets the scroll viewport instead of the content, so the last
                // card is clipped while a dead band sits below it — the bottom simply can't
                // be reached. Scrolling first makes the padding trailing space inside the
                // scrollable content, which is what the clearance is for.
                .verticalScroll(rememberScrollState())
                .padding(
                    start = 16.dp,
                    end = 16.dp,
                    top = 12.dp,
                    bottom = BhaktiBottomNavBarDefaults.overlayClearance + 24.dp
                ),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            AccountSection(
                currentUser = currentUser,
                onSignOut = { actionScope.launch { onSignOut() } },
                onDeleteAccount = onDeleteAccount
            )

            LanguageSection()

            ThemeSection(
                currentMode = themeMode,
                onSelectMode = { mode ->
                    themeMode = mode
                    themeController(mode)
                }
            )

            NotificationsSection()
        }
    }
}

@Composable
private fun AccountSection(
    currentUser: MobileUser,
    onSignOut: () -> Unit,
    onDeleteAccount: suspend () -> Result<Unit>
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var showDeleteConfirmation by rememberSaveable { mutableStateOf(false) }
    var isDeleting by remember { mutableStateOf(false) }
    var deleteError by remember { mutableStateOf<String?>(null) }
    var subscriptionCancellationRequired by remember { mutableStateOf(false) }
    // Resolved here, in composition — the delete callback below runs in a coroutine, where
    // t() is not available.
    val cancelSubscriptionFirstMessage = t("profile_delete_cancel_sub_first")
    val deleteFailedMessage = t("profile_delete_failed")

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
            Text(
                text = currentUser.name ?: t("profile_member"),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            currentUser.email?.let { email ->
                Text(
                    text = email,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (currentUser.isReviewer) {
                Text(
                    text = "Google Play review account",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                TextButton(onClick = onSignOut) {
                    Text(t("profile_sign_out"))
                }
                TextButton(onClick = { showDeleteConfirmation = true }) {
                    Text(t("profile_delete_account"), color = MaterialTheme.colorScheme.error)
                }
            }
            deleteError?.let { message ->
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
            if (subscriptionCancellationRequired) {
                Text(
                    text = t("profile_manage_membership"),
                    modifier = Modifier.clickable {
                        context.startActivity(
                            Intent(Intent.ACTION_VIEW, Uri.parse("https://bhaktichat.com/manage-subscription"))
                        )
                    },
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }

    if (showDeleteConfirmation) {
        AlertDialog(
            onDismissRequest = { if (!isDeleting) showDeleteConfirmation = false },
            title = { Text(t("profile_delete_confirm_title")) },
            text = {
                Text(t("profile_delete_confirm_body"))
            },
            confirmButton = {
                Button(
                    onClick = {
                        isDeleting = true
                        deleteError = null
                        subscriptionCancellationRequired = false
                        scope.launch {
                            val result = onDeleteAccount()
                            isDeleting = false
                            if (result.isFailure) {
                                val error = result.exceptionOrNull()
                                deleteError = if (
                                    error is AuthApiException &&
                                    error.code == "SUBSCRIPTION_CANCELLATION_REQUIRED"
                                ) {
                                    subscriptionCancellationRequired = true
                                    cancelSubscriptionFirstMessage
                                } else {
                                    deleteFailedMessage
                                }
                                showDeleteConfirmation = false
                            }
                        }
                    },
                    enabled = !isDeleting,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text(if (isDeleting) t("profile_deleting") else t("profile_delete_yes"))
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showDeleteConfirmation = false },
                    enabled = !isDeleting
                ) { Text(t("profile_cancel")) }
            }
        )
    }
}

// ---------------------------------------------------------------------------
// Language section
// ---------------------------------------------------------------------------

/**
 * Interface language, changeable at any time after the first-launch picker.
 *
 * The two option labels are intentionally NOT translated: each is written in its own script
 * so it reads correctly whichever language is active. Someone stuck in the wrong language
 * needs to be able to find their way out, and a label that changes with the very setting
 * you're trying to change is no help.
 */
@Composable
private fun LanguageSection() {
    val container = (LocalContext.current.applicationContext as BhaktiChatApplication).container
    val current by container.languageStore.language.collectAsStateWithLifecycle()

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
                    imageVector = Icons.Filled.Language,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = t("language"),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Text(
                text = t("language_subtitle"),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            val options = listOf(
                AppLanguage.HINDI to "हिंदी",
                AppLanguage.HINGLISH to "English"
            )
            options.forEach { (lang, label) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectable(
                            selected = current == lang,
                            onClick = { container.languageStore.setLanguage(lang) }
                        )
                        .padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = current == lang,
                        onClick = { container.languageStore.setLanguage(lang) }
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
                    text = t("appearance"),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Text(
                text = t("appearance_subtitle"),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            val options = listOf(
                ThemePreferences.MODE_SYSTEM to t("theme_system_default"),
                ThemePreferences.MODE_LIGHT to t("theme_light"),
                ThemePreferences.MODE_DARK to t("theme_dark")
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

    // Enabled defaults to true, but that alone doesn't get the reminder actually posting:
    // Android 13+ still needs an explicit POST_NOTIFICATIONS grant, and even pre-13 the
    // alarm itself only gets registered here (setEnabled(true) alone doesn't schedule it).
    // Runs once per visit rather than gating on a "first launch ever" flag, so it also
    // catches a user who denied the permission earlier and later granted it in system
    // Settings without ever touching this switch.
    LaunchedEffect(Unit) {
        if (!enabled) return@LaunchedEffect
        val needsPermission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        if (needsPermission) {
            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            DailyReminderScheduler.schedule(context, hour, minute)
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
                        text = t("daily_reminder"),
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
                text = t("daily_reminder_subtitle"),
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
                    text = t("reminder_time"),
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
