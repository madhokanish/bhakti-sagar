package com.bhaktichat.app.ui.components.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.ui.screens.aartis.components.AartiRow

@Composable
fun AartiPreviewList(
    featuredAarti: Aarti?,
    otherAartis: List<Aarti>,
    onOpenAarti: (String) -> Unit,
    onOpenAllAartis: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        SectionHeader(
            title = "आरती संग्रह",
            actionLabel = "सभी देखें",
            onActionClick = onOpenAllAartis
        )

        featuredAarti?.let { aarti ->
            Surface(
                shape = RoundedCornerShape(18.dp),
                tonalElevation = 1.dp,
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "विशेष चयन",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(start = 8.dp, top = 6.dp)
                    )
                    AartiRow(
                        aarti = aarti,
                        highlighted = true,
                        onClick = { onOpenAarti(aarti.id) }
                    ) {
                        TextButton(
                            onClick = { onOpenAarti(aarti.id) }
                        ) {
                            Text("चलाएँ")
                        }
                    }
                }
            }
        }

        if (otherAartis.isNotEmpty()) {
            Surface(
                shape = RoundedCornerShape(18.dp),
                tonalElevation = 1.dp,
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    otherAartis.forEachIndexed { index, aarti ->
                        AartiRow(
                            aarti = aarti,
                            onClick = { onOpenAarti(aarti.id) }
                        ) {
                            TextButton(onClick = { onOpenAarti(aarti.id) }) {
                                Text("खोलें")
                            }
                        }
                        if (index < otherAartis.lastIndex) {
                            HorizontalDivider(
                                modifier = Modifier.padding(start = 68.dp),
                                color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.45f)
                            )
                        }
                    }
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "पवित्र शिक्षाओं से प्रेरित, शांत चिंतन के लिए निर्मित।",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
