package com.bhaktichat.app.ui.screens.choghadiya

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bhaktichat.app.domain.ChoghadiyaCities
import com.bhaktichat.app.domain.ChoghadiyaCity
import com.bhaktichat.app.ui.theme.BhaktiThemeTokens
import com.bhaktichat.app.ui.components.AppBottomSheet
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults
import com.bhaktichat.app.ui.i18n.t
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import java.util.Locale

@Composable
fun ChoghadiyaRoute(
    viewModel: ChoghadiyaViewModel,
    onBack: () -> Unit,
    onAskShani: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = androidx.lifecycle.compose.LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var hasTriedAutoDetect by rememberSaveable { mutableStateOf(false) }
    var retryLocationOnResume by rememberSaveable { mutableStateOf(false) }
    var showEnableLocationDialog by rememberSaveable { mutableStateOf(false) }
    var showPermissionDialog by rememberSaveable { mutableStateOf(false) }

    suspend fun syncCityWithDeviceLocation() {
        when (val result = resolveCurrentCity(context)) {
            is AutoLocationResult.Success -> {
                retryLocationOnResume = false
                showEnableLocationDialog = false
                showPermissionDialog = false
                if (result.city.slug != uiState.selectedCity.slug) {
                    viewModel.onCitySelected(result.city)
                }
            }

            AutoLocationResult.PermissionRequired -> {
                showPermissionDialog = true
            }

            AutoLocationResult.LocationDisabled -> {
                showEnableLocationDialog = true
            }

            AutoLocationResult.Unavailable -> Unit
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val granted = result.values.any { it }
        if (granted) {
            coroutineScope.launch {
                syncCityWithDeviceLocation()
            }
        } else {
            showPermissionDialog = true
        }
    }

    fun requestLocationAccess() {
        when {
            !hasLocationPermission(context) -> {
                permissionLauncher.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.ACCESS_FINE_LOCATION
                    )
                )
            }

            !isLocationServicesEnabled(context) -> {
                showEnableLocationDialog = true
            }

            else -> {
                coroutineScope.launch {
                    syncCityWithDeviceLocation()
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        if (!hasTriedAutoDetect) {
            hasTriedAutoDetect = true
            requestLocationAccess()
        }
    }

    DisposableEffect(lifecycleOwner, retryLocationOnResume) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME && retryLocationOnResume) {
                requestLocationAccess()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    ChoghadiyaScreen(
        uiState = uiState,
        onBack = onBack,
        onOpenCitySelector = viewModel::onOpenCitySelector,
        onDismissCitySelector = viewModel::onDismissCitySelector,
        onSearchQueryChange = viewModel::onSearchQueryChanged,
        onCitySelected = viewModel::onCitySelected,
        onAutoDetectCity = { requestLocationAccess() },
        onAskShani = onAskShani
    )

    if (showPermissionDialog) {
        AlertDialog(
            onDismissRequest = { showPermissionDialog = false },
            title = { Text(t("choghadiya_enable_location_title")) },
            text = {
                Text(t("choghadiya_enable_location_body"))
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showPermissionDialog = false
                        permissionLauncher.launch(
                            arrayOf(
                                Manifest.permission.ACCESS_COARSE_LOCATION,
                                Manifest.permission.ACCESS_FINE_LOCATION
                            )
                        )
                    }
                ) {
                    Text(t("choghadiya_allow"))
                }
            },
            dismissButton = {
                TextButton(onClick = { showPermissionDialog = false }) {
                    Text(t("choghadiya_not_now"))
                }
            }
        )
    }

    if (showEnableLocationDialog) {
        AlertDialog(
            onDismissRequest = { showEnableLocationDialog = false },
            title = { Text(t("choghadiya_turn_on_location_title")) },
            text = {
                Text(t("choghadiya_turn_on_location_body"))
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showEnableLocationDialog = false
                        retryLocationOnResume = true
                        context.startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                    }
                ) {
                    Text(t("choghadiya_open_settings"))
                }
            },
            dismissButton = {
                TextButton(onClick = { showEnableLocationDialog = false }) {
                    Text(t("choghadiya_not_now"))
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChoghadiyaScreen(
    uiState: ChoghadiyaUiState,
    onBack: () -> Unit,
    onOpenCitySelector: () -> Unit,
    onDismissCitySelector: () -> Unit,
    onSearchQueryChange: (String) -> Unit,
    onCitySelected: (ChoghadiyaCity) -> Unit,
    onAutoDetectCity: () -> Unit,
    onAskShani: (String) -> Unit
) {
    var meaningsExpanded by rememberSaveable { mutableStateOf(false) }

    Scaffold(
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = t("choghadiya_back_to_home")
                        )
                    }
                },
                title = {
                    Column {
                        Text(
                            text = t("explore_choghadiya_title"),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = uiState.todayLabel,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    AssistChip(
                        onClick = onOpenCitySelector,
                        label = {
                            Text(
                                text = uiState.selectedCity.name.substringBefore(','),
                                maxLines = 1
                            )
                        },
                        trailingIcon = {
                            Icon(
                                imageVector = Icons.Filled.KeyboardArrowDown,
                                contentDescription = t("choghadiya_open_city_selector")
                            )
                        }
                    )
                }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = 16.dp,
                    end = 16.dp,
                    top = 16.dp,
                    bottom = BhaktiBottomNavBarDefaults.overlayClearance + 8.dp
                ),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                item("choghadiya_ad") {
                    com.bhaktichat.app.ui.components.ads.BannerAd(placement = "choghadiya")
                }

                item("hero-summary") {
                    HeroSummaryCard(uiState = uiState)
                }

                item("next-good") {
                    NextGoodTimeCard(uiState = uiState)
                }

                item("sun-cycle") {
                    SunCycleCard(uiState = uiState)
                }

                item("timeline") {
                    TimelineSection(uiState = uiState)
                }

                item("meanings") {
                    MeaningAccordion(
                        expanded = meaningsExpanded,
                        onToggle = { meaningsExpanded = !meaningsExpanded }
                    )
                }

                item("ask-shani") {
                    val askShaniPrompt = t("choghadiya_explain_todays_choghadiya")
                    ChatCtaCard(
                        onAskShani = {
                            onAskShani(askShaniPrompt)
                        }
                    )
                }
            }

            if (uiState.loading && uiState.timelineList.isEmpty()) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            }
        }
    }

    if (uiState.isCitySheetOpen) {
        CitySelectorBottomSheet(
            uiState = uiState,
            onDismiss = onDismissCitySelector,
            onSearchQueryChange = onSearchQueryChange,
            onCitySelected = onCitySelected,
            onAutoDetectCity = onAutoDetectCity
        )
    }
}

