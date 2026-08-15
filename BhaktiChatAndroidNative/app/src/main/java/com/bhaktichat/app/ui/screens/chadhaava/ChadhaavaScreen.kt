package com.bhaktichat.app.ui.screens.chadhaava
import androidx.media3.ui.PlayerView
import androidx.media3.datasource.RawResourceDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.common.Player
import androidx.media3.common.MediaItem
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.Lifecycle
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.viewinterop.AndroidView

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bhaktichat.app.R
import com.bhaktichat.app.data.autopay.launchUpiAutopayIntent
import com.bhaktichat.app.ui.components.ads.findActivity
import com.bhaktichat.app.ui.i18n.t

/**
 * चढ़ावा — the subscription surface.
 *
 * Structure follows the design handoff: a scrolling column with a sticky CTA footer, over
 * the app's standard bottom nav (this is a tab, so the bar stays visible).
 *
 * Two things in the handoff are deliberately **not** implemented here:
 *  - the temple-offering card, which promises a real-world weekly puja that does not exist
 *    yet. It ships when the service does.
 *  - the social-proof card, which specified placeholder ratings and an invented testimonial.
 *    It ships with real store data.
 */
object ChadhaavaPalette {
    val Accent = Color(0xFFEA580C)
    val DeepAccent = Color(0xFFC2410C)
    val GradStart = Color(0xFFFB923C)
    val TextPrimary = Color(0xFF2A1C15)
    val TextSecondary = Color(0xFF8A6F5C)
    val TextMuted = Color(0xFFBDA491)
    val TextBody = Color(0xFF4A382E)
    val PageBackground = Color(0xFFFBF7F3)
    val Card = Color(0xFFFFFFFF)
    val CardBorder = Color(0x1A784028)
    val CardBorderAccent = Color(0x4DEA580C)
    val Divider = Color(0x14784028)
    val SurfaceWarm = Color(0xFFF7EFE6)
    val Success = Color(0xFF57A075)
    val SuccessText = Color(0xFF2F6B4A)
    val SuccessSub = Color(0xFF4F7A62)
    val SuccessSurface = Color(0x1C57A075)
    val SuccessBorder = Color(0x5257A075)
    val BadgeAmberFill = Color(0xFFFEF3C7)
    val BadgeAmberText = Color(0xFFB45309)
    val BadgeAccentFill = Color(0xFFFDE9DC)
    val StepperTrack = Color(0xFFEADDD1)
}

@Composable
fun ChadhaavaScreen(
    viewModel: ChadhaavaViewModel,
    onBack: (() -> Unit)?,
    onOpenUrl: (String) -> Unit,
    userEmail: String? = null
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val activity = remember(context) { context.findActivity() }
    var showContactDialog by rememberSaveable { mutableStateOf(false) }

    // The direct Razorpay API returns a UPI mandate URI. Android's chooser opens one of the
    // customer's installed UPI apps; Razorpay Checkout is not involved in this path.
    LaunchedEffect(activity) {
        val host = activity ?: return@LaunchedEffect
        viewModel.authorizationRequests.collect { request ->
            val opened = launchUpiAutopayIntent(host, request.intentUrl)
            if (!opened) {
                viewModel.onUpiAppUnavailable()
            }
        }
    }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) viewModel.checkNow()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ChadhaavaPalette.PageBackground)
    ) {
        val current = state

        // ONE OfferState call site, hoisted out of the when.
        //
        // Offer, Processing and Failed all show the offer — Processing and Failed dim it and
        // put a sheet over the top. Previously each branch called OfferState itself, which
        // gives Compose three separate identities for the same content: every transition
        // between them disposed the AndroidView and released the ExoPlayer, then built both
        // again. That is a black flash exactly when the user taps pay, and again if the
        // payment fails. Keeping a single call site keeps the player alive across all three.
        val showsOffer = current is ChadhaavaUiState.Offer ||
            current is ChadhaavaUiState.Processing ||
            current is ChadhaavaUiState.Failed
        if (showsOffer) {
            val offer = current as? ChadhaavaUiState.Offer
            OfferState(
                blockedBy = offer?.blockedBy,
                onBack = if (offer != null) onBack else null,
                onSubscribe = if (offer != null) { { showContactDialog = true } } else ({}),
                onOpenUrl = if (offer != null) onOpenUrl else ({}),
                dimmed = offer == null
            )
        }

        when (current) {
            is ChadhaavaUiState.Loading -> LoadingState()

            is ChadhaavaUiState.Active -> ActiveState(
                state = current,
                onCancel = viewModel::cancelSubscription,
                onOpenUrl = onOpenUrl
            )

            is ChadhaavaUiState.Processing -> ProcessingSheet(
                elapsedSeconds = current.elapsedSeconds,
                onCheckNow = viewModel::checkNow
            )

            is ChadhaavaUiState.Failed -> ErrorSheet(
                onRetry = { showContactDialog = true },
                onDismiss = viewModel::dismissError
            )

            // Already rendered above.
            is ChadhaavaUiState.Offer -> Unit
        }
    }

    if (showContactDialog) {
        UpiContactDialog(
            onDismiss = { showContactDialog = false },
            onContinue = { contact ->
                showContactDialog = false
                viewModel.startAuthorization(contact)
            }
        )
    }
}

