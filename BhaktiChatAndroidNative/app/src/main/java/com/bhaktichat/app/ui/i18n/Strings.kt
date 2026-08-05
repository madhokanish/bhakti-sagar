package com.bhaktichat.app.ui.i18n

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import com.bhaktichat.app.domain.AppLanguage

/**
 * App-wide translation table, keyed by a short semantic id. One entry per distinct piece of
 * UI copy (not per call site — reuse the same key wherever the same English string appears).
 *
 * Hinglish frequently matches the existing English UI chrome as-is: Hinglish is primarily
 * the guides' *spoken* voice (see `Guides.kt`'s openingScenes and the chat backend's
 * language steering), not a mandate to relabel every button — real Hinglish speakers
 * commonly keep app chrome in English already. Hindi gets a genuine Devanagari translation
 * for everything, since that's the whole point of offering it as a choice.
 *
 * Populated screen-by-screen as each is migrated off raw string literals — see the task
 * list for progress. A missing key falls back to itself so an untranslated string never
 * renders blank.
 */
private data class Entry(val hinglish: String, val hindi: String, val english: String)

private val table: Map<String, Entry> = mapOf(
    "profile_content_description" to Entry("Profile", "प्रोफ़ाइल", "Profile"),
    "good_morning" to Entry("Good morning", "सुप्रभात", "Good morning"),
    "good_afternoon" to Entry("Good afternoon", "नमस्कार", "Good afternoon"),
    "good_evening" to Entry("Good evening", "शुभ संध्या", "Good evening"),
    "aartis" to Entry("Aartis", "आरतियाँ", "Aartis"),
    "pause_aarti" to Entry("Pause aarti", "आरती रोकें", "Pause aarti"),
    "play_todays_aarti" to Entry("Play today's aarti", "आज की आरती सुनें", "Play today's aarti"),
    "min_suffix" to Entry("min", "मिनट", "min"),

    // Bottom navigation
    "nav_home" to Entry("Home", "होम", "Home"),
    "nav_bhakti_chat" to Entry("BhaktiChat", "BhaktiChat", "BhaktiChat"),
    "nav_reels" to Entry("Reels", "रील्स", "Reels"),
    "nav_explore" to Entry("Explore", "एक्सप्लोर", "Explore"),
    // चढ़ावा has no English equivalent that fits the 10sp nav label, so the Devanagari
    // label is kept in every locale (per the design's 360dp width check).
    "nav_chadhaava" to Entry("Chadhava", "चढ़ावा", "Chadhava"),

    // --- चढ़ावा / subscription screen -------------------------------------------------
    "chadhaava_title" to Entry("Chadhava", "चढ़ावा", "Chadhava"),
    "chadhaava_headline" to Entry(
        "Poora app unlock karein",
        "पूरा ऐप अनलॉक करें",
        "Unlock the full app"
    ),
    "chadhaava_price_amount" to Entry("₹5", "₹5", "₹5"),
    "chadhaava_price_now" to Entry("abhi", "अभी", "now"),
    "chadhaava_price_sub" to Entry(
        "Bas itna — poora app 3 din ke liye khul jata hai",
        "बस इतना — पूरा ऐप 3 दिन के लिए खुल जाता है",
        "That's all — the full app opens for 3 days"
    ),
    "chadhaava_refund_title" to Entry(
        "Yeh ₹5 turant wapas bhej diye jaate hain",
        "यह ₹5 तुरंत वापस भेज दिए जाते हैं",
        "This ₹5 is sent back right away"
    ),
    "chadhaava_refund_sub" to Entry(
        "Usi UPI khaate mein, bhugtan ke kuch hi minute mein",
        "उसी UPI खाते में, भुगतान के कुछ ही मिनट में",
        "To the same UPI account, within minutes of payment"
    ),
    "chadhaava_plan_name" to Entry("Masik", "मासिक", "Monthly"),
    "chadhaava_plan_price" to Entry("₹199/mahina", "₹199/महीना", "₹199/month"),
    "chadhaava_plan_starts" to Entry("3 din baad shuru", "3 दिन बाद शुरू", "Starts after 3 days"),

    "chadhaava_timeline_title" to Entry(
        "Aage kya hoga — saaf-saaf",
        "आगे क्या होगा — साफ़-साफ़",
        "What happens next — clearly"
    ),
    "chadhaava_step1_title" to Entry(
        "Aaj — ₹5 dein, turant wapas paayein",
        "आज — ₹5 दें, तुरंत वापस पाएँ",
        "Today — pay ₹5, get it back right away"
    ),
    "chadhaava_step1_sub" to Entry(
        "Poora app usi pal khul jata hai",
        "पूरा ऐप उसी पल खुल जाता है",
        "The full app opens that moment"
    ),
    "chadhaava_step2_title" to Entry(
        "Din 2 — aapko yaad dilaya jayega",
        "दिन 2 — आपको याद दिलाया जाएगा",
        "Day 2 — you'll be reminded"
    ),
    // Deliberately describes only what actually happens: the pre-debit notification comes
    // from the user's bank/UPI app over the AutoPay rails, and we send an email. The app
    // has no push or SMS channel, so the copy must not promise either.
    "chadhaava_step2_sub" to Entry(
        "Kataut se pehle aapke bank/UPI app se soochna milegi, aur hum email bhi bhejenge",
        "कटौती से पहले आपके बैंक/UPI ऐप से सूचना मिलेगी, और हम ईमेल भी भेजेंगे",
        "Your bank/UPI app notifies you before the debit, and we'll email you too"
    ),
    "chadhaava_step3_title" to Entry(
        "Din 3 — ₹199/mahina shuru",
        "दिन 3 — ₹199/महीना शुरू",
        "Day 3 — ₹199/month begins"
    ),
    "chadhaava_step3_sub" to Entry(
        "Pasand na aaye to usse pehle cancel — ek paisa nahi lagega",
        "पसंद न आए तो उससे पहले कैंसल — एक पैसा नहीं लगेगा",
        "Cancel before then if it's not for you — you pay nothing"
    ),

    // --- Temple offering card ---
    "chadhaava_temple_eyebrow" to Entry(
        "Asli mandir · Asli pooja",
        "असली मंदिर · असली पूजा",
        "Real temples · Real puja"
    ),
    "chadhaava_temple_title" to Entry(
        "Aapke naam se chadhava chadhaya jayega",
        "आपके नाम से चढ़ावा चढ़ाया जाएगा",
        "An offering will be made in your name"
    ),
    "chadhaava_temple_intro" to Entry(
        "Har hafte hone wali pooja mein aapka naam sankalp ke saath liya jata hai — do prachin mandiron mein, pandit ji dwara.",
        "हर हफ़्ते होने वाली पूजा में आपका नाम संकल्प के साथ लिया जाता है — दो प्राचीन मंदिरों में, पंडित जी द्वारा।",
        "Your name is taken with the sankalp in the weekly puja — at two ancient temples, by the pandit."
    ),
    "chadhaava_temple_1_name" to Entry(
        "Omkareshwar Jyotirling",
        "ओंकारेश्वर ज्योतिर्लिंग",
        "Omkareshwar Jyotirlinga"
    ),
    "chadhaava_temple_1_place" to Entry(
        "Khandwa, Madhya Pradesh",
        "खंडवा, मध्य प्रदेश",
        "Khandwa, Madhya Pradesh"
    ),
    "chadhaava_temple_2_name" to Entry(
        "Kaal Bhairav Mandir, Kashi",
        "काल भैरव मंदिर, काशी",
        "Kaal Bhairav Temple, Kashi"
    ),
    "chadhaava_temple_2_place" to Entry(
        "Varanasi, Uttar Pradesh",
        "वाराणसी, उत्तर प्रदेश",
        "Varanasi, Uttar Pradesh"
    ),
    "chadhaava_temple_proof" to Entry(
        "Pooja ki photo aur video aapko bheji jaati hai",
        "पूजा की फ़ोटो और वीडियो आपको भेजी जाती है",
        "Photos and video of the puja are sent to you"
    ),
    "chadhaava_benefit_puja" to Entry(
        "Aapke naam se saptahik pooja",
        "आपके नाम से साप्ताहिक पूजा",
        "Weekly puja in your name"
    ),
    "chadhaava_benefit_puja_sub" to Entry(
        "Omkareshwar aur Kashi mein — photo sahit",
        "ओंकारेश्वर और काशी में — फ़ोटो सहित",
        "At Omkareshwar and Kashi — with photos"
    ),
    "chadhaava_badge_new" to Entry("Naya", "नया", "New"),

    "chadhaava_benefits_title" to Entry(
        "Aapko kya milega",
        "आपको क्या मिलेगा",
        "What you get"
    ),
    "chadhaava_benefit_voice" to Entry(
        "Bhagwan se aawaz mein baat",
        "भगवान से आवाज़ में बात",
        "Speak with the deities"
    ),
    "chadhaava_benefit_voice_sub" to Entry(
        "Live voice mode — jaise phone par baat",
        "लाइव वॉइस मोड — जैसे फ़ोन पर बात",
        "Live voice mode — like a phone call"
    ),
    "chadhaava_benefit_chat" to Entry("Aseemit baatcheet", "असीमित बातचीत", "Unlimited conversations"),
    "chadhaava_benefit_chat_sub" to Entry(
        "Krishna, Lakshmi, Shani aur sabhi guruon ke saath",
        "कृष्ण, लक्ष्मी, शनि और सभी गुरुओं के साथ",
        "With Krishna, Lakshmi, Shani and every guide"
    ),
    "chadhaava_benefit_image" to Entry("Divya tasveerein", "दिव्य तस्वीरें", "Divine images"),
    "chadhaava_benefit_image_sub" to Entry(
        "Bhagwan ke saath apni photo banayein",
        "भगवान के साथ अपनी फ़ोटो बनाएँ",
        "Create your photo with the deities"
    ),
    "chadhaava_benefit_wallpaper" to Entry(
        "Wallpaper aur status",
        "वॉलपेपर और स्टेटस",
        "Wallpapers and status"
    ),
    "chadhaava_benefit_wallpaper_sub" to Entry(
        "25 wallpaper — download aur share karein",
        "25 वॉलपेपर — डाउनलोड और शेयर करें",
        "25 wallpapers — download and share"
    ),
    "chadhaava_benefit_adfree" to Entry(
        "Vigyapan-mukt anubhav",
        "विज्ञापन-मुक्त अनुभव",
        "Ad-free experience"
    ),
    "chadhaava_benefit_adfree_sub" to Entry(
        "Koi banner nahi, koi rukawat nahi",
        "कोई बैनर नहीं, कोई रुकावट नहीं",
        "No banners, no interruptions"
    ),
    "chadhaava_badge_popular" to Entry("Sabse lokpriya", "सबसे लोकप्रिय", "Most popular"),
    "chadhaava_badge_here" to Entry("Aap yahin ruke the", "आप यहीं रुके थे", "You stopped here"),
    "chadhaava_expander_more" to Entry("Aur bhi bahut kuch", "और भी बहुत कुछ", "And much more"),
    "chadhaava_expander_less" to Entry("Kam dikhayein", "कम दिखाएँ", "Show less"),
    "chadhaava_expander_sub" to Entry(
        "Reels · Aarti, bhajan, mantra · Choghadiya",
        "रील्स · आरती, भजन, मंत्र · चौघड़िया",
        "Reels · Aarti, bhajan, mantra · Choghadiya"
    ),
    "chadhaava_secondary_reels" to Entry("Reels", "रील्स", "Reels"),
    "chadhaava_secondary_aarti" to Entry(
        "Sabhi aarti, bhajan aur mantra",
        "सभी आरती, भजन और मंत्र",
        "All aartis, bhajans and mantras"
    ),
    "chadhaava_secondary_panchang" to Entry(
        "Choghadiya aur panchang",
        "चौघड़िया और पंचांग",
        "Choghadiya and panchang"
    ),

    "chadhaava_policy_title" to Entry(
        "₹5 ka niyam — poori safai se",
        "₹5 का नियम — पूरी सफ़ाई से",
        "The ₹5 rule — in plain words"
    ),
    "chadhaava_policy_q1" to Entry("₹5 kyun liye jaate hain?", "₹5 क्यों लिए जाते हैं?", "Why is ₹5 charged?"),
    "chadhaava_policy_a1" to Entry(
        "Aapka bank UPI auto-pay chaalu karne ke liye ek asli bhugtan maangta hai. ₹5 sabse chhoti rakam hai jisse yeh ho jata hai — yeh hamara shulk nahi hai.",
        "आपका बैंक UPI ऑटो-पे चालू करने के लिए एक असली भुगतान माँगता है। ₹5 सबसे छोटी रकम है जिससे यह हो जाता है — यह हमारा शुल्क नहीं है।",
        "Your bank requires one real payment to enable UPI auto-pay. ₹5 is the smallest amount that does it — it is not our fee."
    ),
    "chadhaava_policy_q2" to Entry("Wapas kab aayenge?", "वापस कब आएँगे?", "When do I get it back?"),
    "chadhaava_policy_a2" to Entry(
        "Turant — manzoori milne ke kuch minute mein usi UPI khaate mein. Bank ki taraf se deri ho to 24 ghante tak lag sakte hain.",
        "तुरंत — मंज़ूरी मिलने के कुछ मिनट में उसी UPI खाते में। बैंक की तरफ़ से देरी हो तो 24 घंटे तक लग सकते हैं।",
        "Right away — within minutes of approval, to the same UPI account. Bank delays can take up to 24 hours."
    ),
    "chadhaava_policy_q3" to Entry(
        "Cancel karna kitna aasan hai?",
        "कैंसल करना कितना आसान है?",
        "How easy is cancelling?"
    ),
    "chadhaava_policy_a3" to Entry(
        "Isi screen par do tap. 3 din ke andar cancel kiya to ₹199 kabhi nahi katega.",
        "इसी स्क्रीन पर दो टैप। 3 दिन के अंदर कैंसल किया तो ₹199 कभी नहीं कटेगा।",
        "Two taps on this screen. Cancel within 3 days and ₹199 is never charged."
    ),

    "chadhaava_cta_line1" to Entry(
        "₹5 ka chadhava kijiye",
        "₹5 का चढ़ावा अर्पित करें",
        "Offer ₹5 · unlock everything"
    ),
    "chadhaava_cta_line2" to Entry(
        "Turant wapas · 3 din poora app free",
        "तुरंत वापस · 3 दिन पूरा ऐप खुला",
        "Refunded right away · 3 days full access"
    ),
    "chadhaava_cta_blocked_wallpaper" to Entry(
        "₹5 dekar wallpaper kholein",
        "₹5 देकर वॉलपेपर खोलें",
        "Pay ₹5 to unlock wallpapers"
    ),
    "chadhaava_trust" to Entry(
        "UPI auto-pay · kabhi bhi cancel karein",
        "UPI ऑटो-पे · कभी भी कैंसल करें",
        "UPI auto-pay · cancel anytime"
    ),
    "chadhaava_link_refunds" to Entry("Refund neeti", "रिफंड नीति", "Refund policy"),
    "chadhaava_link_terms" to Entry("Sharten", "शर्तें", "Terms"),

    "chadhaava_blocked_wallpaper_title" to Entry(
        "Yeh wallpaper chadhava mein shaamil hai",
        "यह वॉलपेपर चढ़ावा में शामिल है",
        "This wallpaper is part of Chadhava"
    ),
    "chadhaava_blocked_wallpaper_sub" to Entry(
        "Yeh wallpaper aur 24 anya — ₹5 dein, turant wapas paayein, aaj hi download karein",
        "यह वॉलपेपर और 24 अन्य — ₹5 दें, तुरंत वापस पाएँ, आज ही डाउनलोड करें",
        "This wallpaper and 24 more — pay ₹5, get it back right away, download today"
    ),

    "chadhaava_processing_title" to Entry(
        "Apne UPI app mein manzoori dein",
        "अपने UPI ऐप में मंज़ूरी दें",
        "Approve in your UPI app"
    ),
    "chadhaava_processing_body" to Entry(
        "Apne UPI app mein ₹5 ke auto-pay ko manzoori dein — isme ek minute tak lag sakta hai.",
        "अपने UPI ऐप में ₹5 के ऑटो-पे को मंज़ूरी दें — इसमें एक मिनट तक लग सकता है।",
        "Approve the ₹5 auto-pay in your UPI app — this can take up to a minute."
    ),
    "chadhaava_processing_step1" to Entry("UPI app khula", "UPI ऐप खुला", "UPI app opened"),
    "chadhaava_processing_step2" to Entry(
        "Auto-pay manzoori ka intezaar",
        "ऑटो-पे मंज़ूरी का इंतज़ार",
        "Waiting for auto-pay approval"
    ),
    "chadhaava_processing_step3" to Entry(
        "₹5 wapas bheje jayenge · chadhava chaalu",
        "₹5 वापस भेजे जाएँगे · चढ़ावा चालू",
        "₹5 refunded · Chadhava active"
    ),
    "chadhaava_processing_check" to Entry(
        "Maine manzoori de di — jaanchein",
        "मैंने मंज़ूरी दे दी — जाँचें",
        "I've approved — check now"
    ),
    "chadhaava_processing_dont_close" to Entry(
        "Is page ko band na karein",
        "इस पेज को बंद न करें",
        "Don't close this page"
    ),

    "chadhaava_error_title" to Entry(
        "Chadhava poora nahi hua",
        "चढ़ावा पूरा नहीं हुआ",
        "The offering didn't go through"
    ),
    "chadhaava_error_body" to Entry(
        "Aapka ₹5 ka bhugtan poora nahi hua — aur aapke khaate se kuch nahi kata. Ek baar phir koshish karein.",
        "आपका ₹5 का भुगतान पूरा नहीं हुआ — और आपके खाते से कुछ नहीं कटा। एक बार फिर कोशिश करें।",
        "Your ₹5 payment didn't complete — and nothing was deducted from your account. Please try once more."
    ),
    "chadhaava_error_retry" to Entry("Phir se koshish karein", "फिर से कोशिश करें", "Try again"),
    "chadhaava_error_later" to Entry("Abhi nahi", "अभी नहीं", "Not now"),

    "chadhaava_trial_active" to Entry("Trial chaalu hai", "ट्रायल चालू है", "Trial is active"),
    "chadhaava_trial_remaining" to Entry("baaki", "बाकी", "left"),
    "chadhaava_days" to Entry("din", "दिन", "days"),
    "chadhaava_active_title" to Entry(
        "Aapka chadhava sweekar hai",
        "आपका चढ़ावा स्वीकार है",
        "Your offering is accepted"
    ),
    "chadhaava_active_badge" to Entry("Sadasyata sakriya", "सदस्यता सक्रिय", "Membership active"),
    "chadhaava_unlocked_title" to Entry(
        "Ab aapke liye khula hai",
        "अब आपके लिए खुला है",
        "Now open for you"
    ),
    "chadhaava_cancel" to Entry("Sadasyata cancel karein", "सदस्यता कैंसल करें", "Cancel membership"),
    "chadhaava_cancel_trial" to Entry("Trial cancel karein", "ट्रायल कैंसल करें", "Cancel trial"),
    "chadhaava_cancelled_title" to Entry(
        "Sadasyata cancel ho gayi",
        "सदस्यता कैंसल हो गई",
        "Membership cancelled"
    ),
    "chadhaava_cancelled_sub" to Entry(
        "Aage koi kataut nahi hogi. Aapki purani baatcheet surakshit rahegi.",
        "आगे कोई कटौती नहीं होगी। आपकी पुरानी बातचीत सुरक्षित रहेगी।",
        "There will be no further charges. Your past conversations stay safe."
    ),
    "chadhaava_resubscribe" to Entry(
        "Sadasyata phir se shuru karein",
        "सदस्यता फिर से शुरू करें",
        "Restart membership"
    ),
    "chadhaava_loading" to Entry("Ek pal…", "एक पल…", "One moment…"),

    // Home screen
    "home_title" to Entry("Home", "होम", "Home"),
    "home_ai_spiritual_guides" to Entry("AI Spiritual Guides", "एआई आध्यात्मिक गुरु", "AI Spiritual Guides"),
    "home_see_all" to Entry("See all >", "सभी देखें ›", "See all >"),
    "home_life_situations" to Entry("Life Situations", "जीवन की उलझनें", "Life Situations"),
    "home_reels" to Entry("Reels", "रील्स", "Reels"),
    "home_todays_aarti" to Entry("TODAY'S AARTI", "आज की आरती", "TODAY'S AARTI"),
    "home_now_playing" to Entry("NOW PLAYING", "अभी चल रही है", "NOW PLAYING"),
    "home_divine_image_eyebrow" to Entry("DIVINE IMAGE", "दिव्य छवि", "DIVINE IMAGE"),
    "home_divine_image_title" to Entry("Create your darshan", "अपना दिव्य दर्शन बनाएँ", "Create your darshan"),
    "home_divine_image_subtitle" to Entry(
        "Your photo, beside your deity — ready in about a minute.",
        "आपकी फोटो, आपके आराध्य के साथ—लगभग एक मिनट में तैयार।",
        "Your photo, beside your deity — ready in about a minute."
    ),
    "home_upload_a_photo" to Entry("Upload a photo", "अपनी फोटो जोड़ें", "Upload a photo"),
    "home_choghadiya_now" to Entry("CHOGHADIYA NOW", "अभी का चौघड़िया", "CHOGHADIYA NOW"),
    "home_choghadiya_loading" to Entry(
        "Loading today's timings…",
        "आज के शुभ समय लोड हो रहे हैं…",
        "Loading today's timings…"
    ),
    "home_choghadiya_unavailable" to Entry(
        "Today's timings are unavailable",
        "आज के शुभ समय उपलब्ध नहीं हैं",
        "Today's timings are unavailable"
    ),
    "home_choghadiya_details" to Entry(
        "See full details",
        "पूरी जानकारी देखें",
        "See full details"
    ),
    "home_wallpapers" to Entry("Wallpapers", "वॉलपेपर", "Wallpapers"),
    "home_wallpapers_subtitle" to Entry(
        "deity portraits · save & share",
        "भगवान की तस्वीरें · सहेजें और शेयर करें",
        "deity portraits · save & share"
    ),
    "home_feed_title" to Entry("Devotional stream", "भक्ति धारा", "Devotional stream"),
    "home_feed_for_you" to Entry("For you", "आपके लिए", "For you"),
    "home_feed_reel_preview" to Entry("Devotional reel", "भक्ति रील", "Devotional reel"),
    "home_feed_aarti_preview" to Entry("Aarti preview", "आरती की झलक", "Aarti preview"),
    "home_feed_watch_full" to Entry("Watch full reel", "पूरी रील देखें", "Watch full reel"),
    "home_feed_listen_full" to Entry("Listen to full aarti", "पूरी आरती सुनें", "Listen to full aarti"),
    "home_feed_set_status" to Entry("Set as status", "स्टेटस लगाएँ", "Set as status"),
    "home_feed_share" to Entry("Share", "शेयर करें", "Share"),
    "home_feed_share_aarti" to Entry("Share aarti", "आरती शेयर करें", "Share aarti"),
    "home_feed_sound_on" to Entry("Turn sound on", "आवाज़ चालू करें", "Turn sound on"),
    "home_feed_sound_off" to Entry("Turn sound off", "आवाज़ बंद करें", "Turn sound off"),
    "money_stress" to Entry("Money stress", "पैसों की चिंता", "Money stress"),
    "bad_luck" to Entry("Bad luck", "बुरा समय", "Bad luck"),
    "fear" to Entry("Fear", "डर", "Fear"),
    "relationship_issues" to Entry("Relationship Issues", "रिश्तों में परेशानी", "Relationship Issues"),
    "ask_guide" to Entry("Ask %s", "%s से पूछें", "Ask %s"),

    // Guide display names — shown throughout Home, guide picker, chat headers.
    "guide_title_krishna" to Entry("Shri Krishna", "श्री कृष्ण", "Shri Krishna"),
    "guide_title_lakshmi" to Entry("Lakshmi Ji", "लक्ष्मी जी", "Lakshmi Ji"),
    "guide_title_shiv" to Entry("Shiv Ji", "शिव जी", "Shiv Ji"),
    "guide_title_hanuman" to Entry("Hanuman Ji", "हनुमान जी", "Hanuman Ji"),
    "guide_title_shani" to Entry("Shani Dev", "शनि देव", "Shani Dev"),

    // Guide picker "promise" one-liners
    "guide_promise_krishna" to Entry(
        "Warm guidance and clarity", "स्नेहपूर्ण मार्गदर्शन और स्पष्टता", "Warm guidance and clarity"
    ),
    "guide_promise_lakshmi" to Entry(
        "Abundance with steadiness", "स्थिरता के साथ समृद्धि", "Abundance with steadiness"
    ),
    "guide_promise_shiv" to Entry(
        "Stillness and detachment", "शांति और वैराग्य", "Stillness and detachment"
    ),
    "guide_promise_hanuman" to Entry(
        "Courage and devotion", "साहस और भक्ति", "Courage and devotion"
    ),
    "guide_promise_shani" to Entry(
        "Discipline and patience", "अनुशासन और धैर्य", "Discipline and patience"
    ),

    // Life Situation cards — title, subtitle ("Ask <guide>"), and the canned prompt sent to
    // the guide. The Hinglish prompt text is deliberately Hinglish (see AppShellCatalog.kt) so
    // the AI's own reply-language detection steers toward Hinglish; the Hindi/English variants
    // carry the same meaning in their own script/language.
    "situation_title_money_stress" to Entry("Money stress", "पैसों की चिंता", "Money stress"),
    "situation_title_bad_luck" to Entry("Bad luck", "बुरा समय", "Bad luck"),
    "situation_title_fear" to Entry("Fear", "डर", "Fear"),
    "situation_title_relationship_issues" to Entry(
        "Relationship Issues", "रिश्तों में परेशानी", "Relationship Issues"
    ),
    "situation_prompt_money_stress" to Entry(
        "Mujhe paison ki tension se nikalne mein guide karo, wisdom aur stability ke saath.",
        "पैसों की चिंता से बाहर निकलने में मुझे बुद्धि और स्थिरता के साथ मार्गदर्शन दीजिए।",
        "Guide me out of money stress, with wisdom and stability."
    ),
    "situation_prompt_bad_luck" to Entry(
        "Mujhe is bad luck ke daur mein patience, discipline aur faith ke saath aage badhne mein madad karo.",
        "इस कठिन समय में मुझे धैर्य, अनुशासन और विश्वास के साथ आगे बढ़ने में मदद कीजिए।",
        "Help me move through this run of bad luck with patience, discipline, and faith."
    ),
    "situation_prompt_fear" to Entry(
        "Mera fear door karke mujhe courage aur devotion ke saath aage badhne mein madad karo.",
        "मेरा डर दूर करके मुझे साहस और भक्ति के साथ आगे बढ़ने में मदद कीजिए।",
        "Help me move past my fear with courage and devotion."
    ),
    "situation_prompt_relationship_issues" to Entry(
        "Meri relationship issues mein mujhe clarity aur compassion ke saath guide karo.",
        "रिश्तों की इस उलझन को समझने में मुझे स्पष्टता और करुणा के साथ मार्गदर्शन दीजिए।",
        "Guide me through my relationship issues with clarity and compassion."
    ),

    // BhaktiChat screen
    "bhakti_chat_title" to Entry("BhaktiChat", "BhaktiChat", "BhaktiChat"),
    "start_a_new_chat" to Entry("Start a new chat", "नई बातचीत शुरू करें", "Start a new chat"),
    "clear_all" to Entry("Clear all", "सभी हटाएँ", "Clear all"),
    "search" to Entry("Search…", "खोजें…", "Search…"),
    "no_chats_match_search" to Entry(
        "No chats match your search.", "आपकी खोज से कोई बातचीत नहीं मिली।", "No chats match your search."
    ),
    "no_conversations_yet" to Entry(
        "No conversations yet. Start with Home or BhaktiChat.",
        "अभी कोई बातचीत नहीं है। होम या BhaktiChat से शुरू करें।",
        "No conversations yet. Start with Home or BhaktiChat."
    ),
    "all_chats" to Entry("All chats", "सभी चैट", "All chats"),
    "your_creations" to Entry("Your creations", "आपकी रचनाएँ", "Your creations"),
    "saved" to Entry("Saved", "सहेजे गए", "Saved"),
    "saved_messages" to Entry("Saved messages", "सहेजे गए संदेश", "Saved messages"),
    "saved_aartis" to Entry("Saved aartis", "सहेजी गई आरतियाँ", "Saved aartis"),
    "no_saved_match_search" to Entry(
        "No saved items match your search.",
        "आपकी खोज से कोई सहेजी हुई चीज़ नहीं मिली।",
        "No saved items match your search."
    ),
    "no_creations_match_search" to Entry(
        "No creations match your search.",
        "आपकी खोज से कोई रचना नहीं मिली।",
        "No creations match your search."
    ),
    "delete" to Entry("Delete", "हटाएँ", "Delete"),
    "cancel" to Entry("Cancel", "रद्द करें", "Cancel"),
    "clear_all_chats_confirm" to Entry("Clear all chats?", "सभी बातचीत हटाएँ?", "Clear all chats?"),
    "clear_all_creations_confirm" to Entry(
        "Clear all creations?", "सभी रचनाएँ हटाएँ?", "Clear all creations?"
    ),
    "cannot_be_undone" to Entry("This cannot be undone.", "इसे वापस नहीं बदला जा सकता।", "This cannot be undone."),
    "remove_bookmark" to Entry("Remove bookmark", "बुकमार्क हटाएँ", "Remove bookmark"),
    "start_voice_input" to Entry("Start voice input", "बोलकर लिखना शुरू करें", "Start voice input"),
    "stop_voice_input" to Entry("Stop voice input", "बोलकर लिखना रोकें", "Stop voice input"),
    "send" to Entry("Send", "भेजें", "Send"),
    "microphone_permission_denied" to Entry(
        "Microphone permission denied", "माइक्रोफ़ोन की अनुमति नहीं दी गई", "Microphone permission denied"
    ),
    "ask_guide_anything" to Entry("Ask %s anything…", "%s से कुछ भी पूछें…", "Ask %s anything…"),
    "nothing_saved_yet" to Entry(
        "Nothing saved yet. Bookmark a message or aarti to find it here.",
        "अभी कुछ सहेजा नहीं गया है। यहाँ देखने के लिए किसी संदेश या आरती को बुकमार्क करें।",
        "Nothing saved yet. Bookmark a message or aarti to find it here."
    ),
    "your_creations_header" to Entry("Your creations", "आपकी रचनाएँ", "Your creations"),
    "no_divine_creations_yet" to Entry(
        "No divine creations yet. Open Divine Image to generate one.",
        "अभी कोई दिव्य छवि नहीं बनाई गई है। अपनी पहली छवि बनाने के लिए दिव्य छवि खोलें।",
        "No divine creations yet. Open Divine Image to generate one."
    ),

    // Guide picker screen
    "guide_picker_title" to Entry("Choose your guide", "अपना गुरु चुनें", "Choose your guide"),
    "guide_picker_subtitle" to Entry(
        "Pick someone to chat with. Private and secure.",
        "बात करने के लिए अपना गुरु चुनें। आपकी बातचीत निजी और सुरक्षित है।",
        "Pick someone to chat with. Private and secure."
    ),
    "guide_picker_chat" to Entry("Chat", "चैट", "Chat"),
    "guide_picker_footer" to Entry(
        "More guides coming soon", "जल्द ही और गुरु जुड़ेंगे", "More guides coming soon"
    ),
    "guide_picker_avatar_content_description" to Entry(
        "%s avatar", "%s की तस्वीर", "%s avatar"
    ),
    "guide_preview_krishna" to Entry(
        "Clarity for tough decisions and purpose.",
        "कठिन फैसलों और उद्देश्य के लिए स्पष्टता।",
        "Clarity for tough decisions and purpose."
    ),
    "guide_preview_lakshmi" to Entry(
        "Money stress, stability, and gratitude.",
        "पैसों की चिंता, स्थिरता और कृतज्ञता।",
        "Money stress, stability, and gratitude."
    ),
    "guide_preview_shani" to Entry(
        "Strength through bad luck and hard times.",
        "बुरे समय और कठिनाइयों में धैर्य और शक्ति।",
        "Strength through bad luck and hard times."
    ),
    "guide_preview_shiv" to Entry(
        "Stillness and detachment.", "शांति और वैराग्य।", "Stillness and detachment."
    ),
    "guide_preview_hanuman" to Entry(
        "Courage and devotion.", "साहस और भक्ति।", "Courage and devotion."
    ),

    // Reels screen
    "reels_no_reels_yet" to Entry("No reels yet", "अभी कोई रील नहीं है", "No reels yet"),
    "reels_new_clips_soon" to Entry(
        "New devotional clips arrive here soon.",
        "यहाँ जल्द नई भक्ति रीलें आएँगी।",
        "New devotional clips arrive here soon."
    ),
    "reels_feed_top" to Entry("Top", "टॉप", "Top"),
    "reels_feed_aartis" to Entry("Aartis", "आरतियाँ", "Aartis"),
    "reels_save" to Entry("Save", "सहेजें", "Save"),
    "reels_share" to Entry("Share", "शेयर करें", "Share"),
    "reels_share_reel" to Entry("Share reel", "रील शेयर करें", "Share reel"),
    "reels_status" to Entry("Status", "स्टेटस", "Status"),
    "reels_set_as_status" to Entry(
        "Set as WhatsApp status", "व्हाट्सऐप स्टेटस लगाएँ", "Set as WhatsApp status"
    ),
    "reels_ask" to Entry("Ask", "पूछें", "Ask"),
    "reels_ask_about_this" to Entry("Ask about this reel", "इस रील के बारे में पूछें", "Ask about this reel"),

    // Explore hub
    "explore_title" to Entry("Explore", "एक्सप्लोर", "Explore"),
    "explore_services" to Entry("Services", "सुविधाएँ", "Services"),
    "explore_coming_soon" to Entry("Coming soon", "जल्द आ रहा है", "Coming soon"),
    "explore_aartis_title" to Entry("Aartis", "आरतियाँ", "Aartis"),
    "explore_aartis_subtitle" to Entry(
        "Devotional songs with lyrics & audio",
        "भक्ति गीत—बोल और ऑडियो के साथ",
        "Devotional songs with lyrics & audio"
    ),
    "explore_choghadiya_title" to Entry("Choghadiya", "चौघड़िया", "Choghadiya"),
    "explore_choghadiya_subtitle" to Entry(
        "Today's auspicious timings for your city",
        "आपके शहर के लिए आज के शुभ समय",
        "Today's auspicious timings for your city"
    ),
    "explore_festivals_title" to Entry("Festivals", "त्योहार", "Festivals"),
    "explore_festivals_subtitle" to Entry(
        "Upcoming Hindu festivals & vrat",
        "आने वाले हिंदू पर्व और व्रत",
        "Upcoming Hindu festivals & vrat"
    ),
    "explore_panchang_title" to Entry("Panchang", "पंचांग", "Panchang"),
    "explore_panchang_subtitle" to Entry(
        "Tithi, nakshatra, sunrise & sunset today",
        "आज की तिथि, नक्षत्र, सूर्योदय और सूर्यास्त",
        "Tithi, nakshatra, sunrise & sunset today"
    ),
    "explore_wallpapers_title" to Entry("Wallpapers", "वॉलपेपर", "Wallpapers"),
    "explore_wallpapers_subtitle" to Entry(
        "Deity wallpapers to save & share",
        "भगवान के वॉलपेपर—सहेजें और शेयर करें",
        "Deity wallpapers to save & share"
    ),
    "explore_rashifal_title" to Entry("Rashifal", "राशिफल", "Rashifal"),
    "explore_rashifal_subtitle" to Entry("Daily horoscope", "दैनिक राशिफल", "Daily horoscope"),
    "explore_kundli_title" to Entry("Kundli", "कुंडली", "Kundli"),
    "explore_kundli_subtitle" to Entry("Birth chart", "जन्म कुंडली", "Birth chart"),
    "explore_divine_image_content_description" to Entry("Divine Image", "दिव्य छवि", "Divine Image"),
    "explore_featured" to Entry("FEATURED", "विशेष", "FEATURED"),
    "explore_divine_image_title" to Entry("Divine Image", "दिव्य छवि", "Divine Image"),
    "explore_divine_image_subtitle" to Entry(
        "Turn your photo into a sacred darshan",
        "अपनी फोटो से दिव्य दर्शन बनाएँ",
        "Turn your photo into a sacred darshan"
    ),
    "explore_create_yours" to Entry("Create yours", "अपना बनाएँ", "Create yours"),

    // Aartis screen — list, detail lyrics view, and full-screen now-playing player
    "aartis_back_content_description" to Entry("Back to Home", "होम पर वापस जाएँ", "Back to Home"),
    "aartis_search_placeholder" to Entry("Search aartis", "आरती खोजें", "Search aartis"),
    "aartis_todays_aarti_label" to Entry("Today's aarti", "आज की आरती", "Today's aarti"),
    "aartis_empty_search" to Entry(
        "No aartis match this search right now.",
        "आपकी खोज से अभी कोई आरती नहीं मिली।",
        "No aartis match this search right now."
    ),
    "aartis_play_all" to Entry("Play all aartis", "सभी आरतियाँ सुनें", "Play all aartis"),
    "aartis_play_all_subtitle" to Entry(
        "Continuous devotional playback", "बिना रुके लगातार आरतियाँ सुनें", "Continuous devotional playback"
    ),
    "aartis_play_content_description" to Entry("Play %s", "%s सुनें", "Play %s"),
    "aartis_remove_saved_content_description" to Entry(
        "Remove %s from saved", "सहेजी हुई सूची से %s हटाएँ", "Remove %s from saved"
    ),
    "aartis_save_content_description" to Entry("Save %s", "%s सहेजें", "Save %s"),
    "aarti_fallback_title" to Entry("Aarti", "आरती", "Aarti"),
    "now_playing_fallback" to Entry("Now playing", "अभी चल रही है", "Now playing"),
    "buffering" to Entry("Buffering…", "लोड हो रहा है…", "Buffering…"),
    "play_label" to Entry("Play", "सुनें", "Play"),
    "pause_label" to Entry("Pause", "रोकें", "Pause"),
    "next_aarti_content_description" to Entry("Next aarti", "अगली आरती सुनें", "Next aarti"),
    "previous_aarti_content_description" to Entry("Previous aarti", "पिछली आरती सुनें", "Previous aarti"),
    "stop_playback_content_description" to Entry("Stop playback", "आरती बंद करें", "Stop playback"),
    "minimize_player_content_description" to Entry("Minimize player", "प्लेयर छोटा करें", "Minimize player"),
    "playing_from" to Entry("PLAYING FROM", "इस संग्रह से", "PLAYING FROM"),
    "bhaktichat_aartis_subtitle" to Entry("BhaktiChat Aartis", "BhaktiChat आरती संग्रह", "BhaktiChat Aartis"),
    "aarti_filter_all" to Entry("All", "सभी", "All"),
    "aarti_filter_popular" to Entry("Popular", "लोकप्रिय", "Popular"),
    "aarti_filter_morning" to Entry("Morning", "सुबह", "Morning"),
    "aarti_filter_evening" to Entry("Evening", "शाम", "Evening"),
    "aarti_filter_krishna" to Entry("Lord Krishna", "श्री कृष्ण", "Lord Krishna"),
    "aarti_filter_ganesh" to Entry("Ganesh Ji", "गणेश जी", "Ganesh Ji"),
    "aarti_filter_shiv" to Entry("Shiv Ji", "शिव जी", "Shiv Ji"),
    "aarti_filter_devi" to Entry("Devi", "देवी", "Devi"),
    "aarti_filter_vrat" to Entry("Vrat", "व्रत", "Vrat"),
    "aarti_plays_k" to Entry("%dk plays", "%d हज़ार बार चली", "%dk plays"),
    "aarti_plays" to Entry("%d plays", "%d बार चली", "%d plays"),
    "aarti_calm_daily_recitation" to Entry("Calm daily recitation", "रोज़ की शांत आराधना", "Calm daily recitation"),
    "aarti_stop_reading_content_description" to Entry("Stop reading", "पढ़ना रोकें", "Stop reading"),
    "aarti_read_aloud_content_description" to Entry("Read aloud", "ज़ोर से पढ़ें", "Read aloud"),
    "copy" to Entry("Copy", "कॉपी करें", "Copy"),
    "ask_lord_krishna" to Entry("Ask Lord Krishna", "श्री कृष्ण से पूछें", "Ask Lord Krishna"),
    "aarti_explain_prompt_named" to Entry(
        "Mujhe %s aarti ke baare mein bataiye.",
        "मुझे %s आरती के बारे में बताइए।",
        "Explain %s aarti to me."
    ),
    "aarti_explain_prompt_generic" to Entry(
        "Mujhe yeh aarti explain kar dijiye.",
        "मुझे इस आरती का अर्थ समझाइए।",
        "Explain this aarti to me."
    ),
    "lyrics" to Entry("Lyrics", "बोल", "Lyrics"),
    "aarti_lyrics_empty" to Entry("Lyrics will appear here.", "आरती के बोल यहाँ दिखाई देंगे।", "Lyrics will appear here."),
    "aarti_verse_label" to Entry("Verse %d", "अंतरा %d", "Verse %d"),
    "video" to Entry("Video", "वीडियो", "Video"),
    "watch_on_youtube" to Entry("Watch on YouTube", "यूट्यूब पर देखें", "Watch on YouTube"),
    "deity_krishna" to Entry("Lord Krishna", "श्री कृष्ण", "Lord Krishna"),
    "deity_ganesh" to Entry("Lord Ganesh", "श्री गणेश", "Lord Ganesh"),
    "deity_shiv" to Entry("Lord Shiv", "भगवान शिव", "Lord Shiv"),
    "deity_lakshmi" to Entry("Goddess Lakshmi", "देवी लक्ष्मी", "Goddess Lakshmi"),
    "deity_devi" to Entry("Devi", "देवी", "Devi"),
    "deity_vishnu" to Entry("Lord Vishnu", "भगवान विष्णु", "Lord Vishnu"),
    "deity_hanuman" to Entry("Lord Hanuman", "श्री हनुमान", "Lord Hanuman"),
    "deity_other" to Entry("Aarti", "आरती", "Aarti"),
    "aarti_icon_content_description" to Entry("%s icon", "%s आइकन", "%s icon"),
    "video_coming_soon" to Entry("Video coming soon", "वीडियो जल्द उपलब्ध होगा", "Video coming soon"),
    "video_coming_soon_body" to Entry(
        "Read the lyrics below while the video is being prepared.",
        "तब तक नीचे आरती के बोल पढ़ें।",
        "Read the lyrics below while the video is being prepared."
    ),

    // Wallpapers
    "back" to Entry("Back", "वापस", "Back"),
    "wallpapers_title" to Entry("Wallpapers", "वॉलपेपर", "Wallpapers"),
    "wallpapers_subtitle" to Entry(
        "Deity wallpapers to save, share, or set as your status",
        "भगवान के सुंदर वॉलपेपर—सहेजें, शेयर करें या स्टेटस लगाएँ",
        "Deity wallpapers to save, share, or set as your status"
    ),
    "save" to Entry("Save", "सहेजें", "Save"),
    "saved_to_photos" to Entry("Saved to Photos", "फ़ोटो में सहेज दिया गया", "Saved to Photos"),
    "share" to Entry("Share", "शेयर करें", "Share"),
    "share_wallpaper" to Entry("Share wallpaper", "वॉलपेपर शेयर करें", "Share wallpaper"),
    "set_wallpaper_button" to Entry("Set", "लगाएँ", "Set"),
    "set_as_wallpaper" to Entry("Set as wallpaper", "वॉलपेपर लगाएँ", "Set as wallpaper"),
    "no_wallpaper_app_found" to Entry(
        "No wallpaper app found on this device.",
        "इस डिवाइस पर वॉलपेपर लगाने वाला कोई ऐप नहीं मिला।",
        "No wallpaper app found on this device."
    ),
    "unable_to_create_mediastore_entry" to Entry(
        "Unable to create MediaStore entry.", "फ़ोटो सहेजने की जगह नहीं बन सकी।", "Unable to create MediaStore entry."
    ),

    // Wallpaper catalog (Wallpapers.all) — titles reuse guide_title_* translations where the
    // same deity appears, for consistency across Home/Guide Picker/Wallpapers.
    "wallpaper_title_krishna" to Entry("Shri Krishna", "श्री कृष्ण", "Shri Krishna"),
    "wallpaper_subtitle_krishna" to Entry("Divine flute, eternal peace", "दिव्य बांसुरी, शाश्वत शांति", "Divine flute, eternal peace"),
    "wallpaper_title_shiv" to Entry("Shiv Ji", "शिव जी", "Shiv Ji"),
    "wallpaper_subtitle_shiv" to Entry("Stillness and inner strength", "शांति और आंतरिक शक्ति", "Stillness and inner strength"),
    "wallpaper_title_hanuman" to Entry("Hanuman Ji", "हनुमान जी", "Hanuman Ji"),
    "wallpaper_subtitle_hanuman" to Entry("Courage and devotion", "साहस और भक्ति", "Courage and devotion"),
    "wallpaper_title_lakshmi" to Entry("Lakshmi Ji", "लक्ष्मी जी", "Lakshmi Ji"),
    "wallpaper_subtitle_lakshmi" to Entry("Abundance and grace", "समृद्धि और कृपा", "Abundance and grace"),
    "wallpaper_title_shani" to Entry("Shani Dev", "शनि देव", "Shani Dev"),
    "wallpaper_subtitle_shani" to Entry("Discipline and truth", "अनुशासन और सत्य", "Discipline and truth"),
    "wallpaper_title_annapurna" to Entry("Annapurna Ji", "अन्नपूर्णा जी", "Annapurna Ji"),
    "wallpaper_subtitle_annapurna" to Entry("Nourishment and plenty", "पोषण और प्रचुरता", "Nourishment and plenty"),
    "wallpaper_title_ekadashi" to Entry("Ekadashi Mata", "एकादशी माता", "Ekadashi Mata"),
    "wallpaper_subtitle_ekadashi" to Entry("Fasting and devotion", "व्रत और भक्ति", "Fasting and devotion"),
    "wallpaper_title_kali" to Entry("Kali Mata", "काली माता", "Kali Mata"),
    "wallpaper_subtitle_kali" to Entry("Fierce protection", "प्रचंड शक्ति और रक्षा", "Fierce protection"),
    "wallpaper_title_ganga" to Entry("Ganga Ji", "गंगा जी", "Ganga Ji"),
    "wallpaper_subtitle_ganga" to Entry("Purity and flow", "पवित्रता और प्रवाह", "Purity and flow"),
    "wallpaper_title_gayatri" to Entry("Gayatri Mata", "गायत्री माता", "Gayatri Mata"),
    "wallpaper_subtitle_gayatri" to Entry("Wisdom and light", "ज्ञान और प्रकाश", "Wisdom and light"),
    "wallpaper_title_chitragupt" to Entry("Chitragupt Ji", "चित्रगुप्त जी", "Chitragupt Ji"),
    "wallpaper_subtitle_chitragupt" to Entry("Justice and record", "न्याय और कर्मों का लेखा", "Justice and record"),
    "wallpaper_title_tulsi" to Entry("Tulsi Ji", "तुलसी जी", "Tulsi Ji"),
    "wallpaper_subtitle_tulsi" to Entry("Devotion and healing", "भक्ति और उपचार", "Devotion and healing"),
    "wallpaper_title_durga" to Entry("Durga Ji", "दुर्गा जी", "Durga Ji"),
    "wallpaper_subtitle_durga" to Entry("Strength and protection", "शक्ति और सुरक्षा", "Strength and protection"),
    "wallpaper_title_parvati" to Entry("Parvati Ji", "पार्वती जी", "Parvati Ji"),
    "wallpaper_subtitle_parvati" to Entry("Devotion and balance", "भक्ति और संतुलन", "Devotion and balance"),
    "wallpaper_title_brihaspati" to Entry("Brihaspati Dev", "बृहस्पति देव", "Brihaspati Dev"),
    "wallpaper_subtitle_brihaspati" to Entry("Wisdom and guidance", "ज्ञान और मार्गदर्शन", "Wisdom and guidance"),
    "wallpaper_title_hari-vishnu" to Entry("Hari Vishnu Ji", "हरि विष्णु जी", "Hari Vishnu Ji"),
    "wallpaper_subtitle_hari-vishnu" to Entry("Preservation and grace", "संरक्षण और कृपा", "Preservation and grace"),
    "wallpaper_title_ramchandra" to Entry("Ramchandra Ji", "रामचंद्र जी", "Ramchandra Ji"),
    "wallpaper_subtitle_ramchandra" to Entry("Dharma and honor", "धर्म और मर्यादा", "Dharma and honor"),
    "wallpaper_title_lalita" to Entry("Lalita Mata", "ललिता माता", "Lalita Mata"),
    "wallpaper_subtitle_lalita" to Entry("Beauty and grace", "सुंदरता और कृपा", "Beauty and grace"),
    "wallpaper_title_vaishno-devi" to Entry("Vaishno Devi", "वैष्णो देवी", "Vaishno Devi"),
    "wallpaper_subtitle_vaishno-devi" to Entry("Faith and shelter", "आस्था और शरण", "Faith and shelter"),
    "wallpaper_title_shani-dev-aarti" to Entry("Shani Dev", "शनि देव", "Shani Dev"),
    "wallpaper_subtitle_shani-dev-aarti" to Entry("Karma and discipline", "कर्म और अनुशासन", "Karma and discipline"),
    "wallpaper_title_santoshi" to Entry("Santoshi Mata", "संतोषी माता", "Santoshi Mata"),
    "wallpaper_subtitle_santoshi" to Entry("Contentment and peace", "संतोष और शांति", "Contentment and peace"),
    "wallpaper_title_satyanarayan" to Entry("Satyanarayan Ji", "सत्यनारायण जी", "Satyanarayan Ji"),
    "wallpaper_subtitle_satyanarayan" to Entry("Truth and fulfillment", "सत्य और मनोकामना-पूर्ति", "Truth and fulfillment"),
    "wallpaper_title_saraswati" to Entry("Saraswati Ji", "सरस्वती जी", "Saraswati Ji"),
    "wallpaper_subtitle_saraswati" to Entry("Knowledge and art", "ज्ञान और कला", "Knowledge and art"),
    "wallpaper_title_sita" to Entry("Sita Ji", "सीता जी", "Sita Ji"),
    "wallpaper_subtitle_sita" to Entry("Purity and devotion", "पवित्रता और भक्ति", "Purity and devotion"),
    "wallpaper_title_surya" to Entry("Surya Dev", "सूर्य देव", "Surya Dev"),
    "wallpaper_subtitle_surya" to Entry("Energy and vitality", "ऊर्जा और जीवनशक्ति", "Energy and vitality"),

    // Divine Image hub
    "divine_image_title" to Entry("Divine Image", "दिव्य छवि", "Divine Image"),
    "divine_image_hub_subtitle" to Entry(
        "Turn your photo into a sacred moment in seconds.",
        "अपनी फोटो से एक दिव्य स्मृति बनाएँ।",
        "Turn your photo into a sacred moment in seconds."
    ),
    "one_tap_moments" to Entry("One-tap moments", "एक टैप में दिव्य पल", "One-tap moments"),
    "your_creations_short" to Entry("Your creations", "आपकी रचनाएँ", "Your creations"),
    "history_link" to Entry("History ›", "इतिहास ›", "History ›"),
    "your_divine_moments_empty" to Entry(
        "Your divine moments will appear here",
        "आपकी बनाई दिव्य छवियाँ यहाँ दिखाई देंगी",
        "Your divine moments will appear here"
    ),

    // Settings screen
    "settings_title" to Entry("Settings", "सेटिंग्स", "Settings"),
    "appearance" to Entry("Appearance", "दिखावट", "Appearance"),
    "appearance_subtitle" to Entry(
        "Choose how BhaktiChat looks on this device.",
        "चुनें कि इस डिवाइस पर BhaktiChat कैसा दिखे।",
        "Choose how BhaktiChat looks on this device."
    ),
    "theme_system_default" to Entry("System default", "सिस्टम डिफ़ॉल्ट", "System default"),
    "theme_light" to Entry("Light", "हल्की थीम", "Light"),
    "theme_dark" to Entry("Dark", "गहरी थीम", "Dark"),
    "language_section_title" to Entry("Language", "भाषा", "Language"),
    "daily_reminder" to Entry("Daily reminder", "रोज़ की याद", "Daily reminder"),
    "daily_reminder_subtitle" to Entry(
        "Pick a time and BhaktiChat will gently nudge you each day.",
        "समय चुनें; BhaktiChat आपको हर दिन याद दिलाएगा।",
        "Pick a time and BhaktiChat will gently nudge you each day."
    ),
    "reminder_time" to Entry("Reminder time", "याद दिलाने का समय", "Reminder time"),
    "language_section_subtitle" to Entry(
        "How your guides speak, and how BhaktiChat reads throughout the app.",
        "आपके गुरु किस भाषा में बात करें और पूरे ऐप की भाषा कैसी हो।",
        "How your guides speak, and how BhaktiChat reads throughout the app."
    ),

    // Choghadiya screen — location dialogs
    "choghadiya_enable_location_title" to Entry(
        "Enable location access", "स्थान की अनुमति दें", "Enable location access"
    ),
    "choghadiya_enable_location_body" to Entry(
        "Allow location access so the app can automatically choose the nearest city for todays choghadiya.",
        "स्थान की अनुमति दें, ताकि ऐप आज के चौघड़िया के लिए अपने आप सबसे नज़दीकी शहर चुन सके।",
        "Allow location access so the app can automatically choose the nearest city for todays choghadiya."
    ),
    "choghadiya_allow" to Entry("Allow", "अनुमति दें", "Allow"),
    "choghadiya_not_now" to Entry("Not now", "अभी नहीं", "Not now"),
    "choghadiya_turn_on_location_title" to Entry(
        "Turn on location", "स्थान सेवा चालू करें", "Turn on location"
    ),
    "choghadiya_turn_on_location_body" to Entry(
        "Location services are off. Turn them on so BhaktiChat can automatically use your current city.",
        "स्थान सेवाएँ बंद हैं। उन्हें चालू करें ताकि BhaktiChat आपके मौजूदा शहर का अपने आप उपयोग कर सके।",
        "Location services are off. Turn them on so BhaktiChat can automatically use your current city."
    ),
    "choghadiya_open_settings" to Entry("Open settings", "सेटिंग्स खोलें", "Open settings"),

    // Choghadiya screen — top bar
    "choghadiya_back_to_home" to Entry("Back to Home", "होम पर वापस जाएँ", "Back to Home"),
    "choghadiya_open_city_selector" to Entry(
        "Open city selector", "शहर चुनने वाला मेनू खोलें", "Open city selector"
    ),

    // Choghadiya screen — hero card
    "choghadiya_right_now" to Entry("Right now", "अभी", "Right now"),
    "choghadiya_unable_to_calculate" to Entry(
        "Unable to calculate the current period yet.",
        "अभी का चौघड़िया नहीं निकाला जा सका।",
        "Unable to calculate the current period yet."
    ),
    "choghadiya_try_another_city" to Entry(
        "Please try another city or retry in a moment.",
        "कोई दूसरा शहर आज़माएँ या थोड़ी देर बाद फिर कोशिश करें।",
        "Please try another city or retry in a moment."
    ),
    "choghadiya_verdict_favourable" to Entry(
        "Favourable time right now", "अभी अनुकूल समय है", "Favourable time right now"
    ),
    "choghadiya_verdict_neutral" to Entry(
        "Neutral time right now", "अभी सामान्य समय है", "Neutral time right now"
    ),
    "choghadiya_verdict_unfavourable" to Entry(
        "Not favourable right now", "अभी अनुकूल समय नहीं है", "Not favourable right now"
    ),
    "choghadiya_kaal_active" to Entry("%s kaal active", "%s का समय चल रहा है", "%s kaal active"),

    // Choghadiya screen — next auspicious period card
    "choghadiya_next_auspicious_period" to Entry(
        "Next auspicious period", "अगला शुभ समय", "Next auspicious period"
    ),
    "choghadiya_no_more_auspicious" to Entry(
        "No more auspicious periods are left in the current cycle.",
        "मौजूदा चक्र में अब कोई और शुभ समय नहीं बचा है।",
        "No more auspicious periods are left in the current cycle."
    ),
    "choghadiya_kaal_at" to Entry("%1\$s kaal at %2\$s", "%1\$s का समय %2\$s से", "%1\$s kaal at %2\$s"),
    "choghadiya_countdown_in" to Entry("In %s", "शुरू होने में %s", "In %s"),
    "choghadiya_countdown_now" to Entry("Starting now", "अभी शुरू हो रहा है", "Starting now"),
    "choghadiya_hour_singular" to Entry("hour", "घंटा", "hour"),
    "choghadiya_hour_plural" to Entry("hours", "घंटे", "hours"),
    "choghadiya_minute_singular" to Entry("minute", "मिनट", "minute"),
    "choghadiya_minute_plural" to Entry("minutes", "मिनट", "minutes"),

    // Choghadiya screen — sun cycle card
    "choghadiya_sunrise" to Entry("Sunrise", "सूर्योदय", "Sunrise"),
    "choghadiya_sunset" to Entry("Sunset", "सूर्यास्त", "Sunset"),
    "choghadiya_next_sunrise" to Entry("Next sunrise", "अगला सूर्योदय", "Next sunrise"),

    // Choghadiya screen — timeline
    "choghadiya_today_timeline" to Entry("Today timeline", "आज की समय-सारणी", "Today timeline"),
    "choghadiya_now_badge" to Entry("Now", "अभी", "Now"),
    "choghadiya_guidance_shubh" to Entry(
        "Good for starting new work and important decisions.",
        "नया काम शुरू करने और महत्वपूर्ण फैसलों के लिए अच्छा समय।",
        "Good for starting new work and important decisions."
    ),
    "choghadiya_guidance_labh" to Entry(
        "Helpful for business, progress, and practical gains.",
        "व्यापार, प्रगति और व्यावहारिक लाभ के लिए सहायक।",
        "Helpful for business, progress, and practical gains."
    ),
    "choghadiya_guidance_amrit" to Entry(
        "Excellent for meaningful actions, prayers, and fresh starts.",
        "सार्थक कार्यों, प्रार्थना और नई शुरुआत के लिए उत्तम।",
        "Excellent for meaningful actions, prayers, and fresh starts."
    ),
    "choghadiya_guidance_char" to Entry(
        "Steady for movement, admin work, and flexible plans.",
        "यात्रा, आवागमन और बदलती योजनाओं के लिए उपयुक्त।",
        "Steady for movement, admin work, and flexible plans."
    ),
    "choghadiya_guidance_rog" to Entry(
        "Best for routine tasks and reflection.",
        "रोज़मर्रा के काम और आत्मचिंतन के लिए सबसे उपयुक्त।",
        "Best for routine tasks and reflection."
    ),
    "choghadiya_guidance_kaal" to Entry(
        "Avoid major decisions. Keep tasks simple and low risk.",
        "बड़े फैसलों से बचें। काम सरल और कम जोखिम वाले रखें।",
        "Avoid major decisions. Keep tasks simple and low risk."
    ),
    "choghadiya_guidance_udveg" to Entry(
        "Pause, review, and move gently before taking big action.",
        "बड़ा कदम उठाने से पहले रुककर सोचें और सावधानी से आगे बढ़ें।",
        "Pause, review, and move gently before taking big action."
    ),
    "choghadiya_meaning_shubh" to Entry(
        "A supportive window for important actions.",
        "महत्वपूर्ण काम करने के लिए अनुकूल समय।",
        "A supportive window for important actions."
    ),
    "choghadiya_meaning_labh" to Entry(
        "Useful for growth, planning, and practical gains.",
        "विकास, योजना और व्यावहारिक लाभ के लिए उपयोगी।",
        "Useful for growth, planning, and practical gains."
    ),
    "choghadiya_meaning_amrit" to Entry(
        "Strong for blessings, new starts, and sacred work.",
        "पूजा, शुभ काम और नई शुरुआत के लिए बहुत अच्छा समय।",
        "Strong for blessings, new starts, and sacred work."
    ),
    "choghadiya_meaning_char" to Entry(
        "Good for movement, communication, and routine flow.",
        "यात्रा, संवाद और रोज़मर्रा के कामों के लिए अच्छा।",
        "Good for movement, communication, and routine flow."
    ),
    "choghadiya_meaning_rog" to Entry(
        "Keep to ordinary tasks and avoid high stakes decisions.",
        "सामान्य कामों तक सीमित रहें और बड़े फैसलों से बचें।",
        "Keep to ordinary tasks and avoid high stakes decisions."
    ),
    "choghadiya_meaning_kaal" to Entry(
        "Better for restraint, patience, and lighter commitments.",
        "संयम और धैर्य रखें; केवल छोटे, कम जोखिम वाले काम करें।",
        "Better for restraint, patience, and lighter commitments."
    ),
    "choghadiya_meaning_udveg" to Entry(
        "A restless phase. Move slowly and avoid pressure.",
        "एक बेचैन दौर। धीरे आगे बढ़ें और दबाव से बचें।",
        "A restless phase. Move slowly and avoid pressure."
    ),

    // Choghadiya screen — meanings accordion
    "choghadiya_what_do_these_mean" to Entry(
        "What do these mean?", "इनका क्या मतलब है?", "What do these mean?"
    ),
    "choghadiya_collapse_meanings" to Entry(
        "Collapse meanings", "अर्थ छिपाएँ", "Collapse meanings"
    ),
    "choghadiya_expand_meanings" to Entry(
        "Expand meanings", "अर्थ दिखाएँ", "Expand meanings"
    ),
    "choghadiya_accordion_shubh" to Entry(
        "Supportive for important actions, planning, and new starts.",
        "महत्वपूर्ण कार्यों, योजना और नई शुरुआत के लिए सहायक।",
        "Supportive for important actions, planning, and new starts."
    ),
    "choghadiya_accordion_labh" to Entry(
        "Useful for gains, business progress, and practical wins.",
        "लाभ, व्यापार में प्रगति और व्यावहारिक सफलता के लिए उपयोगी।",
        "Useful for gains, business progress, and practical wins."
    ),
    "choghadiya_accordion_amrit" to Entry(
        "Excellent for sacred work, blessings, and meaningful beginnings.",
        "पवित्र कार्यों, आशीर्वाद और सार्थक शुरुआत के लिए उत्तम।",
        "Excellent for sacred work, blessings, and meaningful beginnings."
    ),
    "choghadiya_accordion_rog" to Entry(
        "Better for routine tasks. Avoid high stakes commitments.",
        "रोज़मर्रा के कामों के लिए बेहतर। बड़ी प्रतिबद्धताओं से बचें।",
        "Better for routine tasks. Avoid high stakes commitments."
    ),
    "choghadiya_accordion_chal" to Entry(
        "Good for movement, travel, and flexible work.",
        "यात्रा, आवागमन और लचीले काम के लिए अच्छा।",
        "Good for movement, travel, and flexible work."
    ),
    "choghadiya_accordion_kaal" to Entry(
        "Best handled with patience, caution, and low risk tasks.",
        "इस समय धैर्य रखें, सावधानी बरतें और कम जोखिम वाले काम करें।",
        "Best handled with patience, caution, and low risk tasks."
    ),
    "choghadiya_accordion_udveg" to Entry(
        "A restless phase. Slow down and avoid pressure.",
        "एक बेचैन दौर। धीमे चलें और दबाव से बचें।",
        "A restless phase. Slow down and avoid pressure."
    ),

    // Choghadiya screen — chat CTA card
    "choghadiya_not_sure_when" to Entry(
        "Not sure when to act?", "समझ नहीं आ रहा कि काम कब शुरू करें?", "Not sure when to act?"
    ),
    "choghadiya_ask_before_important_task" to Entry(
        "Ask for practical guidance before you begin an important task.",
        "महत्वपूर्ण काम शुरू करने से पहले व्यावहारिक सलाह लें।",
        "Ask for practical guidance before you begin an important task."
    ),
    "choghadiya_ask_shani_dev" to Entry("Ask Shani Dev", "शनि देव से पूछें", "Ask Shani Dev"),
    "choghadiya_explain_todays_choghadiya" to Entry(
        "Aaj ka choghadiya samjha do.",
        "आज का चौघड़िया समझा दीजिए।",
        "Explain today's choghadiya."
    ),

    // Choghadiya screen — city selector sheet
    "choghadiya_choose_a_city" to Entry("Choose a city", "शहर चुनें", "Choose a city"),
    "choghadiya_search_cities" to Entry("Search cities", "शहर खोजें", "Search cities"),
    "choghadiya_auto_detect_location" to Entry(
        "Auto detect location", "मौजूदा स्थान अपने आप पहचानें", "Auto detect location"
    ),
    "choghadiya_recently_used" to Entry("Recently used", "हाल में चुने गए", "Recently used"),
    "choghadiya_all_cities" to Entry("All cities", "सभी शहर", "All cities"),
    "choghadiya_no_cities_match" to Entry(
        "No cities match your search.", "आपकी खोज से कोई शहर नहीं मिला।", "No cities match your search."
    ),
    "choghadiya_selected" to Entry("Selected", "चुना गया", "Selected"),

    // --- Reels (static TOP feed, keyed by slug) ---
    // Short invocations are transliterated rather than translated: a Hinglish reader
    // expects "Om Namah Shivaya", not an English gloss of it. Long aarti lyrics are
    // never touched — those live in assets/aartis.json and stay Devanagari always.
    "reel_title_jai-shri-ram" to Entry("Jai Shri Ram", "जय श्री राम", "Jai Shri Ram"),
    "reel_caption_jai-shri-ram" to Entry("Jai Shri Ram. Jab din asthir ho, unka naam aapko sthir rakhe.", "जय श्री राम। जब दिन अस्थिर हो, उनका नाम आपको स्थिर रखे।", "Jai Shri Ram. Jab din asthir ho, unka naam aapko sthir rakhe."),
    "reel_audio_jai-shri-ram" to Entry("Jai Shri Ram", "जय श्री राम", "Jai Shri Ram"),
    "reel_title_jo-shri-ram" to Entry("Shri Ram ka naam", "श्री राम का नाम", "Shri Ram ka naam"),
    "reel_caption_jo-shri-ram" to Entry("Shri Ram ka naam jeevan ki kathinaaiyon se paar lagane ka vishwas deta hai.", "श्री राम का नाम जीवन की कठिनाइयों से पार लगाने का विश्वास देता है।", "Shri Ram ka naam jeevan ki kathinaaiyon se paar lagane ka vishwas deta hai."),
    "reel_audio_jo-shri-ram" to Entry("Shri Ram ka Naam", "श्री राम का नाम", "Shri Ram ka Naam"),
    "reel_title_hanuman-ji-animation" to Entry("Hanuman Ji", "हनुमान जी", "Hanuman Ji"),
    "reel_caption_hanuman-ji-animation" to Entry("Saahas wah bhakti hai jo rukne se inkaar karti hai.", "साहस वह भक्ति है जो रुकने से इनकार करती है।", "Saahas wah bhakti hai jo rukne se inkaar karti hai."),
    "reel_audio_hanuman-ji-animation" to Entry("Hanuman Chalisa", "हनुमान चालीसा", "Hanuman Chalisa"),
    "reel_title_trust-him-toxic-bond" to Entry("Jab Mahadev bandhan todein", "जब महादेव बंधन तोड़ें", "Jab Mahadev bandhan todein"),
    "reel_caption_trust-him-toxic-bond" to Entry("Jab Mahadev koi haanikarak bandhan todein, bharosa rakhiye ki usmein bhi aapka kalyaan hai.", "जब महादेव कोई हानिकारक बंधन तोड़ें, भरोसा रखिए कि उसमें भी आपका कल्याण है।", "Jab Mahadev koi haanikarak bandhan todein, bharosa rakhiye ki usmein bhi aapka kalyaan hai."),
    "reel_audio_trust-him-toxic-bond" to Entry("Mahadev · Original audio", "महादेव · मूल ध्वनि", "Mahadev · Original audio"),
    "reel_title_mahadev-ego-prayer" to Entry("Prarthana ansuni kyun reh gayi?", "प्रार्थना अनसुनी क्यों रह गई?", "Prarthana ansuni kyun reh gayi?"),
    "reel_caption_mahadev-ego-prayer" to Entry("Aapne shanti maangi, par ahankaar thaame rakha. Mahadev aapke banaye khaali sthaan ki prateeksha karte hain.", "आपने शांति माँगी, पर अहंकार थामे रखा। महादेव आपके बनाए खाली स्थान की प्रतीक्षा करते हैं।", "Aapne shanti maangi, par ahankaar thaame rakha. Mahadev aapke banaye khaali sthaan ki prateeksha karte hain."),
    "reel_audio_mahadev-ego-prayer" to Entry("Mahadev · Original audio", "महादेव · मूल ध्वनि", "Mahadev · Original audio"),
    "reel_title_emptiness-he-is-waiting" to Entry("Jahan Mahadev prateeksha karte hain", "जहाँ महादेव प्रतीक्षा करते हैं", "Jahan Mahadev prateeksha karte hain"),
    "reel_caption_emptiness-he-is-waiting" to Entry("Kabhi-kabhi jis khaalipan se aap bach rahe hote hain, wahin ve aapki prateeksha kar rahe hote hain.", "कभी-कभी जिस खालीपन से आप बच रहे होते हैं, वहीं वे आपकी प्रतीक्षा कर रहे होते हैं।", "Kabhi-kabhi jis khaalipan se aap bach rahe hote hain, wahin ve aapki prateeksha kar rahe hote hain."),
    "reel_audio_emptiness-he-is-waiting" to Entry("Mahadev · Original audio", "महादेव · मूल ध्वनि", "Mahadev · Original audio"),
    "reel_title_sukoon-kisi-apne-ke-saath" to Entry("Sukoon", "सुकून", "Sukoon"),
    "reel_caption_sukoon-kisi-apne-ke-saath" to Entry("Kabhi-kabhi sukoon kisi jagah mein nahi, kisi apne ke saath milta hai.", "कभी-कभी सुकून किसी जगह में नहीं, किसी अपने के साथ मिलता है।", "Kabhi-kabhi sukoon kisi jagah mein nahi, kisi apne ke saath milta hai."),
    "reel_audio_sukoon-kisi-apne-ke-saath" to Entry("Har Har Mahadev", "हर हर महादेव", "Har Har Mahadev"),
    "reel_title_mahadev-darshan" to Entry("Mahadev darshan", "महादेव दर्शन", "Mahadev darshan"),
    "reel_caption_mahadev-darshan" to Entry("Har Har Mahadev. Kuch pal ki sthirta aapke liye.", "हर हर महादेव। कुछ पल की स्थिरता आपके लिए।", "Har Har Mahadev. Kuch pal ki sthirta aapke liye."),
    "reel_audio_mahadev-darshan" to Entry("Om Namah Shivaya", "ॐ नमः शिवाय", "Om Namah Shivaya"),
    "reel_title_stare-five-seconds-krishna" to Entry("Kya aapne unhein dekha?", "क्या आपने उन्हें देखा?", "Kya aapne unhein dekha?"),
    "reel_caption_stare-five-seconds-krishna" to Entry("Paanch kshan dekhiye, phir aankhein band kijiye. Kabhi-kabhi Krishna dikhai nahi dete, bheetar anubhav hote hain.", "पाँच क्षण देखिए, फिर आँखें बंद कीजिए। कभी-कभी कृष्ण दिखाई नहीं देते, भीतर अनुभव होते हैं।", "Paanch kshan dekhiye, phir aankhein band kijiye. Kabhi-kabhi Krishna dikhai nahi dete, bheetar anubhav hote hain."),
    "reel_audio_stare-five-seconds-krishna" to Entry("Hare Krishna · Original audio", "हरे कृष्ण · मूल ध्वनि", "Hare Krishna · Original audio"),
    "reel_title_mahadev-sabko-bhula" to Entry("Sabko bhulakar", "सबको भुलाकर", "Sabko bhulakar"),
    "reel_caption_mahadev-sabko-bhula" to Entry("Sabko bhulakar, swayam mein doob jaana — Mahadev ki sthirta yahin se shuru hoti hai.", "सबको भुलाकर, स्वयं में डूब जाना — महादेव की स्थिरता यहीं से शुरू होती है।", "Sabko bhulakar, swayam mein doob jaana — Mahadev ki sthirta yahin se shuru hoti hai."),
    "reel_audio_mahadev-sabko-bhula" to Entry("Mahadev · Original audio", "महादेव · मूल ध्वनि", "Mahadev · Original audio"),
    "reel_title_yadi-tumne-varsho-tak-mehnat" to Entry("Varshon ki mehnat", "वर्षों की मेहनत", "Varshon ki mehnat"),
    "reel_caption_yadi-tumne-varsho-tak-mehnat" to Entry("Yadi tumne varshon tak mehnat ki hai — Hanuman Ji yaad dilate hain ki wah kabhi vyarth nahi gayi.", "यदि तुमने वर्षों तक मेहनत की है — हनुमान जी याद दिलाते हैं कि वह कभी व्यर्थ नहीं गई।", "Yadi tumne varshon tak mehnat ki hai — Hanuman Ji yaad dilate hain ki wah kabhi vyarth nahi gayi."),
    "reel_audio_yadi-tumne-varsho-tak-mehnat" to Entry("Hanuman Ji · Original audio", "हनुमान जी · मूल ध्वनि", "Hanuman Ji · Original audio"),
    "reel_title_jo-sadaiv-uska-dhyan-rakhta-hai" to Entry("Mahadev sada saath hain", "महादेव सदा साथ हैं", "Mahadev sada saath hain"),
    "reel_caption_jo-sadaiv-uska-dhyan-rakhta-hai" to Entry("Jo sadaiv Mahadev ka dhyaan karta hai, Mahadev bhi sada uski raksha karte hain.", "जो सदैव महादेव का ध्यान करता है, महादेव भी सदा उसकी रक्षा करते हैं।", "Jo sadaiv Mahadev ka dhyaan karta hai, Mahadev bhi sada uski raksha karte hain."),
    "reel_audio_jo-sadaiv-uska-dhyan-rakhta-hai" to Entry("Om Namah Shivaya", "ॐ नमः शिवाय", "Om Namah Shivaya"),
    "reel_title_krishna-moonlight-darshan" to Entry("Chandni mein Krishna", "चाँदनी में कृष्ण", "Chandni mein Krishna"),
    "reel_caption_krishna-moonlight-darshan" to Entry("Krishna ke saath chandni ka ek shaant pal.", "कृष्ण के साथ चाँदनी का एक शांत पल।", "Krishna ke saath chandni ka ek shaant pal."),
    "reel_audio_krishna-moonlight-darshan" to Entry("Hare Krishna · Original audio", "हरे कृष्ण · मूल ध्वनि", "Hare Krishna · Original audio"),
    "reel_title_mahadev-nandi-sunset" to Entry("Mahadev aur Nandi", "महादेव और नंदी", "Mahadev aur Nandi"),
    "reel_caption_mahadev-nandi-sunset" to Entry("Mahadev aur Nandi ke saannidhya ka ek shaant pal.", "महादेव और नंदी के सान्निध्य का एक शांत पल।", "Mahadev aur Nandi ke saannidhya ka ek shaant pal."),
    "reel_audio_mahadev-nandi-sunset" to Entry("Om Namah Shivaya", "ॐ नमः शिवाय", "Om Namah Shivaya"),
    "reel_title_ram-hanuman-sanyam-mein-jeete" to Entry("Sanyam ki shakti", "संयम की शक्ति", "Sanyam ki shakti"),
    "reel_caption_ram-hanuman-sanyam-mein-jeete" to Entry("Shri Ram ne keval shakti se nahi, sanyam se bhi vijay paayi.", "श्री राम ने केवल शक्ति से नहीं, संयम से भी विजय पाई।", "Shri Ram ne keval shakti se nahi, sanyam se bhi vijay paayi."),
    "reel_audio_ram-hanuman-sanyam-mein-jeete" to Entry("Ram · Original audio", "राम · मूल ध्वनि", "Ram · Original audio"),
    "reel_title_bal-katha-vachak-ram" to Entry("Baal katha", "बाल कथा", "Baal katha"),
    "reel_caption_bal-katha-vachak-ram" to Entry("Aastha umar nahi dekhti — baalak ki vaani mein Ram katha bhi mann ko chhoo jaati hai.", "आस्था उम्र नहीं देखती—बालक की वाणी में राम कथा भी मन को छू जाती है।", "Aastha umar nahi dekhti — baalak ki vaani mein Ram katha bhi mann ko chhoo jaati hai."),
    "reel_audio_bal-katha-vachak-ram" to Entry("Ram Katha · Original audio", "राम कथा · मूल ध्वनि", "Ram Katha · Original audio"),
    "reel_title_mahadev-updesh-waterfall" to Entry("Mahadev ki seekh", "महादेव की सीख", "Mahadev ki seekh"),
    "reel_caption_mahadev-updesh-waterfall" to Entry("Jharne ke paas ve us prashn ka uttar dete hain jise poochhne se aap dar rahe the.", "झरने के पास वे उस प्रश्न का उत्तर देते हैं जिसे पूछने से आप डर रहे थे।", "Jharne ke paas ve us prashn ka uttar dete hain jise poochhne se aap dar rahe the."),
    "reel_audio_mahadev-updesh-waterfall" to Entry("Mahadev · Original audio", "महादेव · मूल ध्वनि", "Mahadev · Original audio"),
    "reel_title_hanuman-ji-tejas-portrait" to Entry("Hanuman Ji", "हनुमान जी", "Hanuman Ji"),
    "reel_caption_hanuman-ji-tejas-portrait" to Entry("Aisi shakti, jise shabdon ki aavashyakta nahi.", "ऐसी शक्ति, जिसे शब्दों की आवश्यकता नहीं।", "Aisi shakti, jise shabdon ki aavashyakta nahi."),
    "reel_audio_hanuman-ji-tejas-portrait" to Entry("Hanuman Chalisa", "हनुमान चालीसा", "Hanuman Chalisa"),
    "reel_title_hanuman-ashirwad-modern-life" to Entry("Unka ashirwad, aapka din", "उनका आशीर्वाद, आपका दिन", "Unka ashirwad, aapka din"),
    "reel_caption_hanuman-ashirwad-modern-life" to Entry("Aapke haath mein phone ho, phir bhi unka ashirwad aapke saath hai.", "आपके हाथ में फ़ोन हो, फिर भी उनका आशीर्वाद आपके साथ है।", "Aapke haath mein phone ho, phir bhi unka ashirwad aapke saath hai."),
    "reel_audio_hanuman-ashirwad-modern-life" to Entry("Hanuman Ji · Original audio", "हनुमान जी · मूल ध्वनि", "Hanuman Ji · Original audio"),
    "reel_title_suljhao-bhagwan-hanuman" to Entry("Meri uljhan suljhaiye", "मेरी उलझन सुलझाइए", "Meri uljhan suljhaiye"),
    "reel_caption_suljhao-bhagwan-hanuman" to Entry("Kuch raaton mein mann bas yahi prarthana karta hai — He Bhagwan, meri uljhan suljha dijiye.", "कुछ रातों में मन बस यही प्रार्थना करता है—हे भगवान, मेरी उलझन सुलझा दीजिए।", "Kuch raaton mein mann bas yahi prarthana karta hai — He Bhagwan, meri uljhan suljha dijiye."),
    "reel_audio_suljhao-bhagwan-hanuman" to Entry("Sitaram · Original audio", "सीताराम · मूल ध्वनि", "Sitaram · Original audio"),
    "reel_title_krishna-meri-baat-sun-lena" to Entry("Krishna, meri baat sun lena", "कृष्ण, मेरी बात सुन लेना", "Krishna, meri baat sun lena"),
    "reel_caption_krishna-meri-baat-sun-lena" to Entry("Jo baat kisi aur se nahi keh sakte, wah Krishna se keh dijiye.", "जो बात किसी और से नहीं कह सकते, वह कृष्ण से कह दीजिए।", "Jo baat kisi aur se nahi keh sakte, wah Krishna se keh dijiye."),
    "reel_audio_krishna-meri-baat-sun-lena" to Entry("Krishna · Original audio", "कृष्ण · मूल ध्वनि", "Krishna · Original audio"),
    "reel_title_shabari-ram-charo-dham" to Entry("Shabari ke ber", "शबरी के बेर", "Shabari ke ber"),
    "reel_caption_shabari-ram-charo-dham" to Entry("Bhakti ka poorn hona aavashyak nahi — uska prem se arpit hona hi paryapt hai.", "भक्ति का पूर्ण होना आवश्यक नहीं—उसका प्रेम से अर्पित होना ही पर्याप्त है।", "Bhakti ka poorn hona aavashyak nahi — uska prem se arpit hona hi paryapt hai."),
    "reel_audio_shabari-ram-charo-dham" to Entry("Ram · Original audio", "राम · मूल ध्वनि", "Ram · Original audio"),



    // --- Auth (non-composable: resolved via LanguageStore.str) ---
    "auth_session_expired" to Entry(
        "Your session has expired. Please sign in again.",
        "आपका सत्र समाप्त हो गया है। कृपया फिर से साइन इन करें।",
        "Your session has expired. Please sign in again."
    ),
    "auth_google_not_configured" to Entry(
        "Google sign-in is not configured yet.", "Google साइन-इन अभी कॉन्फ़िगर नहीं है।",
        "Google sign-in is not configured yet."
    ),
    "auth_adding_google" to Entry("Adding Google account…", "Google खाता जोड़ा जा रहा है…", "Adding Google account…"),
    "auth_no_google_account" to Entry(
        "No Google account is available on this device.", "इस डिवाइस पर Google खाता उपलब्ध नहीं है।",
        "No Google account is available on this device."
    ),
    "auth_check_connection" to Entry(
        "Check your internet connection and try again.", "इंटरनेट कनेक्शन जाँचें और फिर से प्रयास करें।",
        "Check your internet connection and try again."
    ),
    "auth_google_failed" to Entry(
        "Google sign-in could not be completed. Please try again.",
        "Google साइन-इन पूरा नहीं हो सका। फिर से प्रयास करें।",
        "Google sign-in could not be completed. Please try again."
    ),
    "auth_signing_in" to Entry("Signing in…", "साइन इन किया जा रहा है…", "Signing in…"),
    "auth_access_failed" to Entry(
        "Could not sign in with that email or username.",
        "ईमेल या उपयोगकर्ता नाम से साइन इन पूरा नहीं हो सका।",
        "Could not sign in with that email or username."
    ),
    "auth_challenge_expired" to Entry(
        "Sign-in took too long. Please try again.", "साइन-इन में देर हो गई। कृपया फिर से प्रयास करें।",
        "Sign-in took too long. Please try again."
    ),
    "auth_invalid_google_token" to Entry(
        "Could not verify your Google account.", "Google खाते की पुष्टि नहीं हो सकी।",
        "Could not verify your Google account."
    ),
    "auth_verified_email_required" to Entry(
        "This Google account needs a verified email.", "इस Google खाते में सत्यापित ईमेल आवश्यक है।",
        "This Google account needs a verified email."
    ),
    "auth_account_link_required" to Entry(
        "This email is already linked to BhaktiChat. Contact support to link it safely.",
        "यह ईमेल पहले से BhaktiChat से जुड़ा है। सुरक्षित रूप से जोड़ने के लिए सहायता से संपर्क करें।",
        "This email is already linked to BhaktiChat. Contact support to link it safely."
    ),
    "auth_not_available" to Entry(
        "Google sign-in is not available right now.", "Google साइन-इन अभी उपलब्ध नहीं है।",
        "Google sign-in is not available right now."
    ),

    // --- Billing (non-composable) ---
    "billing_checkout_failed" to Entry(
        "The purchase page could not open. Please try again.",
        "खरीदारी वाला पृष्ठ नहीं खुल सका। कृपया फिर प्रयास करें।",
        "The purchase page could not open. Please try again."
    ),
    "billing_store_not_ready" to Entry(
        "The store is not ready yet. Please try again in a moment.",
        "स्टोर अभी तैयार नहीं है। कृपया कुछ क्षण बाद फिर प्रयास करें।",
        "The store is not ready yet. Please try again in a moment."
    ),
    "period_week" to Entry("week", "सप्ताह", "week"),
    "period_month" to Entry("month", "महीना", "month"),
    "period_3_months" to Entry("3 months", "3 महीने", "3 months"),
    "period_6_months" to Entry("6 months", "6 महीने", "6 months"),
    "period_year" to Entry("year", "वर्ष", "year"),
    "trial_free" to Entry("Free trial", "निःशुल्क परीक्षण", "Free trial"),
    "unit_day" to Entry("day", "दिन", "day"),
    "unit_week" to Entry("week", "सप्ताह", "week"),
    "unit_month" to Entry("month", "महीना", "month"),
    "unit_year" to Entry("year", "वर्ष", "year"),

    // --- Speech input (non-composable) ---
    "speech_mic_permission" to Entry(
        "Microphone permission is required.", "माइक्रोफ़ोन की अनुमति आवश्यक है।",
        "Microphone permission is required."
    ),
    "speech_unavailable" to Entry(
        "Voice recognition is not available on this device.",
        "इस डिवाइस पर आवाज़ पहचान उपलब्ध नहीं है।",
        "Voice recognition is not available on this device."
    ),
    "speech_start_failed" to Entry(
        "Could not start voice typing.", "आवाज़ से लिखना शुरू नहीं हो सका।", "Could not start voice typing."
    ),
    "speech_audio_error" to Entry(
        "There was a problem recording your voice.", "आवाज़ रिकॉर्ड करने में समस्या हुई।",
        "There was a problem recording your voice."
    ),
    "speech_generic_error" to Entry(
        "There was a problem with voice typing.", "आवाज़ से लिखने में समस्या हुई।",
        "There was a problem with voice typing."
    ),
    "speech_network_error" to Entry(
        "A network problem occurred during voice recognition.",
        "आवाज़ पहचान के दौरान नेटवर्क की समस्या हुई।",
        "A network problem occurred during voice recognition."
    ),
    "speech_timeout" to Entry(
        "Voice recognition took too long.", "आवाज़ पहचान में बहुत समय लग गया।",
        "Voice recognition took too long."
    ),
    "speech_no_match" to Entry(
        "Could not understand that. Please speak again.", "आवाज़ समझ नहीं आई। कृपया फिर बोलें।",
        "Could not understand that. Please speak again."
    ),
    "speech_busy" to Entry(
        "Voice recognition is busy. Please try again.", "आवाज़ पहचान अभी व्यस्त है। कृपया फिर प्रयास करें।",
        "Voice recognition is busy. Please try again."
    ),
    "speech_service_error" to Entry(
        "There was a problem with the voice recognition service.", "आवाज़ पहचान सेवा में समस्या हुई।",
        "There was a problem with the voice recognition service."
    ),
    "speech_no_speech" to Entry("No speech was heard.", "कोई आवाज़ सुनाई नहीं दी।", "No speech was heard."),
    // --- Panchang ---
    "panchang_title" to Entry("Panchang", "पंचांग", "Panchang"),
    "go_back" to Entry("Go back", "वापस जाएँ", "Go back"),
    "panchang_tithi" to Entry("Tithi", "तिथि", "Tithi"),
    "panchang_tithi_value" to Entry("Shukla Dwitiya", "शुक्ल द्वितीया", "Shukla Dwitiya"),
    "panchang_nakshatra" to Entry("Nakshatra", "नक्षत्र", "Nakshatra"),
    "panchang_nakshatra_value" to Entry("Pushya", "पुष्य", "Pushya"),
    "panchang_vaar" to Entry("Day", "वार", "Day"),
    "panchang_vaar_value" to Entry("Saturday", "शनिवार", "Saturday"),
    "panchang_yoga" to Entry("Yoga", "योग", "Yoga"),
    "panchang_yoga_value" to Entry("Siddhi", "सिद्धि", "Siddhi"),
    "panchang_karan" to Entry("Karan", "करण", "Karan"),
    "panchang_karan_value" to Entry("Balav", "बालव", "Balav"),
    "panchang_rahu_kaal" to Entry("Rahu Kaal", "राहु काल", "Rahu Kaal"),
    "panchang_rahu_kaal_value" to Entry("9:00 – 10:30 AM", "9:00 – 10:30 पूर्वाह्न", "9:00 – 10:30 AM"),
    "panchang_date_location" to Entry(
        "Saturday, 5 July · Mumbai", "शनिवार, 5 जुलाई · मुंबई", "Saturday, 5 July · Mumbai"
    ),
    "panchang_sunrise" to Entry("Sunrise", "सूर्योदय", "Sunrise"),
    "panchang_sunrise_value" to Entry("6:04 AM", "6:04 पूर्वाह्न", "6:04 AM"),
    "panchang_sunset" to Entry("Sunset", "सूर्यास्त", "Sunset"),
    "panchang_sunset_value" to Entry("7:15 PM", "7:15 अपराह्न", "7:15 PM"),

    // --- Festivals ---
    "festivals_title" to Entry("Festivals", "त्योहार", "Festivals"),
    "festivals_subtitle" to Entry(
        "Upcoming Hindu festivals & vrat", "आने वाले हिंदू त्योहार और व्रत", "Upcoming Hindu festivals & vrat"
    ),
    "month_august" to Entry("August", "अगस्त", "August"),
    "month_september" to Entry("September", "सितंबर", "September"),
    "festival_hariyali_teej" to Entry("Hariyali Teej", "हरियाली तीज", "Hariyali Teej"),
    "festival_hariyali_teej_desc" to Entry(
        "A monsoon festival celebrated in honour of Devi Parvati",
        "देवी पार्वती के सम्मान में मनाया जाने वाला वर्षा ऋतु का पर्व",
        "A monsoon festival celebrated in honour of Devi Parvati"
    ),
    "festival_naag_panchami" to Entry("Naag Panchami", "नाग पंचमी", "Naag Panchami"),
    "festival_naag_panchami_desc" to Entry(
        "A festival for worshipping the serpent deities",
        "नाग देवताओं की पूजा का पर्व",
        "A festival for worshipping the serpent deities"
    ),
    "festival_raksha_bandhan" to Entry("Raksha Bandhan", "रक्षा बंधन", "Raksha Bandhan"),
    "festival_raksha_bandhan_desc" to Entry(
        "A festival of the sacred bond between brother and sister",
        "भाई-बहन के पवित्र संबंध का पर्व",
        "A festival of the sacred bond between brother and sister"
    ),
    "festival_janmashtami" to Entry("Krishna Janmashtami", "कृष्ण जन्माष्टमी", "Krishna Janmashtami"),
    "festival_janmashtami_desc" to Entry(
        "The birth celebration of Bhagwan Shri Krishna",
        "भगवान श्री कृष्ण का जन्मोत्सव",
        "The birth celebration of Bhagwan Shri Krishna"
    ),
    // --- Profile / Settings ---
    "language" to Entry("Language", "भाषा", "Language"),
    "language_subtitle" to Entry(
        "Choose the language for the app.",
        "ऐप की भाषा चुनें।",
        "Choose the language for the app."
    ),
    "profile_member" to Entry("BhaktiChat member", "BhaktiChat सदस्य", "BhaktiChat member"),
    "profile_sign_out" to Entry("Sign out", "साइन आउट", "Sign out"),
    "profile_delete_account" to Entry("Delete account", "अकाउंट हटाएँ", "Delete account"),
    "profile_manage_membership" to Entry("Manage membership", "सदस्यता प्रबंधित करें", "Manage membership"),
    "profile_delete_confirm_title" to Entry(
        "Delete account permanently?",
        "अकाउंट हमेशा के लिए हटाएँ?",
        "Delete account permanently?"
    ),
    "profile_delete_confirm_body" to Entry(
        "Your conversations, saved items and BhaktiChat account data will be permanently deleted. Your Google account will not be deleted.",
        "आपकी बातचीत, सेव की गई जानकारी और BhaktiChat अकाउंट डेटा स्थायी रूप से हटा दिया जाएगा। आपका Google अकाउंट नहीं हटेगा।",
        "Your conversations, saved items and BhaktiChat account data will be permanently deleted. Your Google account will not be deleted."
    ),
    "profile_delete_cancel_sub_first" to Entry(
        "Cancel your active membership before deleting the account.",
        "अकाउंट हटाने से पहले अपनी सक्रिय सदस्यता रद्द करें।",
        "Cancel your active membership before deleting the account."
    ),
    "profile_delete_failed" to Entry(
        "Account could not be deleted. Please try again.",
        "अकाउंट अभी नहीं हट सका। कृपया फिर से प्रयास करें।",
        "Account could not be deleted. Please try again."
    ),
    "profile_deleting" to Entry("Deleting…", "हटाया जा रहा है…", "Deleting…"),
    "profile_delete_yes" to Entry("Yes, delete", "हाँ, हटाएँ", "Yes, delete"),
    "profile_cancel" to Entry("Cancel", "रद्द करें", "Cancel"),
    "reel_like_lakh" to Entry("Lakh", "लाख", "Lakh"),
    "reel_like_thousand" to Entry("Hazaar", "हज़ार", "Thousand"),
)

