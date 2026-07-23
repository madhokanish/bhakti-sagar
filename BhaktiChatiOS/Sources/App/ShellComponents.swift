import SwiftUI

#if os(iOS)
import UIKit
#endif

// MARK: - Top bar shell

struct AppTopBar<Left: View, Center: View, Right: View>: View {
    private let sideSlotWidth: CGFloat = 96

    let leftContent: Left
    let centerContent: Center
    let rightContent: Right

    init(
        @ViewBuilder leftContent: () -> Left,
        @ViewBuilder centerContent: () -> Center,
        @ViewBuilder rightContent: () -> Right
    ) {
        self.leftContent = leftContent()
        self.centerContent = centerContent()
        self.rightContent = rightContent()
    }

    var body: some View {
        HStack {
            HStack { leftContent }
                .frame(width: sideSlotWidth, alignment: .leading)

            Spacer(minLength: 0)

            HStack { centerContent }
                .frame(maxWidth: .infinity)

            Spacer(minLength: 0)

            HStack { rightContent }
                .frame(width: sideSlotWidth, alignment: .trailing)
        }
        .frame(height: 56)
    }
}

// MARK: - Section header

struct ShellSectionHeader: View {
    let title: String
    let actionLabel: String?
    let onActionTap: (() -> Void)?

    init(title: String, actionLabel: String? = nil, onActionTap: (() -> Void)? = nil) {
        self.title = title
        self.actionLabel = actionLabel
        self.onActionTap = onActionTap
    }

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)

            Spacer()

            if let actionLabel, let onActionTap {
                Button(action: onActionTap) {
                    Text(actionLabel)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.accentPrimary)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Guide avatar

struct GuideAvatarItemView: View {
    let title: String
    let imageAssetName: String
    let isSelected: Bool
    var selectedTextColor: Color = BhaktiTheme.accentPrimary
    var unselectedTextColor: Color = BhaktiTheme.textSecondary
    var itemWidth: CGFloat = 104
    var outerDiameter: CGFloat = 80
    /// Kept for source-compat with existing call sites; the image now always
    /// fills the full [outerDiameter] so the "white ring" gap is gone.
    var imageDiameter: CGFloat = 80

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: BhaktiTheme.Spacing.sm) {
            // Image fills the full circle; the selection ring sits ON the image
            // edge as an overlay rather than a separate concentric stroke. This
            // matches the convention used by WhatsApp / iOS Contacts / Instagram
            // stories — no visible "framed" gap around the artwork.
            PackageAssetLoader.image(named: imageAssetName)
                .resizable()
                .scaledToFill()
                .frame(width: outerDiameter, height: outerDiameter)
                .clipShape(Circle())
                .overlay(
                    Circle().stroke(
                        isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.border.opacity(0.45),
                        lineWidth: isSelected ? 2.5 : 1
                    )
                )
                .scaleEffect(isSelected && !reduceMotion ? 1.05 : 1)
                .animation(reduceMotion ? nil : BhaktiTheme.Animation.spring, value: isSelected)

            Text(title)
                .font(.system(size: 13, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? selectedTextColor : unselectedTextColor)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.85)
                .frame(width: itemWidth, alignment: .center)
        }
        .frame(width: itemWidth)
    }
}

// MARK: - Situation card
//
// Compact horizontal card used in the Home → "Life Situations" grid.
// Each card is ~76pt tall (versus the older 128pt vertical layout) and uses
// a per-situation accent color so the grid reads as a varied, emotionally
// keyed set rather than a wall of identical chips.

struct SituationCardView: View {
    let title: String
    let subtitle: String
    let iconSystemName: String
    /// Per-situation accent color — used for both the icon tint and the
    /// subtle background gradient. Defaults to the brand orange.
    var accentColor: Color = BhaktiTheme.accentPrimary
    /// The default guide's portrait for this situation (e.g. Lakshmi Ji for
    /// "Money stress"). When present, shown instead of the generic SF Symbol
    /// medallion so the card reads at a glance which guide will respond.
    var guideAvatarAssetName: String? = nil

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            // Guide portrait (falls back to the generic icon medallion if
            // no guide avatar is available for this situation).
            ZStack {
                if let guideAvatarAssetName {
                    PackageAssetLoader.image(named: guideAvatarAssetName)
                        .resizable()
                        .scaledToFill()
                } else {
                    Circle()
                        .fill(accentColor.opacity(0.14))
                    Image(systemName: iconSystemName)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(accentColor)
                }
            }
            .frame(width: 42, height: 42)
            .clipShape(Circle())
            .overlay(Circle().stroke(accentColor.opacity(0.35), lineWidth: 1.5))

            // Title + guide name
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .minimumScaleFactor(0.9)

