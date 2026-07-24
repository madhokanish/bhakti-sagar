import Foundation

/// Response from `POST /api/bhaktigpt/voice/session` — an ephemeral OpenAI Realtime API
/// token plus the model/voice the session was minted with. Guide-agnostic route, shared
/// with Android.
struct VoiceSessionResponse: Codable {
    let ephemeralKey: String
    let model: String
    let expiresAt: Int?
    let voicePresetId: String?
}
