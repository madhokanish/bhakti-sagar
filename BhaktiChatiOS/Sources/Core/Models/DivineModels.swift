import Foundation

enum DivineMode: String, Codable, CaseIterable {
    case photoWithGod = "PHOTO_WITH_GOD"
    case photoAtTemple = "PHOTO_AT_TEMPLE"
}

struct DivineTemplate: Identifiable, Hashable, Codable {
    let id: String
    let mode: DivineMode
    let title: String
    let description: String
    let thumbnailAssetName: String
    let promptSkeleton: String
    let deityTag: String?
    let templeName: String?
    let sceneName: String?
}

enum CreationStatus: String, Codable {
    case idle
    case generating
    case success
    case failed
}

struct DivineCreation: Identifiable, Hashable, Codable {
    let id: String
    let mode: DivineMode
    let templateId: String
    let templateTitle: String
    let inputPrompt: String
    let outputImageURL: String?
    let outputImageBase64: String?
    let status: CreationStatus
    let errorMessage: String?
    var variant: String?        // "control" or "treatment"
    var requestId: String?      // for correlating feedback
    var feedbackRating: String? // "up" or "down" — set after user rates
}

struct DivineImageResponse: Codable {
    let imageBase64: String?
    let imageUrl: String?
    let error: String?
    let mimeType: String?
    let variant: String?
    let requestId: String?
    let durationMs: Int?
}
