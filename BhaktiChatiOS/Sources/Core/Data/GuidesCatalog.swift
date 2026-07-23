import Foundation

enum GuidesCatalog {
    static let all: [Guide] = [
        Guide(
            id: "krishna",
            displayName: "Shri Krishna",
            status: "Online guide",
            avatarAssetName: "avatar_krishna",
            cardAssetName: "card_krishna",
            description: "When life feels noisy, Shri Krishna guidance helps you return to clarity and steady action.\n\nThe voice is compassionate and practical. It helps you focus on dharma, intent, and what you can do today.\n\nThis is an AI guide inspired by scriptures and stories. It is not the real deity.\n\nUse this guide for reflection, emotional balance, and purposeful decisions in daily life.",
            teachings: ["Dharma and duty", "Detachment with action", "Love and devotion", "Inner strength in chaos", "Clarity before reaction"],
            openingScene: "Jaise main tumhare paas baithkar pyaar se tumhari baat sun raha hoon.\n\nDil ki uljhan ho ya zindagi ka koi faisla, batao, aaj mann mein kya chal raha hai?",
            suggestedPrompts: [
                "I have two difficult options. How should I decide?",
                "How do I act without anxiety about results?",
                "Give me a 5 minute Gita reflection for mental clarity.",
                "Help me stay calm before a difficult conversation."
            ],
            serverPromptKey: "krishna"
        ),
        Guide(
            id: "lakshmi",
            displayName: "Lakshmi Ji",
            status: "Online guide",
            avatarAssetName: "avatar_lakshmi",
            cardAssetName: "card_lakshmi",
            description: "Lakshmi Ji guidance supports a calm and responsible approach to prosperity.\n\nIt encourages gratitude, order, and practical habits so abundance can grow with stability.\n\nThis is an AI guide inspired by scriptures and stories. It is not the real deity.\n\nUse this guide when you want balance in money, home, and emotional wellbeing.",
            teachings: ["Abundance with responsibility", "Gratitude", "Generosity", "Balance in material life", "Order and discipline"],
            openingScene: "Jaise mere saath tumhare ghar aur mann mein thoda sukoon aa raha ho.\n\nPaise, ghar, ya jeevan ki chinta ho, batao, is waqt tumhe sabse zyada kis cheez ki zarurat hai?",
            suggestedPrompts: [
                "I feel anxious about money. What is one grounded step today?",
                "How can I practice abundance without overspending?",
                "Give me a weekly Lakshmi Ji inspired gratitude routine.",
                "How can I bring more harmony into my home?"
            ],
            serverPromptKey: "lakshmi"
        ),
        Guide(
            id: "shani",
            displayName: "Shani Dev",
            status: "Online guide",
            avatarAssetName: "avatar_shani",
            cardAssetName: "card_shani",
            description: "Shani Dev guidance is steady, direct, and rooted in truth.\n\nIt helps you build discipline, patience, and resilience when progress feels slow.\n\nThis is an AI guide inspired by scriptures and stories. It is not the real deity.\n\nUse this guide to turn pressure into structure and consistent effort.",
            teachings: ["Discipline", "Karma", "Patience", "Long term growth through effort", "Accountability"],
            openingScene: "Main tumhe daraane nahi, tumhe sach dikhane aaya hoon.\n\nJo mushkil samay chal raha hai, batao, sabse zyada bojh kis baat ka lag raha hai?",
            suggestedPrompts: [
                "I feel stuck despite hard work. What should I do this week?",
                "How can I stay calm during delays and uncertainty?",
                "Give me one Saturday discipline plan I can actually follow.",
                "How do I build better habits without burnout?"
            ],
            serverPromptKey: "shani"
        ),
        Guide(
            id: "shiv",
            displayName: "Shiv Ji",
            status: "Online guide",
            avatarAssetName: "shivji",
            cardAssetName: "shivji",
            description: "Shiv Ji guidance is quiet, spacious, and direct.\n\nIt helps you release noise, reduce attachment, and return to what is essential.\n\nThis is an AI guide inspired by scriptures and stories. It is not the real deity.\n\nUse this guide when you want stillness, truth, and a calmer inner center.",
            teachings: ["Stillness before reaction", "Detachment", "Inner silence", "Truth over noise", "Courage in surrender"],
            openingScene: "Mere saath ek pal ke liye sab kuch shaant hone do.\n\nJo dard, gussa, ya thakan andar jama hai, batao, aaj tum kya chhodna chahte ho?",
            suggestedPrompts: [
                "Help me let go of what I cannot control.",
                "Give me a calm Shiv Ji inspired reflection for today.",
                "How do I stay steady when my mind feels noisy?",
                "What truth am I avoiding right now?"
            ],
            serverPromptKey: "shiv"
        ),
        Guide(
            id: "hanuman",
            displayName: "Hanuman Ji",
            status: "Online guide",
            avatarAssetName: "hanumanji",
            cardAssetName: "hanumanji",
            description: "Hanuman Ji guidance is loyal, fearless, and action focused.\n\nIt helps you replace hesitation with courage, service, and discipline.\n\nThis is an AI guide inspired by scriptures and stories. It is not the real deity.\n\nUse this guide when you need strength, devotion, and steady resolve.",
            teachings: ["Devotion in action", "Fearlessness", "Service", "Strength through humility", "Steady commitment"],
            openingScene: "Main tumhare saath khada hoon, tumhe himmat aur bal dene ke liye.\n\nDar ho ya koi badi pareshani, batao, aaj tumhe kis baat ke liye taqat chahiye?",
            suggestedPrompts: [
                "Give me courage for something I am avoiding.",
                "How do I stop overthinking and start acting?",
                "Share one Hanuman Ji inspired step for strength today.",
                "Help me face fear without panic."
            ],
            serverPromptKey: "hanuman"
        )
    ]

    static func byId(_ id: String) -> Guide? {
        all.first { $0.id == id }
    }
}