@Composable
private fun HeroSummaryCard(uiState: ChoghadiyaUiState) {
    val current = uiState.currentKaal
    val tone = current?.tone ?: KaalTone.NEUTRAL
    val colors = heroGradientFor(tone)
    val icon = iconFor(current?.displayLabel.orEmpty())

    Card(
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(colors))
                .padding(18.dp)
        ) {
            if (current == null && uiState.loading) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = t("choghadiya_right_now"),
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White.copy(alpha = 0.92f)
                    )
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.5.dp)
                }
            } else if (current == null) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = t("choghadiya_right_now"),
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White.copy(alpha = 0.92f)
                    )
                    Text(
                        text = t("choghadiya_unable_to_calculate"),
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White
                    )
                    Text(
                        text = uiState.error ?: t("choghadiya_try_another_city"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.92f)
                    )
                }
            } else {
                val currentTitle = t("choghadiya_kaal_active").format(current.displayLabel)
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            color = Color.White.copy(alpha = 0.16f),
                            shape = CircleShape
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = currentTitle,
                                tint = Color.White,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                        Text(
                            text = heroVerdictLabel(current.tone),
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White.copy(alpha = 0.92f)
                        )
                    }
                    Text(
                        text = currentTitle,
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = current.timeRange,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White.copy(alpha = 0.95f)
                    )
                    Text(
                        text = t(current.guidanceKey),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.94f)
                    )
                    KaalProgressBar(
                        progress = current.progress,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 2.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun NextGoodTimeCard(uiState: ChoghadiyaUiState) {
    Card(
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.Schedule,
                    contentDescription = t("choghadiya_next_auspicious_period"),
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = t("choghadiya_next_auspicious_period"),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }

            val nextGood = uiState.nextGoodKaal
            if (nextGood == null) {
                Text(
                    text = t("choghadiya_no_more_auspicious"),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                Text(
                    text = t("choghadiya_kaal_at").format(nextGood.displayLabel, nextGood.start),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = nextGood.startsAt,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = countdownText(nextGood.countdownHours, nextGood.countdownMinutes),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun SunCycleCard(uiState: ChoghadiyaUiState) {
    Card(
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            SunInfoBlock(
                label = t("choghadiya_sunrise"),
                value = uiState.sunrise,
                modifier = Modifier.weight(1f)
            )
            SunInfoBlock(
                label = t("choghadiya_sunset"),
                value = uiState.sunset,
                modifier = Modifier.weight(1f)
            )
            SunInfoBlock(
                label = t("choghadiya_next_sunrise"),
                value = uiState.nextSunrise,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun SunInfoBlock(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 10.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun TimelineSection(uiState: ChoghadiyaUiState) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = t("choghadiya_today_timeline"),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold
        )

        if (!uiState.error.isNullOrBlank() && uiState.timelineList.isEmpty()) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.7f)
                )
            ) {
                Text(
                    text = uiState.error,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    modifier = Modifier.padding(16.dp)
                )
            }
        } else {
            ChoghadiyaTimeline(items = uiState.timelineList)
        }
    }
}

@Composable
fun ChoghadiyaTimeline(items: List<TimelineItemUi>) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items.forEachIndexed { index, item ->
            TimelineRow(
                item = item,
                showConnector = index < items.lastIndex
            )
        }
    }
}

