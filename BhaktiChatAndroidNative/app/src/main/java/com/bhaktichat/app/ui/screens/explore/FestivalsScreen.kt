package com.bhaktichat.app.ui.screens.explore
import com.bhaktichat.app.ui.i18n.t

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults

/**
 * Holds translation keys rather than resolved strings: this list is a top-level `val`, so it
 * is built once at class-init, long before any composition exists. Resolving copy here would
 * freeze it to whichever language happened to be active at startup — and `t()` is not even
 * callable outside composition. [FestivalCard] resolves each key as it draws.
 */
private data class Festival(
    val day: String,
    val monthKey: String,
    val nameKey: String,
    val subKey: String,
    val grad: List<Color>
)

private val festivals = listOf(
    Festival("16", "month_august", "festival_hariyali_teej", "festival_hariyali_teej_desc", listOf(Color(0xFF6EE7B7), Color(0xFF059669))),
    Festival("18", "month_august", "festival_naag_panchami", "festival_naag_panchami_desc", listOf(Color(0xFFA5B4FC), Color(0xFF6366F1))),
    Festival("28", "month_august", "festival_raksha_bandhan", "festival_raksha_bandhan_desc", listOf(Color(0xFFFCA5A5), Color(0xFFDC2626))),
    Festival("04", "month_september", "festival_janmashtami", "festival_janmashtami_desc", listOf(Color(0xFFFDBA74), Color(0xFFEA580C)))
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FestivalsScreen(onBack: () -> Unit) {
    Scaffold(
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0),
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(bottom = BhaktiBottomNavBarDefaults.overlayClearance + 12.dp)
        ) {
            AppTopBar(
                title = t("festivals_title"),
                leftContent = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, t("go_back"), tint = ExplorePalette.TextPrimary)
                    }
                }
            )
            Column(
                modifier = Modifier.padding(horizontal = 18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(t("festivals_subtitle"), fontSize = 14.sp, color = ExplorePalette.TextSecondary)
                festivals.forEach { f -> FestivalCard(f) }
            }
        }
    }
}

@Composable
private fun FestivalCard(f: Festival) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(ExplorePalette.Card)
            .border(1.dp, ExplorePalette.CardBorder, RoundedCornerShape(18.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Column(
            modifier = Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Brush.linearGradient(f.grad)),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(f.day, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color.White, textAlign = TextAlign.Center)
            Text(t(f.monthKey), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(alpha = 0.9f))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(t(f.nameKey), fontSize = 15.5.sp, fontWeight = FontWeight.Bold, color = ExplorePalette.TextPrimary)
            Text(t(f.subKey), fontSize = 12.5.sp, color = ExplorePalette.TextSecondary)
        }
    }
}
