package com.bhaktichat.app.ui.screens.aartis.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

data class AartiFilter(
    val key: String,
    val label: String
)

@Composable
fun FilterChips(
    filters: List<AartiFilter>,
    selectedKey: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyRow(
        modifier = modifier,
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(filters, key = { it.key }) { filter ->
            FilterChip(
                selected = filter.key == selectedKey,
                onClick = { onSelect(filter.key) },
                label = {
                    Text(
                        text = filter.label,
                        style = MaterialTheme.typography.labelLarge
                    )
                }
            )
        }
    }
}
