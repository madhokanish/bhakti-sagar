package com.bhaktichat.app.ui.navigation

import android.net.Uri

object NavDestinations {
    const val PREFILL_TOPIC_KEY = "prefill_topic"
    const val CHAT_PREFILL_ARG = "prefill"
    const val CHAT_ROUTE_PREFILL_APPLIED_KEY = "chat_route_prefill_applied"
    const val START_NEW_CHAT_KEY = "start_new_chat"
    const val HOME = "home"
    const val CHAT_ENTRY = "chat_entry"
    const val GUIDE_PICKER = "guide_picker"
    const val CHAT = "chat/{guideId}?prefill={prefill}"
    const val GUIDE_PROFILE = "guide_profile/{guideId}"
    const val AARTIS = "aartis"
    const val AARTI_DETAIL = "aarti/{aartiId}"
    const val CHOGHADIYA = "choghadiya"
    const val PROFILE = "profile"

    fun chatRoute(guideId: String, prefill: String? = null): String {
        return if (prefill.isNullOrBlank()) {
            "chat/$guideId"
        } else {
            "chat/$guideId?prefill=${Uri.encode(prefill)}"
        }
    }

    fun guideProfileRoute(guideId: String): String = "guide_profile/$guideId"
    fun aartiDetailRoute(aartiId: String): String = "aarti/$aartiId"
}
