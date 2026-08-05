package com.bhaktichat.app.ui.screens.divineimage

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bhaktichat.app.domain.DivineCreation
import com.bhaktichat.app.domain.DivineMode
import com.bhaktichat.app.domain.DivineTemplate
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.i18n.LocalAppLanguage
import com.bhaktichat.app.ui.i18n.t

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DivineImageScreen(
    uiState: DivineImageHomeUiState,
    onBack: () -> Unit,
    onOpenTemplate: (DivineMode, String) -> Unit,
    onOpenHistory: () -> Unit = {},
    onOpenCreation: (String) -> Unit = {},
    isPro: Boolean = false,
    onOpenSubscribe: () -> Unit = {}
) {
    Scaffold(
        // Outer app Scaffold already applies status-bar insets to the NavHost; zero here
        // so the top inset isn't applied twice (which pushed content way down).
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0),
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item("topbar") {
                AppTopBar(
                    title = t("divine_image_title"),
                    leftContent = {
                        IconButton(onClick = onBack) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Outlined.ArrowBack,
                                contentDescription = t("back")
                            )
                        }
                    }
                    // Get-Pro pill removed (ad-based model).
                )
            }

            item("subtitle") {
                Text(
                    text = t("divine_image_hub_subtitle"),
                    fontSize = 14.sp,
                    color = DivineImagePalette.TextSecondary
                )
            }

            items(
                items = uiState.homeOptions,
                key = { template -> "mode_${template.id}" }
            ) { template ->
                ModeCard(
                    template = template,
                    onClick = { onOpenTemplate(template.mode, template.id) }
                )
            }

            if (uiState.inspirations.isNotEmpty()) {
                item("moments_header") {
                    SectionHeader(title = t("one_tap_moments"))
                }
                items(
                    items = uiState.inspirations.chunked(2),
                    key = { row -> row.joinToString("_") { it.id } }
                ) { row ->
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        row.forEach { template ->
                            OneTapMomentCard(
                                template = template,
                                onClick = { onOpenTemplate(template.mode, template.id) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        // Odd item out on the last row — a spacer keeps its card at half
                        // width instead of stretching to fill the row alone.
                        if (row.size == 1) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }

            item("creations_header") {
                SectionHeader(
                    title = t("your_creations_short"),
                    actionLabel = t("history_link").takeIf { uiState.recentCreations.isNotEmpty() },
                    onAction = onOpenHistory
                )
            }
            item("creations_row") {
                YourCreationsRow(
                    creations = uiState.recentCreations,
                    onOpenCreation = onOpenCreation
                )
            }
        }
    }
}

// Free-quota chip removed — ad-based model, no image limit.

// MARK: - Mode cards -----------------------------------------------------------

@Composable
private fun ModeCard(
    template: DivineTemplate,
    onClick: () -> Unit
) {
    val language = LocalAppLanguage.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(150.dp)
            .clip(RoundedCornerShape(22.dp))
            .clickable(onClick = onClick)
    ) {
        Image(
            painter = painterResource(id = template.thumbnailRes),
            contentDescription = template.title(language),
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        // Bottom scrim for legible text.
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.35f to Color.Transparent,
                        1f to Color.Black.copy(alpha = 0.78f)
                    )
                )
        )
        Row(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Text(
                    text = template.title(language),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )
                Text(
                    text = template.description(language),
                    fontSize = 12.5.sp,
                    color = Color.White.copy(alpha = 0.88f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = DivineImagePalette.DeepAccent,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

// MARK: - One-tap moment cards -------------------------------------------------

@Composable
private fun OneTapMomentCard(
    template: DivineTemplate,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val language = LocalAppLanguage.current
    Box(
        modifier = modifier
            .height(168.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
    ) {
        Image(
            painter = painterResource(id = template.thumbnailRes),
            contentDescription = template.title(language),
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.4f to Color.Transparent,
                        1f to Color.Black.copy(alpha = 0.82f)
                    )
                )
        )
        // Deity monogram badge, top-left.
        template.deityTag?.let { deity ->
            val gradient = DivineImagePalette.deityMonogram(deity)
                ?: (DivineImagePalette.ModeGodStart to DivineImagePalette.ModeGodEnd)
            Box(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(8.dp)
                    .size(26.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(listOf(gradient.first, gradient.second))
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = deity.firstOrNull()?.uppercase().orEmpty(),
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }
        }
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                text = template.title(language),
                fontSize = 12.5.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "एक टैप ›",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFFFD8A8)
            )
        }
    }
}

// MARK: - Your creations -------------------------------------------------------

@Composable
private fun YourCreationsRow(
    creations: List<DivineCreation>,
    onOpenCreation: (String) -> Unit
) {
    if (creations.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(96.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(DivineImagePalette.Card)
                .border(
                    width = 1.dp,
                    color = DivineImagePalette.CardBorderStrong,
                    shape = RoundedCornerShape(16.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = t("your_divine_moments_empty"),
                fontSize = 13.sp,
                color = DivineImagePalette.TextMuted
            )
        }
        return
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        creations.take(3).forEach { creation ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .background(DivineImagePalette.Card)
                    .clickable { onOpenCreation(creation.id) }
            ) {
                UriPreviewImage(
                    uriString = creation.outputImageUri,
                    contentDescription = creation.templateTitle,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                    decodeMaxPx = 480
                )
            }
        }
        // Pad the row so 1 or 2 creations still align left with square tiles.
        repeat(3 - creations.take(3).size) {
            Box(modifier = Modifier.weight(1f))
        }
    }
}

// MARK: - Section header -------------------------------------------------------

@Composable
private fun SectionHeader(
    title: String,
    actionLabel: String? = null,
    onAction: () -> Unit = {}
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = title,
            fontSize = 17.sp,
            fontWeight = FontWeight.ExtraBold,
            color = DivineImagePalette.TextPrimary
        )
        actionLabel?.let {
            Text(
                text = it,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = DivineImagePalette.DeepAccent,
                modifier = Modifier.clickable(onClick = onAction)
            )
        }
    }
}
