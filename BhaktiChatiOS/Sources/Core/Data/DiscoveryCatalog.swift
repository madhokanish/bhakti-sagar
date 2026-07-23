import Foundation

struct DiscoveryGuideTile: Identifiable, Hashable {
    let id: String
    let title: String
    let imageAssetName: String
}

struct DiscoverySituation: Identifiable, Hashable {
    let id: String
    let title: String
    let iconSystemName: String
    let prompt: String
    let defaultGuideId: String
}

enum DiscoveryCatalog {
    static let guides: [DiscoveryGuideTile] = [
        DiscoveryGuideTile(id: "krishna", title: "Shri Krishna", imageAssetName: "avatar_krishna"),
        DiscoveryGuideTile(id: "lakshmi", title: "Lakshmi Ji", imageAssetName: "avatar_lakshmi"),
        DiscoveryGuideTile(id: "shiv", title: "Shiv Ji", imageAssetName: "shivji"),
        DiscoveryGuideTile(id: "hanuman", title: "Hanuman Ji", imageAssetName: "hanumanji"),
        DiscoveryGuideTile(id: "shani", title: "Shani Dev", imageAssetName: "avatar_shani")
    ]

    static let situations: [DiscoverySituation] = [
        DiscoverySituation(
            id: "money_stress",
            title: "Money stress",
            iconSystemName: "creditcard",
            prompt: "Mujhe paison ki tension se nikalne mein guide karo.",
            defaultGuideId: "lakshmi"
        ),
        DiscoverySituation(
            id: "bad_luck",
            title: "Bad luck",
            iconSystemName: "bolt",
            prompt: "Mujhe is bad luck se nikalne ka raasta dikhao.",
            defaultGuideId: "shani"
        ),
        DiscoverySituation(
            id: "anxiety",
            title: "Anxiety",
            iconSystemName: "figure.mind.and.body",
            prompt: "Mujhe anxiety se shaanti tak wapas lao.",
            defaultGuideId: "shiv"
        ),
        DiscoverySituation(
            id: "fear",
            title: "Fear",
            iconSystemName: "leaf",
            prompt: "Mera fear door karo, mujhe himmat do.",
            defaultGuideId: "hanuman"
        ),
        DiscoverySituation(
            id: "relationship_issues",
            title: "Relationship Issues",
            iconSystemName: "heart",
            prompt: "Meri relationship problem mein mujhe guidance chahiye.",
            defaultGuideId: "krishna"
        ),
        DiscoverySituation(
            id: "career_confusion",
            title: "Career Confusion",
            iconSystemName: "briefcase",
            prompt: "Meri career confusion mein agla sahi kadam dikhao.",
            defaultGuideId: "krishna"
        ),
        DiscoverySituation(
            id: "exams",
            title: "Exams",
            iconSystemName: "book",
            prompt: "Mujhe exams ki taiyari mein focus karne mein madad karo.",
            defaultGuideId: "krishna"
        ),
        DiscoverySituation(
            id: "discipline",
            title: "Discipline",
            iconSystemName: "brain.head.profile",
            prompt: "Mujhe apni discipline mazboot karne mein madad karo.",
            defaultGuideId: "shani"
        )
    ]

    // Hinglish by design (app default voice) — key nouns stay in English (matches
    // BhaktiChatHubScreen.promptIcon's keyword matching) while grammar/connectors are
    // Hindi, same code-mixing pattern real Hinglish speech uses. Also ensures each chip
    // contains a recognized Hinglish marker (see ChatPromptSupport.hinglishMarkers) so the
    // model actually replies in Hinglish instead of defaulting to English for these.
    static let hubPromptChips: [String: [String]] = [
        "krishna": [
            "Aaj mera dharma kya hai?",
            "Mujhe ek Gita verse sunao",
            "Mujhe confusion mein madad karo",
            "Mujhe Mahabharata ki koi story sunao"
        ],
        "lakshmi": [
            "Money ki stress kam karo",
            "Meri career ko bless karo",
            "Mujhe financial stability sikhao",
            "Mujhe paise save karna sikhao"
        ],
        "shiv": [
            "Aaj raat mera mann calm karo",
            "Mujhe detachment sikhao",
            "Mera emotional pain ease karo",
            "Mujhe inner stillness chahiye"
        ],
        "hanuman": [
            "Mera fear door karo",
            "Mujhe courage do",
            "Mujhe disciplined rehne mein madad karo",
            "Mera mann protect karo"
        ],
        "shani": [
            "Mujhe discipline sikhao",
            "Aaj ka sabse bada lesson kya hai?",
            "Mujhe karma ke baare mein samjhao",
            "Mujhe consistent rehne mein madad karo"
        ]
    ]
}