@Composable
private fun UpiContactDialog(onDismiss: () -> Unit, onContinue: (String) -> Unit) {
    var contact by rememberSaveable { mutableStateOf("") }
    val valid = contact.filter(Char::isDigit).length == 10
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Set up UPI AutoPay", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    "Enter the Indian mobile number linked to your UPI app. You will then choose GPay, PhonePe, BHIM or another installed UPI app.",
                    color = ChadhaavaPalette.TextSecondary,
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )
                OutlinedTextField(
                    value = contact,
                    onValueChange = { contact = it.filter(Char::isDigit).take(10) },
                    label = { Text("UPI mobile number") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    isError = contact.isNotBlank() && !valid
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onContinue(contact) }, enabled = valid) { Text("Continue") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Not now") } }
    )
}

@Composable
private fun LoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = ChadhaavaPalette.Accent)
            Spacer(Modifier.height(12.dp))
            Text(t("chadhaava_loading"), fontSize = 13.sp, color = ChadhaavaPalette.TextSecondary)
        }
    }
}

// --- Offer (1a / 1b) ----------------------------------------------------------------

@Composable
private fun OfferState(
    blockedBy: BlockedFeature?,
    onBack: (() -> Unit)?,
    onSubscribe: () -> Unit,
    onOpenUrl: (String) -> Unit,
    dimmed: Boolean = false
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .then(if (dimmed) Modifier.background(Color(0x6B2A1C15)) else Modifier)
    ) {
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
        ) {
            if (blockedBy != null) {
                BlockedHeader(onBack = onBack)
                BlockedContextCard(blockedBy)
            } else {
                Hero()
            }

            Spacer(Modifier.height(14.dp))
            PriceCard(compact = blockedBy != null)
            Spacer(Modifier.height(18.dp))
            Benefits(blockedBy = blockedBy)
            Spacer(Modifier.height(18.dp))
            BillingTimeline()
            Spacer(Modifier.height(18.dp))
            PolicyBlock()

            // DEBUG-ONLY. Opens Checkout against a one-time order instead of a
            // subscription so we can see whether UPI is missing for subscriptions
            // specifically, or for this app in general. Never present in release.


            Spacer(Modifier.height(14.dp))
            PolicyLinksRow(onOpenUrl = onOpenUrl)
            Spacer(Modifier.height(22.dp))
        }

        CtaFooter(
            blockedBy = blockedBy,
            onSubscribe = onSubscribe,
            onOpenUrl = onOpenUrl
        )
    }
}

/**
 * Looping hero clip of someone speaking to camera — the audio carries the pitch, so it
 * plays with sound. Playback follows the lifecycle so it stops when the screen is
 * backgrounded rather than burning battery behind a lock screen, and the player is
 * released on dispose.
 */
