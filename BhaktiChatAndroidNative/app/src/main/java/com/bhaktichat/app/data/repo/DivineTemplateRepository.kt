package com.bhaktichat.app.data.repo

import com.bhaktichat.app.R
import com.bhaktichat.app.domain.AppLanguage
import com.bhaktichat.app.domain.DivineMode
import com.bhaktichat.app.domain.DivineTemplate

interface DivineTemplateRepository {
    fun getHomeOptions(): List<DivineTemplate>
    fun getInspirations(): List<DivineTemplate>
    fun getTemplate(templateId: String): DivineTemplate?
}

class StaticDivineTemplateRepository : DivineTemplateRepository {
    private val godPromptTemplate = """
        PRIMARY GOAL: A photorealistic composite of the uploaded person alongside Lord [DEITY NAME] in a sacred Hindu devotional scene.

        Reference subject: Treat the uploaded photo as the ground-truth reference for the person's face, hair, skin tone, age, and expression. Their face must remain identical to the upload — see the IDENTITY LOCK rules above.

        Scene: [SCENE NAME]

        Composition:
        - Frame the uploaded person from the chest up or three-quarter length, naturally turned toward or beside Lord [DEITY NAME].
        - Lord [DEITY NAME] appears as a traditional Hindu devotional figure: divine posture, serene expression, correct classical iconography (attributes, vahana, garments true to scripture), with a soft glowing aura.
        - Person and deity must be clearly distinct — never blend, merge, or hybridize facial features.
        - Believable eye-level scale and real-world proportions between the two subjects.

        Lighting:
        - Warm golden-hour temple lighting; soft diya / oil-lamp glow on the person's face from below-front; subtle rim light from the deity's aura.
        - Realistic shadows on both subjects matching one consistent light direction.

        Environment:
        - Sacred Hindu temple or shrine setting: marble or sandstone interior, carved pillars, brass bells, lit diyas, fresh marigold and lotus garlands, faint incense smoke, soft bokeh background.

        Style:
        - Ultra-realistic photography blended with classical Hindu devotional art aesthetic.
        - DSLR portrait look, 85mm lens, shallow depth of field, natural film grain.
        - Warm, reverent color grading — not over-saturated, not HDR-crunchy.

        The final image must read as a real photograph of the uploaded person experiencing a sacred moment with Lord [DEITY NAME], with the person's face preserved pixel-faithfully from the upload.
    """.trimIndent()

    private val templePromptTemplate = """
        PRIMARY GOAL: A photorealistic photograph of the uploaded person inside [TEMPLE NAME] during [SCENE NAME].

        Reference subject: Treat the uploaded photo as the ground-truth reference for the person's face, hair, skin tone, age, and expression. Their face must remain identical to the upload — see the IDENTITY LOCK rules above.

        Setting: [TEMPLE NAME]
        Moment: [SCENE NAME]

        Composition:
        - Frame the uploaded person from the chest up or three-quarter length, standing peacefully or with hands folded in pranam if appropriate.
        - The architectural identity of [TEMPLE NAME] must be clearly recognizable: correct shikhara, garbhagriha, mandapa, or characteristic features faithful to that specific temple.
        - Background includes authentic temple elements: stone carvings, brass bells, oil lamps, marigold garlands, faint incense haze, distant devotees softly out of focus.

        Lighting:
        - Warm golden sunlight or diya glow appropriate to the time of day implied by [SCENE NAME].
        - Soft directional light shaping the person's face naturally; one consistent shadow direction.

        Style:
        - Ultra-realistic travel-portrait photography.
        - DSLR look, 85mm lens, shallow depth of field, natural film grain, natural color grading.
        - Skin retains visible texture; no AI-smoothed or plastic look.

        The result must look like a real, candid photograph of the uploaded person inside [TEMPLE NAME], with their face preserved pixel-faithfully from the upload.
    """.trimIndent()

