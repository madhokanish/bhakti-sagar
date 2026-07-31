package com.bhaktichat.app.data.repo

import com.bhaktichat.app.R
import com.bhaktichat.app.domain.Reel
import com.bhaktichat.app.domain.ReelFeed

/** Devotional video feed — mirrors iOS's ReelsRepository. The `top` clips are the user's own
 * uploaded videos, streamed from the same CDN the web app serves them from (no bundled video
 * assets on Android either); `aartis` projects the existing aarti library into Reels shape. */
class ReelsRepository(
    private val aartiRepository: AartiRepository
) {
    private val mediaBaseUrl = "https://bhaktichat.com/reels"

    private val topReels: List<Reel> = listOf(
        reel(
            id = "reel-01", slug = "jai-shri-ram", title = "Jai Shri Ram",
            caption = "Jai Shri Ram. Let His name steady you when the day will not.",
            deityId = "krishna", audioTitle = "Jai Shri Ram",
            durationSeconds = 31, likeCount = 12_400,
            posterRes = R.drawable.reel_jai_shri_ram
        ),
        reel(
            id = "reel-02", slug = "jo-shri-ram", title = "Jo Shri Ram",
            caption = "जो श्री राम — the name that carries you across.",
            deityId = "krishna", audioTitle = "Jo Shri Ram",
            durationSeconds = 24, likeCount = 8_730,
            posterRes = R.drawable.reel_jo_shri_ram
        ),
        reel(
            id = "reel-03", slug = "hanuman-ji-animation", title = "Hanuman Ji",
            caption = "Courage is devotion that refused to sit down.",
            deityId = "hanuman", audioTitle = "Hanuman Chalisa",
            durationSeconds = 22, likeCount = 15_600,
            posterRes = R.drawable.reel_hanuman_ji_animation
        ),
        reel(
            id = "reel-04", slug = "trust-him-toxic-bond", title = "When He breaks a bond",
            caption = "He is the Creator. Trust Him when He destroys a toxic bond.",
            deityId = "shiv", audioTitle = "Mahadev · original audio",
            durationSeconds = 47, likeCount = 23_100,
            posterRes = R.drawable.reel_trust_him_toxic_bond
        ),
        reel(
            id = "reel-05", slug = "mahadev-ego-prayer", title = "Why the prayer went unanswered",
            caption = "You asked for peace but kept your ego. Mahadev waits for the space you make.",
            deityId = "shiv", audioTitle = "Mahadev · original audio",
            durationSeconds = 38, likeCount = 19_800,
            posterRes = R.drawable.reel_mahadev_ego_prayer
        ),
        reel(
            id = "reel-06", slug = "emptiness-he-is-waiting", title = "Where He waits",
            caption = "Sometimes the emptiness you're trying to escape is the very place He is waiting for you.",
            deityId = "shiv", audioTitle = "Mahadev · original audio",
            durationSeconds = 52, likeCount = 31_200,
            posterRes = R.drawable.reel_emptiness_he_is_waiting
        ),
        reel(
            id = "reel-07", slug = "sukoon-kisi-apne-ke-saath", title = "Sukoon",
            caption = "Kabhi kabhi sukoon kisi jagah mein nahi, kisi apne ke saath milta hai.",
            deityId = "shiv", audioTitle = "Har Har Mahadev",
            durationSeconds = 29, likeCount = 9_450,
            posterRes = R.drawable.reel_sukoon_kisi_apne_ke_saath
        ),
        reel(
            id = "reel-08", slug = "mahadev-darshan", title = "Mahadev darshan",
            caption = "Har Har Mahadev. A moment of stillness for your scroll.",
            deityId = "shiv", audioTitle = "Om Namah Shivaya",
            durationSeconds = 21, likeCount = 7_220,
            posterRes = R.drawable.reel_mahadev_darshan
        ),
        reel(
            id = "reel-09", slug = "stare-five-seconds-krishna", title = "Did you see Him?",
            caption = "Stare for 5 seconds, then close your eyes. Sometimes Krishna doesn't appear — He arrives.",
            deityId = "krishna", audioTitle = "Hare Krishna · original audio",
            durationSeconds = 18, likeCount = 27_500,
            posterRes = R.drawable.reel_stare_five_seconds_krishna
        ),
        reel(
            id = "reel-10", slug = "mahadev-sabko-bhula", title = "Sabko Bhula",
            caption = "सबको भुला के, खुद में डूब जाना — Mahadev's stillness begins here.",
            deityId = "shiv", audioTitle = "Mahadev · original audio",
            durationSeconds = 12, likeCount = 14_200,
            posterRes = R.drawable.reel_mahadev_sabko_bhula
        ),
        reel(
            id = "reel-11", slug = "yadi-tumne-varsho-tak-mehnat", title = "Years of Hard Work",
            caption = "यदि तुमने वर्षों तक मेहनत की है — Hanuman Ji reminds you it was never wasted.",
            deityId = "hanuman", audioTitle = "Hanuman Ji · original audio",
            durationSeconds = 128, likeCount = 21_800,
            posterRes = R.drawable.reel_yadi_tumne_varsho_tak_mehnat
        ),
        reel(
            id = "reel-12", slug = "jo-sadaiv-uska-dhyan-rakhta-hai", title = "Who Watches Over You",
            caption = "जो सदैव उसका ध्यान रखता है — He is always keeping watch.",
            deityId = "shiv", audioTitle = "Om Namah Shivaya",
            durationSeconds = 16, likeCount = 11_300,
            posterRes = R.drawable.reel_jo_sadaiv_uska_dhyan_rakhta_hai
        ),
        reel(
            id = "reel-13", slug = "krishna-moonlight-darshan", title = "Krishna in Moonlight",
            caption = "A quiet moonlit moment with Krishna.",
            deityId = "krishna", audioTitle = "Hare Krishna · original audio",
            durationSeconds = 10, likeCount = 9_600,
            posterRes = R.drawable.reel_krishna_moonlight_darshan
        ),
        reel(
            id = "reel-14", slug = "mahadev-nandi-sunset", title = "Mahadev & Nandi",
            caption = "Stillness beside Him — Mahadev and Nandi at rest.",
            deityId = "shiv", audioTitle = "Om Namah Shivaya",
            durationSeconds = 20, likeCount = 8_700,
            posterRes = R.drawable.reel_mahadev_nandi_sunset
        ),
        reel(
            id = "reel-15", slug = "ram-hanuman-sanyam-mein-jeete", title = "Living in Restraint",
            caption = "बल्कि अपने संयम में जीते थे — Ram lived not by his strength, but by his self-restraint.",
            deityId = "hanuman", audioTitle = "Ram · original audio",
            durationSeconds = 44, likeCount = 26_400,
            posterRes = R.drawable.reel_ram_hanuman_sanyam_mein_jeete
        ),
        reel(
            id = "reel-16", slug = "bal-katha-vachak-ram", title = "A Child's Katha",
            caption = "Faith doesn't wait to grow up — a young voice carries the Ramayana forward.",
            deityId = "krishna", audioTitle = "Ram Katha · original audio",
            durationSeconds = 10, likeCount = 18_500,
            posterRes = R.drawable.reel_bal_katha_vachak_ram
        ),
        reel(
            id = "reel-17", slug = "mahadev-updesh-waterfall", title = "What Mahadev Teaches",
            caption = "Beside the waterfall, He answers the question you were afraid to ask.",
            deityId = "shiv", audioTitle = "Mahadev · original audio",
            durationSeconds = 16, likeCount = 13_900,
            posterRes = R.drawable.reel_mahadev_updesh_waterfall
        ),
        reel(
            id = "reel-18", slug = "hanuman-ji-tejas-portrait", title = "Hanuman Ji",
            caption = "Strength that needs no words.",
            deityId = "hanuman", audioTitle = "Hanuman Chalisa",
            durationSeconds = 20, likeCount = 22_700,
            posterRes = R.drawable.reel_hanuman_ji_tejas_portrait
        ),
        reel(
            id = "reel-19", slug = "hanuman-ashirwad-modern-life", title = "His Blessing, Your Day",
            caption = "Even with your phone in hand, His hand is on your head.",
            deityId = "hanuman", audioTitle = "Hanuman Ji · original audio",
            durationSeconds = 35, likeCount = 17_300,
            posterRes = R.drawable.reel_hanuman_ashirwad_modern_life
        ),
        reel(
            id = "reel-20", slug = "suljhao-bhagwan-hanuman", title = "Suljhao Bhagwan",
            caption = "सुलझाओ भगवन — some nights, all you can do is ask Him to untangle it.",
            deityId = "hanuman", audioTitle = "Sitaram · original audio",
            durationSeconds = 12, likeCount = 15_100,
            posterRes = R.drawable.reel_suljhao_bhagwan_hanuman
        ),
        reel(
            id = "reel-21", slug = "krishna-meri-baat-sun-lena", title = "Sun Lena",
            caption = "तो मेरी बात सुन लेना — whatever you can't tell anyone else, tell Krishna.",
            deityId = "krishna", audioTitle = "Krishna · original audio",
            durationSeconds = 20, likeCount = 24_600,
            posterRes = R.drawable.reel_krishna_meri_baat_sun_lena
        ),
        reel(
            id = "reel-22", slug = "shabari-ram-charo-dham", title = "Shabari's Berries",
            caption = "Devotion doesn't need to be perfect — it only needs to be offered with love.",
            deityId = "krishna", audioTitle = "Ram · original audio",
            durationSeconds = 15, likeCount = 12_800,
            posterRes = R.drawable.reel_shabari_ram_charo_dham
        )
    )

    private fun reel(
        id: String,
        slug: String,
        title: String,
        caption: String,
        deityId: String,
        audioTitle: String,
        durationSeconds: Int,
        likeCount: Long,
        posterRes: Int
    ) = Reel(
        id = id,
        slug = slug,
        title = title,
        caption = caption,
        creatorName = "BhaktiChat",
        creatorAvatarRes = R.drawable.bhaktichat_logo,
        deityId = deityId,
        audioTitle = audioTitle,
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
                    posterRes = null,
                    feed = ReelFeed.AARTIS
                )
            }
    }
}
