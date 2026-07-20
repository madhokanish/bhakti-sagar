package com.bhaktichat.app.ui.navigation

import androidx.annotation.DrawableRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Psychology
import androidx.compose.material.icons.outlined.SelfImprovement
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.WorkOutline
import androidx.compose.ui.graphics.vector.ImageVector
import com.bhaktichat.app.R

data class DiscoveryGuideConfig(
    val id: String,
    val title: String,
    @DrawableRes val imageRes: Int?,
    val fallbackLetter: String,
    val promise: String,
    val available: Boolean = true
)

data class SituationConfig(
    val id: String,
    val title: String,
    val icon: ImageVector,
    val prompt: String,
    val defaultGuideId: String
)

val discoveryGuideCatalog = listOf(
    DiscoveryGuideConfig(
        id = "krishna",
        title = "Shri Krishna",
        imageRes = R.drawable.avatar_krishna,
        fallbackLetter = "K",
        promise = "Warm guidance and clarity"
    ),
    DiscoveryGuideConfig(
        id = "lakshmi",
        title = "Lakshmi Ji",
        imageRes = R.drawable.avatar_lakshmi,
        fallbackLetter = "L",
        promise = "Abundance with steadiness"
    ),
    DiscoveryGuideConfig(
        id = "shiv",
        title = "Shiv Ji",
        imageRes = R.drawable.shivji,
        fallbackLetter = "S",
        promise = "Stillness and detachment"
    ),
    DiscoveryGuideConfig(
        id = "hanuman",
        title = "Hanuman Ji",
        imageRes = R.drawable.hanumanji,
        fallbackLetter = "H",
        promise = "Courage and devotion"
    ),
    DiscoveryGuideConfig(
        id = "shani",
        title = "Shani Dev",
        imageRes = R.drawable.avatar_shani,
        fallbackLetter = "S",
        promise = "Discipline and patience"
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
        title = "Money stress",
        icon = Icons.Outlined.AccountBalanceWallet,
        prompt = "Mujhe paison ki tension se nikalne mein guide karo, wisdom aur stability ke saath.",
        defaultGuideId = "lakshmi"
    ),
    SituationConfig(
        id = "bad_luck",
        title = "Bad luck",
        icon = Icons.Outlined.Bolt,
        prompt = "Mujhe is bad luck ke daur mein patience, discipline aur faith ke saath aage badhne mein madad karo.",
        defaultGuideId = "shani"
    ),
    SituationConfig(
        id = "anxiety",
        title = "Anxiety",
        icon = Icons.Outlined.SelfImprovement,
        prompt = "Meri anxiety ko calm karke mujhe inner stillness tak wapas lao.",
        defaultGuideId = "shiv"
    ),
    SituationConfig(
        id = "fear",
        title = "Fear",
        icon = Icons.Outlined.Spa,
        prompt = "Mera fear door karke mujhe courage aur devotion ke saath aage badhne mein madad karo.",
        defaultGuideId = "hanuman"
    ),
    SituationConfig(
        id = "relationship_issues",
        title = "Relationship Issues",
        icon = Icons.Outlined.FavoriteBorder,
        prompt = "Meri relationship issues mein mujhe clarity aur compassion ke saath guide karo.",
        defaultGuideId = "krishna"
    ),
    SituationConfig(
        id = "career_confusion",
        title = "Career Confusion",
        icon = Icons.Outlined.WorkOutline,
        prompt = "Meri career confusion mein guide karo aur agla sahi kadam dikhao.",
        defaultGuideId = "krishna"
    ),
    SituationConfig(
        id = "exams",
        title = "Exams",
        icon = Icons.Outlined.School,
        prompt = "Mujhe exams ki taiyari mein focus, calmness aur discipline ke saath madad karo.",
        defaultGuideId = "krishna"
    ),
    SituationConfig(
        id = "discipline",
        title = "Discipline",
        icon = Icons.Outlined.Psychology,
        prompt = "Mujhe stronger discipline banane aur apne efforts mein steady rehne mein madad karo.",
        defaultGuideId = "shani"
    )
)

// Hinglish by design (app default voice) — see the discoverySituations comment above for why.
val bhaktiGuideChips: Map<String, List<String>> = mapOf(
    "krishna" to listOf(
        "Aaj mera dharma kya hai?",
        "Mujhe ek Gita verse sunao",
        "Confusion mein meri madad karo",
        "Mujhe Mahabharata ki koi story sunao"
    ),
    "lakshmi" to listOf(
        "Money ki stress kam karo",
        "Meri career ko bless karo",
        "Mujhe financial stability sikhao",
        "Mujhe paise save karna sikhao"
    ),
    "shiv" to listOf(
        "Aaj raat mera mann calm karo",
        "Mujhe detachment sikhao",
        "Mera emotional pain ease karo",
        "Mujhe inner stillness chahiye"
    ),
    "hanuman" to listOf(
        "Mera fear door karo",
        "Mujhe courage do",
        "Mujhe disciplined rehne mein madad karo",
        "Mera mann protect karo"
    ),
    "shani" to listOf(
        "Mujhe discipline sikhao",
        "Yeh kaunsa lesson hai?",
        "Mera karma guide karo",
        "Mujhe consistent rehne mein madad karo"
    )
)
