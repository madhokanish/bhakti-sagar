package com.bhaktichat.app.domain

/**
 * Prefix prepended to every Divine Image prompt. The wording is intentionally
 * verbose — gpt-image-1 responds to explicit identity-preservation language,
 * and the negative phrasing helps prevent the most common face-distortion
 * failure modes (smoothed skin, anime-fied features, fused subjects, etc.).
 *
 * Keep this in sync with `BhaktiChatiOS/.../DivineTemplateCatalog.swift`
 * (`identityPrefix`).
 */
const val DIVINE_IDENTITY_REALISM_PREFIX = """CRITICAL IDENTITY LOCK — read this first. It overrides every other instruction below.

This is a PHOTO EDIT of the uploaded photo, not a brand-new image. The uploaded photo already contains the real person; your only job is to place THAT EXACT PERSON — with their face copied over essentially unchanged — into a sacred Hindu devotional scene. Do NOT invent a new face, a look-alike, a relative, or an "improved" version of them. Copy the person's head and face from the uploaded photo as directly as possible and keep facial geometry, identity, and proportions faithful to the original pixels. Never alter, stylize, beautify, slim, smooth, re-shape into a different face, idealize, anime-fy, age, or de-age the face in any way.

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
- Natural soft directional lighting that keeps real skin texture fully visible — never smoothed, airbrushed, or beautified.
- Visible high-frequency skin detail; no AI-smoothed, plastic, or wax-like skin.
- Anatomically correct hands, fingers, ears, and proportions.
- No duplicated facial features, no fused fingers, no extra limbs, no warped facial geometry, no asymmetric eyes, no merging of the person's features with the deity.

The uploaded person is the subject; the deity and environment are supporting context. When in doubt, copy the reference face exactly rather than "improving" it. If the person is not instantly recognizable as the same individual from the uploaded photo, the result is a failure and must not be produced."""
