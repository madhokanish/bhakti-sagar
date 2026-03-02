package com.bhaktichat.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp

@Composable
fun TopFocusedImage(
    imageRes: Int,
    contentDescription: String,
    modifier: Modifier = Modifier,
    shape: Shape = RectangleShape,
    scaleX: Float = 1f,
    scaleY: Float = 1f
) {
    // Use a uniform zoom factor so top-focused crops do not distort faces.
    val zoom = maxOf(1f, scaleX, scaleY)
    val imageModifier = if (zoom > 1.01f) {
        Modifier
            .fillMaxSize()
            .graphicsLayer {
                transformOrigin = TransformOrigin(0.5f, 0f)
                this.scaleX = zoom
                this.scaleY = zoom
            }
    } else {
        Modifier.fillMaxSize()
    }

    Box(
        modifier = modifier.clip(shape)
    ) {
        Image(
            painter = painterResource(id = imageRes),
            contentDescription = contentDescription,
            contentScale = ContentScale.Crop,
            alignment = Alignment.TopCenter,
            modifier = imageModifier
        )
    }
}

@Composable
fun GuideAvatar(
    avatarRes: Int,
    contentDescription: String,
    sizeDp: Int = 36,
    verticalBias: Float = -1f
) {
    TopFocusedImage(
        imageRes = avatarRes,
        contentDescription = contentDescription,
        modifier = Modifier.size(sizeDp.dp),
        shape = CircleShape,
        scaleX = 1f,
        scaleY = 1f
    )
}