/** Tone word for the current Choghadiya period — kept separate since it's composed with a
 *  slot label rather than standing alone. */
private val toneWords: Map<String, Entry> = mapOf(
    "auspicious" to Entry("auspicious", "शुभ", "auspicious"),
    "neutral" to Entry("neutral", "सामान्य", "neutral"),
    "caution" to Entry("caution", "सावधानी", "caution"),
    "tone_neutral_fallback" to Entry("neutral", "सामान्य", "neutral")
)

private fun Entry.forLanguage(language: AppLanguage): String = when (language) {
    AppLanguage.HINDI -> hindi
    AppLanguage.HINGLISH -> hinglish
    AppLanguage.ENGLISH -> english
}

/**
 * Resolves a key outside composition — for repositories, ViewModels and anything else that
 * can't call [t]. Read the language from `AppContainer.languageStore.language.value`.
 *
 * Falls back to Hinglish, then Hindi, then the key itself: a missing translation should
 * degrade to *something* readable rather than rendering an error string as if it were copy.
 */
fun translate(key: String, language: AppLanguage): String {
    val entry = table[key] ?: return key
    return entry.forLanguage(language)
        .ifBlank { entry.hinglish }
        .ifBlank { entry.hindi }
        .ifBlank { key }
}

fun translateTone(key: String, language: AppLanguage): String =
    toneWords[key]?.forLanguage(language) ?: translate("tone_neutral_fallback", language)

/**
 * The in-composition translator. Reads [LocalAppLanguage], so every call site recomposes
 * automatically when the user switches language — no restart, no manual invalidation.
 */
@Composable
@ReadOnlyComposable
fun t(key: String): String = translate(key, LocalAppLanguage.current)

@Composable
@ReadOnlyComposable
fun tTone(key: String): String = translateTone(key, LocalAppLanguage.current)

/**
 * Shorthand for the many non-composable call sites (repositories, managers, ViewModels)
 * that need a translated string: `languageStore.str("key")`. Reads the language at call
 * time, so a message built after the user switches uses the new language.
 */
fun com.bhaktichat.app.util.LanguageStore.str(key: String): String =
    translate(key, language.value)