@Composable
private fun HeroVideo(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val player = remember {
        ExoPlayer.Builder(context).build().apply {
            // Looping by repeating the item in the playlist rather than REPEAT_MODE_ALL over
            // a single item.
            //
            // A single-item repeat loops by seeking back to zero, which flushes the decoder:
            // for a moment there is no frame to draw and the surface goes blank. That is the
            // flash at the loop seam. Consecutive playlist entries are a gapless transition
            // instead — ExoPlayer buffers the next entry while the current one is still
            // playing, so a decoded frame is always ready.
            //
            // Ten entries at 15s is 2.5 minutes before the playlist wraps; REPEAT_MODE_ALL
            // then handles the wrap. They all reference the same file, so the extra entries
            // cost nothing.
            val uri = RawResourceDataSource.buildRawResourceUri(R.raw.chadhaava_hero)
            setMediaItems(List(10) { MediaItem.fromUri(uri) })
            repeatMode = Player.REPEAT_MODE_ALL
            volume = 1f
            playWhenReady = true
            prepare()
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> player.play()
                Lifecycle.Event.ON_STOP -> player.pause()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            player.release()
        }
    }

    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            // Inflated rather than constructed so surface_type="texture_view" can be set —
            // it has no programmatic setter, and the default SurfaceView paints black
            // outside the video.
            val view = android.view.LayoutInflater.from(ctx)
                .inflate(R.layout.view_hero_video, null) as PlayerView
            view.player = player
            // Hold the last rendered frame instead of blanking to the shutter whenever the
            // player momentarily has nothing to draw — the other half of the loop-seam flicker.
            view.setKeepContentOnPlayerReset(true)
            // The real cause of the frame-to-frame flicker: a TextureView is transparent by
            // default, so every frame is alpha-blended against whatever is behind it instead
            // of drawn solid. Whenever a decoded frame isn't ready in time for a vsync, the
            // page background shows through for that instant — a flicker on ordinary
            // playback, not just at the loop seam. Marking it opaque makes it draw solid.
            (view.videoSurfaceView as? android.view.TextureView)?.isOpaque = true
            view
        }
    )
}

@Composable
private fun Hero() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(190.dp)
            .clipToBounds(),
        contentAlignment = Alignment.TopCenter
    ) {
        // Video only — nothing overlaid.
        //
        // No still underneath: the TextureView composites every frame against whatever is
        // behind it, so a static image there showed through as a flicker. The clip is a
        // bundled resource, so there is no load failure to guard against.
        //
        // No headline either: the footage already carries "SiRF 5" and "OFFER", so an
        // overlay duplicated its message and sat unreadably across the subject once the
        // scrim behind it was removed. The offer is restated in full on the price card
        // directly below.
        //
        // Rendered at the clip's exact native ratio (1280x720) rather than filling the
        // 190dp box directly. resize_mode="zoom" in view_hero_video.xml crops to fill —
        // at this box's aspect ratio that cropped symmetrically off the top and bottom,
        // slicing through the BhaktiChat mark sitting right at the top of frame. Full,
        // uncropped height plus TopCenter alignment on the surrounding box means any crop
        // now falls only at the bottom, where there's nothing worth keeping.
        HeroVideo(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
        )
    }
}


@Composable
private fun BlockedHeader(onBack: (() -> Unit)?) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (onBack != null) {
            IconButton(onClick = onBack, modifier = Modifier.size(34.dp)) {
                Icon(
                    Icons.AutoMirrored.Outlined.ArrowBack,
                    contentDescription = t("back"),
                    tint = ChadhaavaPalette.TextPrimary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
        Text(
            text = t("chadhaava_title"),
            fontSize = 15.sp,
            fontWeight = FontWeight.ExtraBold,
            color = ChadhaavaPalette.TextPrimary
        )
    }
}

@Composable
private fun BlockedContextCard(blockedBy: BlockedFeature) {
    val thumb = when (blockedBy) {
        BlockedFeature.WALLPAPERS -> R.drawable.shivji
        BlockedFeature.CHAT_QUOTA -> R.drawable.avatar_krishna
        BlockedFeature.IMAGE_QUOTA -> R.drawable.card_krishna
    }
    val titleKey = when (blockedBy) {
        BlockedFeature.WALLPAPERS -> "chadhaava_blocked_wallpaper_title"
        BlockedFeature.CHAT_QUOTA -> "chadhaava_blocked_chat_title"
        BlockedFeature.IMAGE_QUOTA -> "chadhaava_blocked_image_title"
    }
    val subKey = when (blockedBy) {
        BlockedFeature.WALLPAPERS -> "chadhaava_blocked_wallpaper_sub"
        BlockedFeature.CHAT_QUOTA -> "chadhaava_blocked_chat_sub"
        BlockedFeature.IMAGE_QUOTA -> "chadhaava_blocked_image_sub"
    }
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(18.dp),
        color = ChadhaavaPalette.Card,
        border = BorderStroke(1.dp, ChadhaavaPalette.CardBorderAccent)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(11.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(width = 52.dp, height = 64.dp)
                    .clip(RoundedCornerShape(12.dp))
            ) {
                Image(
                    painter = painterResource(thumb),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                Box(modifier = Modifier.fillMaxSize().background(Color(0x6B2A1C15)))
            }
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = t(titleKey),
                    fontSize = 14.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = ChadhaavaPalette.TextPrimary
                )
                Text(
                    text = t(subKey),
                    fontSize = 12.sp,
                    color = ChadhaavaPalette.TextSecondary,
                    lineHeight = 17.sp
                )
            }
        }
    }
}

