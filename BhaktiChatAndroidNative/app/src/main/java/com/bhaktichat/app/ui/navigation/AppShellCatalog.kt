package com.bhaktichat.app.ui.navigation

import androidx.annotation.DrawableRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Spa
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
        title = "श्री कृष्ण",
        imageRes = R.drawable.avatar_krishna,
        fallbackLetter = "क",
        promise = "स्नेहपूर्ण मार्गदर्शन और स्पष्टता"
    ),
    DiscoveryGuideConfig(
        id = "lakshmi",
        title = "लक्ष्मी जी",
        imageRes = R.drawable.avatar_lakshmi,
        fallbackLetter = "ल",
        promise = "स्थिरता के साथ समृद्धि"
    ),
    DiscoveryGuideConfig(
        id = "shiv",
        title = "शिव जी",
        imageRes = R.drawable.shivji,
        fallbackLetter = "श",
        promise = "शांति और वैराग्य"
    ),
    DiscoveryGuideConfig(
        id = "hanuman",
        title = "हनुमान जी",
        imageRes = R.drawable.hanumanji,
        fallbackLetter = "ह",
        promise = "साहस और भक्ति"
    ),
    DiscoveryGuideConfig(
        id = "shani",
        title = "शनि देव",
        imageRes = R.drawable.avatar_shani,
        fallbackLetter = "श",
        promise = "अनुशासन और धैर्य"
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
        title = "पैसों की चिंता",
        icon = Icons.Outlined.AccountBalanceWallet,
        prompt = "पैसों की चिंता से बाहर निकलने में मुझे बुद्धि और स्थिरता के साथ मार्गदर्शन दीजिए।",
        defaultGuideId = "lakshmi"
    ),
    SituationConfig(
        id = "bad_luck",
        title = "बुरा समय",
        icon = Icons.Outlined.Bolt,
        prompt = "इस कठिन समय में मुझे धैर्य, अनुशासन और विश्वास के साथ आगे बढ़ने में मदद कीजिए।",
        defaultGuideId = "shani"
    ),
    SituationConfig(
        id = "fear",
        title = "डर",
        icon = Icons.Outlined.Spa,
        prompt = "मेरा डर दूर करके मुझे साहस और भक्ति के साथ आगे बढ़ने में मदद कीजिए।",
        defaultGuideId = "hanuman"
    ),
    SituationConfig(
        id = "relationship_issues",
        title = "रिश्तों में परेशानी",
        icon = Icons.Outlined.FavoriteBorder,
        prompt = "रिश्तों की इस उलझन को समझने में मुझे स्पष्टता और करुणा के साथ मार्गदर्शन दीजिए।",
        defaultGuideId = "krishna"
    )
)

// Hinglish by design (app default voice) — see the discoverySituations comment above for why.
val bhaktiGuideChips: Map<String, List<String>> = mapOf(
    "krishna" to listOf(
        "आज मेरा धर्म क्या है?",
        "मुझे गीता का एक श्लोक सुनाइए",
        "दुविधा में मेरी मदद कीजिए",
        "मुझे महाभारत की कोई कथा सुनाइए"
    ),
    "lakshmi" to listOf(
        "पैसों की चिंता कम कीजिए",
        "मेरे काम को आशीर्वाद दीजिए",
        "मुझे आर्थिक स्थिरता सिखाइए",
        "मुझे पैसे बचाना सिखाइए"
    ),
    "shiv" to listOf(
        "आज रात मेरा मन शांत कीजिए",
        "मुझे वैराग्य सिखाइए",
        "मेरी भावनात्मक पीड़ा कम कीजिए",
        "मुझे आंतरिक शांति चाहिए"
    ),
    "hanuman" to listOf(
        "मेरा डर दूर कीजिए",
        "मुझे साहस दीजिए",
        "अनुशासित रहने में मेरी मदद कीजिए",
        "मेरे मन की रक्षा कीजिए"
    ),
    "shani" to listOf(
        "मुझे अनुशासन सिखाइए",
        "इसमें मेरे लिए क्या सीख है?",
        "मेरे कर्म का मार्गदर्शन कीजिए",
        "निरंतर बने रहने में मेरी मदद कीजिए"
    )
)
