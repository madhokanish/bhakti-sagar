package com.bhaktichat.app.ui.screens.explore

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.filled.Wallpaper
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bhaktichat.app.domain.Wallpapers
import com.bhaktichat.app.ui.components.shell.AppTopBar
import com.bhaktichat.app.ui.i18n.t
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBarDefaults

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WallpapersScreen(
    onBack: () -> Unit,
    onOpenWallpaper: (String) -> Unit
) {
    Scaffold(
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0),
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            AppTopBar(
                title = t("wallpapers_title"),
                leftContent = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, t("back"), tint = ExplorePalette.TextPrimary)
                    }
                }
            )
            Text(
                text = t("wallpapers_subtitle"),
                fontSize = 13.sp,
                color = ExplorePalette.TextSecondary,
                modifier = Modifier.padding(start = 18.dp, end = 18.dp, top = 2.dp, bottom = 12.dp)
            )
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    start = 18.dp,
                    end = 18.dp,
                    bottom = BhaktiBottomNavBarDefaults.overlayClearance + 16.dp
                ),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(Wallpapers.all, key = { it.id }) { wallpaper ->
                    WallpaperTile(
                        title = t("wallpaper_title_${wallpaper.id}"),
                        subtitle = t("wallpaper_subtitle_${wallpaper.id}"),
                        imageRes = wallpaper.imageRes,
                        onClick = { onOpenWallpaper(wallpaper.id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun WallpaperTile(
    title: String,
    subtitle: String,
    imageRes: Int,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(0.72f)
            .clip(RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
    ) {
        Image(
            painter = painterResource(id = imageRes),
            contentDescription = title,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.45f to Color.Transparent,
                        1f to Color.Black.copy(alpha = 0.78f)
                    )
                )
        )
        // Small glass badge, top-right — signals "tap for actions" without cluttering the art.
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(10.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(Color.Black.copy(alpha = 0.35f))
                .padding(6.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.Wallpaper,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.padding(2.dp)
            )
        }
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(title, fontSize = 15.5.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text(subtitle, fontSize = 11.5.sp, color = Color.White.copy(alpha = 0.85f))
        }
    }
}
