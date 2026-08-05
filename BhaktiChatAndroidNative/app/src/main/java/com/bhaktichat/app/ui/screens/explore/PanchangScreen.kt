package com.bhaktichat.app.ui.screens.explore
import com.bhaktichat.app.ui.i18n.t

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material.icons.filled.WbTwilight
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PanchangScreen(onBack: () -> Unit) {
    val rows = listOf(
        t("panchang_tithi") to t("panchang_tithi_value"),
        t("panchang_nakshatra") to t("panchang_nakshatra_value"),
        t("panchang_vaar") to t("panchang_vaar_value"),
        t("panchang_yoga") to t("panchang_yoga_value"),
        t("panchang_karan") to t("panchang_karan_value"),
        t("panchang_rahu_kaal") to t("panchang_rahu_kaal_value")
    )
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
                title = t("panchang_title"),
                leftContent = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, t("go_back"), tint = ExplorePalette.TextPrimary)
                    }
                }
            )
            Column(
                modifier = Modifier.padding(horizontal = 18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(t("panchang_date_location"), fontSize = 14.sp, color = ExplorePalette.TextSecondary)

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatTile(Icons.Filled.WbSunny, t("panchang_sunrise"), t("panchang_sunrise_value"), listOf(Color(0xFFFCD34D), Color(0xFFD97706)), Modifier.weight(1f))
                    StatTile(Icons.Filled.WbTwilight, t("panchang_sunset"), t("panchang_sunset_value"), listOf(Color(0xFFA5B4FC), Color(0xFF6366F1)), Modifier.weight(1f))
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .background(ExplorePalette.Card)
                        .border(1.dp, ExplorePalette.CardBorder, RoundedCornerShape(18.dp))
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    rows.forEachIndexed { i, (k, v) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(k, fontSize = 14.sp, color = ExplorePalette.TextSecondary)
                            Text(v, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = ExplorePalette.TextPrimary)
                        }
                        if (i < rows.lastIndex) {
                            androidx.compose.material3.HorizontalDivider(color = ExplorePalette.CardBorder)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatTile(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    gradient: List<Color>,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .height(96.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Brush.linearGradient(gradient))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(icon, null, tint = Color.White, modifier = Modifier.size(22.dp))
        Text(label, fontSize = 12.sp, color = Color.White.copy(alpha = 0.9f))
        Text(value, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
    }
}
