package com.bhaktichat.app.data.repo

import com.bhaktichat.app.util.LanguageStore

import com.bhaktichat.app.ui.i18n.translate

import android.content.Context
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.domain.Deity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

class AartiRepository(private val context: Context,
    private val languageStore: LanguageStore
) {
    private val cacheLock = Mutex()
    @Volatile
    private var cachedAartis: List<Aarti>? = null

    suspend fun loadAartis(): List<Aarti> {
        cachedAartis?.let { return it }

        return cacheLock.withLock {
            cachedAartis?.let { return@withLock it }

            val loaded = withContext(Dispatchers.IO) {
                val json = context.assets.open("aartis.json").bufferedReader().use { it.readText() }
                val array = JSONArray(json)
                val list = mutableListOf<Aarti>()
                for (index in 0 until array.length()) {
                    val item = array.getJSONObject(index)
                    val title = item.optJSONObject("title")
                    val englishTitle = title.optStringOrNull("english")
                    val hindiTitle = title.optStringOrNull("hindi")
                    val catalogTitle = englishTitle ?: hindiTitle ?: translate("aarti", languageStore.language.value)
                    val displayTitle = hindiTitle ?: translate("aarti", languageStore.language.value)
                    val displayHindiTitle = displayTitle
                    val isTop = item.optBoolean("isTop", false)

                    val lyricsObj = item.optJSONObject("lyrics")
                    val englishLyrics = lyricsObj.optStringArray("english")
                    val hindiLyrics = lyricsObj.optStringArray("hindi")
                    val selectedLyrics = when {
                        hindiLyrics.isNotEmpty() -> hindiLyrics
                        englishLyrics.isNotEmpty() -> emptyList()
                        else -> emptyList()
                    }

                    val rawTags = item.optStringArray("tags")
                    val deity = resolveDeity(
                        category = item.optString("category"),
                        tags = rawTags,
                        title = catalogTitle
                    )
                    val tags = buildList {
                        rawTags
                            .map { it.trim().lowercase() }
                            .filter { it.isNotBlank() }
                            .forEach(::add)

                        when (deity) {
                            Deity.KRISHNA -> {
                                add("krishna")
                                add("morning")
                            }
                            Deity.GANESH -> {
                                add("ganesh")
                                add("morning")
                            }
                            Deity.SHIV -> {
                                add("shiv")
                                add("evening")
                            }
                            Deity.LAKSHMI -> {
                                add("lakshmi")
                                add("devi")
                                add("evening")
                            }
                            Deity.DEVI -> {
                                add("devi")
                                add("evening")
                            }
                            Deity.VISHNU -> add("morning")
                            Deity.HANUMAN -> add("morning")
                            Deity.OTHER -> Unit
                        }

                        if (displayTitle.contains("vrat", ignoreCase = true) || rawTags.any {
                                it.contains("ekadashi", ignoreCase = true) || it.contains("vrat", ignoreCase = true)
                            }
                        ) {
                            add("vrat")
                        }

                        if (isTop) add("popular")
                    }.distinct()

                    list += Aarti(
                        id = item.getString("id"),
                        slug = item.optString("slug"),
                        title = displayTitle,
                        titleHi = displayHindiTitle,
                        deity = deity,
                        durationMinutes = item.optInt("durationMinutes").takeIf { it > 0 }
                            ?: estimateDurationMinutes(selectedLyrics),
                        tags = tags,
                        youtubeVideoId = extractYouTubeVideoId(item.optStringOrNull("youtubeUrl")),
                        audioUrl = item.optStringOrNull("audioUrl"),
                        popularityCount = item.optLong("popularityCount").takeIf { it > 0L },
                        isTop = isTop,
                        lyrics = selectedLyrics,
                        imageAssetName = item.optStringOrNull("imageAsset"),
                    )
                }
                list
            }

            cachedAartis = loaded
            loaded
        }
    }
}

private fun JSONObject?.optStringOrNull(key: String): String? {
    if (this == null) return null
    return optString(key).takeIf { it.isNotBlank() }
}

private fun JSONObject?.optStringArray(key: String): List<String> {
    if (this == null) return emptyList()
    val array = optJSONArray(key) ?: return emptyList()
    return buildList {
        for (index in 0 until array.length()) {
            val value = array.optString(index)
            if (value.isNotBlank()) add(value)
        }
    }
}

private fun resolveDeity(
    category: String,
    tags: List<String>,
    title: String
): Deity {
    val normalizedCategory = category.trim().lowercase()
    val normalizedTitle = title.lowercase()
    val normalizedTags = tags.map { it.lowercase() }

    return when {
        normalizedCategory == "krishna" -> Deity.KRISHNA
        normalizedCategory == "ganesha" || normalizedTags.any { "ganesh" in it || "ganesha" in it } -> Deity.GANESH
        normalizedCategory == "shiva" || normalizedTags.any { "shiv" in it || "shiva" in it } -> Deity.SHIV
        normalizedCategory == "lakshmi" || normalizedTags.any { "lakshmi" in it } -> Deity.LAKSHMI
        normalizedCategory == "shakti" || normalizedTags.any { "devi" in it || "mata" in it } || "mata" in normalizedTitle -> Deity.DEVI
        normalizedCategory == "vishnu" -> Deity.VISHNU
        normalizedTags.any { "hanuman" in it } || "hanuman" in normalizedTitle -> Deity.HANUMAN
        else -> Deity.OTHER
    }
}

private fun estimateDurationMinutes(lyrics: List<String>): Int {
    if (lyrics.isEmpty()) return 3
    return ((lyrics.size / 6.0) + 2).toInt().coerceIn(2, 9)
}

private fun extractYouTubeVideoId(url: String?): String? {
    val safeUrl = url?.trim().orEmpty()
    if (safeUrl.isBlank()) return null

    return when {
        "watch?v=" in safeUrl -> safeUrl.substringAfter("watch?v=").substringBefore("&").ifBlank { null }
        "youtu.be/" in safeUrl -> safeUrl.substringAfter("youtu.be/").substringBefore("?").ifBlank { null }
        "/embed/" in safeUrl -> safeUrl.substringAfter("/embed/").substringBefore("?").ifBlank { null }
        else -> null
    }
}
