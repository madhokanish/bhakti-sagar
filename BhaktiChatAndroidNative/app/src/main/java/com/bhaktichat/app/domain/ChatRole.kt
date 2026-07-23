package com.bhaktichat.app.domain

enum class ChatRole(val wire: String) {
    USER("user"),
    ASSISTANT("assistant"),
    SYSTEM("system");

    companion object {
        fun fromWire(wire: String): ChatRole = when (wire) {
            USER.wire -> USER
            SYSTEM.wire -> SYSTEM
            else -> ASSISTANT
        }
    }
}
