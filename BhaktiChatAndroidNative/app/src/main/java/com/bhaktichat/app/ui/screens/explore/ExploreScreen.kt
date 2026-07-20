package com.bhaktichat.app.ui.screens.explore

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Celebration
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material.icons.filled.WbSunny
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bhaktichat.app.R
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults

/** Warm saffron/cream palette for the new 4-tab IA screens (design_handoff_bhaktichat_ia). */
object ExplorePalette {
    val Card = Color(0xFFFFFFFF)
    val CardBorder = Color(0x1A784028)       // rgba(120,80,40,0.10)
    val TextPrimary = Color(0xFF2A1C15)
    val TextSecondary = Color(0xFF8A6F5C)
    val TextMuted = Color(0xFFBDA491)
    val DeepAccent = Color(0xFFC2410C)
    val Accent = Color(0xFFEA580C)
    val GradStart = Color(0xFFFB923C)
    val GradEnd = Color(0xFFEA580C)
    val Success = Color(0xFF57A075)
    val Warn = Color(0xFFD97706)
    val Avoid = Color(0xFFDC2626)

    // Service icon-tile gradients
    val AartiGrad = listOf(Color(0xFFFCA5A5), Color(0xFFDC2626))
    val ChoghadiyaGrad = listOf(Color(0xFFFB923C), Color(0xFFEA580C))
    val FestivalGrad = listOf(Color(0xFFA5B4FC), Color(0xFF6366F1))
    val PanchangGrad = listOf(Color(0xFFFCD34D), Color(0xFFD97706))
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExploreScreen(
    onOpenProfile: () -> Unit,
    onOpenDivineImage: () -> Unit,
    onOpenAartis: () -> Unit,
    onOpenChoghadiya: () -> Unit,
    onOpenFestivals: () -> Unit,
    onOpenPanchang: () -> Unit
) {
    Scaffold(
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            AppTopBar(
                title = "Explore",
                leftContent = {
                    IconButton(onClick = onOpenProfile) {
                        Icon(
                            imageVector = Icons.Outlined.Person,
                            contentDescription = "Profile"
                        )
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp)
                .padding(top = 8.dp, bottom = BhaktiBottomNavBarDefaults.overlayClearance + 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            FeaturedDivineImageCard(onClick = onOpenDivineImage)

            Text("Services", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = ExplorePalette.TextPrimary)

            ServiceRow(
                icon = Icons.Filled.MusicNote,
                gradient = ExplorePalette.AartiGrad,
                title = "Aartis",
                subtitle = "30+ devotional songs with lyrics & audio",
                onClick = onOpenAartis
            )
            ServiceRow(
                icon = Icons.Filled.WbSunny,
                gradient = ExplorePalette.ChoghadiyaGrad,
                title = "Choghadiya",
                subtitle = "Today's auspicious timings for your city",
                onClick = onOpenChoghadiya
            )
            ServiceRow(
                icon = Icons.Filled.Celebration,
                gradient = ExplorePalette.FestivalGrad,
                title = "Festivals",
                subtitle = "Upcoming Hindu festivals & vrat",
                onClick = onOpenFestivals
            )
            ServiceRow(
                icon = Icons.Filled.CalendarMonth,
                gradient = ExplorePalette.PanchangGrad,
                title = "Panchang",
                subtitle = "Tithi, nakshatra, sunrise & sunset today",
                onClick = onOpenPanchang
            )

            Text("Coming soon", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = ExplorePalette.TextPrimary)
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ComingSoonCard(Icons.Filled.Stars, "Rashifal", "Daily horoscope", Modifier.weight(1f))
                ComingSoonCard(Icons.Filled.GridView, "Kundli", "Birth chart", Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun FeaturedDivineImageCard(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(190.dp)
            .clip(RoundedCornerShape(24.dp))
            .clickable(onClick = onClick)
    ) {
        Image(
            painter = painterResource(id = R.drawable.photo_with_god),
            contentDescription = "Divine Image",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.25f to Color.Transparent,
                        1f to Color.Black.copy(alpha = 0.82f)
                    )
                )
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Icon(Icons.Filled.AutoAwesome, null, tint = Color(0xFFFFE7C6), modifier = Modifier.size(13.dp))
                Text("FEATURED", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFFE7C6), letterSpacing = 1.sp)
            }
            Text("Divine Image", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            Text("Turn your photo into a sacred darshan", fontSize = 13.sp, color = Color.White.copy(alpha = 0.9f))
            Spacer(Modifier.height(2.dp))
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White)
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text("Create yours", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ExplorePalette.DeepAccent)
                Icon(Icons.Filled.ChevronRight, null, tint = ExplorePalette.DeepAccent, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun ServiceRow(
    icon: ImageVector,
    gradient: List<Color>,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(ExplorePalette.Card)
            .border(1.dp, ExplorePalette.CardBorder, RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(46.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Brush.linearGradient(gradient)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = Color.White, modifier = Modifier.size(22.dp))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = ExplorePalette.TextPrimary)
            Text(subtitle, fontSize = 12.5.sp, color = ExplorePalette.TextSecondary)
        }
        Icon(Icons.Filled.ChevronRight, null, tint = ExplorePalette.TextMuted, modifier = Modifier.size(22.dp))
    }
}

@Composable
private fun ComingSoonCard(icon: ImageVector, title: String, subtitle: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(ExplorePalette.Card.copy(alpha = 0.6f))
            .border(1.dp, ExplorePalette.CardBorder, RoundedCornerShape(18.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(icon, null, tint = ExplorePalette.TextMuted, modifier = Modifier.size(24.dp))
        Text(title, fontSize = 14.5.sp, fontWeight = FontWeight.Bold, color = ExplorePalette.TextPrimary.copy(alpha = 0.7f))
        Text(subtitle, fontSize = 12.sp, color = ExplorePalette.TextMuted)
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(ExplorePalette.TextMuted.copy(alpha = 0.15f))
                .padding(horizontal = 8.dp, vertical = 3.dp)
        ) {
            Text("Coming soon", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ExplorePalette.TextSecondary)
        }
    }
}
