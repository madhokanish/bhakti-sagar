package com.bhaktichat.app.domain

data class Guide(
    val id: String,
    val displayName: String,
    val status: String,
    val avatarRes: Int,
    val avatarVerticalBias: Float,
    val profileImageRes: Int,
    val profileVerticalBias: Float,
    val description: String,
    val teachings: List<String>,
    val openingScene: String,
    val suggestedPrompts: List<String>,
    val serverPromptKey: String
)