@Composable
private fun PriceCard(compact: Boolean) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(22.dp),
        color = ChadhaavaPalette.Card,
        border = BorderStroke(1.5.dp, ChadhaavaPalette.CardBorderAccent)
    ) {
        Column(
            modifier = Modifier.padding(if (compact) 16.dp else 18.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = t("chadhaava_price_amount"),
                        fontSize = if (compact) 48.sp else 54.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = ChadhaavaPalette.DeepAccent,
                        lineHeight = if (compact) 50.sp else 56.sp
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = t("chadhaava_price_now"),
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = ChadhaavaPalette.TextPrimary,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }
                Text(
                    text = t("chadhaava_price_sub"),
                    fontSize = 13.sp,
                    color = ChadhaavaPalette.TextSecondary,
                    textAlign = TextAlign.Center
                )
            }

            RefundReassurance()

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(ChadhaavaPalette.CardBorder)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Surface(
                    shape = RoundedCornerShape(99.dp),
                    color = ChadhaavaPalette.SurfaceWarm,
                    border = BorderStroke(1.dp, Color(0x1F784028))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        // "Masik ₹199/mahina" said the same thing twice — the label is gone
                        // and the price now carries the timing.
                        Text(
                            text = t("chadhaava_plan_price"),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = ChadhaavaPalette.TextPrimary
                        )
                    }
                }
                Text(
                    text = t("chadhaava_plan_starts"),
                    fontSize = 11.sp,
                    color = ChadhaavaPalette.TextSecondary
                )
            }
        }
    }
}

@Composable
private fun RefundReassurance() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = ChadhaavaPalette.SuccessSurface,
        border = BorderStroke(1.dp, ChadhaavaPalette.SuccessBorder)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 13.dp, vertical = 11.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CheckCircle(size = 22.dp)
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = t("chadhaava_refund_title"),
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = ChadhaavaPalette.SuccessText
                )
                Text(
                    text = t("chadhaava_refund_sub"),
                    fontSize = 11.5.sp,
                    color = ChadhaavaPalette.SuccessSub
                )
            }
        }
    }
}

@Composable
private fun CheckCircle(size: androidx.compose.ui.unit.Dp) {
    Box(
        modifier = Modifier
            .size(size)
            .background(ChadhaavaPalette.Success, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            Icons.Filled.Check,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(size * 0.62f)
        )
    }
}

/**
 * The differentiator card: a weekly puja performed in the subscriber's name at two named
 * temples, with photo/video sent back.
 *
 * This is a promise about a real-world religious service, not a software feature. Every
 * claim here must actually be fulfilled each week for real subscribers — the named temples,
 * the sankalp, and the photos. The header image is a placeholder and should be replaced
 * with documentary photography of the actual puja; a stock temple shot undercuts the one
 * claim on this screen that cannot be verified in-app.
 */

@Composable
private fun TempleRow(name: String, place: String) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(9.dp)
    ) {
        Box(
            modifier = Modifier
                .padding(top = 5.dp)
                .size(7.dp)
                .background(ChadhaavaPalette.Accent, CircleShape)
        )
        Column {
            Text(
                text = name,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = ChadhaavaPalette.TextPrimary
            )
            Text(
                text = place,
                fontSize = 11.sp,
                color = ChadhaavaPalette.TextSecondary
            )
        }
    }
}

