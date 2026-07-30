#if os(iOS)
import AVFoundation
import SwiftUI
import UIKit

/// Owns one looping `AVPlayer` for a single reel page.
///
/// Muted by default — audio is only ever claimed on an explicit unmute tap, and claiming it
/// pauses `AartiPlayer` so two surfaces never make sound at once (see `ReelsAudioCoordinator`).
@MainActor
final class ReelVideoController: ObservableObject {
    @Published private(set) var isReady = false
    @Published private(set) var failed = false
    @Published private(set) var progress: Double = 0

    let player = AVQueuePlayer()

    private var looper: AVPlayerLooper?
    private var timeObserver: Any?
    private var statusObservation: NSKeyValueObservation?

    init() {
        player.isMuted = true
        player.actionAtItemEnd = .advance
    }

    deinit {
        if let timeObserver {
            player.removeTimeObserver(timeObserver)
        }
        statusObservation?.invalidate()
    }

    func load(urlString: String?) {
        guard looper == nil, let urlString, let url = URL(string: urlString) else {
            if urlString == nil { failed = true }
            return
        }

        let item = AVPlayerItem(url: url)
        looper = AVPlayerLooper(player: player, templateItem: item)

        // Observe the player's *current* item, not the template: AVPlayerLooper never plays
        // the template itself, it plays copies of it, so the template's status stays .unknown
        // forever.
        statusObservation = player.observe(\.currentItem?.status, options: [.new, .initial]) { [weak self] player, _ in
            Task { @MainActor in
                switch player.currentItem?.status {
                case .readyToPlay: self?.isReady = true
                case .failed:      self?.failed = true
                default:           break
                }
            }
        }

        timeObserver = player.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.2, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            guard let self else { return }
            let duration = self.player.currentItem?.duration.seconds ?? 0
            guard duration.isFinite, duration > 0 else { return }
            Task { @MainActor in
                self.progress = min(max(time.seconds / duration, 0), 1)
            }
        }
    }

    func play()  { player.play() }
    func pause() { player.pause() }

    func setMuted(_ muted: Bool) {
        player.isMuted = muted
        if !muted { ReelsAudioCoordinator.reelsDidClaimAudio() }
    }
}

/// Single owner of "who is allowed to make sound". Reels and the aarti player are the two
/// audio-adjacent surfaces; whichever claims audio silences the other.
enum ReelsAudioCoordinator {
    @MainActor
    static func reelsDidClaimAudio() {
        if AartiPlayer.shared.isPlaying {
            AartiPlayer.shared.togglePlayPause()
        }
    }
}

/// Thin `AVPlayerLayer` host — `VideoPlayer` would draw its own controls, which a full-bleed
/// feed must not show.
struct ReelVideoView: UIViewRepresentable {
    let player: AVPlayer

    func makeUIView(context: Context) -> PlayerLayerView {
        let view = PlayerLayerView()
        view.playerLayer.player = player
        view.playerLayer.videoGravity = .resizeAspectFill
        // Transparent, not black: with no opacity gating the layer simply renders nothing
        // until the first frame arrives, so the poster behind it shows through and is then
        // covered by live video. A black background here would hide the poster instead.
        view.backgroundColor = .clear
        // This is a pure video-rendering surface — it never needs to receive touches itself.
        // Left enabled, this raw UIView (unlike an ordinary SwiftUI view) sat in the hosting
        // hierarchy as a genuine UIKit hit-test target, which took priority over every SwiftUI
        // overlay layered visually on top of it (the feed switcher, and even the persistent
        // tab bar) — any tap anywhere on the page was captured here first, no matter how the
        // rest of the view tree was arranged above it.
        view.isUserInteractionEnabled = false
        return view
    }

    func updateUIView(_ uiView: PlayerLayerView, context: Context) {
        if uiView.playerLayer.player !== player {
            uiView.playerLayer.player = player
        }
    }

    final class PlayerLayerView: UIView {
        override class var layerClass: AnyClass { AVPlayerLayer.self }
        var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
    }
}
#endif
