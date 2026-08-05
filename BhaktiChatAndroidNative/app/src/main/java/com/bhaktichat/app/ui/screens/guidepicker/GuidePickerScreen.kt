package com.bhaktichat.app.ui.screens.guidepicker

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.domain.Guide
import com.bhaktichat.app.domain.Guides
import com.bhaktichat.app.ui.components.GuideAvatar
import com.bhaktichat.app.ui.i18n.t

@Composable
fun GuidePickerScreen(onGuideClick: (String) -> Unit) {
    val guides = remember { Guides.all }
    GuideListScreen(
        guides = guides,
        onGuideClick = onGuideClick
    )
}

@Composable
private fun GuideListScreen(
    guides: List<Guide>,
    onGuideClick: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(top = 8.dp, bottom = 8.dp)
    ) {
        item("header") {
            Text(
                text = t("guide_picker_title"),
                style = MaterialTheme.typography.headlineSmall,
                modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 8.dp)
            )
            Text(
                text = t("guide_picker_subtitle"),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 8.dp)
            )
        }

        itemsIndexed(guides, key = { _, guide -> guide.id }) { index, guide ->
            GuideRowItem(
                guide = guide,
                onClick = { onGuideClick(guide.id) }
            )

            if (index < guides.lastIndex) {
                HorizontalDivider(
                    modifier = Modifier.padding(start = 92.dp),
                    thickness = 0.6.dp,
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.55f)
                )
            }
        }

        if (guides.size <= 3) {
            item("footer") {
                Text(
                    text = t("guide_picker_footer"),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 10.dp, bottom = 4.dp)
                )
            }
        }
    }
}

@Composable
private fun GuideRowItem(
    guide: Guide,
    onClick: () -> Unit
) {
    val haptics = LocalHapticFeedback.current
    val guideName = t("guide_title_${guide.id}")

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(88.dp)
            .clickable {
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                onClick()
            }
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(60.dp)) {
            GuideAvatar(
                avatarRes = guide.avatarRes,
                contentDescription = t("guide_picker_avatar_content_description").format(guideName),
                sizeDp = 60
            )
            Surface(
                shape = CircleShape,
                color = Color(0xFF22C55E),
                tonalElevation = 0.dp,
                shadowElevation = 0.dp,
                modifier = Modifier
                    .size(12.dp)
                    .align(Alignment.BottomEnd)
            ) {}
        }

        Row(
            modifier = Modifier
                .weight(1f)
                .padding(start = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            androidx.compose.foundation.layout.Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = guideName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = t(previewTextKey(guide.id)),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Box(
                modifier = Modifier
                    .size(44.dp)
                    .padding(start = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = t("guide_picker_chat"),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

private fun previewTextKey(guideId: String): String {
    return when (guideId) {
        "krishna" -> "guide_preview_krishna"
        "lakshmi" -> "guide_preview_lakshmi"
        "shani" -> "guide_preview_shani"
        "shiv" -> "guide_preview_shiv"
        "hanuman" -> "guide_preview_hanuman"
        else -> "guide_picker_subtitle"
    }
}