@Composable
private fun TimelineRow(
    item: TimelineItemUi,
    showConnector: Boolean
) {
    val accent = accentFor(item.tone)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(if (item.isFuture && !item.isCurrent) 0.72f else 1f),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(top = 12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(if (item.isCurrent) 16.dp else 14.dp)
                    .background(accent, CircleShape)
            )
            if (showConnector) {
                Box(
                    modifier = Modifier
                        .padding(top = 4.dp)
                        .size(width = 2.dp, height = 76.dp)
                        .background(MaterialTheme.colorScheme.outlineVariant)
                )
            }
        }

        Card(
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = if (item.isCurrent) 3.dp else 1.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (item.isCurrent) {
                    MaterialTheme.colorScheme.surface
                } else {
                    MaterialTheme.colorScheme.surface
                }
            ),
            modifier = Modifier
                .fillMaxWidth()
                .border(
                    width = 1.dp,
                    color = if (item.isCurrent) {
                        accent.copy(alpha = 0.65f)
                    } else {
                        MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                    },
                    shape = RoundedCornerShape(20.dp)
                )
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                if (item.isCurrent) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .background(
                                color = accent.copy(alpha = 0.90f),
                                shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
                            )
                    )
                }
                Column(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = iconFor(item.title),
                        contentDescription = item.title,
                        tint = accent
                    )
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    if (item.isCurrent) {
                        Surface(
                            color = accent.copy(alpha = 0.12f),
                            shape = RoundedCornerShape(999.dp)
                        ) {
                            Text(
                                text = t("choghadiya_now_badge"),
                                style = MaterialTheme.typography.labelSmall,
                                color = accent,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }
                }
                Text(
                    text = item.timeRange,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = t(item.meaningKey),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                }
            }
        }
    }
}

@Composable
private fun MeaningAccordion(
    expanded: Boolean,
    onToggle: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            TextButton(
                onClick = onToggle,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = t("choghadiya_what_do_these_mean"),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Icon(
                        imageVector = if (expanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown,
                        contentDescription = if (expanded) {
                            t("choghadiya_collapse_meanings")
                        } else {
                            t("choghadiya_expand_meanings")
                        }
                    )
                }
            }

            AnimatedVisibility(visible = expanded) {
                Column(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    MeaningRow("शुभ", t("choghadiya_accordion_shubh"))
                    MeaningRow("लाभ", t("choghadiya_accordion_labh"))
                    MeaningRow("अमृत", t("choghadiya_accordion_amrit"))
                    MeaningRow("रोग", t("choghadiya_accordion_rog"))
                    MeaningRow("चल", t("choghadiya_accordion_chal"))
                    MeaningRow("काल", t("choghadiya_accordion_kaal"))
                    MeaningRow("उद्वेग", t("choghadiya_accordion_udveg"))
                    Spacer(modifier = Modifier.height(4.dp))
                }
            }
        }
    }
}

