package com.bhaktichat.app.ui.screens.divineimage
import com.bhaktichat.app.ui.i18n.t

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import com.bhaktichat.app.BhaktiChatApplication
import com.bhaktichat.app.R
import com.bhaktichat.app.domain.DivineMode
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.i18n.LocalAppLanguage
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import kotlinx.coroutines.flow.Flow

/**
 * Divine Image creation screen — v2 redesign mirroring the iOS layout.
 *
 * Layout: top bar / intro blurb / big photo drop-zone / (preset summary card OR
 * deity-avatar row + scene chips OR temple chips + moment chips) / collapsible
 * "Add extra details" / sticky generate dock at the bottom.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DivineImageCreateScreen(
    mode: DivineMode,
    uiState: DivineImageCreateUiState,
    uiEvents: Flow<DivineImageCreateUiEvent>,
    onBack: () -> Unit,
    onOpenResult: (String) -> Unit,
    onPickImage: (Uri?) -> Unit,
    onUseDemoPhoto: () -> Unit,
    @Suppress("UNUSED_PARAMETER") onCustomTempleNameChange: (String) -> Unit,
    onSelectDeity: (String) -> Unit,
    onSelectScene: (String) -> Unit,
    onSelectTemple: (String) -> Unit,
    onSelectTempleMoment: (String) -> Unit,
    /// Default no-op so older call-sites (BhaktiChatApp.kt) keep compiling
    /// until they explicitly thread `vm::onCustomPromptChanged` through.
    onCustomPromptChange: (String) -> Unit = {},
    onGenerate: () -> Unit
) {
    val template = uiState.template
    val language = LocalAppLanguage.current
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent(),
        onResult = onPickImage
    )

    LaunchedEffect(uiEvents) {
        uiEvents.collect { event ->
            when (event) {
                is DivineImageCreateUiEvent.NavigateToResult -> onOpenResult(event.creationId)
            }
        }
    }

    var showAdvancedPrompt by remember { mutableStateOf(false) }
    // Custom prompt is owned by the ViewModel so it actually feeds into
    // buildPrompt() at generation time (matches iOS behaviour).

    val isPreset = template?.deityTag != null || template?.templeName != null
    val hasPhoto = uiState.selectedImageUri != null

    // Preload the interstitial now so it's ready to show over the generation wait screen.
    val adContext = LocalContext.current
    LaunchedEffect(Unit) {
        (adContext.applicationContext as BhaktiChatApplication).container.interstitialAdManager.load(adContext)
    }

    // Ad-based model: divine image is free for everyone — no quota chip.
    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = 16.dp,
                end = 16.dp,
                top = 8.dp,
                // Generate dock is ~110dp tall; leave space so the last section
                // is fully reachable above it.
                bottom = 140.dp
            ),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            item("top_bar") {
                AppTopBar(
                    title = template?.title(language) ?: t("di_create_title"),
                    leftContent = {
                        IconButton(onClick = onBack) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Outlined.ArrowBack,
                                contentDescription = t("go_back"),
                                tint = BhaktiThemeTokens.TextPrimary
                            )
                        }
                    }
                )
            }

            item("intro_blurb") {
                template?.description(language)?.takeIf { it.isNotBlank() }?.let { desc ->
                    Text(
                        text = desc,
                        style = MaterialTheme.typography.bodyMedium,
                        color = BhaktiThemeTokens.TextSecondary,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 2.dp)
                    )
                }
            }

            item("photo_zone") {
                PhotoZone(
                    selectedImageUri = uiState.selectedImageUri,
                    onPickFromGallery = { galleryLauncher.launch("image/*") },
                    onUseDemoPhoto = onUseDemoPhoto
                )
            }

            if (isPreset && template != null) {
                item("preset_summary") {
                    PresetSummaryCard(
                        deityName = template.deityTag,
                        templeName = template.templeName,
                        sceneOrMoment = template.sceneName
                    )
                }
            } else {
                when (mode) {
                    DivineMode.PHOTO_WITH_GOD -> {
                        item("deity_section") {
                            DeitySection(
                                options = uiState.deityOptions,
                                selectedDeity = uiState.selectedDeity,
                                onSelect = onSelectDeity
                            )
                        }
                        item("scene_section") {
                            ChipSection(
                                number = "3",
                                title = t("di_choose_scene"),
                                options = uiState.sceneOptions,
                                selected = uiState.selectedScene,
                                onSelect = onSelectScene
                            )
                        }
                    }
                    DivineMode.PHOTO_AT_TEMPLE -> {
                        item("temple_section") {
                            ChipSection(
                                number = "2",
                                title = t("di_choose_temple"),
                                options = uiState.templeOptions,
                                selected = uiState.selectedTemple,
                                onSelect = onSelectTemple
                            )
                        }
                        item("moment_section") {
                            ChipSection(
                                number = "3",
                                title = t("di_choose_moment"),
                                options = uiState.templeMomentOptions,
                                selected = uiState.selectedTempleMoment,
                                onSelect = onSelectTempleMoment
                            )
                        }
                    }
                }
            }

            item("advanced_prompt") {
                AdvancedPromptSection(
                    expanded = showAdvancedPrompt,
                    onToggle = { showAdvancedPrompt = !showAdvancedPrompt },
                    value = uiState.customPrompt,
                    onValueChange = onCustomPromptChange
                )
            }

            uiState.validationMessage?.let { message ->
                item("validation") {
                    ErrorCard(text = message)
                }
            }
        }

        // Sticky generate dock pinned to bottom.
        GenerateDock(
            modifier = Modifier.align(Alignment.BottomCenter),
            isGenerating = uiState.isSubmitting,
            hasPhoto = hasPhoto,
            canGenerate = uiState.isReadyToGenerate && !uiState.isSubmitting,
            onGenerate = onGenerate
        )
    }
}

// MARK: - Photo zone -----------------------------------------------------------

@Composable
private fun PhotoZone(
    selectedImageUri: Uri?,
    onPickFromGallery: () -> Unit,
    onUseDemoPhoto: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionHeader(number = "1", title = t("di_your_photo"))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(208.dp)
                .clip(RoundedCornerShape(20.dp))
                .clickable(onClick = onPickFromGallery)
        ) {
            if (selectedImageUri != null) {
                UriPreviewImage(
                    uriString = selectedImageUri.toString(),
                    contentDescription = t("di_selected_photo"),
                    modifier = Modifier
                        .fillMaxSize()
                        .border(
                            width = 1.dp,
                            color = BhaktiThemeTokens.BorderSubtle,
                            shape = RoundedCornerShape(20.dp)
                        ),
                    contentScale = ContentScale.Crop,
                    decodeMaxPx = 720
                )
                // "Change" pill in top-right
                Row(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(10.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color.Black.copy(alpha = 0.55f))
                        .clickable(onClick = onPickFromGallery)
                        .padding(horizontal = 10.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Refresh,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = t("di_change"),
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            } else {
                // Empty drop-zone state: dashed saffron border, icon and tap prompt.
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(20.dp))
                        .background(BhaktiThemeTokens.SurfaceCard)
                        .dashedRoundedBorder(
                            color = DivineImagePalette.NumberHighlight.copy(alpha = 0.4f),
                            cornerRadius = 20.dp,
                            strokeWidth = 1.5.dp
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.AddAPhoto,
                            contentDescription = null,
                            tint = BhaktiThemeTokens.AccentPrimary,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = t("di_tap_add_photo"),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = DivineImagePalette.TextPrimary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = t("di_photo_hint"),
                            fontSize = 12.5.sp,
                            color = DivineImagePalette.TextSecondary
                        )
                    }
                }
            }
        }

        // Secondary "try with demo photo" link
        Row(
            modifier = Modifier
                .clickable(onClick = onUseDemoPhoto)
                .padding(start = 2.dp, top = 2.dp, end = 4.dp, bottom = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.AutoAwesome,
                contentDescription = null,
                tint = BhaktiThemeTokens.AccentPrimary,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = t("di_try_sample"),
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium,
                color = BhaktiThemeTokens.AccentPrimary
            )
        }
    }
}

// MARK: - Preset summary -------------------------------------------------------

@Composable
private fun PresetSummaryCard(
    deityName: String?,
    templeName: String?,
    sceneOrMoment: String?
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionHeader(number = "2", title = t("di_your_darshan"))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = BhaktiThemeTokens.SurfaceCard,
            border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Avatar — deity image OR temple glyph
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .border(
                            width = 1.5.dp,
                            color = BhaktiThemeTokens.AccentPrimary.copy(alpha = 0.35f),
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    val deityAsset = deityName?.let(::deityAvatarRes)
                    if (deityAsset != null) {
                        Image(
                            painter = painterResource(id = deityAsset),
                            contentDescription = deityName,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    color = BhaktiThemeTokens.AccentPrimary.copy(alpha = 0.14f),
                                    shape = CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.AccountBalance,
                                contentDescription = null,
                                tint = BhaktiThemeTokens.AccentPrimary,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Text(
                        text = divineChoiceDisplayText(deityName ?: templeName.orEmpty(), LocalAppLanguage.current),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = BhaktiThemeTokens.TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    sceneOrMoment?.takeIf { it.isNotBlank() }?.let {
                        Text(
                            text = divineChoiceDisplayText(it, LocalAppLanguage.current),
                            style = MaterialTheme.typography.bodySmall,
                            color = BhaktiThemeTokens.TextSecondary,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = BhaktiThemeTokens.AccentPrimary
                ) {
                    Text(
                        text = t("di_ready_options"),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }
    }
}

// MARK: - Deity section (horizontal avatar row) --------------------------------

@Composable
private fun DeitySection(
    options: List<DivineChoiceOption>,
    selectedDeity: String?,
    onSelect: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SectionHeader(number = "2", title = t("di_choose_deity"))

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(horizontal = 2.dp, vertical = 2.dp)
        ) {
            items(options, key = { it.id }) { option ->
                DeityAvatarChip(
                    deityName = option.title,
                    selected = selectedDeity == option.title,
                    onClick = { onSelect(option.title) }
                )
            }
        }
    }
}

// MARK: - LazyRow chip selectors -----------------------------------------------

@Composable
private fun DeityAvatarChip(
    deityName: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val scale by animateFloatAsState(
        targetValue = if (selected) 1.05f else 1.0f,
        label = "deityChipScale"
    )
    val asset = deityAvatarRes(deityName)

    Column(
        modifier = Modifier
            .width(78.dp)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // Outer 74dp selection ring (orange when selected) wrapping the
        // inner 62dp circular avatar — matches iOS layout.
        Box(
            modifier = Modifier
                .size(74.dp)
                .scale(scale)
                .then(
                    if (selected) {
                        Modifier.border(
                            width = 2.5.dp,
                            color = DivineImagePalette.NumberHighlight,
                            shape = CircleShape
                        )
                    } else {
                        Modifier
                    }
                ),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(62.dp)
                    .clip(CircleShape)
                    .border(
                        width = 1.dp,
                        color = BhaktiThemeTokens.BorderSubtle.copy(alpha = 0.45f),
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (asset != null) {
                    Image(
                        painter = painterResource(id = asset),
                        contentDescription = deityName,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(BhaktiThemeTokens.SurfaceCard, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = divineChoiceDisplayText(deityName, LocalAppLanguage.current).firstOrNull()?.toString().orEmpty(),
                            color = BhaktiThemeTokens.AccentPrimary,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        Text(
            text = deityShortName(deityName),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.Medium,
            color = if (selected) DivineImagePalette.DeepAccent else DivineImagePalette.TextSecondary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center
        )
    }
}

// MARK: - Chip section (scenes / temples / moments) ----------------------------

@Composable
private fun ChipSection(
    number: String,
    title: String,
    options: List<String>,
    selected: String?,
    onSelect: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionHeader(number = number, title = title)

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 2.dp, vertical = 2.dp)
        ) {
            items(options, key = { it }) { option ->
                OptionChip(
                    label = divineChoiceDisplayText(option, LocalAppLanguage.current),
                    selected = option == selected,
                    onClick = { onSelect(option) }
                )
            }
        }
    }
}

@Composable
private fun OptionChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(999.dp)
    val bgModifier = if (selected) {
        Modifier.background(
            brush = Brush.linearGradient(
                listOf(
                    BhaktiThemeTokens.AccentGradientStart,
                    BhaktiThemeTokens.AccentGradientEnd
                )
            ),
            shape = shape
        )
    } else {
        Modifier.background(BhaktiThemeTokens.SurfaceCard, shape)
    }
    val borderModifier = if (selected) {
        Modifier
    } else {
        Modifier.border(
            width = 1.dp,
            color = DivineImagePalette.CardBorderStrong,
            shape = shape
        )
    }

    Box(
        modifier = Modifier
            .clip(shape)
            .then(bgModifier)
            .then(borderModifier)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 9.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
            color = if (selected) Color.White else DivineImagePalette.TextPrimary
        )
    }
}

// MARK: - Advanced prompt ------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdvancedPromptSection(
    expanded: Boolean,
    onToggle: () -> Unit,
    value: String,
    onValueChange: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onToggle)
                .padding(horizontal = 2.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = if (expanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                contentDescription = if (expanded) t("di_hide_details") else t("di_show_details"),
                tint = BhaktiThemeTokens.TextSecondary,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = t("di_add_details"),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = BhaktiThemeTokens.TextPrimary
            )
            Text(
                text = t("di_optional"),
                style = MaterialTheme.typography.bodySmall,
                color = BhaktiThemeTokens.TextTertiary
            )
        }

        AnimatedVisibility(visible = expanded) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 96.dp),
                placeholder = {
                    Text(
                        text = t("di_details_hint"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = BhaktiThemeTokens.TextTertiary
                    )
                },
                textStyle = MaterialTheme.typography.bodyMedium,
                shape = RoundedCornerShape(14.dp),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = BhaktiThemeTokens.SurfaceCard,
                    unfocusedContainerColor = BhaktiThemeTokens.SurfaceCard,
                    focusedTextColor = BhaktiThemeTokens.TextPrimary,
                    unfocusedTextColor = BhaktiThemeTokens.TextPrimary,
                    focusedIndicatorColor = BhaktiThemeTokens.AccentPrimary,
                    unfocusedIndicatorColor = BhaktiThemeTokens.BorderSubtle
                ),
                maxLines = 5
            )
        }
    }
}

// MARK: - Section header -------------------------------------------------------

@Composable
private fun SectionHeader(number: String, title: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(CircleShape)
                .background(BhaktiThemeTokens.AccentPrimary),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = number,
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.Black
            )
        }
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            color = BhaktiThemeTokens.TextPrimary
        )
    }
}

// MARK: - Generate dock --------------------------------------------------------

// FreeImageQuotaChip removed — ad-based model, no image limit.

@Composable
private fun GenerateDock(
    modifier: Modifier = Modifier,
    isGenerating: Boolean,
    hasPhoto: Boolean,
    canGenerate: Boolean,
    onGenerate: () -> Unit
) {
    val footerHint = when {
        isGenerating -> t("di_generating_eta")
        !hasPhoto -> t("di_need_photo")
        !canGenerate -> t("di_need_steps")
        else -> t("di_ready_tap")
    }
    val footerHintColor = if (canGenerate && !isGenerating) {
        DivineImagePalette.Success
    } else {
        BhaktiThemeTokens.TextSecondary
    }

    Surface(
        modifier = modifier
            .fillMaxWidth(),
        color = BhaktiThemeTokens.Background.copy(alpha = 0.98f),
        border = BorderStroke(1.dp, BhaktiThemeTokens.BorderSubtle.copy(alpha = 0.8f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .alpha(if (canGenerate || isGenerating) 1f else 0.55f)
                    .background(
                        brush = Brush.linearGradient(
                            listOf(
                                BhaktiThemeTokens.AccentGradientStart,
                                BhaktiThemeTokens.AccentGradientEnd
                            )
                        )
                    )
                    .clickable(enabled = canGenerate && !isGenerating, onClick = onGenerate),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (isGenerating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp,
                            color = Color.White
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Filled.AutoAwesome,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Text(
                        text = if (isGenerating) t("di_generating_dots") else t("di_create_cta"),
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Text(
                text = footerHint,
                style = MaterialTheme.typography.bodySmall,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = footerHintColor,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

// MARK: - Error card -----------------------------------------------------------

@Composable
private fun ErrorCard(text: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = BhaktiThemeTokens.AccentError.copy(alpha = 0.08f),
        border = BorderStroke(1.dp, BhaktiThemeTokens.AccentError.copy(alpha = 0.3f))
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(14.dp),
            style = MaterialTheme.typography.bodyMedium,
            color = BhaktiThemeTokens.TextPrimary
        )
    }
}

// MARK: - Helpers --------------------------------------------------------------

/** Dashed rounded-rect border, drawn behind content (Compose has no built-in dashed border). */
private fun Modifier.dashedRoundedBorder(
    color: Color,
    cornerRadius: Dp,
    strokeWidth: Dp
): Modifier = this.drawBehind {
    val stroke = Stroke(
        width = strokeWidth.toPx(),
        pathEffect = PathEffect.dashPathEffect(floatArrayOf(14f, 10f), 0f)
    )
    val inset = strokeWidth.toPx() / 2f
    drawRoundRect(
        color = color,
        topLeft = Offset(inset, inset),
        size = Size(size.width - inset * 2, size.height - inset * 2),
        cornerRadius = CornerRadius(cornerRadius.toPx(), cornerRadius.toPx()),
        style = stroke
    )
}

private fun deityAvatarRes(deity: String): Int? = when (deity) {
    "Lord Krishna" -> R.drawable.avatar_krishna
    "Lakshmi Ji"   -> R.drawable.avatar_lakshmi
    "Shiv Ji"      -> R.drawable.shivji
    "Hanuman Ji"   -> R.drawable.hanumanji
    "Ganesh Ji"    -> R.drawable.ic_ganesh_top_aarti
    else           -> null
}

@Composable
private fun deityShortName(deity: String): String = when (deity) {
    "Lord Krishna" -> t("di_short_krishna")
    "Lakshmi Ji"   -> t("di_short_lakshmi")
    "Shiv Ji"      -> t("di_short_shiv")
    "Hanuman Ji"   -> t("di_short_hanuman")
    "Ganesh Ji"    -> t("di_short_ganesh")
    else           -> divineChoiceDisplayText(deity, LocalAppLanguage.current)
}

private fun String.capitalizeFirst(): String =
    if (isEmpty()) this else first().uppercaseChar() + substring(1)
