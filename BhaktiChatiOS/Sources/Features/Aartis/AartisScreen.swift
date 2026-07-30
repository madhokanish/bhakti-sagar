import SwiftUI

struct AartisScreen: View {
    @EnvironmentObject private var appState: AppState
    @ObservedObject private var player = AartiPlayer.shared
    @Environment(\.dismiss) private var dismiss

    @State private var aartis: [Aarti] = []
    @State private var errorText: String?
    @State private var query = ""
    @State private var selectedFilter = "all"
    @State private var showNowPlaying = false

    /// Every aarti with a real audio track, in list order — the continuous queue.
    private var audioAartis: [Aarti] {
        aartis.filter { $0.hasAudio }
    }

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
        ZStack(alignment: .bottom) {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                topBar
                searchField
                filtersRow

                if !audioAartis.isEmpty, query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, selectedFilter == "all" {
                    playAllCard
                }

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
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance + (player.hasQueue ? 76 : 0))
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

        if player.hasQueue {
            MiniPlayerBar(
                player: player,
                onPlayPause: { player.togglePlayPause() },
                onNext: { player.next() },
                onStop: { player.stop() },
                onExpand: { showNowPlaying = true }
            )
            .padding(.horizontal, 12)
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance + 8)
        }
        }
        #if os(iOS)
        .fullScreenCover(isPresented: $showNowPlaying) {
            AartiNowPlayingScreen()
        }
        #else
        .sheet(isPresented: $showNowPlaying) {
            AartiNowPlayingScreen()
        }
        #endif
    }

    private var playAllCard: some View {
        Button {
            player.playQueue(audioAartis, startId: audioAartis.first?.id)
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    Circle().fill(BhaktiTheme.accentPrimary).frame(width: 44, height: 44)
                    Image(systemName: "play.fill")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Play all aartis")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                    Text("\(audioAartis.count) aartis • continuous playback")
                        .font(.caption)
                        .foregroundStyle(BhaktiTheme.textSecondary)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity)
            .background(BhaktiTheme.accentPrimary.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 18))
        }
        .buttonStyle(.plain)
    }

    // A row that navigates to the lyrics on tap, with an independent play button overlaid on the
    // trailing edge for audio-having aartis (the play button is a sibling of the NavigationLink so
    // its taps don't trigger navigation).
    @ViewBuilder
    private func playableRow(_ aarti: Aarti) -> some View {
        ZStack(alignment: .trailing) {
            NavigationLink {
                AartiDetailScreen(aarti: aarti)
            } label: {
                AartiRowCard(
                    aarti: aarti,
                    trailingContent: aarti.hasAudio ? { AnyView(rowTrailingReserve(aarti)) } : nil
                )
            }
            .buttonStyle(.plain)

            if aarti.hasAudio {
                playButton(for: aarti)
                    .padding(.trailing, 14)
            }
        }
    }

    private func rowTrailingReserve(_ aarti: Aarti) -> some View {
        HStack(spacing: 10) {
            if appState.isAartiSaved(aarti.id) {
                Image(systemName: "bookmark.fill")
                    .foregroundStyle(BhaktiTheme.accentWarm)
                    .accessibilityLabel("Saved")
            }
            Color.clear.frame(width: 32, height: 32)
        }
    }

    private func playButton(for aarti: Aarti) -> some View {
        let isCurrent = player.currentAartiId == aarti.id
        let showPause = isCurrent && player.isPlaying
        return Button {
            if isCurrent {
                player.togglePlayPause()
            } else {
                player.playQueue(audioAartis, startId: aarti.id)
            }
        } label: {
            Image(systemName: showPause ? "pause.circle.fill" : "play.circle.fill")
                .font(.system(size: 30))
                .foregroundStyle(BhaktiTheme.accentPrimary)
        }
        .buttonStyle(.plain)
        .contentShape(Circle())
        .accessibilityLabel(showPause ? "Pause \(aarti.title)" : "Play \(aarti.title)")
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

                ZStack(alignment: .topTrailing) {
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
                                            if featuredAarti.hasAudio {
                                                Color.clear.frame(width: 32, height: 32)
                                            } else {
                                                Text("Read")
                                                    .font(.subheadline.weight(.semibold))
                                                    .foregroundStyle(BhaktiTheme.accentPrimary)
                                            }
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

                    if featuredAarti.hasAudio {
                        playButton(for: featuredAarti)
                            .padding(.top, 26)
                            .padding(.trailing, 22)
                    }
                }
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
                    playableRow(aarti)

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

/// Floating Spotify-style now-playing bar; visible whenever a queue is loaded.
private struct MiniPlayerBar: View {
    @ObservedObject var player: AartiPlayer
    let onPlayPause: () -> Void
    let onNext: () -> Void
    let onStop: () -> Void
    let onExpand: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(player.title.isEmpty ? "Aarti" : player.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .lineLimit(1)
                    Text(player.isBuffering ? "Buffering…" : (player.subtitle.isEmpty ? "Now playing" : player.subtitle))
                        .font(.caption)
                        .foregroundStyle(BhaktiTheme.textSecondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)

                Button(action: onPlayPause) {
                    Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(BhaktiTheme.accentPrimary)
                        .frame(width: 40, height: 40)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(player.isPlaying ? "Pause" : "Play")

                Button(action: onNext) {
                    Image(systemName: "forward.end.fill")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .frame(width: 40, height: 40)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Next aarti")

                Button(action: onStop) {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textSecondary)
                        .frame(width: 40, height: 40)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Stop playback")
            }
            .padding(.leading, 16)
            .padding(.trailing, 4)
            .padding(.vertical, 6)

            // Thin progress line, like Spotify's mini-player.
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(BhaktiTheme.accentPrimary.opacity(0.15))
                    Rectangle()
                        .fill(BhaktiTheme.accentPrimary)
                        .frame(width: max(0, geo.size.width * player.progress))
                }
            }
            .frame(height: 3)
            .animation(.linear(duration: 0.3), value: player.progress)
        }
        .background(BhaktiTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.15), radius: 8, x: 0, y: 2)
        // Tapping the bar (incl. the Spacer gaps) expands to the full-screen player, and the
        // contentShape ensures the whole bar absorbs the tap so nothing leaks through to the
        // list rows behind the floating overlay.
        .contentShape(Rectangle())
        .onTapGesture { onExpand() }
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
