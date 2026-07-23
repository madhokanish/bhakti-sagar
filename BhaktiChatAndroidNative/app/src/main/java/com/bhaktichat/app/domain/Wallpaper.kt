package com.bhaktichat.app.domain

import com.bhaktichat.app.R

/** A shareable deity wallpaper/status image — reuses the existing guide portrait art. */
data class Wallpaper(
    val id: String,
    val title: String,
    val subtitle: String,
    val imageRes: Int
)

object Wallpapers {
    // Sourced from the highest-resolution portrait already bundled per deity — no new art
    // needed for a first cut of this feature.
    val all: List<Wallpaper> = listOf(
        Wallpaper(
            id = "krishna",
            title = "Shri Krishna",
            subtitle = "Divine flute, eternal peace",
            imageRes = R.drawable.hero_krishna
        ),
        Wallpaper(
            id = "shiv",
            title = "Shiv Ji",
            subtitle = "Stillness and inner strength",
            imageRes = R.drawable.shivji
        ),
        Wallpaper(
            id = "hanuman",
            title = "Hanuman Ji",
            subtitle = "Courage and devotion",
            imageRes = R.drawable.hanumanji
        ),
        Wallpaper(
            id = "lakshmi",
            title = "Lakshmi Ji",
            subtitle = "Abundance and grace",
            imageRes = R.drawable.card_lakshmi
        ),
        Wallpaper(
            id = "shani",
            title = "Shani Dev",
            subtitle = "Discipline and truth",
            imageRes = R.drawable.card_shani
        )
    )

    fun byId(id: String): Wallpaper? = all.firstOrNull { it.id == id }
}
