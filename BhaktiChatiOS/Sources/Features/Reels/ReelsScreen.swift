import SwiftUI
#if os(iOS)
import AVFoundation
import UIKit
#endif

/// Full-bleed vertical devotional video feed. Sound-on autoplay, one clip per page, with a
/// chat handoff ("Ask about this") as the differentiating action.
struct ReelsScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var feed: ReelFeed = .top
    /// Tracked by reel id, not index: indices collide across feeds, and using one as the page's
    /// `.id()` made SwiftUI reuse page 0 on a feed switch instead of rebinding it to the new clip.
    @State private var activeReelID: String?
    @State private var isMuted = false
    @State private var likedIDs: Set<String> = []
    @State private var savedIDs: Set<String> = []

    /// Shuffled per-screen-appearance (see `.onAppear` in `body`), not recomputed on every view
    /// update — a plain computed property re-sorting `ReelsRepository.reels(for:)` on each
    /// re-render would reshuffle mid-scroll and jump the feed under the user's finger. This way
    /// order is random once per visit to the tab, but stable while they're actually browsing it.
    @State private var reels: [Reel] = []

    /// Before the first scroll event lands, `activeReelID` is nil — treat the first clip as
    /// active so it autoplays on open (and on every feed switch).
    private var resolvedActiveID: String? { activeReelID ?? reels.first?.id }

    var body: some View {
        GeometryReader { proxy in
            // No `.ignoresSafeArea()` anywhere in this view (see the bottom of `body` for why
            // that was the actual bug) — `proxy.size` is therefore the space already inset from
            // both the status bar and, more importantly, RootTabView's persistent bottom tab
            // bar, exactly like every other screen in the app gets by default. That's what
            // guarantees this screen's ScrollView never physically overlaps the tab bar's real
            // hit area — no manual arithmetic, no assumptions about what `.ignoresSafeArea`
            // does or doesn't shrink.
            let pageSize = proxy.size
            let insets = proxy.safeAreaInsets

            ZStack(alignment: .top) {
                Color.black

                if reels.isEmpty {
                    emptyState
                } else {
                    ScrollView(.vertical, showsIndicators: false) {
                        LazyVStack(spacing: 0) {
                            ForEach(reels) { reel in
                                ReelPageView(
                                    reel: reel,
                                    pageSize: pageSize,
                                    safeAreaInsets: insets,
                                    isActive: reel.id == resolvedActiveID,
                                    isMuted: $isMuted,
                                    isLiked: likedIDs.contains(reel.id),
                                    isSaved: savedIDs.contains(reel.id),
                                    reduceMotion: reduceMotion,
                                    onLike: { toggle(&likedIDs, reel.id) },
                                    onSave: { toggle(&savedIDs, reel.id) },
                                    onAsk: { askAbout(reel) }
                                )
                                .frame(width: pageSize.width, height: pageSize.height)
                                .id(reel.id)
                            }
                        }
                        .scrollTargetLayout()
                    }
                    .scrollTargetBehavior(.paging)
                    .scrollPosition(id: $activeReelID)
                }
            }
            // Only rewind to the top when the current clip isn't part of the new feed —
            // otherwise this would clobber a deep-link from Home that just set both.
            .onChange(of: feed) { _, newFeed in
                refreshReels(for: newFeed)
                if activeReelID == nil || !reels.contains(where: { $0.id == activeReelID }) {
                    activeReelID = reels.first?.id
                }
            }
            .onAppear {
                refreshReels(for: feed)
                consumePendingReel()
            }
            .onChange(of: appState.pendingReelId) { _, _ in consumePendingReel() }
        }
        .overlay(alignment: .top) {
            feedSwitcher
                .padding(.top, 6)
        }
        .background(Color.black)
        .bhaktiHideNavigationBar()
        .preferredColorScheme(.dark)
    }

    /// Replaces `reels` with a freshly shuffled order for `feed`. Called once per screen
    /// appearance (fresh shuffle each visit) and on every feed switch — never from `body`
    /// itself, so scrolling doesn't reshuffle the list out from under the user mid-browse.
    private func refreshReels(for feed: ReelFeed) {
        reels = ReelsRepository.reels(for: feed).shuffled()
    }

    /// Honours a deep-link from Home's Reels shelf: switch to whichever feed holds the clip,
    /// jump to it, then clear the request so returning to the tab later resumes where the
    /// user actually left off. Runs after `refreshReels` in `.onAppear`, and re-shuffles again
    /// itself if it has to switch feeds — `activeReelID` is set last, so the deep-linked clip
    /// wins over that reshuffle's own "jump to the first clip" fallback.
    private func consumePendingReel() {
        guard let pending = appState.pendingReelId else { return }
        if let match = ReelFeed.allCases.first(where: { feedCase in
            ReelsRepository.reels(for: feedCase).contains { $0.id == pending }
        }) {
            if match != feed {
                feed = match
            } else if reels.isEmpty {
                refreshReels(for: feed)
            }
            activeReelID = pending
        }
        appState.pendingReelId = nil
    }

    private func toggle(_ set: inout Set<String>, _ id: String) {
        if set.contains(id) { set.remove(id) } else { set.insert(id) }
#if os(iOS)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
#endif
    }

    /// The differentiating action — opens this deity's single persistent conversation seeded
    /// with the clip's context.
    private func askAbout(_ reel: Reel) {
        let guideName = GuidesCatalog.byId(reel.deityId)?.displayName ?? "your guide"
        let prompt = "I just watched a reel — \"\(reel.title)\". \(reel.caption)\n\nWhat does this mean for me, \(guideName)?"
        Task {
            _ = await appState.startThread(
                for: reel.deityId,
                includeOpeningScene: false,
                initialPrompt: prompt
            )
            appState.selectedTab = .bhaktiChat
        }
    }

    private var feedSwitcher: some View {
        HStack(spacing: 18) {
            ForEach(ReelFeed.allCases, id: \.self) { option in
                Button {
                    withAnimation(BhaktiTheme.Animation.quick) { feed = option }
                } label: {
                    Text(option.title)
                        .font(.system(size: option == feed ? 14.5 : 14, weight: option == feed ? .heavy : .semibold))
                        .foregroundStyle(option == feed ? .white : Color.white.opacity(0.55))
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(option == feed ? [.isSelected] : [])
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        // Absorb taps across the whole strip — without this, a tap in the gap between the
        // three labels falls through to the page and toggles mute.
        .background(Color.black.opacity(0.001))
        .contentShape(Rectangle())
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "play.square")
                .font(.system(size: 34, weight: .light))
                .foregroundStyle(Color.white.opacity(0.5))
            Text("No reels yet")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(.white)
            Text("New devotional clips arrive here soon.")
                .font(.system(size: 12.5))
                .foregroundStyle(Color.white.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - One page

private struct ReelPageView: View {
    let reel: Reel
    let pageSize: CGSize
    let safeAreaInsets: EdgeInsets
    let isActive: Bool
    @Binding var isMuted: Bool
    let isLiked: Bool
    let isSaved: Bool
    let reduceMotion: Bool
    let onLike: () -> Void
    let onSave: () -> Void
    let onAsk: () -> Void

#if os(iOS)
    @StateObject private var controller = ReelVideoController()
#endif

    var body: some View {
        // No `.ignoresSafeArea()` on any child here — the page is already sized to the full
        // screen by its parent, and expanding a child past that frame re-centres the overlay
        // content against the larger bounds (which pushed the caption off-screen and hid the
        // action rail entirely).
        ZStack {
            // Media is explicitly framed to the page. Without this, `scaledToFill` lets the
            // image report its full scaled size, the ZStack grows to match, and the overlay
            // content below gets centred against those oversized bounds — which is what pushed
            // the caption off-screen and hid the action rail.
            poster
                .frame(width: pageSize.width, height: pageSize.height)
                .clipped()

#if os(iOS)
            // Reduce Motion: hold the poster frame, keep everything else usable. The `.aartis`
            // feed has no real video track (it projects the audio-only aarti library into Reels
            // shape) — attaching an AVPlayerLayer to an audio-only asset produced no sound at
            // all, so those pages skip the layer entirely and just play audio under the poster,
            // the same way AartiPlayer does elsewhere in the app.
            if !reduceMotion && reel.feed != .aartis {
                // No readiness gating: AVPlayerLooper plays *copies* of the template item, so
                // the template's own status never reaches .readyToPlay — gating on it left the
                // layer permanently invisible (a still poster with audio playing under it).
                // The layer is transparent until its first frame lands, so the poster shows
                // through and is then covered by live video.
                ReelVideoView(player: controller.player)
                    .frame(width: pageSize.width, height: pageSize.height)
                    .clipped()
            }
#endif

            scrims
                .frame(width: pageSize.width, height: pageSize.height)

            VStack(spacing: 0) {
                HStack(alignment: .bottom, spacing: 12) {
                    captionBlock
                    actionRail
                        .frame(width: 46)
                }
                scrubber
                    .padding(.top, 14)
            }
            // Pad first, then clamp to the page — the reverse order would make the padded
            // content wider than the page and push the rail back off-screen. `pageSize` already
            // stops above the real tab bar (see ReelsScreen — only the top safe area is
            // ignored), so this just needs its own small inset, not the tab bar's height again.
            .padding(.horizontal, 16)
            .padding(.bottom, safeAreaInsets.bottom + 14)
            .frame(width: pageSize.width, height: pageSize.height, alignment: .bottom)
        }
        .frame(width: pageSize.width, height: pageSize.height)
        .clipped()
        .contentShape(Rectangle())
        .onTapGesture { toggleMute() }
#if os(iOS)
        .task(id: isActive) {
            controller.load(urlString: reel.videoURL)
            controller.setMuted(isMuted)
            // Only the visible page plays; everything else is paused (never more than one
            // decode session active).
            if isActive && !reduceMotion { controller.play() } else { controller.pause() }
        }
        .onChange(of: isMuted) { _, muted in controller.setMuted(muted) }
        .onDisappear { controller.pause() }
#endif
    }

    private func toggleMute() {
        isMuted.toggle()
    }

    @ViewBuilder
    private var poster: some View {
        if let asset = reel.posterAsset {
            PackageAssetLoader.image(named: asset)
                .resizable()
                .scaledToFill()
        } else {
            Color.black
        }
    }

    private var scrims: some View {
        ZStack {
            LinearGradient(
                stops: [
                    .init(color: Color.black.opacity(0.55), location: 0),
                    .init(color: .clear, location: 0.22)
                ],
                startPoint: .top, endPoint: .bottom
            )
            LinearGradient(
                stops: [
                    .init(color: .clear, location: 0.45),
                    .init(color: Color.black.opacity(0.85), location: 1)
                ],
                startPoint: .top, endPoint: .bottom
            )
        }
        .allowsHitTesting(false)
    }

    private var captionBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                if let avatar = reel.creatorAvatarAsset {
                    PackageAssetLoader.image(named: avatar)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 34, height: 34)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.white.opacity(0.6), lineWidth: 1.5))
                }
                Text(reel.creatorName)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(.white)
                Text("Follow")
                    .font(.system(size: 10.5, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .overlay(Capsule().stroke(Color.white.opacity(0.75), lineWidth: 1))
            }

            Text(reel.caption)
                .font(.system(size: 13.5))
                .lineSpacing(2)
                .foregroundStyle(.white)
                .lineLimit(3)

            HStack(spacing: 6) {
                MiniWaveform(isAnimating: isActive && !reduceMotion)
                Text("\(reel.audioTitle)")
                    .font(.system(size: 11.5))
                    .foregroundStyle(Color.white.opacity(0.85))
                    .lineLimit(1)
                Image(systemName: isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color.white.opacity(0.75))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var actionRail: some View {
        VStack(spacing: 20) {
            railButton(
                systemName: isLiked ? "heart.fill" : "heart",
                label: reel.likeCountLabel,
                tint: isLiked ? BhaktiTheme.accentPrimary : .white,
                accessibility: isLiked ? "Unlike" : "Like",
                action: onLike
            )
            railButton(
                systemName: isSaved ? "bookmark.fill" : "bookmark",
                label: "Save",
                tint: .white,
                accessibility: isSaved ? "Remove from saved" : "Save",
                action: onSave
            )
            ShareLink(item: shareText) {
                railLabel(systemName: "square.and.arrow.up", label: "Share", tint: .white, accent: false)
            }
            .accessibilityLabel("Share this reel")

            // Accented and visually dominant — this is the action that differentiates Reels.
            Button(action: onAsk) {
                railLabel(systemName: "sparkles", label: "Ask", tint: .white, accent: true)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Ask about this reel")
        }
    }

    private var shareText: String {
        "\(reel.title) — \(reel.caption)\n\nvia BhaktiChat"
    }

    private func railButton(
        systemName: String,
        label: String,
        tint: Color,
        accessibility: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            railLabel(systemName: systemName, label: label, tint: tint, accent: false)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibility)
    }

    private func railLabel(systemName: String, label: String, tint: Color, accent: Bool) -> some View {
        VStack(spacing: 5) {
            ZStack {
                Circle()
                    .fill(accent ? BhaktiTheme.accentPrimary : Color.white.opacity(0.16))
                    .frame(width: 34, height: 34)
                Image(systemName: systemName)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(accent ? .white : tint)
            }
            .shadow(color: accent ? BhaktiTheme.accentPrimary.opacity(0.5) : .clear, radius: 6, x: 0, y: 3)

            Text(label)
                .font(.system(size: 10.5, weight: .bold))
                .foregroundStyle(.white)
        }
    }

    private var scrubber: some View {
#if os(iOS)
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.25))
                Capsule()
                    .fill(Color.white)
                    .frame(width: proxy.size.width * controller.progress)
            }
        }
        .frame(height: 2.5)
#else
        Capsule().fill(Color.white.opacity(0.25)).frame(height: 2.5)
#endif
    }
}

// MARK: - Mini waveform

private struct MiniWaveform: View {
    let isAnimating: Bool

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<3, id: \.self) { index in
                Capsule()
                    .fill(Color.white.opacity(0.9))
                    .frame(width: 2, height: 9)
                    .scaleEffect(y: isAnimating ? 1 : 0.5, anchor: .center)
                    .animation(
                        isAnimating
                        ? .easeInOut(duration: 0.9).repeatForever(autoreverses: true).delay(Double(index) * 0.15)
                        : .default,
                        value: isAnimating
                    )
            }
        }
        .frame(height: 10)
    }
}
