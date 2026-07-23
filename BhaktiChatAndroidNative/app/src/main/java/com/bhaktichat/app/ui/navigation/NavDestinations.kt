package com.bhaktichat.app.ui.navigation

import android.net.Uri

object NavDestinations {
    const val PREFILL_TOPIC_KEY = "prefill_topic"
    const val CHAT_PREFILL_ARG = "prefill"
    const val CHAT_PROMPT_ARG = "prompt"
    const val CHAT_FRESH_ARG = "fresh"
    const val CHAT_SKIP_OPENER_ARG = "skipOpener"
    const val CHAT_LAUNCH_ID_ARG = "launchId"
    const val HUB_PREFILL_ARG = "prefill"
    const val HUB_GUIDE_ARG = "guide"
    const val CHAT_ROUTE_PREFILL_APPLIED_KEY = "chat_route_prefill_applied"
    const val CHAT_ROUTE_LAUNCH_APPLIED_KEY = "chat_route_launch_applied"
    const val START_NEW_CHAT_KEY = "start_new_chat"
    const val HOME = "home"
    const val BHAKTI_CHAT_BASE = "bhakti_hub"
    const val BHAKTI_CHAT_ROUTE_PREFIX = "bhakti_hub"
    const val BHAKTI_CHAT = "bhakti_hub?guide={guide}"
    const val THREAD_ID_ARG = "threadId"
    const val THREAD = "thread/{threadId}"
    const val DIVINE_IMAGE_ROUTE_PREFIX = "divine_image"
    const val DIVINE_IMAGE_HOME = "divine_image_home"
    const val DIVINE_IMAGE_MODE_ARG = "mode"
    const val DIVINE_IMAGE_TEMPLATE_ID_ARG = "templateId"
    const val DIVINE_IMAGE_CREATION_ID_ARG = "creationId"
    const val DIVINE_IMAGE_CREATE = "divine_image_create/{mode}/{templateId}"
    const val DIVINE_IMAGE_RESULT = "divine_image_result/{creationId}"
    const val HISTORY = "history"
    const val CHAT_ENTRY = "chat_entry"
    const val GUIDE_PICKER = "guide_picker"
    const val CHAT =
        "chat/{guideId}?prefill={prefill}&prompt={prompt}&fresh={fresh}&skipOpener={skipOpener}&launchId={launchId}"
    const val EXPLORE = "explore"
    const val AARTIS = "aartis"
    const val AARTI_DETAIL = "aarti/{aartiId}"
    const val CHOGHADIYA = "choghadiya"
    const val FESTIVALS = "festivals"
    const val PANCHANG = "panchang"
    const val WALLPAPERS = "wallpapers"
    const val WALLPAPER_DETAIL = "wallpaper/{wallpaperId}"
    const val VOICE_MODE_GUIDE_ARG = "guideId"
    const val VOICE_MODE_CONVERSATION_ARG = "conversationId"
    const val VOICE_MODE = "voice/{$VOICE_MODE_GUIDE_ARG}?conversationId={$VOICE_MODE_CONVERSATION_ARG}"
    const val PROFILE = "profile"

    fun bhaktiChatRoute(guideId: String? = null, prefill: String? = null): String {
        val params = buildList {
            if (!guideId.isNullOrBlank()) add("guide=${Uri.encode(guideId)}")
        }
        return if (params.isEmpty()) {
            BHAKTI_CHAT_BASE
        } else {
            "$BHAKTI_CHAT_BASE?${params.joinToString("&")}"
        }
    }

    fun threadRoute(threadId: String): String = "thread/${Uri.encode(threadId)}"

    fun chatRoute(
        guideId: String,
        prefill: String? = null,
        prompt: String? = null,
        fresh: Boolean = false,
        skipOpener: Boolean = false,
        launchId: String? = null
    ): String {
        val params = buildList {
            if (!prefill.isNullOrBlank()) add("prefill=${Uri.encode(prefill)}")
            if (!prompt.isNullOrBlank()) add("prompt=${Uri.encode(prompt)}")
            if (fresh) add("fresh=true")
            if (skipOpener) add("skipOpener=true")
            if (!launchId.isNullOrBlank()) add("launchId=${Uri.encode(launchId)}")
        }
        return if (params.isEmpty()) {
            "chat/$guideId"
        } else {
            "chat/$guideId?${params.joinToString("&")}"
        }
    }

    fun divineImageCreateRoute(mode: String, templateId: String): String =
        "divine_image_create/${Uri.encode(mode)}/${Uri.encode(templateId)}"

    fun divineImageResultRoute(creationId: String): String =
        "divine_image_result/${Uri.encode(creationId)}"

    fun aartiDetailRoute(aartiId: String): String = "aarti/$aartiId"

    fun wallpaperDetailRoute(wallpaperId: String): String = "wallpaper/$wallpaperId"

    fun voiceModeRoute(guideId: String, conversationId: String?): String {
        val base = "voice/${Uri.encode(guideId)}"
        return if (conversationId.isNullOrBlank()) base else "$base?conversationId=${Uri.encode(conversationId)}"
    }
}
