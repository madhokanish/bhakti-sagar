package com.bhaktichat.app.ui.components.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bhaktichat.app.R
import com.bhaktichat.app.ui.i18n.t

/**
 * Home-screen चढ़ावा offer: temple artwork, what the subscription contains, one CTA.
 *
 * Every bullet describes a feature the subscription actually unlocks. Deliberately no claims
 * about what an offering will do in the user's life — outcomes around health, childbirth,
 * marriage or prosperity are not ours to promise, they are the fastest route to a Play
 * takedown, and for a devotional audience they are the difference between an offer and a
 * confidence trick. The artwork carries the devotional weight instead.
 */
@Composable
fun ChadhaavaBenefitsCard(onOpen: () -> Unit, modifier: Modifier = Modifier) {
    val benefits = listOf(
        "chadhaava_card_benefit_1",
        "chadhaava_card_benefit_2",
        "chadhaava_card_benefit_3",
        "chadhaava_card_benefit_4"
    )
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF7A1B36), Color(0xFF5A1228))
                )
            )
            .clickable(onClick = onOpen)
    ) {
        Box(modifier = Modifier.fillMaxWidth().height(132.dp)) {
            Image(
                painter = painterResource(R.drawable.chadhaava_temple),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            // Fades the artwork into the card body so the heading below never sits on a
            // hard seam, whatever crop the device width produces.
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colorStops = arrayOf(
                                0f to Color.Transparent,
                                0.72f to Color(0x407A1B36),
                                1f to Color(0xFF7A1B36)
                            )
                        )
                    )
            )
        }

        Column(
            modifier = Modifier.padding(start = 18.dp, end = 18.dp, top = 2.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(9.dp)
        ) {
            Text(
                text = t("chadhaava_card_title"),
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold
            )
            benefits.forEach { key ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.ChevronRight,
                        contentDescription = null,
                        tint = Color(0xFFF6C04A),
                        modifier = Modifier.size(19.dp)
                    )
                    Text(
                        text = t(key),
                        color = Color(0xF2FFFFFF),
                        fontSize = 14.sp,
                        lineHeight = 19.sp,
                        modifier = Modifier.padding(start = 7.dp)
                    )
                }
            }
            Box(
                modifier = Modifier
                    .padding(top = 6.dp)
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(26.dp))
                    .background(Color(0xFFF6C04A))
                    .clickable(onClick = onOpen)
                    .padding(vertical = 13.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = t("chadhaava_card_cta"),
                    color = Color(0xFF3A2410),
                    fontSize = 15.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center
                )
            }
            Text(
                text = t("chadhaava_card_footnote"),
                color = Color(0x99FFFFFF),
                fontSize = 11.5.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
