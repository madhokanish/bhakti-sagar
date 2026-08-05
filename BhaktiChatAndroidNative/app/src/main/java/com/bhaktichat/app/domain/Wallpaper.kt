package com.bhaktichat.app.domain

import com.bhaktichat.app.R

/**
 * A shareable deity wallpaper/status image — reuses the existing guide portrait art.
 *
 * Display copy deliberately lives in the translation table, not here: every screen resolves
 * `t("wallpaper_title_{id}")` / `t("wallpaper_subtitle_{id}")`, so titles follow the user's
 * chosen language instead of being pinned to whatever was hardcoded at construction.
 */
data class Wallpaper(
    val id: String,
    val imageRes: Int
)

object Wallpapers {
    // Sourced from the highest-resolution portrait already bundled per deity — no new art
    // needed for a first cut of this feature.
    val all: List<Wallpaper> = listOf(
        Wallpaper(
            id = "krishna",
            imageRes = R.drawable.hero_krishna
        ),
        Wallpaper(
            id = "shiv",
            imageRes = R.drawable.shivji
        ),
        Wallpaper(
            id = "hanuman",
            imageRes = R.drawable.hanumanji
        ),
        Wallpaper(
            id = "lakshmi",
            imageRes = R.drawable.card_lakshmi
        ),
        Wallpaper(
            id = "shani",
            imageRes = R.drawable.card_shani
        ),

        // Sourced from the per-aarti deity portraits generated for the Aartis feature.
        Wallpaper(
            id = "annapurna",
            imageRes = R.drawable.aarti_shri_annapurna_ji_ki_aarati
        ),
        Wallpaper(
            id = "ekadashi",
            imageRes = R.drawable.aarti_shri_ekadashi_mata_ki_aarati
        ),
        Wallpaper(
            id = "kali",
            imageRes = R.drawable.aarti_shri_kali_mata_ki_aarati
        ),
        Wallpaper(
            id = "ganga",
            imageRes = R.drawable.aarti_shri_ganga_ji_ki_aarati
        ),
        Wallpaper(
            id = "gayatri",
            imageRes = R.drawable.aarti_shri_gayatri_mata_ki_aarati
        ),
        Wallpaper(
            id = "chitragupt",
            imageRes = R.drawable.aarti_shri_chitragupt_ji_ki_aarati
        ),
        Wallpaper(
            id = "tulsi",
            imageRes = R.drawable.aarti_shri_tulsi_ji_ki_aarati
        ),
        Wallpaper(
            id = "durga",
            imageRes = R.drawable.aarti_shri_durga_ji_ki_aarati
        ),
        Wallpaper(
            id = "parvati",
            imageRes = R.drawable.aarti_shri_parvati_ji_ki_aarati
        ),
        Wallpaper(
            id = "brihaspati",
            imageRes = R.drawable.aarti_shri_brihaspati_dev_ki_aarati
        ),
        Wallpaper(
            id = "hari-vishnu",
            imageRes = R.drawable.aarti_shri_hari_vishnu_ji_ki_aarati
        ),
        Wallpaper(
            id = "ramchandra",
            imageRes = R.drawable.aarti_shri_ramchandra_ji_ki_aarati
        ),
        Wallpaper(
            id = "lalita",
            imageRes = R.drawable.aarti_shri_lalita_mata_ki_aarati
        ),
        Wallpaper(
            id = "vaishno-devi",
            imageRes = R.drawable.aarti_shri_vaishno_devi_ki_aarati
        ),
        Wallpaper(
            id = "shani-dev-aarti",
            imageRes = R.drawable.aarti_shri_shani_dev_ji_ki_aarati
        ),
        Wallpaper(
            id = "santoshi",
            imageRes = R.drawable.aarti_shri_santoshi_mata_ki_aarati
        ),
        Wallpaper(
            id = "satyanarayan",
            imageRes = R.drawable.aarti_shri_satyanarayan_ji_ki_aarati
        ),
        Wallpaper(
            id = "saraswati",
            imageRes = R.drawable.aarti_shri_saraswati_ji_ki_aarati
        ),
        Wallpaper(
            id = "sita",
            imageRes = R.drawable.aarti_shri_sita_ji_ki_aarati
        ),
        Wallpaper(
            id = "surya",
            imageRes = R.drawable.aarti_shri_surya_dev_ki_aarati
        )
    )

    fun byId(id: String): Wallpaper? = all.firstOrNull { it.id == id }
}