/**
 * The three-step timeline is a compliance element, not decoration: the charge amount, its
 * date, and the cancel path are all visible before payment rather than behind a link.
 */
@Composable
private fun BillingTimeline() {
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Text(
            text = t("chadhaava_timeline_title"),
            fontSize = 14.sp,
            fontWeight = FontWeight.ExtraBold,
            color = ChadhaavaPalette.TextPrimary
        )
        Spacer(Modifier.height(12.dp))
        TimelineStep(1, t("chadhaava_step1_title"), t("chadhaava_step1_sub"), TimelineStyle.FILLED, true)
        TimelineStep(2, t("chadhaava_step2_title"), t("chadhaava_step2_sub"), TimelineStyle.ACCENT_RING, true)
        TimelineStep(3, t("chadhaava_step3_title"), t("chadhaava_step3_sub"), TimelineStyle.MUTED_RING, false)
    }
}

private enum class TimelineStyle { FILLED, ACCENT_RING, MUTED_RING }

@Composable
private fun TimelineStep(
    number: Int,
    title: String,
    subtitle: String,
    style: TimelineStyle,
    showConnector: Boolean
) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.width(22.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .then(
                        when (style) {
                            TimelineStyle.FILLED -> Modifier.background(ChadhaavaPalette.Accent, CircleShape)
                            else -> Modifier.background(Color.White, CircleShape)
                        }
                    )
                    .then(
                        when (style) {
                            TimelineStyle.ACCENT_RING ->
                                Modifier.border(2.dp, ChadhaavaPalette.Accent, CircleShape)
                            TimelineStyle.MUTED_RING ->
                                Modifier.border(2.dp, Color(0xFFE3D5C7), CircleShape)
                            else -> Modifier
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = number.toString(),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = when (style) {
                        TimelineStyle.FILLED -> Color.White
                        TimelineStyle.ACCENT_RING -> ChadhaavaPalette.DeepAccent
                        TimelineStyle.MUTED_RING -> Color(0xFFA08A78)
                    }
                )
            }
            if (showConnector) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(34.dp)
                        .background(ChadhaavaPalette.StepperTrack)
                )
            }
        }
        Spacer(Modifier.width(11.dp))
        Column(modifier = Modifier.padding(bottom = 13.dp)) {
            Text(
                text = title,
                fontSize = 13.5.sp,
                fontWeight = FontWeight.Bold,
                color = ChadhaavaPalette.TextPrimary
            )
            Text(
                text = subtitle,
                fontSize = 11.5.sp,
                color = ChadhaavaPalette.TextSecondary,
                lineHeight = 16.sp
            )
        }
    }
}

private data class Benefit(
    val titleKey: String,
    val subKey: String,
    val badgeKey: String? = null,
    val badgeAmber: Boolean = false
)

