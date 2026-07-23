import Foundation

struct Guide: Identifiable, Hashable, Codable {
    let id: String
    let displayName: String
    let status: String
    let avatarAssetName: String
    let cardAssetName: String
    let description: String
    let teachings: [String]
    let openingScene: String
    let suggestedPrompts: [String]
    let serverPromptKey: String
}
