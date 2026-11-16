package com.bhaktichat.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.domain.Guides
import com.bhaktichat.app.ui.i18n.LocalAppLanguage
import com.bhaktichat.app.ui.i18n.t
import com.bhaktichat.app.util.notifications.PrePromptTrigger

/**
 * Asked in the guide's voice before Android's own permission dialog, at a moment the user
 * just got something from the app. "Haan" opens the system dialog; "Abhi nahi" doesn't.
 */
@Composable
fun NotificationPrePromptDialog(
    trigger: PrePromptTrigger,
    guideId: String,
    onAccept: () -> Unit,
    onDecline: () -> Unit
) {
    val guide = Guides.byId(guideId) ?: Guides.all.first()
    val guideName = guide.displayName(LocalAppLanguage.current)
    val question = when (trigger) {
        PrePromptTrigger.CHAT -> t("notif_preprompt_chat").format(guideName)
        PrePromptTrigger.AARTI -> t("notif_preprompt_aarti")
    }
    AlertDialog(
        onDismissRequest = onDecline,
        icon = {
            TopFocusedImage(
                imageRes = guide.avatarRes,
                contentDescription = guideName,
                shape = CircleShape,
                modifier = Modifier.size(72.dp)
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = question,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.Center
                )
                Text(
                    text = t("notif_preprompt_note"),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            }
        },
        confirmButton = {
            Button(onClick = onAccept) { Text(t("notif_preprompt_yes")) }
        },
        dismissButton = {
            TextButton(onClick = onDecline) { Text(t("notif_preprompt_no")) }
        }
    )
}
