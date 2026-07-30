import SwiftUI

/// First-launch disclosure + consent for third-party AI processing, required by App Store
/// Review Guideline 5.1.1(i) / 5.1.2(i): before any personal data is sent to a third-party
/// AI service, the app must disclose *what* is sent, *who* it goes to, and obtain the user's
/// permission. Shown once (gated by `bhakti_ai_consent_v1` in AppStorage) before the main UI
/// becomes usable, so it always precedes the first chat message or Divine Image upload.
struct AIConsentView: View {
    let onAgree: () -> Void

    private let privacyURL = URL(string: "https://bhaktichat.com/privacy")!

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Spacer(minLength: 24)

                ZStack {
                    Circle()
                        .fill(BhaktiTheme.accentPrimary.opacity(0.12))
                        .frame(width: 92, height: 92)
                    Image(systemName: "sparkles")
                        .font(.system(size: 40, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.accentPrimary)
                }

                Text("Before you begin")
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(BhaktiTheme.textPrimary)

                Text("BhaktiChat uses artificial intelligence to bring your guides to life.")
                    .font(.system(size: 15))
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .multilineTextAlignment(.center)

                VStack(alignment: .leading, spacing: 16) {
                    consentRow(
                        icon: "paperplane.fill",
                        title: "What is sent",
                        body: "The text of the messages you send, any photo you add for a Divine Image, and — during a voice call — the audio of your voice."
                    )
                    consentRow(
                        icon: "building.2.fill",
                        title: "Who it goes to",
                        body: "OpenAI, L.L.C. (our AI provider), which processes it only to generate a reply. It is not used to train AI models."
                    )
                    consentRow(
                        icon: "hand.raised.fill",
                        title: "Your choice",
                        body: "Nothing is sent until you send a message, start a voice call, or create a Divine Image. You can stop anytime."
                    )
                }
                .padding(18)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BhaktiTheme.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: 18).stroke(BhaktiTheme.border, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 18))

                Text("BhaktiChat is an AI companion inspired by tradition. It is not a real deity and does not provide predictions, medical, legal, or financial advice.")
                    .font(.system(size: 12.5))
                    .foregroundStyle(BhaktiTheme.textTertiary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 4)

                Link(destination: privacyURL) {
                    Text("Read our Privacy Policy")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.accentPrimary)
                }

                Spacer(minLength: 8)

                Button(action: onAgree) {
                    Text("Agree & Continue")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(BhaktiTheme.accentPrimary)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .buttonStyle(.plain)

                Text("By tapping Agree & Continue, you consent to your messages, any photos you add, and your voice audio during a call being sent to OpenAI, L.L.C. to generate responses, as described above and in our Privacy Policy.")
                    .font(.system(size: 11.5))
                    .foregroundStyle(BhaktiTheme.textTertiary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 4)
                    .padding(.bottom, 16)
            }
            .padding(.horizontal, 22)
        }
        .background(BhaktiTheme.background.ignoresSafeArea())
        .interactiveDismissDisabled(true)
    }

    private func consentRow(icon: String, title: String, body: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(BhaktiTheme.accentPrimary)
                .frame(width: 26, height: 26)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                Text(body)
                    .font(.system(size: 13))
                    .foregroundStyle(BhaktiTheme.textSecondary)
            }
        }
    }
}
