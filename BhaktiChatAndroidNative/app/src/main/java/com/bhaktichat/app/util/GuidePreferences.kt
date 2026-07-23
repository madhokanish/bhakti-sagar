package com.bhaktichat.app.util

import android.content.Context

class GuidePreferences(context: Context) {
    private val prefs = context.getSharedPreferences("bhaktichat_prefs", Context.MODE_PRIVATE)

    fun lastGuideId(): String? = prefs.getString(KEY_LAST_GUIDE, null)

    fun setLastGuideId(guideId: String) {
        prefs.edit().putString(KEY_LAST_GUIDE, guideId).apply()
    }

    fun conversationId(guideId: String): String? = prefs.getString("$KEY_CONVERSATION_PREFIX$guideId", null)

    fun setConversationId(guideId: String, conversationId: String?) {
        val key = "$KEY_CONVERSATION_PREFIX$guideId"
        prefs.edit().apply {
            if (conversationId.isNullOrBlank()) remove(key) else putString(key, conversationId)
        }.apply()
    }

    fun pinnedGuideIds(): Set<String> {
        val raw = prefs.getString(KEY_PINNED_GUIDES, "") ?: ""
        return if (raw.isBlank()) emptySet()
        else raw.split(",").filter { it.isNotBlank() }.toSet()
    }

    fun setPinnedGuideIds(ids: Set<String>) {
        prefs.edit().putString(KEY_PINNED_GUIDES, ids.sorted().joinToString(",")).apply()
    }

    fun togglePinnedGuide(guideId: String) {
        val current = pinnedGuideIds().toMutableSet()
        if (current.contains(guideId)) current.remove(guideId) else current.add(guideId)
        setPinnedGuideIds(current)
    }

    companion object {
        private const val KEY_LAST_GUIDE = "last_guide_id"
        private const val KEY_CONVERSATION_PREFIX = "conversation_id_"
        private const val KEY_PINNED_GUIDES = "pinned_guide_ids"
    }
}
