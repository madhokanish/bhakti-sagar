package com.bhaktichat.app.ui.screens.chat

import com.bhaktichat.app.ui.screens.chadhaava.BlockedFeature

/**
 * A paid feature a user asked a guide for in chat. About 90 chat turns a week ask for a
 * bhajan, aarti, ringtone, wallpaper or a deity's photo, and the guide can only talk — so a
 * free user gets a card under the reply that opens चढ़ावा, the same quick-checkout sheet every
 * other gate uses, with [blockedFeature]'s copy. Once they pay, it is all on Home.
 *
 * [source] is the paywall / checkout source in PostHog, so this funnel can be read on its own.
 * There is no ringtone feature: a ringtone ask is offered the aartis, under its own source.
 */
enum class ChatContentRequest(val source: String, val blockedFeature: BlockedFeature) {
    AARTI("chat_aarti", BlockedFeature.AARTIS),
    RINGTONE("chat_ringtone", BlockedFeature.AARTIS),
    WALLPAPER("chat_wallpaper", BlockedFeature.WALLPAPERS),
    DIVINE_IMAGE("chat_divine_image", BlockedFeature.IMAGE_QUOTA),
    VOICE("chat_voice", BlockedFeature.VOICE),
    REELS("chat_reels", BlockedFeature.REELS),
    FESTIVALS("chat_festivals", BlockedFeature.FESTIVALS);

    companion object {
        fun fromSource(source: String): ChatContentRequest? = entries.firstOrNull { it.source == source }

        // Most specific first: "bhajan ki ringtone" is a ringtone, "photo banao" an image to
        // make, "Diwali ki aarti" an aarti rather than the festival calendar.
        fun detect(userMessage: String): ChatContentRequest? {
            val picture = PICTURE_WORDS.containsMatchIn(userMessage)
            return when {
                RINGTONE_WORDS.containsMatchIn(userMessage) -> RINGTONE
                picture && MAKE_WORDS.containsMatchIn(userMessage) -> DIVINE_IMAGE
                WALLPAPER_WORDS.containsMatchIn(userMessage) -> WALLPAPER
                // "Photo" alone is too common ("meri beti ki photo dekhkar…"): it needs an ask
                // or a deity in the same message to mean "give me a picture".
                picture && PICTURE_CONTEXT_WORDS.containsMatchIn(userMessage) -> WALLPAPER
                VOICE_WORDS.containsMatchIn(userMessage) -> VOICE
                SONG_WORDS.containsMatchIn(userMessage) -> AARTI
                REEL_WORDS.containsMatchIn(userMessage) -> REELS
                FESTIVAL_WORDS.containsMatchIn(userMessage) -> FESTIVALS
                else -> null
            }
        }

        // Whole words only. Devanagari matras are \p{M}, so the look-behind excludes them too
        // (a match must not start mid-word); a trailing matra is allowed so plurals still match.
        private fun words(vararg words: String) = Regex(
            "(?<![\\p{L}\\p{M}])(?:${words.joinToString("|")})(?!\\p{L})",
            RegexOption.IGNORE_CASE
        )

        private val RINGTONE_WORDS = words(
            "ringtones?", "rington", "ring tone", "caller ?tune",
            "रिंगटोन", "रिंग टोन", "कॉलर ट्यून"
        )
        private val WALLPAPER_WORDS = words("wallpapers?", "wall paper", "वॉलपेपर", "वालपेपर")
        private val PICTURE_WORDS = words(
            "photos?", "foto", "images?", "pics?", "pictures?", "tasveer", "tasvir", "chitra", "dp",
            "फोटो", "फ़ोटो", "तस्वीर", "चित्र", "इमेज"
        )
        private val MAKE_WORDS = words(
            "banao", "banaiye", "banaye", "banayen", "bana do", "banado", "bana dijiye",
            "generate", "create", "edit",
            "बनाओ", "बनाइए", "बनाएं", "बनाएँ", "बना दो", "बना दीजिए"
        )
        private val PICTURE_CONTEXT_WORDS = words(
            "bhejo", "bhejiye", "bhej", "dijiye", "dikhao", "dikhaiye", "chahiye", "chaiye",
            "lagana", "lagani", "lagao", "lagaen", "lagayen", "send", "show", "want", "give",
            "aapka", "aapki", "apka", "apki", "tumhara", "tumhari",
            "krishna", "kanha", "shyam", "shiv", "shiva", "mahadev?", "bholenath", "bhole",
            "hanuman", "bajrang", "bajrangbali", "lakshmi", "laxmi", "shani", "ram",
            "bhagwan", "bhagwaan", "mata",
            "भेजो", "भेजिए", "भेज", "दीजिए", "दिखाओ", "दिखाइए", "चाहिए", "लगाना", "लगानी", "लगाओ",
            "आपका", "आपकी", "तुम्हारा", "तुम्हारी",
            "कृष्ण", "कान्हा", "श्याम", "शिव", "महादेव", "भोलेनाथ", "भोले", "हनुमान", "बजरंगबली",
            "लक्ष्मी", "शनि", "राम", "भगवान", "माता"
        )
        private val VOICE_WORDS = words(
            "call karo", "call kariye", "call kijiye", "call karna", "call me", "video call",
            "voice", "awaa?z (?:mein|me|main)", "bolkar baat",
            "कॉल करो", "कॉल कीजिए", "कॉल करना", "फोन करो", "आवाज़ में", "आवाज में", "बोलकर"
        )
        private val SONG_WORDS = words(
            "songs?", "gana", "gaana", "gane", "gaane", "bhajans?", "aarti", "arti", "aarati",
            "chalisa", "kirtan",
            "गाना", "गाने", "गीत", "भजन", "आरती", "चालीसा", "कीर्तन"
        )
        private val REEL_WORDS = words(
            "reels?", "videos?", "status", "whatsapp status",
            "रील", "रील्स", "वीडियो", "स्टेटस"
        )
        private val FESTIVAL_WORDS = words(
            "tyohar", "tyohaar", "festivals?", "vrat", "ekadashi", "diwali", "deepawali", "navratri",
            "chhath", "karwa ?chauth", "holi", "janmashtami", "shivratri", "dhanteras", "purnima",
            "amavasya",
            "त्योहार", "त्यौहार", "व्रत", "एकादशी", "दिवाली", "दीवाली", "दीपावली", "नवरात्रि",
            "नवरात्र", "छठ", "करवा चौथ", "होली", "जन्माष्टमी", "शिवरात्रि", "धनतेरस", "पूर्णिमा",
            "अमावस्या"
        )
    }
}
