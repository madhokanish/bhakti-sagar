package com.bhaktichat.app.domain

/** The app language the user picked — Hindi (Devanagari), Hinglish or English. It drives
 * the UI strings and the language guides reply in. [default] is Hindi. */
enum class AppLanguage(val wireValue: String) {
    HINGLISH("hinglish"),
    HINDI("hi"),
    ENGLISH("en");

    companion object {
        val default: AppLanguage = HINDI

        fun fromWireValue(value: String?): AppLanguage? = entries.firstOrNull { it.wireValue == value }
    }
}
