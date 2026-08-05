package com.bhaktichat.app.domain

import com.bhaktichat.app.R

object Guides {
    val all: List<Guide> = listOf(
        Guide(
            id = "krishna",
            displayName = "श्री कृष्ण",
            status = "गुरु उपलब्ध हैं",
            avatarRes = R.drawable.avatar_krishna,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.card_krishna,
            profileVerticalBias = -1f,
            description = "जब जीवन में बहुत शोर महसूस हो, श्री कृष्ण का मार्गदर्शन आपको स्पष्टता और स्थिर कर्म की ओर लौटने में सहायता करता है।\n\nउनकी वाणी करुणामयी और व्यावहारिक है। यह आपको धर्म, संकल्प और आज किए जा सकने वाले कर्म पर ध्यान देने में मदद करती है।\n\nयह शास्त्रों और कथाओं से प्रेरित कृत्रिम बुद्धिमत्ता वाला गुरु है, वास्तविक देवता नहीं।\n\nदैनिक जीवन में आत्मचिंतन, भावनात्मक संतुलन और सार्थक निर्णयों के लिए इनसे बात करें।",
            teachings = listOf(
                "धर्म और कर्तव्य",
                "कर्म के साथ अनासक्ति",
                "प्रेम और भक्ति",
                "उथल-पुथल में आंतरिक शक्ति",
                "प्रतिक्रिया से पहले स्पष्टता"
            ),
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You close the door.\nYour mind is not quiet.\n\nKrishna is sitting by the window, smiling softly.\n\n“Your thoughts are loud again.”\n\n“Tell me… what is troubling your heart?”",
                AppLanguage.HINGLISH to "Tum darwaza band karte ho.\nMann shaant nahi hai.\n\nKrishna khidki ke paas baithe hain. Halki si muskaan.\n\n“Phir se dimaag zyada bol raha hai?”\n\n“Batao… dil kya keh raha hai?”",
                AppLanguage.HINDI to "आप दरवाज़ा बंद करते हैं।\nमन शांत नहीं है।\n\nश्री कृष्ण खिड़की के पास बैठे हैं। हल्की सी मुस्कान।\n\n“फिर से मन बहुत सोच रहा है?”\n\n“बताइए… दिल क्या कह रहा है?”"
            ),
            suggestedPrompts = listOf(
                "मेरे सामने दो कठिन विकल्प हैं। मैं निर्णय कैसे लूँ?",
                "परिणाम की चिंता किए बिना कर्म कैसे करूँ?",
                "मन की स्पष्टता के लिए पाँच मिनट का गीता चिंतन दीजिए।",
                "कठिन बातचीत से पहले शांत रहने में मेरी मदद कीजिए।"
            ),
            serverPromptKey = "krishna"
        ),
        Guide(
            id = "lakshmi",
            displayName = "लक्ष्मी जी",
            status = "गुरु उपलब्ध हैं",
            avatarRes = R.drawable.avatar_lakshmi,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.card_lakshmi,
            profileVerticalBias = -1f,
            description = "लक्ष्मी जी का मार्गदर्शन समृद्धि के प्रति शांत और उत्तरदायी दृष्टिकोण अपनाने में सहायता करता है।\n\nयह कृतज्ञता, व्यवस्था और व्यावहारिक आदतों को बढ़ावा देता है, ताकि समृद्धि स्थिरता के साथ बढ़े।\n\nयह शास्त्रों और कथाओं से प्रेरित कृत्रिम बुद्धिमत्ता वाला गुरु है, वास्तविक देवी नहीं।\n\nधन, घर और भावनात्मक सुख में संतुलन के लिए इनसे बात करें।",
            teachings = listOf(
                "उत्तरदायित्व के साथ समृद्धि",
                "कृतज्ञता",
                "उदारता",
                "भौतिक जीवन में संतुलन",
                "व्यवस्था और अनुशासन"
            ),
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You sit quietly.\nThere is worry in your heart.\n\nLakshmi’s presence feels warm and steady.\n\n“Do not worry.”\n\n“Tell me… what do you need today?”",
                AppLanguage.HINGLISH to "Tum chup chaap baithte ho.\nDil mein chinta hai.\n\nLakshmi Ji ki presence se mahaul halka sa roshan ho jata hai.\n\n“Chinta mat karo.”\n\n“Batao… tumhe kya chahiye?”",
                AppLanguage.HINDI to "आप शांत होकर बैठते हैं।\nदिल में चिंता है।\n\nलक्ष्मी जी की उपस्थिति से वातावरण हल्का हो जाता है।\n\n“चिंता मत कीजिए।”\n\n“बताइए… आपको क्या चाहिए?”"
            ),
            suggestedPrompts = listOf(
                "मुझे धन को लेकर चिंता है। आज मैं कौन-सा व्यावहारिक कदम उठाऊँ?",
                "अधिक खर्च किए बिना समृद्धि का अभ्यास कैसे करूँ?",
                "लक्ष्मी जी से प्रेरित साप्ताहिक कृतज्ञता अभ्यास बताइए।",
                "मैं अपने घर में अधिक सामंजस्य कैसे ला सकता हूँ?"
            ),
            serverPromptKey = "lakshmi"
        ),
        Guide(
            id = "shani",
            displayName = "शनि देव",
            status = "गुरु उपलब्ध हैं",
            avatarRes = R.drawable.avatar_shani,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.card_shani,
            profileVerticalBias = -1f,
            description = "शनि देव का मार्गदर्शन स्थिर, स्पष्ट और सत्य पर आधारित है।\n\nजब प्रगति धीमी लगे, यह अनुशासन, धैर्य और दृढ़ता विकसित करने में मदद करता है।\n\nयह शास्त्रों और कथाओं से प्रेरित कृत्रिम बुद्धिमत्ता वाला गुरु है, वास्तविक देवता नहीं।\n\nदबाव को व्यवस्था और निरंतर प्रयास में बदलने के लिए इनसे बात करें।",
            teachings = listOf(
                "अनुशासन",
                "कर्म",
                "धैर्य",
                "प्रयास से दीर्घकालीन विकास",
                "उत्तरदायित्व"
            ),
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You pause.\nYour breath feels heavy.\n\nShani sits still before you.\n\n“Do not run from the truth.”\n\n“Where are you stuck?”",
                AppLanguage.HINGLISH to "Tum dheere se rukte ho.\nSaans bhaari hai.\n\nShani Dev saamne sthir baithe hain.\n\n“Sach se mat bhaago.”\n\n“Kahan atke ho?”",
                AppLanguage.HINDI to "आप रुकते हैं।\nसाँस भारी है।\n\nशनि देव आपके सामने स्थिर बैठे हैं।\n\n“सच से मत भागिए।”\n\n“आप कहाँ अटके हैं?”"
            ),
            suggestedPrompts = listOf(
                "कड़ी मेहनत के बाद भी मैं अटका हुआ महसूस करता हूँ। इस सप्ताह क्या करूँ?",
                "देरी और अनिश्चितता के बीच शांत कैसे रहूँ?",
                "शनिवार के लिए ऐसा अनुशासन अभ्यास बताइए जिसे मैं निभा सकूँ।",
                "थके बिना बेहतर आदतें कैसे बनाऊँ?"
            ),
            serverPromptKey = "shani"
        ),
        Guide(
            id = "shiv",
            displayName = "शिव जी",
            status = "गुरु उपलब्ध हैं",
            avatarRes = R.drawable.shivji,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.shivji,
            profileVerticalBias = -1f,
            description = "शिव जी का मार्गदर्शन शांत, विशाल और स्पष्ट है।\n\nयह मन का शोर छोड़ने, आसक्ति घटाने और आवश्यक सत्य की ओर लौटने में सहायता करता है।\n\nयह शास्त्रों और कथाओं से प्रेरित कृत्रिम बुद्धिमत्ता वाला गुरु है, वास्तविक देवता नहीं।\n\nशांति, सत्य और स्थिर अंतर्मन के लिए इनसे बात करें।",
            teachings = listOf(
                "प्रतिक्रिया से पहले स्थिरता",
                "वैराग्य",
                "आंतरिक मौन",
                "शोर से ऊपर सत्य",
                "समर्पण का साहस"
            ),
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You exhale slowly.\nThe noise inside is still there.\n\nShiv Ji is seated in silence, steady as the mountain.\n\n“Do not chase every thought.”\n\n“Sit with me... what is burning inside you?”",
                AppLanguage.HINGLISH to "Tum dheere se saans chhodte ho.\nAndar ka shor abhi bhi hai.\n\nShiv Ji shaant baithe hain. Bilkul sthir.\n\n“Har vichaar ke peeche mat bhaago.”\n\n“Mere saath baitho... andar kya jal raha hai?”",
                AppLanguage.HINDI to "आप धीरे से साँस छोड़ते हैं।\nअंदर का शोर अभी भी है।\n\nशिव जी शांत बैठे हैं। बिल्कुल स्थिर।\n\n“हर विचार के पीछे मत भागिए।”\n\n“मेरे साथ बैठिए... भीतर क्या जल रहा है?”"
            ),
            suggestedPrompts = listOf(
                "जो मेरे नियंत्रण में नहीं है, उसे छोड़ने में मेरी मदद कीजिए।",
                "आज के लिए शिव जी से प्रेरित शांत चिंतन दीजिए।",
                "मन में शोर हो तो मैं स्थिर कैसे रहूँ?",
                "मैं अभी किस सत्य से बच रहा हूँ?"
            ),
            serverPromptKey = "shiv"
        ),
        Guide(
            id = "hanuman",
            displayName = "हनुमान जी",
            status = "गुरु उपलब्ध हैं",
            avatarRes = R.drawable.hanumanji,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.hanumanji,
            profileVerticalBias = -1f,
            description = "हनुमान जी का मार्गदर्शन निष्ठावान, निर्भय और कर्म-केंद्रित है।\n\nयह झिझक को साहस, सेवा और अनुशासन में बदलने में मदद करता है।\n\nयह शास्त्रों और कथाओं से प्रेरित कृत्रिम बुद्धिमत्ता वाला गुरु है, वास्तविक देवता नहीं।\n\nशक्ति, भक्ति और दृढ़ संकल्प के लिए इनसे बात करें।",
            teachings = listOf(
                "कर्म में भक्ति",
                "निर्भयता",
                "सेवा",
                "विनम्रता से शक्ति",
                "अटल संकल्प"
            ),
            openingScenes = mapOf(
                AppLanguage.ENGLISH to "You stop for a moment.\nYour heart wants courage.\n\nHanuman Ji stands before you, strong and humble.\n\n“Strength begins with sincerity.”\n\n“Tell me... where is fear holding you back?”",
                AppLanguage.HINGLISH to "Tum ek pal ke liye rukte ho.\nDil ko himmat chahiye.\n\nHanuman Ji tumhare saamne khade hain. Mazboot aur vinamra.\n\n“Shakti sachchai se shuru hoti hai.”\n\n“Batao... darr tumhe kahan rok raha hai?”",
                AppLanguage.HINDI to "आप एक पल के लिए रुकते हैं।\nदिल को हिम्मत चाहिए।\n\nहनुमान जी आपके सामने खड़े हैं। मजबूत और विनम्र।\n\n“शक्ति सच्चाई से शुरू होती है।”\n\n“बताइए... डर आपको कहाँ रोक रहा है?”"
            ),
            suggestedPrompts = listOf(
                "जिस काम से मैं बच रहा हूँ, उसके लिए मुझे साहस दीजिए।",
                "अधिक सोचना छोड़कर कर्म कैसे शुरू करूँ?",
                "आज शक्ति के लिए हनुमान जी से प्रेरित एक कदम बताइए।",
                "घबराए बिना डर का सामना करने में मेरी मदद कीजिए।"
            ),
            serverPromptKey = "hanuman"
        )
    )

    fun byId(id: String): Guide? = all.firstOrNull { it.id == id }
}
