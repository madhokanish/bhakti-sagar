package com.bhaktichat.app.ui.screens.aartis.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.R
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.domain.Deity

@Composable
fun AartiRow(
    aarti: Aarti,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    highlighted: Boolean = false,
    trailingContent: @Composable RowScope.() -> Unit
) {
    val shape = RoundedCornerShape(16.dp)

    Surface(
        shape = shape,
        color = if (highlighted) {
            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
        } else {
            MaterialTheme.colorScheme.background
        },
        tonalElevation = if (highlighted) 1.dp else 0.dp,
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = 76.dp)
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            AartiThumbnail(aarti = aarti)

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Text(
                    text = aarti.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                aarti.subtitle?.let { subtitle ->
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Text(
                    text = metadataLabel(aarti),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.End,
                content = trailingContent
            )
        }
    }
}

@Composable
private fun AartiThumbnail(aarti: Aarti) {
    val imageRes = when (aarti.deity) {
        Deity.GANESH -> R.drawable.ic_ganesh_top_aarti
        Deity.SHIV -> R.drawable.ic_shiv_top_aarti
        Deity.LAKSHMI -> R.drawable.ic_lakshmi_top_aarti
        else -> R.drawable.ic_default_aarti
    }

    Image(
        painter = painterResource(id = imageRes),
        contentDescription = "${aarti.title} icon",
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
    )
}

private fun metadataLabel(aarti: Aarti): String {
    val labels = buildList {
        aarti.durationMinutes?.let { add("$it min") }

        when {
            aarti.tags.any { it.equals("morning", ignoreCase = true) } -> add("Morning")
            aarti.tags.any { it.equals("evening", ignoreCase = true) } -> add("Evening")
        }

        aarti.popularityCount?.let { count ->
            add(
                when {
                    count >= 1000 -> "${count / 1000}k plays"
                    else -> "$count plays"
                }
            )
        }
    }

    return labels.ifEmpty { listOf("Calm daily recitation") }.joinToString(" • ")
}