@Composable
private fun Benefits(blockedBy: BlockedFeature?) {
    var expanded by rememberSaveable { mutableStateOf(blockedBy != null) }

    // Ranked by emotional pull, not feature completeness. When the user was blocked on a
    // specific feature, that feature leads instead.
    val base = listOf(
        Benefit("chadhaava_benefit_voice", "chadhaava_benefit_voice_sub", "chadhaava_badge_popular", true),
        Benefit("chadhaava_benefit_chat", "chadhaava_benefit_chat_sub"),
        Benefit("chadhaava_benefit_image", "chadhaava_benefit_image_sub"),
        Benefit("chadhaava_benefit_wallpaper", "chadhaava_benefit_wallpaper_sub"),
        Benefit("chadhaava_benefit_adfree", "chadhaava_benefit_adfree_sub")
    )
    // Whatever they were blocked on leads the list, badged, so the offer answers the
    // thing they just hit rather than making them hunt for it.
    val blockedKey = when (blockedBy) {
        BlockedFeature.WALLPAPERS -> "chadhaava_benefit_wallpaper"
        BlockedFeature.CHAT_QUOTA -> "chadhaava_benefit_chat"
        BlockedFeature.IMAGE_QUOTA -> "chadhaava_benefit_image"
        null -> null
    }
    val ordered = if (blockedKey != null && base.any { it.titleKey == blockedKey }) {
        val blocked = base.first { it.titleKey == blockedKey }
            .copy(badgeKey = "chadhaava_badge_here", badgeAmber = false)
        listOf(blocked) + base.filterNot { it.titleKey == blockedKey }
    } else {
        base
    }

    Column(
        modifier = Modifier
            .padding(horizontal = 16.dp)
            .animateContentSize()
    ) {
        Text(
            text = t("chadhaava_benefits_title"),
            fontSize = 14.5.sp,
            fontWeight = FontWeight.ExtraBold,
            color = ChadhaavaPalette.TextPrimary
        )
        Spacer(Modifier.height(12.dp))
        ordered.forEach { BenefitRow(it) }

        if (expanded) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
                    .height(1.dp)
                    .background(ChadhaavaPalette.CardBorder)
            )
            listOf(
                "chadhaava_secondary_reels",
                "chadhaava_secondary_aarti",
                "chadhaava_secondary_panchang"
            ).forEach { key ->
                Text(
                    text = t(key),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = ChadhaavaPalette.TextBody,
                    modifier = Modifier.padding(vertical = 6.dp)
                )
            }
        }

        Spacer(Modifier.height(8.dp))
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 44.dp)
                .clickable { expanded = !expanded },
            shape = RoundedCornerShape(14.dp),
            color = ChadhaavaPalette.SurfaceWarm,
            border = BorderStroke(1.dp, ChadhaavaPalette.CardBorder)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 13.dp, vertical = 11.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (expanded) t("chadhaava_expander_less") else t("chadhaava_expander_more"),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = ChadhaavaPalette.TextPrimary
                    )
                    if (!expanded) {
                        Text(
                            text = t("chadhaava_expander_sub"),
                            fontSize = 11.sp,
                            color = ChadhaavaPalette.TextSecondary
                        )
                    }
                }
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .background(Color.White, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        if (expanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown,
                        contentDescription = null,
                        tint = ChadhaavaPalette.TextSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun BenefitRow(benefit: Benefit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(11.dp)
    ) {
        CheckCircle(size = 20.dp)
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = t(benefit.titleKey),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = ChadhaavaPalette.TextPrimary
                )
                benefit.badgeKey?.let { key ->
                    Surface(
                        shape = RoundedCornerShape(99.dp),
                        color = if (benefit.badgeAmber) ChadhaavaPalette.BadgeAmberFill
                        else ChadhaavaPalette.BadgeAccentFill
                    ) {
                        Text(
                            text = t(key),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (benefit.badgeAmber) ChadhaavaPalette.BadgeAmberText
                            else ChadhaavaPalette.DeepAccent,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }
            Text(
                text = t(benefit.subKey),
                fontSize = 11.5.sp,
                color = ChadhaavaPalette.TextSecondary
            )
        }
    }
}

@Composable
private fun PolicyBlock() {
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Text(
            text = t("chadhaava_policy_title"),
            fontSize = 14.5.sp,
            fontWeight = FontWeight.ExtraBold,
            color = ChadhaavaPalette.TextPrimary
        )
        Spacer(Modifier.height(10.dp))
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = ChadhaavaPalette.Card,
            border = BorderStroke(1.dp, ChadhaavaPalette.CardBorder)
        ) {
            Column {
                listOf(
                    "chadhaava_policy_q1" to "chadhaava_policy_a1",
                    "chadhaava_policy_q2" to "chadhaava_policy_a2",
                    "chadhaava_policy_q3" to "chadhaava_policy_a3"
                ).forEachIndexed { index, (q, a) ->
                    if (index > 0) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(ChadhaavaPalette.Divider)
                        )
                    }
                    Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 13.dp)) {
                        Text(
                            text = t(q),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = ChadhaavaPalette.TextPrimary
                        )
                        Spacer(Modifier.height(3.dp))
                        Text(
                            text = t(a),
                            fontSize = 11.5.sp,
                            color = ChadhaavaPalette.TextSecondary,
                            lineHeight = 17.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CtaFooter(
    blockedBy: BlockedFeature?,
    onSubscribe: () -> Unit,
    onOpenUrl: (String) -> Unit
) {
    Surface(
        color = ChadhaavaPalette.PageBackground,
        border = BorderStroke(1.dp, ChadhaavaPalette.Divider)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 16.dp, end = 16.dp, top = 11.dp, bottom = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Fixed height: long labels wrap rather than shrinking the button.
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .clickable(onClick = onSubscribe),
                shape = RoundedCornerShape(16.dp),
                color = Color.Transparent
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.linearGradient(
                                listOf(ChadhaavaPalette.GradStart, ChadhaavaPalette.Accent)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = when (blockedBy) {
                                BlockedFeature.WALLPAPERS -> t("chadhaava_cta_blocked_wallpaper")
                                BlockedFeature.CHAT_QUOTA -> t("chadhaava_cta_blocked_chat")
                                BlockedFeature.IMAGE_QUOTA -> t("chadhaava_cta_blocked_image")
                                null -> t("chadhaava_cta_line1")
                            },
                            fontSize = 17.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Text(
                            text = t("chadhaava_cta_line2"),
                            fontSize = 10.5.sp,
                            color = Color.White.copy(alpha = 0.92f)
                        )
                    }
                }
            }

            // Refund/Terms links deliberately are NOT here. This footer is pinned over the
            // scrolling offer, so every row it holds is a row permanently taken away from the
            // content behind it. The links live at the end of the scroll instead (see
            // PolicyLinksRow) — still one tap from the CTA, still present for the payment
            // provider, but no longer costing fixed height on every frame.
        }
    }
}

