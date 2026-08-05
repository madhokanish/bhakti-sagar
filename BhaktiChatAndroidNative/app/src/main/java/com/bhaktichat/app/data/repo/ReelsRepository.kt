package com.bhaktichat.app.data.repo

import android.content.Context

import com.bhaktichat.app.R
import com.bhaktichat.app.domain.Reel
import com.bhaktichat.app.domain.ReelFeed
import com.bhaktichat.app.ui.screens.aartis.components.aartiImageRes

/** Devotional video feed — mirrors iOS's ReelsRepository. The `top` clips are the user's own
 * uploaded videos, streamed from the same CDN the web app serves them from (no bundled video
 * assets on Android either); `aartis` projects the existing aarti library into Reels shape. */
class ReelsRepository(
    private val context: Context,
    private val aartiRepository: AartiRepository
) {
    private val mediaBaseUrl = "https://bhaktichat.com/reels"

    private val topReels: List<Reel> = listOf(
        reel(
            id = "reel-01", slug = "jai-shri-ram",
            deityId = "krishna",
            durationSeconds = 31, likeCount = 12_400,
            posterRes = R.drawable.reel_jai_shri_ram
        ),
        reel(
            id = "reel-02", slug = "jo-shri-ram",
            deityId = "krishna",
            durationSeconds = 24, likeCount = 8_730,
            posterRes = R.drawable.reel_jo_shri_ram
        ),
        reel(
            id = "reel-03", slug = "hanuman-ji-animation",
            deityId = "hanuman",
            durationSeconds = 22, likeCount = 15_600,
            posterRes = R.drawable.reel_hanuman_ji_animation
        ),
        reel(
            id = "reel-04", slug = "trust-him-toxic-bond",
            deityId = "shiv",
            durationSeconds = 47, likeCount = 23_100,
            posterRes = R.drawable.reel_trust_him_toxic_bond
        ),
        reel(
            id = "reel-05", slug = "mahadev-ego-prayer",
            deityId = "shiv",
            durationSeconds = 38, likeCount = 19_800,
            posterRes = R.drawable.reel_mahadev_ego_prayer
        ),
        reel(
            id = "reel-06", slug = "emptiness-he-is-waiting",
            deityId = "shiv",
            durationSeconds = 52, likeCount = 31_200,
            posterRes = R.drawable.reel_emptiness_he_is_waiting
        ),
        reel(
            id = "reel-07", slug = "sukoon-kisi-apne-ke-saath",
            deityId = "shiv",
            durationSeconds = 29, likeCount = 9_450,
            posterRes = R.drawable.reel_sukoon_kisi_apne_ke_saath
        ),
        reel(
            id = "reel-08", slug = "mahadev-darshan",
            deityId = "shiv",
            durationSeconds = 21, likeCount = 7_220,
            posterRes = R.drawable.reel_mahadev_darshan
        ),
        reel(
            id = "reel-09", slug = "stare-five-seconds-krishna",
            deityId = "krishna",
            durationSeconds = 18, likeCount = 27_500,
            posterRes = R.drawable.reel_stare_five_seconds_krishna
        ),
        reel(
            id = "reel-10", slug = "mahadev-sabko-bhula",
            deityId = "shiv",
            durationSeconds = 12, likeCount = 14_200,
            posterRes = R.drawable.reel_mahadev_sabko_bhula
        ),
        reel(
            id = "reel-11", slug = "yadi-tumne-varsho-tak-mehnat",
            deityId = "hanuman",
            durationSeconds = 128, likeCount = 21_800,
            posterRes = R.drawable.reel_yadi_tumne_varsho_tak_mehnat
        ),
        reel(
            id = "reel-12", slug = "jo-sadaiv-uska-dhyan-rakhta-hai",
            deityId = "shiv",
            durationSeconds = 16, likeCount = 11_300,
            posterRes = R.drawable.reel_jo_sadaiv_uska_dhyan_rakhta_hai
        ),
        reel(
            id = "reel-13", slug = "krishna-moonlight-darshan",
            deityId = "krishna",
            durationSeconds = 10, likeCount = 9_600,
            posterRes = R.drawable.reel_krishna_moonlight_darshan
        ),
        reel(
            id = "reel-14", slug = "mahadev-nandi-sunset",
            deityId = "shiv",
            durationSeconds = 20, likeCount = 8_700,
            posterRes = R.drawable.reel_mahadev_nandi_sunset
        ),
        reel(
            id = "reel-15", slug = "ram-hanuman-sanyam-mein-jeete",
            deityId = "hanuman",
            durationSeconds = 44, likeCount = 26_400,
            posterRes = R.drawable.reel_ram_hanuman_sanyam_mein_jeete
        ),
        reel(
            id = "reel-16", slug = "bal-katha-vachak-ram",
            deityId = "krishna",
            durationSeconds = 10, likeCount = 18_500,
            posterRes = R.drawable.reel_bal_katha_vachak_ram
        ),
        reel(
            id = "reel-17", slug = "mahadev-updesh-waterfall",
            deityId = "shiv",
            durationSeconds = 16, likeCount = 13_900,
            posterRes = R.drawable.reel_mahadev_updesh_waterfall
        ),
        reel(
            id = "reel-18", slug = "hanuman-ji-tejas-portrait",
            deityId = "hanuman",
            durationSeconds = 20, likeCount = 22_700,
            posterRes = R.drawable.reel_hanuman_ji_tejas_portrait
        ),
        reel(
            id = "reel-19", slug = "hanuman-ashirwad-modern-life",
            deityId = "hanuman",
            durationSeconds = 35, likeCount = 17_300,
            posterRes = R.drawable.reel_hanuman_ashirwad_modern_life
        ),
        reel(
            id = "reel-20", slug = "suljhao-bhagwan-hanuman",
            deityId = "hanuman",
            durationSeconds = 12, likeCount = 15_100,
            posterRes = R.drawable.reel_suljhao_bhagwan_hanuman
        ),
        reel(
            id = "reel-21", slug = "krishna-meri-baat-sun-lena",
            deityId = "krishna",
            durationSeconds = 20, likeCount = 24_600,
            posterRes = R.drawable.reel_krishna_meri_baat_sun_lena
        ),
        reel(
            id = "reel-22", slug = "shabari-ram-charo-dham",
            deityId = "krishna",
            durationSeconds = 15, likeCount = 12_800,
            posterRes = R.drawable.reel_shabari_ram_charo_dham
        )
    )

    private fun reel(
        id: String,
        slug: String,
        deityId: String,
        durationSeconds: Int,
        likeCount: Long,
        posterRes: Int
    ) = Reel(
        id = id,
        slug = slug,
        // Static TOP reels resolve their copy from the slug at render time via
        // Reel.displayTitle()/displayCaption()/displayAudioTitle(), so the feed follows the
        // user's language. The aarti-derived feed below still carries real strings, which
        // come from assets/aartis.json.
        title = "",
        caption = "",
        creatorName = "BhaktiChat",
        creatorAvatarRes = R.drawable.bhaktichat_logo,
        deityId = deityId,
        audioTitle = "",
        durationSeconds = durationSeconds,
        likeCount = likeCount,
        videoUrl = "$mediaBaseUrl/$slug.mp4",
        hasVideoTrack = true,
        posterRes = posterRes,
        feed = ReelFeed.TOP
    )

    suspend fun reels(feed: ReelFeed): List<Reel> = when (feed) {
        ReelFeed.TOP -> topReels
        ReelFeed.AARTIS -> aartiRepository.loadAartis()
            .filter { it.hasAudio }
            .map { aarti ->
                Reel(
                    id = "aarti-${aarti.id}",
                    slug = aarti.slug,
                    title = aarti.title,
                    caption = aarti.subtitle ?: aarti.title,
                    creatorName = "BhaktiChat",
                    creatorAvatarRes = R.drawable.bhaktichat_logo,
                    deityId = aarti.deity.name.lowercase(),
                    audioTitle = aarti.title,
                    durationSeconds = (aarti.durationMinutes ?: 3) * 60,
                    likeCount = aarti.popularityCount ?: 0L,
                    videoUrl = aarti.audioUrl,
                    hasVideoTrack = false,
                    // Per-deity artwork, resolved by the same helper the Aarti list and the
                    // full-screen player use, so a reel and its aarti row never disagree.
                    posterRes = aartiImageRes(context, aarti),
                    feed = ReelFeed.AARTIS
                )
            }
    }
}
