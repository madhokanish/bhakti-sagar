package com.bhaktichat.app.ui.components.lock

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Lock treatment for content that sits behind चढ़ावा.
 *
 * Draws over whatever it is placed on top of inside a [Box], so the underlying artwork stays
 * partly visible — the point is to show the user what they are missing, not to hide it. A
 * fully obscured tile reads as a broken image and converts worse than a dimmed one.
 *
 * [onClick] should route to the Chadhaava screen with the matching BlockedFeature, so the
 * offer leads with the thing the user just tried to open.
 */
@Composable
fun LockedContentOverlay(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    scrimColor: Color = Color(0xB3120A06)
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(scrimColor)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(Color(0xF2F6C04A)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Lock,
                    contentDescription = null,
                    tint = Color(0xFF3A2410),
                    modifier = Modifier.size(22.dp)
                )
            }
            if (!label.isNullOrBlank()) {
                Text(
                    text = label,
                    color = Color.White,
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 12.dp)
                )
            }
        }
    }
}
