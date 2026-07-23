import Foundation

enum DivineTemplateCatalog {
    static let identityPrefix = """
    CRITICAL IDENTITY LOCK — read before generating.

    You are performing a photorealistic composite of a real person into a sacred Hindu devotional scene. The face from the uploaded reference photo must be preserved with absolute fidelity. Treat the uploaded face as a fixed reference image — its facial geometry, identity, and proportions are NOT to be altered, stylized, beautified, smoothed, idealized, anime-fied, or re-imagined in any way.

    Strict face-preservation rules:
    - Eyes: exact shape, color, spacing, eyelid fold, and gaze must match the reference. No enlargement, no symmetrization.
    - Nose: exact bridge width, tip shape, and nostril structure as in the reference.
    - Mouth and lips: same shape, fullness, and natural resting expression.
    - Skin: identical skin tone, undertone, freckles, moles, scars, and natural texture (visible pores, fine lines). Do not smooth, airbrush, or de-age the skin.
    - Facial hair: replicate beard, moustache, sideburn shape and density exactly. Do not add or remove facial hair.
    - Hairline and hairstyle: preserve hair color, length, parting, and hairline shape from the reference.
    - Age, gender, ethnicity, and body weight: exactly as in the reference.
    - Expression: keep the same natural micro-expression as the reference. Do not force a smile or exaggerate emotion.
    - The person must be instantly recognizable to anyone who knows them.

    Output quality:
    - Photorealistic DSLR look, 85mm portrait lens feel, full-frame sensor, natural depth of field.
    - Natural soft directional lighting that flatters skin without flattening texture.
    - Visible high-frequency skin detail; no AI-smoothed, plastic, or wax-like skin.
    - Anatomically correct hands, fingers, ears, and proportions.
    - No duplicated facial features, no fused fingers, no extra limbs, no warped facial geometry, no asymmetric eyes, no merging of the person's features with the deity.

    The uploaded person is the subject. The deity and environment are the supporting context. If the face fails to match the upload, the output is unusable.
    """

    private static let godPromptTemplate = """
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
    """

    private static let templePromptTemplate = """
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
    """

    static let deityOptions = [
        "Lord Krishna", "Shiv Ji", "Hanuman Ji", "Lakshmi Ji", "Ganesh Ji"
    ]

    static let sceneOptions = [
        "blessing you", "standing beside you", "walking with you", "protecting you", "in temple darshan"
    ]

    static let templeOptions = [
        "Kashi Vishwanath", "Somnath", "Mahakaleshwar", "Tirupati", "Siddhivinayak"
    ]

    static let templeMoments = [
        "during aarti", "while offering flowers", "at sunrise darshan", "prayer in main mandir", "with diyas lit"
    ]

    static let templates: [DivineTemplate] = [
        DivineTemplate(
            id: "photo_with_god",
            mode: .photoWithGod,
            title: "Photo with God",
            description: "Create a sacred photo with your chosen deity",
            thumbnailAssetName: "photo_with_god",
            promptSkeleton: godPromptTemplate,
            deityTag: nil,
            templeName: nil,
            sceneName: nil
        ),
        DivineTemplate(
            id: "photo_at_temple",
            mode: .photoAtTemple,
            title: "Photo at Temple",
            description: "Place yourself at a sacred temple",
            thumbnailAssetName: "photo_at_temple",
            promptSkeleton: templePromptTemplate,
            deityTag: nil,
            templeName: nil,
            sceneName: nil
        ),
        DivineTemplate(
            id: "krishna_blessing_you",
            mode: .photoWithGod,
            title: "Lord Krishna blessing you",
            description: "One tap devotional setup",
            thumbnailAssetName: "card_krishna",
            promptSkeleton: godPromptTemplate,
            deityTag: "Lord Krishna",
            templeName: nil,
            sceneName: "blessing you"
        ),
        DivineTemplate(
            id: "hanuman_protecting_you",
            mode: .photoWithGod,
            title: "Hanuman Ji protecting you",
            description: "One tap devotional setup",
            thumbnailAssetName: "hanumanji",
            promptSkeleton: godPromptTemplate,
            deityTag: "Hanuman Ji",
            templeName: nil,
            sceneName: "protecting you"
        ),
        DivineTemplate(
            id: "shiva_meditating_beside_you",
            mode: .photoWithGod,
            title: "Shiv Ji meditating beside you",
            description: "One tap devotional setup",
            thumbnailAssetName: "shivji",
            promptSkeleton: godPromptTemplate,
            deityTag: "Shiv Ji",
            templeName: nil,
            sceneName: "standing beside you"
        ),
        DivineTemplate(
            id: "lakshmi_blessing_your_home",
            mode: .photoWithGod,
            title: "Lakshmi Ji blessing your home",
            description: "One tap devotional setup",
            thumbnailAssetName: "card_lakshmi",
            promptSkeleton: godPromptTemplate,
            deityTag: "Lakshmi Ji",
            templeName: nil,
            sceneName: "blessing you"
        )
    ]

    static var homeOptions: [DivineTemplate] {
        templates.filter { $0.id == "photo_with_god" || $0.id == "photo_at_temple" }
    }

    static var inspirations: [DivineTemplate] {
        templates.filter { $0.id != "photo_with_god" && $0.id != "photo_at_temple" }
    }

    static func byId(_ id: String) -> DivineTemplate? {
        templates.first { $0.id == id }
    }
}