                Text(subtitle)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 11)
        .frame(maxWidth: .infinity, minHeight: 76, alignment: .leading)
        .background(
            // Subtle gradient: brand surface → soft accent tint at the
            // bottom-right corner. Adds warmth without overpowering.
            LinearGradient(
                colors: [
                    BhaktiTheme.surface,
                    accentColor.opacity(0.06)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Hub prompt card

struct HubPromptCard: View {
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.sm) {
            Image(systemName: "sparkle")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BhaktiTheme.accentPrimary.opacity(0.8))

            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(BhaktiTheme.textPrimary)
                .multilineTextAlignment(.leading)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, BhaktiTheme.Spacing.md)
        .padding(.vertical, BhaktiTheme.Spacing.md)
        .frame(maxWidth: .infinity, minHeight: 80, alignment: .topLeading)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))
    }
}

// MARK: - Bottom nav bar

struct BhaktiBottomNavBar: View {
    static let overlayClearance: CGFloat = 70

    @Binding var selectedTab: AppTab

    private func selectTab(_ tab: AppTab) {
#if os(iOS)
        let generator = UISelectionFeedbackGenerator()
        generator.selectionChanged()
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
#endif
        withAnimation(BhaktiTheme.Animation.spring) {
            selectedTab = tab
        }
    }

    var body: some View {
        HStack(alignment: .bottom, spacing: 0) {
            bottomItem(tab: .home, label: "Home", systemName: "house")
            bottomLogoItem
            bottomItem(tab: .explore, label: "Explore", systemName: "safari")
            bottomItem(tab: .history, label: "History", systemName: "clock")
        }
        .padding(.horizontal, BhaktiTheme.Spacing.sm)
        .padding(.top, BhaktiTheme.Spacing.xs)
        .padding(.bottom, BhaktiTheme.Spacing.xs)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(BhaktiTheme.border.opacity(0.6))
                .frame(height: 0.5)
        }
    }

    private func bottomItem(tab: AppTab, label: String, systemName: String) -> some View {
        let isSelected = selectedTab == tab

        return Button { selectTab(tab) } label: {
            VStack(spacing: 3) {
                Image(systemName: isSelected ? "\(systemName).fill" : systemName)
                    .font(.system(size: 21, weight: .medium))
                    .foregroundStyle(isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.textTertiary)
                    .frame(height: 26)

                Text(label)
                    .font(.system(size: 10, weight: isSelected ? .semibold : .regular))
                    .foregroundStyle(isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.textTertiary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)

                Circle()
                    .fill(isSelected ? BhaktiTheme.accentPrimary : Color.clear)
                    .frame(width: 4, height: 4)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, BhaktiTheme.Spacing.xs)
        }
        .buttonStyle(.plain)
    }

    private var bottomLogoItem: some View {
        let isSelected = selectedTab == .bhaktiChat

        return Button { selectTab(.bhaktiChat) } label: {
            VStack(spacing: 3) {
                Image(systemName: "sparkle")
                    .font(.system(size: 26, weight: isSelected ? .bold : .medium))
                    .foregroundStyle(isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.textTertiary)
                    .frame(width: 32, height: 32)
                    .scaleEffect(isSelected ? 1.08 : 1)
                    .animation(BhaktiTheme.Animation.spring, value: isSelected)

                Text("Bhakti Chat")
                    .font(.system(size: 10, weight: isSelected ? .semibold : .regular))
                    .foregroundStyle(isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.textTertiary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)

                Circle()
                    .fill(isSelected ? BhaktiTheme.accentPrimary : Color.clear)
                    .frame(width: 4, height: 4)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, BhaktiTheme.Spacing.xs)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Keyboard observer

@MainActor
final class KeyboardObserver: ObservableObject {
    @Published var isVisible = false

    private var willChangeFrameObserver: NSObjectProtocol?
    private var willHideObserver: NSObjectProtocol?

    init() {
#if os(iOS)
        let center = NotificationCenter.default
        willChangeFrameObserver = center.addObserver(
            forName: UIResponder.keyboardWillChangeFrameNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            Task { @MainActor [weak self] in
                guard let self,
                      let frame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect
                else { self?.isVisible = false; return }
                self.isVisible = max(0, UIScreen.main.bounds.height - frame.minY) > 100
            }
        }
        willHideObserver = center.addObserver(
            forName: UIResponder.keyboardWillHideNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in self?.isVisible = false }
        }
#endif
    }

    deinit {
#if os(iOS)
        let center = NotificationCenter.default
        if let o = willChangeFrameObserver { center.removeObserver(o) }
        if let o = willHideObserver { center.removeObserver(o) }
#endif
    }
}