    private val templates = listOf(
        DivineTemplate(
            id = "photo_with_god",
            mode = DivineMode.PHOTO_WITH_GOD,
            titles = mapOf(
                AppLanguage.HINGLISH to "Photo with God",
                AppLanguage.HINDI to "भगवान के साथ फोटो",
                AppLanguage.ENGLISH to "Photo with God"
            ),
            descriptions = mapOf(
                AppLanguage.HINGLISH to "Create a sacred photo with your chosen deity",
                AppLanguage.HINDI to "अपने आराध्य के साथ एक दिव्य छवि बनाएँ",
                AppLanguage.ENGLISH to "Create a sacred photo with your chosen deity"
            ),
            thumbnailRes = R.drawable.photo_with_god,
            promptSkeleton = godPromptTemplate,
            isHomePrimary = true
        ),
        DivineTemplate(
            id = "photo_at_temple",
            mode = DivineMode.PHOTO_AT_TEMPLE,
            titles = mapOf(
                AppLanguage.HINGLISH to "Photo at Temple",
                AppLanguage.HINDI to "मंदिर में फोटो",
                AppLanguage.ENGLISH to "Photo at Temple"
            ),
            descriptions = mapOf(
                AppLanguage.HINGLISH to "Place yourself at a sacred temple",
                AppLanguage.HINDI to "अपनी फोटो को पवित्र मंदिर के दृश्य में सजाएँ",
                AppLanguage.ENGLISH to "Place yourself at a sacred temple"
            ),
            thumbnailRes = R.drawable.photo_at_temple,
            promptSkeleton = templePromptTemplate,
            isHomePrimary = true
        ),
        DivineTemplate(
            id = "krishna_blessing_you",
            mode = DivineMode.PHOTO_WITH_GOD,
            titles = mapOf(
                AppLanguage.HINGLISH to "Lord Krishna blessing you",
                AppLanguage.HINDI to "श्री कृष्ण का आशीर्वाद",
                AppLanguage.ENGLISH to "Lord Krishna blessing you"
            ),
            descriptions = mapOf(
                AppLanguage.HINGLISH to "One tap devotional setup",
                AppLanguage.HINDI to "एक टैप में श्री कृष्ण के साथ दिव्य छवि",
                AppLanguage.ENGLISH to "One tap devotional setup"
            ),
            thumbnailRes = R.drawable.card_krishna,
            promptSkeleton = godPromptTemplate,
            deityTag = "Lord Krishna",
            sceneName = "Lord Krishna blessing you"
        ),
        DivineTemplate(
            id = "hanuman_protecting_you",
            mode = DivineMode.PHOTO_WITH_GOD,
            titles = mapOf(
                AppLanguage.HINGLISH to "Hanuman Ji protecting you",
                AppLanguage.HINDI to "हनुमान जी का रक्षा-आशीर्वाद",
                AppLanguage.ENGLISH to "Hanuman Ji protecting you"
            ),
            descriptions = mapOf(
                AppLanguage.HINGLISH to "One tap devotional setup",
                AppLanguage.HINDI to "एक टैप में हनुमान जी के साथ दिव्य छवि",
                AppLanguage.ENGLISH to "One tap devotional setup"
            ),
            thumbnailRes = R.drawable.hanumanji,
            promptSkeleton = godPromptTemplate,
            deityTag = "Hanuman Ji",
            sceneName = "Hanuman Ji protecting you"
        ),
        DivineTemplate(
            id = "shiva_meditating_beside_you",
            mode = DivineMode.PHOTO_WITH_GOD,
            titles = mapOf(
                AppLanguage.HINGLISH to "Shiv Ji meditating beside you",
                AppLanguage.HINDI to "आपके साथ ध्यानमग्न शिव जी",
                AppLanguage.ENGLISH to "Shiv Ji meditating beside you"
            ),
            descriptions = mapOf(
                AppLanguage.HINGLISH to "One tap devotional setup",
                AppLanguage.HINDI to "एक टैप में शिव जी के साथ दिव्य छवि",
                AppLanguage.ENGLISH to "One tap devotional setup"
            ),
            thumbnailRes = R.drawable.shivji,
            promptSkeleton = godPromptTemplate,
            deityTag = "Shiv Ji",
            sceneName = "Shiv Ji meditating beside you"
        ),
        DivineTemplate(
            id = "lakshmi_blessing_your_home",
            mode = DivineMode.PHOTO_WITH_GOD,
            titles = mapOf(
                AppLanguage.HINGLISH to "Lakshmi Ji blessing your home",
                AppLanguage.HINDI to "आपके घर में लक्ष्मी जी का आशीर्वाद",
                AppLanguage.ENGLISH to "Lakshmi Ji blessing your home"
            ),
            descriptions = mapOf(
                AppLanguage.HINGLISH to "One tap devotional setup",
                AppLanguage.HINDI to "एक टैप में लक्ष्मी जी के साथ दिव्य छवि",
                AppLanguage.ENGLISH to "One tap devotional setup"
            ),
            thumbnailRes = R.drawable.card_lakshmi,
            promptSkeleton = godPromptTemplate,
            deityTag = "Lakshmi Ji",
            sceneName = "Lakshmi Ji blessing your home"
        )
    )

    override fun getHomeOptions(): List<DivineTemplate> =
        templates.filter { it.isHomePrimary }

    override fun getInspirations(): List<DivineTemplate> =
        templates.filterNot { it.isHomePrimary }

    override fun getTemplate(templateId: String): DivineTemplate? =
        templates.firstOrNull { it.id == templateId }
}
