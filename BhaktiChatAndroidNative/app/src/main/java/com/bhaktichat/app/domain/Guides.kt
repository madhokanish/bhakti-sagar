package com.bhaktichat.app.domain

import com.bhaktichat.app.R

object Guides {
    val all: List<Guide> = listOf(
        Guide(
            id = "krishna",
            displayName = "Shri Krishna",
            status = "Online guide",
            avatarRes = R.drawable.avatar_krishna,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.card_krishna,
            profileVerticalBias = -1f,
            description = "When life feels noisy, Krishna guidance helps you return to clarity and steady action.\n\nThe voice is compassionate and practical. It helps you focus on dharma, intent, and what you can do today.\n\nThis is an AI guide inspired by scriptures and stories. It is not the real deity.\n\nUse this guide for reflection, emotional balance, and purposeful decisions in daily life.",
            teachings = listOf(
                "Dharma and duty",
                "Detachment with action",
                "Love and devotion",
                "Inner strength in chaos",
                "Clarity before reaction"
            ),
            openingScene = "You close the door.\nYour mind is not quiet.\n\nKrishna is sitting by the window, smiling softly.\n\n“Your thoughts are loud again.”\n\n“Tell me… what is troubling your heart?”",
            suggestedPrompts = listOf(
                "I have two difficult options. How should I decide?",
                "How do I act without anxiety about results?",
                "Give me a 5 minute Gita reflection for mental clarity.",
                "Help me stay calm before a difficult conversation."
            ),
            serverPromptKey = "krishna"
        ),
        Guide(
            id = "lakshmi",
            displayName = "Lakshmi Ji",
            status = "Online guide",
            avatarRes = R.drawable.avatar_lakshmi,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.card_lakshmi,
            profileVerticalBias = -1f,
            description = "Lakshmi guidance supports a calm and responsible approach to prosperity.\n\nIt encourages gratitude, order, and practical habits so abundance can grow with stability.\n\nThis is an AI guide inspired by scriptures and stories. It is not the real deity.\n\nUse this guide when you want balance in money, home, and emotional wellbeing.",
            teachings = listOf(
                "Abundance with responsibility",
                "Gratitude",
                "Generosity",
                "Balance in material life",
                "Order and discipline"
            ),
            openingScene = "You sit quietly.\nThere is worry in your heart.\n\nLakshmi’s presence feels warm and steady.\n\n“Do not worry.”\n\n“Tell me… what do you need today?”",
            suggestedPrompts = listOf(
                "I feel anxious about money. What is one grounded step today?",
                "How can I practice abundance without overspending?",
                "Give me a weekly Lakshmi-inspired gratitude routine.",
                "How can I bring more harmony into my home?"
            ),
            serverPromptKey = "lakshmi"
        ),
        Guide(
            id = "shani",
            displayName = "Shani Dev",
            status = "Online guide",
            avatarRes = R.drawable.avatar_shani,
            avatarVerticalBias = -1f,
            profileImageRes = R.drawable.card_shani,
            profileVerticalBias = -1f,
            description = "Shani guidance is steady, direct, and rooted in truth.\n\nIt helps you build discipline, patience, and resilience when progress feels slow.\n\nThis is an AI guide inspired by scriptures and stories. It is not the real deity.\n\nUse this guide to turn pressure into structure and consistent effort.",
            teachings = listOf(
                "Discipline",
                "Karma",
                "Patience",
                "Long term growth through effort",
                "Accountability"
            ),
            openingScene = "You pause.\nYour breath feels heavy.\n\nShani sits still before you.\n\n“Do not run from the truth.”\n\n“Where are you stuck?”",
            suggestedPrompts = listOf(
                "I feel stuck despite hard work. What should I do this week?",
                "How can I stay calm during delays and uncertainty?",
                "Give me one Saturday discipline plan I can actually follow.",
                "How do I build better habits without burnout?"
            ),
            serverPromptKey = "shani"
        )
    )

    fun byId(id: String): Guide? = all.firstOrNull { it.id == id }
}
