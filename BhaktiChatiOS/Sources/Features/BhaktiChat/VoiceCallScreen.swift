import SwiftUI
#if os(iOS)
import AVFoundation
#endif

/// Full-screen voice-call UI: guide portrait, name, live call state, streaming caption, and
/// an end-call control. Mirrors Android's `VoiceModeScreen.kt`. Presented as a
/// `.fullScreenCover` from `ChatThreadScreen` (this screen has no nested `NavigationStack`
/// of its own, so a modal takeover — not a stack push — matches the existing convention for
/// "single full-screen destination" here).
struct VoiceCallScreen: View {
    let guide: Guide

    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel: VoiceConversationViewModel
    @State private var permissionDeniedMessage: String?

    init(guide: Guide, conversationId: String?, api: BhaktiAPIClient) {
        self.guide = guide
        _viewModel = StateObject(wrappedValue: VoiceConversationViewModel(guide: guide, conversationId: conversationId, api: api))
    }

    var body: some View {
        ZStack {
            Color(red: 0x1A / 255, green: 0x0F / 255, blue: 0x0A / 255).ignoresSafeArea()

            VStack(spacing: 16) {
                Spacer()

                PackageAssetLoader.image(named: guide.avatarAssetName)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 220, height: 220)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.white.opacity(0.15), lineWidth: 10))

                Text(guide.displayName)
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(.white)

                Text(stateLabel)
                    .font(.system(size: 15))
                    .foregroundStyle(Color(red: 0xE8 / 255, green: 0xC7 / 255, blue: 0xA8 / 255))

                if !captionText.isEmpty {
                    Text(captionText)
                        .font(.system(size: 16))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .padding(.top, 8)
                }

                Spacer()

                Button {
                    viewModel.endCall()
                    dismiss()
                } label: {
                    Image(systemName: "phone.down.fill")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 64, height: 64)
                        .background(BhaktiTheme.accentError)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("End call")
                .padding(.bottom, 40)
            }
        }
        .bhaktiHideNavigationBar()
        .task {
            await requestMicPermissionThenStart()
        }
        .onDisappear {
            viewModel.endCall()
        }
    }

    private var stateLabel: String {
        if let permissionDeniedMessage { return permissionDeniedMessage }
        switch viewModel.callState {
        case .idle, .connecting: return "Connecting…"
        case .listening, .userSpeaking: return "Listening"
        case .thinking: return "Thinking…"
        case .guideSpeaking: return "Speaking"
        case .error(let message): return message
        case .ended: return "Call ended"
        }
    }

    private var captionText: String {
        !viewModel.assistantCaption.isEmpty ? viewModel.assistantCaption : viewModel.userCaption
    }

    private func requestMicPermissionThenStart() async {
        #if os(iOS)
        let granted: Bool = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
        guard granted else {
            permissionDeniedMessage = "Microphone permission is required for Voice Mode."
            return
        }
        #endif
        await viewModel.start()
    }
}
