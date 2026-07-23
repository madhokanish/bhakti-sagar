import SwiftUI

struct AartisScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var aartis: [Aarti] = []
    @State private var errorText: String?
    @State private var query = ""
    @State private var selectedFilter = "all"

    private var filteredAartis: [Aarti] {
        aartis
            .filter { matchesFilter($0, selectedFilter) && matchesQuery($0, query) }
            .sorted {
                if $0.isTop != $1.isTop { return $0.isTop && !$1.isTop }
                if $0.hasArtwork != $1.hasArtwork { return $0.hasArtwork && !$1.hasArtwork }
                if ($0.popularityCount ?? 0) != ($1.popularityCount ?? 0) {
                    return ($0.popularityCount ?? 0) > ($1.popularityCount ?? 0)
                }
                return $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
            }
    }

    private var featuredAarti: Aarti? {
        guard query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, selectedFilter == "all" else {
            return nil
        }
        return filteredAartis.first
    }

    private var remainingAartis: [Aarti] {
        guard let featuredAarti else { return filteredAartis }
        return filteredAartis.filter { $0.id != featuredAarti.id }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                topBar
                searchField
                filtersRow

                #if os(iOS)
                // UIViewRepresentable doesn't reliably adopt GADBannerView's intrinsic
                // size inside a SwiftUI stack — an explicit frame is required or the
                // banner can render at zero height (Google's own SwiftUI sample does
                // the same). Matches Android's fixed 320x50 `AdSize.BANNER`.
                BannerAdView(placement: "aartis_list")
                    .frame(width: 320, height: 50)
                #endif

                if let errorText {
                    errorState(message: errorText)
                } else if aartis.isEmpty {
                    loadingState
                } else {
                    content
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance)
        }
        .bhaktiPageBackground()
        .bhaktiHideNavigationBar()
        .task {
            guard aartis.isEmpty, errorText == nil else { return }
            do {
                aartis = try AartiRepository.loadAartis()
            } catch {
                errorText = error.localizedDescription
            }
        }
    }

    private var loadingState: some View {
        VStack(spacing: BhaktiTheme.Spacing.md) {
            ProgressView()
                .progressViewStyle(.circular)
                .tint(BhaktiTheme.accentPrimary)
                .scaleEffect(1.2)
            Text("Loading aartis…")
                .font(.subheadline)
                .foregroundStyle(BhaktiTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, BhaktiTheme.Spacing.xxl + 12)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg))
    }

    private func errorState(message: String) -> some View {
        VStack(spacing: BhaktiTheme.Spacing.md) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 32, weight: .semibold))
                .foregroundStyle(BhaktiTheme.accentError)

            VStack(spacing: BhaktiTheme.Spacing.xs) {
                Text("Could not load aartis")
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Button {
                errorText = nil
                Task {
                    do {
                        aartis = try AartiRepository.loadAartis()
                    } catch {
                        errorText = error.localizedDescription
                    }
                }
            } label: {
                Label("Try again", systemImage: "arrow.clockwise")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, BhaktiTheme.Spacing.lg)
                    .padding(.vertical, BhaktiTheme.Spacing.sm + 2)
                    .background(BhaktiTheme.accentPrimary)
                    .clipShape(Capsule())
            }
            .buttonStyle(BhaktiPressEffect())
        }
        .frame(maxWidth: .infinity)
        .padding(BhaktiTheme.Spacing.xl)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg))
    }

    private var topBar: some View {
        AppTopBar(
            leftContent: {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Back")
            },
            centerContent: {
                Text("Aartis")
                    .font(.largeTitle.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
            },
            rightContent: {
                Color.clear.frame(width: 1, height: 1)
            }
        )
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(BhaktiTheme.textSecondary)
            TextField("Search aartis", text: $query)
                .foregroundStyle(BhaktiTheme.textPrimary)
                .modifier(BhaktiSearchFieldTraits())
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private var filtersRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(AartiFilters.all) { filter in
                    Button {
                        selectedFilter = filter.key
                    } label: {
                        AartiFilterChip(filter: filter, isSelected: selectedFilter == filter.key)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.trailing, 16)
        }
    }

    @ViewBuilder
    private var content: some View {
        if let featuredAarti {
            VStack(alignment: .leading, spacing: 10) {
                Text("Today’s aarti")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.accentPrimary)
                    .padding(.horizontal, 4)

                NavigationLink {
                    AartiDetailScreen(aarti: featuredAarti)
                } label: {
                    VStack(alignment: .leading, spacing: 10) {
                        AartiRowCard(
                            aarti: featuredAarti,
                            highlighted: true,
                            trailingContent: {
                                AnyView(
                                    HStack(spacing: 8) {
                                        if appState.isAartiSaved(featuredAarti.id) {
                                            Image(systemName: "bookmark.fill")
                                                .foregroundStyle(BhaktiTheme.accentWarm)
                                                .accessibilityLabel("Saved")
                                        }
                                        Text("Play")
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(BhaktiTheme.accentPrimary)
                                    }
                                )
                            }
                        )

                        Text(featuredAarti.preview)
                            .font(.subheadline)
                            .foregroundStyle(BhaktiTheme.textSecondary)
                            .lineLimit(3)
                            .padding(.horizontal, 14)
                            .padding(.bottom, 4)
                    }
                    .padding(8)
                    .background(BhaktiTheme.surface.opacity(0.96))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(BhaktiTheme.border, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                }
                .buttonStyle(.plain)
            }
        }

        if remainingAartis.isEmpty && featuredAarti == nil {
            VStack(spacing: BhaktiTheme.Spacing.sm) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 28, weight: .medium))
                    .foregroundStyle(BhaktiTheme.textTertiary)
                Text("No aartis match \"\(query.isEmpty ? selectedFilter : query)\"")
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                Text("Try a different search or clear the filter.")
                    .font(.subheadline)
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, BhaktiTheme.Spacing.xxl)
        } else if remainingAartis.isEmpty {
            EmptyView()
        } else {
            VStack(spacing: 0) {
                ForEach(Array(remainingAartis.enumerated()), id: \.element.id) { index, aarti in
                    NavigationLink {
                        AartiDetailScreen(aarti: aarti)
                    } label: {
                        AartiRowCard(aarti: aarti)
                    }
                    .buttonStyle(.plain)

                    if index < remainingAartis.count - 1 {
                        Divider()
                            .background(BhaktiTheme.border.opacity(0.75))
                            .padding(.leading, 70)
                            .padding(.vertical, 8)
                    }
                }
            }
            .padding(8)
            .background(BhaktiTheme.surface.opacity(0.96))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(BhaktiTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 20))
        }
    }
}

private struct BhaktiSearchFieldTraits: ViewModifier {
    func body(content: Content) -> some View {
        #if os(iOS)
        content
            .textInputAutocapitalization(.words)
            .autocorrectionDisabled()
        #else
        content
        #endif
    }
}

private func matchesFilter(_ aarti: Aarti, _ filter: String) -> Bool {
    switch filter {
    case "all":
        return true
    case "popular":
        return aarti.isTop
    default:
        return aarti.tags.contains(where: { $0.caseInsensitiveCompare(filter) == .orderedSame })
    }
}

private func matchesQuery(_ aarti: Aarti, _ query: String) -> Bool {
    let normalized = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if normalized.isEmpty { return true }

    return aarti.title.lowercased().contains(normalized)
        || aarti.titleHi.lowercased().contains(normalized)
        || aarti.deity.rawValue.lowercased().contains(normalized)
        || aarti.tags.contains(where: { $0.lowercased().contains(normalized) })
}