@Composable
private fun MeaningRow(title: String, body: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = body,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ChatCtaCard(
    onAskShani: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = t("choghadiya_not_sure_when"),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = t("choghadiya_ask_before_important_task"),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(
                                BhaktiThemeTokens.AccentGradientStart,
                                BhaktiThemeTokens.AccentGradientEnd
                            )
                        )
                    )
                    .clickable(onClick = onAskShani)
                    .padding(vertical = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = t("choghadiya_ask_shani_dev"),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
private fun KaalProgressBar(
    progress: Float,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(6.dp)
            .background(
                color = Color.White.copy(alpha = 0.18f),
                shape = RoundedCornerShape(999.dp)
            )
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(progress.coerceIn(0f, 1f))
                .height(6.dp)
                .background(
                    color = Color.White.copy(alpha = 0.92f),
                    shape = RoundedCornerShape(999.dp)
                )
        )
    }
}

@Composable
fun CitySelectorBottomSheet(
    uiState: ChoghadiyaUiState,
    onDismiss: () -> Unit,
    onSearchQueryChange: (String) -> Unit,
    onCitySelected: (ChoghadiyaCity) -> Unit,
    onAutoDetectCity: () -> Unit
) {
    AppBottomSheet(
        onDismiss = onDismiss
    ) {
        LazyColumn(
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item("header") {
                Text(
                    text = t("choghadiya_choose_a_city"),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }

            item("search") {
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = onSearchQueryChange,
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text(t("choghadiya_search_cities")) }
                )
            }

            item("auto-detect") {
                OutlinedButton(
                    onClick = onAutoDetectCity,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Filled.MyLocation,
                        contentDescription = t("choghadiya_auto_detect_location")
                    )
                    Text(
                        text = t("choghadiya_auto_detect_location"),
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
            }

            if (uiState.recentCities.isNotEmpty()) {
                item("recent-title") {
                    Text(
                        text = t("choghadiya_recently_used"),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                item("recent-cities") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        uiState.recentCities.forEach { city ->
                            AssistChip(
                                onClick = { onCitySelected(city) },
                                label = {
                                    Text(
                                        text = city.name.substringBefore(','),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            )
                        }
                    }
                }
            }

            item("all-cities-title") {
                Text(
                    text = t("choghadiya_all_cities"),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
            }

            if (uiState.filteredCities.isEmpty()) {
                item("empty-search") {
                    Text(
                        text = t("choghadiya_no_cities_match"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                itemsIndexed(uiState.filteredCities, key = { _, city -> city.slug }) { index, city ->
                    Surface(
                        shape = RoundedCornerShape(18.dp),
                        color = if (city.slug == uiState.selectedCity.slug) {
                            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)
                        } else {
                            MaterialTheme.colorScheme.surface
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        TextButton(
                            onClick = { onCitySelected(city) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(horizontalAlignment = Alignment.Start) {
                                    Text(
                                        text = city.name,
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = city.tz,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                if (city.slug == uiState.selectedCity.slug) {
                                    Text(
                                        text = t("choghadiya_selected"),
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }

                    if (index < uiState.filteredCities.lastIndex) {
                        HorizontalDivider(
                            thickness = 0.5.dp,
                            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)
                        )
                    }
                }
            }
        }
    }
}

private sealed interface AutoLocationResult {
    data class Success(val city: ChoghadiyaCity) : AutoLocationResult
    data object PermissionRequired : AutoLocationResult
    data object LocationDisabled : AutoLocationResult
    data object Unavailable : AutoLocationResult
}

private fun hasLocationPermission(context: Context): Boolean {
    val coarse = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.ACCESS_COARSE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED
    val fine = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED
    return coarse || fine
}

private fun isLocationServicesEnabled(context: Context): Boolean {
    val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return false
    return runCatching {
        locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
            locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }.getOrDefault(false)
}

private suspend fun resolveCurrentCity(context: Context): AutoLocationResult {
    if (!hasLocationPermission(context)) return AutoLocationResult.PermissionRequired
    if (!isLocationServicesEnabled(context)) return AutoLocationResult.LocationDisabled

    val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        ?: return AutoLocationResult.Unavailable

    val lastKnown = bestLastKnownLocation(locationManager)
    val location = lastKnown ?: fetchSingleLocation(context, locationManager)
    return if (location == null) {
        AutoLocationResult.Unavailable
    } else {
        AutoLocationResult.Success(
            ChoghadiyaCities.all.minByOrNull { city ->
                distanceSquared(city.lat, city.lon, location.latitude, location.longitude)
            } ?: ChoghadiyaCities.recommendedCity()
        )
    }
}

private fun bestLastKnownLocation(locationManager: LocationManager): Location? {
    val providers = listOf(
        LocationManager.GPS_PROVIDER,
        LocationManager.NETWORK_PROVIDER,
        LocationManager.PASSIVE_PROVIDER
    )

    return providers.mapNotNull { provider ->
        runCatching { locationManager.getLastKnownLocation(provider) }.getOrNull()
    }.maxByOrNull { location ->
        val accuracyScore = if (location.hasAccuracy()) 100_000f - location.accuracy else 0f
        location.time + accuracyScore.toLong()
    }
}

private suspend fun fetchSingleLocation(
    context: Context,
    locationManager: LocationManager
): Location? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return null

    val provider = when {
        runCatching { locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) }.getOrDefault(false) ->
            LocationManager.NETWORK_PROVIDER
        runCatching { locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) }.getOrDefault(false) ->
            LocationManager.GPS_PROVIDER
        else -> null
    } ?: return null

    return suspendCancellableCoroutine { continuation ->
        runCatching {
            locationManager.getCurrentLocation(
                provider,
                null,
                ContextCompat.getMainExecutor(context)
            ) { location ->
                if (continuation.isActive) {
                    continuation.resume(location)
                }
            }
        }.onFailure {
            if (continuation.isActive) {
                continuation.resume(null)
            }
        }
    }
}

private fun distanceSquared(
    cityLat: Double,
    cityLon: Double,
    userLat: Double,
    userLon: Double
): Double {
    val latDiff = cityLat - userLat
    val lonDiff = cityLon - userLon
    return (latDiff * latDiff) + (lonDiff * lonDiff)
}

/** Honest verdict for the "right now" period — the header must match the tone, not
 *  always claim "auspicious" (which was misleading during Kaal/Rog/Udveg periods). */
@Composable
private fun heroVerdictLabel(tone: KaalTone): String = when (tone) {
    KaalTone.AUSPICIOUS -> t("choghadiya_verdict_favourable")
    KaalTone.NEUTRAL -> t("choghadiya_verdict_neutral")
    KaalTone.CHALLENGING -> t("choghadiya_verdict_unfavourable")
}

@Composable
private fun countdownText(hours: Long, minutes: Long): String {
    return when {
        hours > 0 && minutes > 0 -> {
            val hourWord = if (hours == 1L) t("choghadiya_hour_singular") else t("choghadiya_hour_plural")
            val minuteWord = if (minutes == 1L) t("choghadiya_minute_singular") else t("choghadiya_minute_plural")
            t("choghadiya_countdown_in").format("$hours $hourWord $minutes $minuteWord")
        }
        hours > 0 -> {
            val hourWord = if (hours == 1L) t("choghadiya_hour_singular") else t("choghadiya_hour_plural")
            t("choghadiya_countdown_in").format("$hours $hourWord")
        }
        minutes > 0 -> {
            val minuteWord = if (minutes == 1L) t("choghadiya_minute_singular") else t("choghadiya_minute_plural")
            t("choghadiya_countdown_in").format("$minutes $minuteWord")
        }
        else -> t("choghadiya_countdown_now")
    }
}

/** Public — Home's live Choghadiya row uses the same tone gradient as this screen's banner. */
fun heroGradientFor(tone: KaalTone): List<Color> {
    return when (tone) {
        KaalTone.AUSPICIOUS -> listOf(Color(0xFF2E7D32), Color(0xFF66BB6A))
        KaalTone.NEUTRAL -> listOf(Color(0xFFB26A00), Color(0xFFE3A63F))
        KaalTone.CHALLENGING -> listOf(Color(0xFF8E3B46), Color(0xFFB85F67))
    }
}

private fun accentFor(tone: KaalTone): Color {
    return when (tone) {
        KaalTone.AUSPICIOUS -> Color(0xFF2E7D32)
        KaalTone.NEUTRAL -> Color(0xFF9E7B00)
        KaalTone.CHALLENGING -> Color(0xFFB23A48)
    }
}

private fun iconFor(label: String): ImageVector {
    val normalized = label.lowercase(Locale.ENGLISH)
    return when {
        normalized.contains("amrit") -> Icons.Filled.WaterDrop
        normalized.contains("shubh") -> Icons.Filled.WbSunny
        normalized.contains("labh") -> Icons.AutoMirrored.Filled.TrendingUp
        normalized.contains("rog") || normalized.contains("kaal") || normalized.contains("udveg") -> Icons.Filled.WarningAmber
        normalized.contains("chal") || normalized.contains("char") -> Icons.Filled.Sync
        else -> Icons.Filled.Bolt
    }
}
