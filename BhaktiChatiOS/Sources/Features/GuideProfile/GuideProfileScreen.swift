import SwiftUI

struct GuideProfileScreen: View {
    @EnvironmentObject private var appState: AppState
    let guide: Guide

    @State private var isLaunching = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.lg) {
                heroImage

                VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.md) {
                    Text(guide.displayName)
                        .font(.title2.weight(.bold))
                        .foregroundStyle(BhaktiTheme.textPrimary)

                    Text(guide.description)
                        .font(.body)
                        .foregroundStyle(BhaktiTheme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                teachingsCard

                startChatButton
            }
            .padding(.horizontal, BhaktiTheme.Spacing.lg)
            .padding(.top, BhaktiTheme.Spacing.md)
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance)
        }
        .navigationTitle("Guide Profile")
        .bhaktiInlineNavigationTitle()
        .bhaktiPageBackground()
    }

    private var heroImage: some View {
        PackageAssetLoader.image(named: guide.cardAssetName)
            .resizable()
            .scaledToFill()
            .frame(height: 220)
            .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg))
            .overlay(
                RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg)
                    .stroke(BhaktiTheme.border, lineWidth: 1)
            )
    }

    private var teachingsCard: some View {
        VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.md) {
            Text("Teachings")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BhaktiTheme.textSecondary)
                .textCase(.uppercase)
                .tracking(0.8)

            VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.sm + 2) {
                ForEach(guide.teachings, id: \.self) { item in
                    HStack(alignment: .top, spacing: BhaktiTheme.Spacing.sm) {
                        Image(systemName: "sparkle")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(BhaktiTheme.accentPrimary)
                            .padding(.top, 3)

                        Text(item)
                            .font(.body)
                            .foregroundStyle(BhaktiTheme.textPrimary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
        .padding(BhaktiTheme.Spacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg))
    }

    private var startChatButton: some View {
        Button {
            guard !isLaunching else { return }
            isLaunching = true
            Task {
                _ = await appState.startThread(for: guide.id, includeOpeningScene: true)
                isLaunching = false
                appState.selectedTab = .bhaktiChat
            }
        } label: {
            HStack(spacing: BhaktiTheme.Spacing.sm) {
                if isLaunching {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: "bubble.left.and.bubble.right.fill")
                        .font(.system(size: 16, weight: .semibold))
                }
                Text(isLaunching ? "Starting..." : "Start New Chat")
                    .font(.headline.weight(.semibold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(BhaktiTheme.accentGradient)
            .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))
        }
        .buttonStyle(BhaktiPressEffect())
        .disabled(isLaunching)
    }
}
