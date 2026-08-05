package com.bhaktichat.app.domain

/** The Android interface is always Hindi in Devanagari. The other values remain only for
 * chat reply matching when a user deliberately writes using the Latin alphabet. */
enum class AppLanguage(val wireValue: String) {
    HINGLISH("hinglish"),
    HINDI("hi"),
    ENGLISH("en");

    companion object {
        val default: AppLanguage = HINDI

        fun fromWireValue(value: String?): AppLanguage? = entries.firstOrNull { it.wireValue == value }
    }
}
