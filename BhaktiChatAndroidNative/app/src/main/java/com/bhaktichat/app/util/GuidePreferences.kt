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

    companion object {
        private const val KEY_LAST_GUIDE = "last_guide_id"
        private const val KEY_CONVERSATION_PREFIX = "conversation_id_"
    }
}
