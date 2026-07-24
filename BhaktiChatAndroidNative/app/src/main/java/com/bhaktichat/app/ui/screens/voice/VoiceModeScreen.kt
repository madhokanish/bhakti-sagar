package com.bhaktichat.app.ui.screens.voice

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.bhaktichat.app.domain.VoiceCallState

@Composable
fun VoiceModeScreen(
    viewModel: VoiceConversationViewModel,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val recordAudioLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            viewModel.start()
        } else {
            Toast.makeText(context, "Microphone permission is needed for Voice Mode", Toast.LENGTH_SHORT).show()
            onBack()
        }
    }

    LaunchedEffect(Unit) {
        val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
        if (granted) {
            viewModel.start()
        } else {
            recordAudioLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    // Backgrounding mid-call ends the session — a foreground service to keep the mic
    // alive in the background is deliberately out of scope for v1.
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_STOP) viewModel.endCall()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    DisposableEffect(viewModel) {
        onDispose { viewModel.endCall() }
    }

    LaunchedEffect(uiState.callState) {
        if (uiState.callState is VoiceCallState.Ended) onBack()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(VoiceModePalette.Background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                GuidePortrait(
                    imageRes = uiState.guideProfileImageRes,
                    callState = uiState.callState
                )
                Text(
                    text = uiState.guideName,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.padding(top = 24.dp)
                )
                Text(
                    text = callStateLabel(uiState.callState),
                    fontSize = 14.sp,
                    color = VoiceModePalette.TextSecondary,
                    modifier = Modifier.padding(top = 6.dp)
                )
                // Live mic meter while listening — lets the user confirm the mic is hearing them
                // (fills as they speak). Only shown when the mic is actually open.
                if (uiState.callState is VoiceCallState.Listening ||
                    uiState.callState is VoiceCallState.UserSpeaking
                ) {
                    MicLevelMeter(level = uiState.micLevel, modifier = Modifier.padding(top = 12.dp))
                }
                val caption = uiState.assistantCaption.ifBlank { uiState.userCaption }
                if (caption.isNotBlank()) {
                    Text(
                        text = caption,
                        fontSize = 15.sp,
                        color = Color.White.copy(alpha = 0.85f),
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 20.dp, start = 12.dp, end = 12.dp)
                    )
                }
                uiState.errorMessage?.let { message ->
                    Text(
                        text = message,
                        fontSize = 13.sp,
                        color = VoiceModePalette.Error,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 16.dp)
                    )
                }
            }

            // DEBUG only: injects a bundled recorded utterance so the full loop can be verified
            // on an emulator (which has no real microphone). Absent from release builds.
            if (com.bhaktichat.app.BuildConfig.DEBUG &&
                (uiState.callState is VoiceCallState.Listening || uiState.callState is VoiceCallState.UserSpeaking)
            ) {
                Text(
                    text = "▶ Inject test voice (debug)",
                    fontSize = 13.sp,
                    color = VoiceModePalette.TextSecondary,
                    modifier = Modifier
                        .padding(bottom = 16.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.10f))
                        .padding(horizontal = 16.dp, vertical = 10.dp)
                        .clickable {
                            val pcm = runCatching {
                                context.assets.open("voice_test_utterance.pcm").use { it.readBytes() }
                            }.getOrNull()
                            if (pcm != null) viewModel.injectTestUtterance(pcm)
                        }
                )
            }

            IconButton(
                onClick = {
                    viewModel.endCall()
                    onBack()
                },
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(VoiceModePalette.Error)
            ) {
                Icon(
                    imageVector = Icons.Filled.CallEnd,
                    contentDescription = "End voice call",
                    tint = Color.White
                )
            }
        }
    }
}

@Composable
private fun MicLevelMeter(level: Float, modifier: Modifier = Modifier) {
    // Smooth the raw level a little so the bar doesn't jitter.
    val animated by androidx.compose.animation.core.animateFloatAsState(
        targetValue = level.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 90, easing = LinearEasing),
        label = "mic-level"
    )
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.5f)
                .height(6.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.15f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(animated.coerceAtLeast(0.02f))
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(VoiceModePalette.RingUserSpeaking)
            )
        }
    }
}

@Composable
private fun GuidePortrait(imageRes: Int, callState: VoiceCallState) {
    val infiniteTransition = rememberInfiniteTransition(label = "voice-pulse")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (callState is VoiceCallState.GuideSpeaking || callState is VoiceCallState.UserSpeaking) 1.08f else 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 900, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "voice-pulse-scale"
    )

    val ringColor = when (callState) {
        is VoiceCallState.UserSpeaking -> VoiceModePalette.RingUserSpeaking
        is VoiceCallState.GuideSpeaking -> VoiceModePalette.RingGuideSpeaking
        is VoiceCallState.Thinking -> VoiceModePalette.RingThinking
        else -> VoiceModePalette.RingIdle
    }

    Box(
        modifier = Modifier
            .size(220.dp)
            .scale(pulse)
            .clip(CircleShape)
            .background(ringColor.copy(alpha = 0.35f)),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(id = imageRes),
            contentDescription = null,
            modifier = Modifier
                .size(190.dp)
                .clip(CircleShape),
            contentScale = ContentScale.Crop
        )
    }
}

private fun callStateLabel(state: VoiceCallState): String = when (state) {
    is VoiceCallState.Idle -> "Starting..."
    is VoiceCallState.Connecting -> "Connecting..."
    is VoiceCallState.Listening -> "Listening"
    is VoiceCallState.UserSpeaking -> "Listening..."
    is VoiceCallState.Thinking -> "Thinking..."
    is VoiceCallState.GuideSpeaking -> "Speaking"
    is VoiceCallState.Error -> "Something went wrong"
    is VoiceCallState.Ended -> "Call ended"
}

private object VoiceModePalette {
    val Background = Color(0xFF1A1210)
    val TextSecondary = Color(0xFFD8C4B0)
    val Error = Color(0xFFDC2626)
    val RingIdle = Color(0xFF8A6F5C)
    val RingUserSpeaking = Color(0xFF57A075)
    val RingGuideSpeaking = Color(0xFFF97316)
    val RingThinking = Color(0xFFFBBF24)
}
