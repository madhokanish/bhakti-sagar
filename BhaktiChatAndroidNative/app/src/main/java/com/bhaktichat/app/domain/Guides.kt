package com.bhaktichat.app.domain

import com.bhaktichat.app.R

object Guides {
    val all: List<Guide> = listOf(
        Guide(
            id = "krishna",
            avatarRes = R.drawable.avatar_krishna,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.card_krishna,
            profileVerticalBias = -1f,
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You close the door.\nYour mind is not quiet.\n\nKrishna is sitting by the window, smiling softly.\n\n“Your thoughts are loud again.”\n\n“Tell me… what is troubling your heart?”",
                AppLanguage.HINGLISH to "Tum darwaza band karte ho.\nMann shaant nahi hai.\n\nKrishna khidki ke paas baithe hain. Halki si muskaan.\n\n“Phir se dimaag zyada bol raha hai?”\n\n“Batao… dil kya keh raha hai?”",
                AppLanguage.HINDI to "आप दरवाज़ा बंद करते हैं।\nमन शांत नहीं है।\n\nश्री कृष्ण खिड़की के पास बैठे हैं। हल्की सी मुस्कान।\n\n“फिर से मन बहुत सोच रहा है?”\n\n“बताइए… दिल क्या कह रहा है?”"
            ),
            serverPromptKey = "krishna"
        ),
        Guide(
            id = "lakshmi",
            avatarRes = R.drawable.avatar_lakshmi,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.card_lakshmi,
            profileVerticalBias = -1f,
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You sit quietly.\nThere is worry in your heart.\n\nLakshmi’s presence feels warm and steady.\n\n“Do not worry.”\n\n“Tell me… what do you need today?”",
                AppLanguage.HINGLISH to "Tum chup chaap baithte ho.\nDil mein chinta hai.\n\nLakshmi Ji ki presence se mahaul halka sa roshan ho jata hai.\n\n“Chinta mat karo.”\n\n“Batao… tumhe kya chahiye?”",
                AppLanguage.HINDI to "आप शांत होकर बैठते हैं।\nदिल में चिंता है।\n\nलक्ष्मी जी की उपस्थिति से वातावरण हल्का हो जाता है।\n\n“चिंता मत कीजिए।”\n\n“बताइए… आपको क्या चाहिए?”"
            ),
            serverPromptKey = "lakshmi"
        ),
        Guide(
            id = "shani",
            avatarRes = R.drawable.avatar_shani,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.card_shani,
            profileVerticalBias = -1f,
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You pause.\nYour breath feels heavy.\n\nShani sits still before you.\n\n“Do not run from the truth.”\n\n“Where are you stuck?”",
                AppLanguage.HINGLISH to "Tum dheere se rukte ho.\nSaans bhaari hai.\n\nShani Dev saamne sthir baithe hain.\n\n“Sach se mat bhaago.”\n\n“Kahan atke ho?”",
                AppLanguage.HINDI to "आप रुकते हैं।\nसाँस भारी है।\n\nशनि देव आपके सामने स्थिर बैठे हैं।\n\n“सच से मत भागिए।”\n\n“आप कहाँ अटके हैं?”"
            ),
            serverPromptKey = "shani"
        ),
        Guide(
            id = "shiv",
            avatarRes = R.drawable.shivji,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.shivji,
            profileVerticalBias = -1f,
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You exhale slowly.\nThe noise inside is still there.\n\nShiv Ji is seated in silence, steady as the mountain.\n\n“Do not chase every thought.”\n\n“Sit with me... what is burning inside you?”",
                AppLanguage.HINGLISH to "Tum dheere se saans chhodte ho.\nAndar ka shor abhi bhi hai.\n\nShiv Ji shaant baithe hain. Bilkul sthir.\n\n“Har vichaar ke peeche mat bhaago.”\n\n“Mere saath baitho... andar kya jal raha hai?”",
                AppLanguage.HINDI to "आप धीरे से साँस छोड़ते हैं।\nअंदर का शोर अभी भी है।\n\nशिव जी शांत बैठे हैं। बिल्कुल स्थिर।\n\n“हर विचार के पीछे मत भागिए।”\n\n“मेरे साथ बैठिए... भीतर क्या जल रहा है?”"
            ),
            serverPromptKey = "shiv"
        ),
        Guide(
            id = "hanuman",
            avatarRes = R.drawable.hanumanji,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.hanumanji,
            profileVerticalBias = -1f,
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You stop for a moment.\nYour heart wants courage.\n\nHanuman Ji stands before you, strong and humble.\n\n“Strength begins with sincerity.”\n\n“Tell me... where is fear holding you back?”",
                AppLanguage.HINGLISH to "Tum ek pal ke liye rukte ho.\nDil ko himmat chahiye.\n\nHanuman Ji tumhare saamne khade hain. Mazboot aur vinamra.\n\n“Shakti sachchai se shuru hoti hai.”\n\n“Batao... darr tumhe kahan rok raha hai?”",
                AppLanguage.HINDI to "आप एक पल के लिए रुकते हैं।\nदिल को हिम्मत चाहिए।\n\nहनुमान जी आपके सामने खड़े हैं। मजबूत और विनम्र।\n\n“शक्ति सच्चाई से शुरू होती है।”\n\n“बताइए... डर आपको कहाँ रोक रहा है?”"
            ),
            serverPromptKey = "hanuman"
        )
    )

    fun byId(id: String): Guide? = all.firstOrNull { it.id == id }
}
