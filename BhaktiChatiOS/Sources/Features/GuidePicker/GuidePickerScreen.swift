import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct GuidePickerScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    // Pinned guides stored as comma-separated IDs in AppStorage
    @AppStorage("bhakti_pinned_guides") private var pinnedIdsRaw: String = ""

    private var pinnedIds: Set<String> {
        Set(pinnedIdsRaw.split(separator: ",").map(String.init).filter { !$0.isEmpty })
    }

    private func togglePin(_ id: String) {
        var ids = pinnedIds
        if ids.contains(id) { ids.remove(id) } else { ids.insert(id) }
        pinnedIdsRaw = ids.sorted().joined(separator: ",")
    }

    /// Pinned guides shown first, rest in catalog order
    private var orderedGuides: [Guide] {
        let pinned = pinnedIds
        let (p, rest) = GuidesCatalog.all.reduce(into: ([Guide](), [Guide]())) { acc, g in
            if pinned.contains(g.id) { acc.0.append(g) } else { acc.1.append(g) }
        }
        return p + rest
    }

    private let columns = [
        GridItem(.flexible(), spacing: 14),
        GridItem(.flexible(), spacing: 14)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                topBar

                Text("Choose your guide for this session")
                    .font(.body)
                    .foregroundStyle(BhaktiTheme.textSecondary)

                if !pinnedIds.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Label("Pinned", systemImage: "pin.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(BhaktiTheme.accentPrimary)
                            .textCase(.uppercase)
                            .tracking(0.6)

                        LazyVGrid(columns: columns, spacing: 14) {
                            ForEach(orderedGuides.filter { pinnedIds.contains($0.id) }) { guide in
                                guideCard(for: guide)
                            }
                        }
                    }

                    Text("All guides")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textTertiary)
                        .textCase(.uppercase)
                        .tracking(0.6)
                }

                LazyVGrid(columns: columns, spacing: 14) {
                    ForEach(orderedGuides.filter { !pinnedIds.contains($0.id) }) { guide in
                        guideCard(for: guide)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance)
        }
        .bhaktiPageBackground()
        .bhaktiHideNavigationBar()
    }

    // MARK: - Top bar

    private var topBar: some View {
        AppTopBar(
            leftContent: {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .frame(width: 42, height: 42)
                        .background(BhaktiTheme.surface)
                        .overlay(Circle().stroke(BhaktiTheme.border, lineWidth: 1))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            },
            centerContent: {
                Text("Choose Guide")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
            },
            rightContent: {
                Color.clear.frame(width: 42, height: 42)
            }
        )
    }

    // MARK: - Guide card

    @ViewBuilder
    private func guideCard(for guide: Guide) -> some View {
        let isSelected = appState.selectedGuideId == guide.id
        let isPinned = pinnedIds.contains(guide.id)

        Button {
            appState.selectGuide(guide.id)
#if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
#endif
            dismiss()
        } label: {
            VStack(spacing: 10) {
                ZStack(alignment: .topTrailing) {
                    PackageAssetLoader.image(named: guide.avatarAssetName)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 72, height: 72)
                        .clipShape(Circle())
                        .overlay(
                            Circle().stroke(
                                isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.border,
                                lineWidth: isSelected ? 2.5 : 1
                            )
                        )

                    if isPinned {
                        Image(systemName: "pin.fill")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(4)
                            .background(BhaktiTheme.accentPrimary)
                            .clipShape(Circle())
                            .offset(x: 4, y: -4)
                    }
                }

                Text(guide.displayName)
                    .font(.system(size: 14, weight: isSelected ? .semibold : .regular))
                    .foregroundStyle(isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .minimumScaleFactor(0.85)

                if isSelected {
                    Label("Selected", systemImage: "checkmark.circle.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.accentPrimary)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .padding(.horizontal, 10)
            .background(isSelected ? BhaktiTheme.accentPrimary.opacity(0.08) : BhaktiTheme.surface)
            .overlay(
                RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg)
                    .stroke(
                        isSelected ? BhaktiTheme.accentPrimary.opacity(0.55) : BhaktiTheme.border,
                        lineWidth: 1
                    )
            )
            .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg))
        }
        .buttonStyle(BhaktiPressEffect())
        .animation(BhaktiTheme.Animation.spring, value: isSelected)
        .contextMenu {
            Button {
                togglePin(guide.id)
            } label: {
                Label(isPinned ? "Unpin guide" : "Pin to top", systemImage: isPinned ? "pin.slash" : "pin")
            }
        }
    }
}
