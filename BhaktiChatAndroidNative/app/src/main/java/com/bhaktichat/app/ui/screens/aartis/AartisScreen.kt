package com.bhaktichat.app.ui.screens.aartis

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bhaktichat.app.data.local.SavedAartisStore
import com.bhaktichat.app.data.repo.AartiRepository
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.ui.screens.aartis.components.AartiFilter
import com.bhaktichat.app.ui.screens.aartis.components.AartiRow
import com.bhaktichat.app.ui.screens.aartis.components.FilterChips

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AartisScreen(
    repository: AartiRepository,
    savedAartisStore: SavedAartisStore,
    onOpenDetail: (String) -> Unit
) {
    var query by rememberSaveable { mutableStateOf("") }
    var selectedFilter by rememberSaveable { mutableStateOf("all") }
    var aartis by remember { mutableStateOf(emptyList<Aarti>()) }
    val savedIds by savedAartisStore.savedIds.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        aartis = repository.loadAartis()
    }

    val filtered = remember(aartis, query, selectedFilter) {
        aartis
            .filter { aarti ->
                matchesFilter(aarti, selectedFilter) && matchesQuery(aarti, query)
            }
            .sortedWith(
                compareByDescending<Aarti> { it.isTop }
                    .thenByDescending { it.popularityCount ?: 0L }
                    .thenBy { it.title }
            )
    }
    val featuredAarti = filtered.firstOrNull()
        ?.takeIf { query.isBlank() && selectedFilter == "all" }
    val remainingAartis = if (featuredAarti == null) filtered else filtered.drop(1)

    Column(modifier = androidx.compose.ui.Modifier.fillMaxSize()) {
        TopAppBar(title = { Text("Aartis") })

        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            singleLine = true,
            placeholder = { Text("Search aartis") },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Outlined.Search,
                    contentDescription = "Search aartis"
                )
            },
            modifier = androidx.compose.ui.Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        )

        FilterChips(
            filters = aartiFilters,
            selectedKey = selectedFilter,
            onSelect = { selectedFilter = it }
        )

        LazyColumn(
            modifier = androidx.compose.ui.Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            featuredAarti?.let { aarti ->
                item("featured-aarti") {
                    Surface(
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp),
                        tonalElevation = 1.dp,
                        color = MaterialTheme.colorScheme.surface,
                        modifier = androidx.compose.ui.Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = androidx.compose.ui.Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = "Today’s aarti",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = androidx.compose.ui.Modifier.padding(start = 8.dp, top = 6.dp, bottom = 4.dp)
                            )
                            AartiRow(
                                aarti = aarti,
                                highlighted = true,
                                onClick = { onOpenDetail(aarti.id) }
                            ) {
                                IconButton(
                                    onClick = { savedAartisStore.toggleSaved(aarti.id) }
                                ) {
                                    Icon(
                                        imageVector = if (aarti.id in savedIds) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                                        contentDescription = if (aarti.id in savedIds) {
                                            "Remove ${aarti.title} from saved"
                                        } else {
                                            "Save ${aarti.title}"
                                        },
                                        tint = if (aarti.id in savedIds) {
                                            MaterialTheme.colorScheme.primary
                                        } else {
                                            MaterialTheme.colorScheme.onSurfaceVariant
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            if (remainingAartis.isEmpty()) {
                item("empty-state") {
                    Text(
                        text = "No aartis match this search right now.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = androidx.compose.ui.Modifier.padding(vertical = 16.dp)
                    )
                }
            } else {
                item("list-shell") {
                    Surface(
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp),
                        tonalElevation = 1.dp,
                        color = MaterialTheme.colorScheme.surface,
                        modifier = androidx.compose.ui.Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = androidx.compose.ui.Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            remainingAartis.forEachIndexed { index, aarti ->
                                AartiRow(
                                    aarti = aarti,
                                    onClick = { onOpenDetail(aarti.id) }
                                ) {
                                    IconButton(
                                        onClick = { savedAartisStore.toggleSaved(aarti.id) }
                                    ) {
                                        Icon(
                                            imageVector = if (aarti.id in savedIds) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                                            contentDescription = if (aarti.id in savedIds) {
                                                "Remove ${aarti.title} from saved"
                                            } else {
                                                "Save ${aarti.title}"
                                            },
                                            tint = if (aarti.id in savedIds) {
                                                MaterialTheme.colorScheme.primary
                                            } else {
                                                MaterialTheme.colorScheme.onSurfaceVariant
                                            }
                                        )
                                    }
                                }
                                if (index < remainingAartis.lastIndex) {
                                    HorizontalDivider(
                                        modifier = androidx.compose.ui.Modifier.padding(start = 68.dp),
                                        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.45f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private val aartiFilters = listOf(
    AartiFilter("all", "All"),
    AartiFilter("popular", "Popular"),
    AartiFilter("morning", "Morning"),
    AartiFilter("evening", "Evening"),
    AartiFilter("krishna", "Krishna"),
    AartiFilter("ganesh", "Ganesh"),
    AartiFilter("shiv", "Shiv"),
    AartiFilter("devi", "Devi"),
    AartiFilter("vrat", "Vrat")
)

private fun matchesFilter(aarti: Aarti, filter: String): Boolean = when (filter) {
    "all" -> true
    "popular" -> aarti.isTop
    else -> aarti.tags.any { it.equals(filter, ignoreCase = true) }
}

private fun matchesQuery(aarti: Aarti, query: String): Boolean {
    if (query.isBlank()) return true
    val normalized = query.trim().lowercase()
    return aarti.title.lowercase().contains(normalized) ||
        aarti.titleHi.lowercase().contains(normalized) ||
        aarti.deity.name.lowercase().contains(normalized) ||
        aarti.tags.any { it.contains(normalized, ignoreCase = true) }
}
