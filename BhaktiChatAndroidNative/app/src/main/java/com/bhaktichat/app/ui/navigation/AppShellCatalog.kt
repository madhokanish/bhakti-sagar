package com.bhaktichat.app.ui.navigation

import androidx.annotation.DrawableRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.ui.graphics.vector.ImageVector
import com.bhaktichat.app.R

/**
 * Identity and artwork only — no display copy. Titles and promises are resolved by the
 * screens through `t("guide_title_{id}")` / `t("guide_promise_{id}")`, so they follow the
 * chosen language. [fallbackLetterKey] is a translation key, not a letter.
 */
data class DiscoveryGuideConfig(
    val id: String,
    @DrawableRes val imageRes: Int?,
    val fallbackLetterKey: String,
    val available: Boolean = true
)

/**
 * Identity, icon and routing only. Title and the prompt sent to the guide are resolved via
 * `t("situation_title_{id}")` / `t("situation_prompt_{id}")` — the prompt in particular must
 * follow the user's language, since the chat backend mirrors the script it receives.
 */
data class SituationConfig(
    val id: String,
    val icon: ImageVector,
    val defaultGuideId: String
)

val discoveryGuideCatalog = listOf(
    DiscoveryGuideConfig(
        id = "krishna",
        imageRes = R.drawable.avatar_krishna,
        fallbackLetterKey = "guide_letter_krishna",
    ),
    DiscoveryGuideConfig(
        id = "lakshmi",
        imageRes = R.drawable.avatar_lakshmi,
        fallbackLetterKey = "guide_letter_lakshmi",
    ),
    DiscoveryGuideConfig(
        id = "shiv",
        imageRes = R.drawable.shivji,
        fallbackLetterKey = "guide_letter_shiv",
    ),
    DiscoveryGuideConfig(
        id = "hanuman",
        imageRes = R.drawable.hanumanji,
        fallbackLetterKey = "guide_letter_hanuman",
    ),
    DiscoveryGuideConfig(
        id = "shani",
        imageRes = R.drawable.avatar_shani,
        fallbackLetterKey = "guide_letter_shani",
    )
)

val discoverySituations = listOf(
    // Hinglish by design (app default voice) — key nouns stay in English (matches
    // promptIcon's keyword matching in BhaktiChatHubScreen.kt) while grammar/connectors
    // are Hindi, same code-mixing pattern real Hinglish speech uses. Also ensures each
    // prompt contains a recognized Hinglish marker (see AddressingEngine.hinglishMarkers)
    // so the model actually replies in Hinglish instead of defaulting to English.
    SituationConfig(
        id = "money_stress",
        icon = Icons.Outlined.AccountBalanceWallet,
        defaultGuideId = "lakshmi"
    ),
    SituationConfig(
        id = "bad_luck",
        icon = Icons.Outlined.Bolt,
        defaultGuideId = "shani"
    ),
    SituationConfig(
        id = "fear",
        icon = Icons.Outlined.Spa,
        defaultGuideId = "hanuman"
    ),
    SituationConfig(
        id = "relationship_issues",
        icon = Icons.Outlined.FavoriteBorder,
        defaultGuideId = "krishna"
    )
)

