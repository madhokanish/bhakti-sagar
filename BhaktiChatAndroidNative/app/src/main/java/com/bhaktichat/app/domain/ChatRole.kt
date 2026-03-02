package com.bhaktichat.app.domain

enum class ChatRole(val wire: String) {
    USER("user"),
    ASSISTANT("assistant");

    companion object {
        fun fromWire(wire: String): ChatRole = if (wire == USER.wire) USER else ASSISTANT
    }
}