/**
 * Refund and Terms, rendered inline at the end of the scrollable offer.
 *
 * Kept rather than dropped: Razorpay expects a reachable refund policy, and these are the
 * two links the /refunds page itself is written to satisfy.
 */
@Composable
private fun PolicyLinksRow(onOpenUrl: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center
    ) {
        Text(
            text = t("chadhaava_link_refunds"),
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = ChadhaavaPalette.DeepAccent,
            modifier = Modifier.clickable { onOpenUrl("https://bhaktichat.com/refunds") }
        )
        Text("  ·  ", fontSize = 11.sp, color = ChadhaavaPalette.TextMuted)
        Text(
            text = t("chadhaava_link_terms"),
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = ChadhaavaPalette.DeepAccent,
            modifier = Modifier.clickable { onOpenUrl("https://bhaktichat.com/terms") }
        )
    }
}

// --- Active / trial (1d / 1e) --------------------------------------------------------

@Composable
private fun ActiveState(
    state: ChadhaavaUiState.Active,
    onCancel: () -> Unit,
    onOpenUrl: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = t("chadhaava_title"),
                fontSize = 16.sp,
                fontWeight = FontWeight.ExtraBold,
                color = ChadhaavaPalette.TextPrimary
            )
        }

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(22.dp),
            color = Color.Transparent
        ) {
            Column(
                modifier = Modifier
                    .background(
                        Brush.linearGradient(
                            listOf(ChadhaavaPalette.GradStart, ChadhaavaPalette.Accent)
                        )
                    )
                    .padding(horizontal = 18.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(13.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(26.dp)
                            .background(Color.White, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(R.drawable.ic_diya),
                            contentDescription = null,
                            tint = ChadhaavaPalette.Accent,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Text(
                        text = if (state.isTrial) t("chadhaava_trial_active") else t("chadhaava_active_badge"),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                }

                if (state.isTrial && state.daysRemaining != null) {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = "${state.daysRemaining} ${t("chadhaava_days")}",
                            fontSize = 36.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = t("chadhaava_trial_remaining"),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White.copy(alpha = 0.9f),
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                    }
                } else {
                    Text(
                        text = t("chadhaava_active_title"),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                }
            }
        }

        Spacer(Modifier.height(18.dp))

        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
            Text(
                text = t("chadhaava_unlocked_title"),
                fontSize = 13.5.sp,
                fontWeight = FontWeight.ExtraBold,
                color = ChadhaavaPalette.TextPrimary
            )
            Spacer(Modifier.height(10.dp))
            listOf(
                "chadhaava_benefit_voice",
                "chadhaava_benefit_chat",
                "chadhaava_benefit_image",
                "chadhaava_benefit_wallpaper",
                "chadhaava_benefit_adfree"
            ).forEach { key ->
                Row(
                    modifier = Modifier.padding(bottom = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(9.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CheckCircle(size = 18.dp)
                    Text(
                        text = t(key),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = ChadhaavaPalette.TextBody
                    )
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        // Cancel stays a plain, reachable text button — deliberately not buried behind a
        // retention flow.
        Text(
            text = if (state.isTrial) t("chadhaava_cancel_trial") else t("chadhaava_cancel"),
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = ChadhaavaPalette.TextSecondary,
            modifier = Modifier
                .padding(horizontal = 16.dp)
                .heightIn(min = 44.dp)
                .clickable(onClick = onCancel)
                .padding(vertical = 12.dp)
        )

        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = t("chadhaava_link_refunds"),
                fontSize = 10.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = ChadhaavaPalette.DeepAccent,
                modifier = Modifier.clickable { onOpenUrl("https://bhaktichat.com/refunds") }
            )
            Text("·", fontSize = 10.5.sp, color = ChadhaavaPalette.TextMuted)
            Text(
                text = t("chadhaava_link_terms"),
                fontSize = 10.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = ChadhaavaPalette.DeepAccent,
                modifier = Modifier.clickable { onOpenUrl("https://bhaktichat.com/terms") }
            )
        }

        Spacer(Modifier.height(24.dp))
    }
}

// --- Processing / error sheets (1c / 1g) ---------------------------------------------

@Composable
private fun ProcessingSheet(elapsedSeconds: Int, onCheckNow: () -> Unit) {
    BottomSheetScaffold {
        CircularProgressIndicator(color = ChadhaavaPalette.Accent, modifier = Modifier.size(44.dp))
        Spacer(Modifier.height(15.dp))
        Text(
            text = t("chadhaava_processing_title"),
            fontSize = 19.sp,
            fontWeight = FontWeight.ExtraBold,
            color = ChadhaavaPalette.TextPrimary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = t("chadhaava_processing_body"),
            fontSize = 13.sp,
            color = ChadhaavaPalette.TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 19.sp
        )
        Spacer(Modifier.height(14.dp))
        Text(
            text = "%d:%02d".format(elapsedSeconds / 60, elapsedSeconds % 60),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = ChadhaavaPalette.DeepAccent
        )
        Spacer(Modifier.height(15.dp))
        SecondaryButton(text = t("chadhaava_processing_check"), onClick = onCheckNow)
        Spacer(Modifier.height(10.dp))
        Text(
            text = t("chadhaava_processing_dont_close"),
            fontSize = 11.5.sp,
            color = ChadhaavaPalette.TextMuted
        )
    }
}

@Composable
private fun ErrorSheet(onRetry: () -> Unit, onDismiss: () -> Unit) {
    BottomSheetScaffold {
        Text(
            text = t("chadhaava_error_title"),
            fontSize = 19.sp,
            fontWeight = FontWeight.ExtraBold,
            color = ChadhaavaPalette.TextPrimary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(8.dp))
        // Only our own copy is ever shown. The gateway's raw payload goes to logcat — it is
        // developer detail and reads as alarming nonsense to a devotee. "Nothing was
        // deducted" leads, because that is the user's actual worry.
        Text(
            text = t("chadhaava_error_body"),
            fontSize = 13.sp,
            color = ChadhaavaPalette.TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 19.sp
        )
        Spacer(Modifier.height(18.dp))
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .clickable(onClick = onRetry),
            shape = RoundedCornerShape(16.dp),
            color = Color.Transparent
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.linearGradient(listOf(ChadhaavaPalette.GradStart, ChadhaavaPalette.Accent))
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = t("chadhaava_error_retry"),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        SecondaryButton(text = t("chadhaava_error_later"), onClick = onDismiss)
    }
}

@Composable
private fun BottomSheetScaffold(content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(topStart = 26.dp, topEnd = 26.dp),
            color = ChadhaavaPalette.PageBackground
        ) {
            Column(
                modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 14.dp, bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(width = 40.dp, height = 4.dp)
                        .background(Color(0xFFE3D5C7), RoundedCornerShape(99.dp))
                )
                Spacer(Modifier.height(16.dp))
                content()
            }
        }
    }
}

@Composable
private fun SecondaryButton(text: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 48.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = ChadhaavaPalette.Card,
        border = BorderStroke(1.dp, ChadhaavaPalette.CardBorder)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = text,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = ChadhaavaPalette.TextPrimary,
                modifier = Modifier.padding(vertical = 14.dp)
            )
        }
    }
}
