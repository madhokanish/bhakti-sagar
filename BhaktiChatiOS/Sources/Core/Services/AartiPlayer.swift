import AVFoundation
import Combine
import Foundation
import MediaPlayer

/// App-scoped continuous aarti player — the iOS counterpart of Android's Media3 `AartiPlaybackService`.
///
/// `AVQueuePlayer` auto-advances through its items, which gives the "one aarti after another"
/// continuous playback for free. Background playback, the lock-screen transport controls, and the
/// now-playing metadata come from `AVAudioSession(.playback)` + `MPNowPlayingInfoCenter` +
/// `MPRemoteCommandCenter`. A singleton so playback + the mini-player survive navigation, exactly
/// like the app-scoped controller on Android.
@MainActor
final class AartiPlayer: ObservableObject {
    static let shared = AartiPlayer()

    @Published private(set) var currentAartiId: String?
    @Published private(set) var currentAarti: Aarti?
    @Published private(set) var title: String = ""
    @Published private(set) var subtitle: String = ""
    @Published private(set) var isPlaying: Bool = false
    @Published private(set) var isBuffering: Bool = false
    @Published private(set) var hasQueue: Bool = false
    @Published private(set) var progress: Double = 0  // 0...1 for the mini-player bar
    @Published private(set) var elapsed: Double = 0   // seconds
    @Published private(set) var duration: Double = 0  // seconds

    private let player = AVQueuePlayer()
    private var itemToAarti: [ObjectIdentifier: Aarti] = [:]
    /// The slice currently loaded (from the tapped aarti to the end of the list), kept so a
    /// tap-to-play after the queue naturally ends can restart the last track (matches Android).
    private var queueAartis: [Aarti] = []

    private var timeObserver: Any?
    private var currentItemObserver: NSKeyValueObservation?
    private var rateObserver: NSKeyValueObservation?
    private var statusObserver: NSKeyValueObservation?
    private var didConfigureCommands = false

    private init() {}

    // MARK: - Public API

    /// Plays the audio-having aartis as a queue, starting at `startId` (or the first one) and
    /// running to the end of the list — the same "play from here onward" behaviour as Android.
    func playQueue(_ aartis: [Aarti], startId: String?) {
        let playable = aartis.filter { $0.hasAudio }
        guard !playable.isEmpty else { return }
        let startIndex = startId.flatMap { id in playable.firstIndex { $0.id == id } } ?? 0
        let slice = Array(playable[startIndex...])

        configureSessionAndCommands()

        player.removeAllItems()
        itemToAarti.removeAll()
        queueAartis = slice

        for aarti in slice {
            guard let url = aarti.audioUrl.flatMap({ URL(string: $0) }) else { continue }
            let item = AVPlayerItem(url: url)
            itemToAarti[ObjectIdentifier(item)] = aarti
            if player.canInsert(item, after: nil) {
                player.insert(item, after: nil)
            }
        }

        hasQueue = !player.items().isEmpty
        observePlayer()
        player.play()
        isPlaying = true
        handleCurrentItemChange()
    }

    func togglePlayPause() {
        if player.currentItem == nil {
            // Queue ran to the end — restart from the last track the user was on (like Android).
            playQueue(queueAartis, startId: currentAartiId)
            return
        }
        if player.rate != 0 {
            player.pause()
            isPlaying = false
        } else {
            player.play()
            isPlaying = true
        }
        updateNowPlaying()
    }

    func next() {
        player.advanceToNextItem()
        handleCurrentItemChange()
    }

    /// Previous, Spotify-style: restart the current track if we're >3s in, otherwise jump to the
    /// previous track (rebuilding the queue from there, since AVQueuePlayer consumes played items).
    func previous() {
        let cur = player.currentItem?.currentTime().seconds ?? 0
        if cur > 3 {
            player.seek(to: .zero)
            updateProgress()
            return
        }
        if let id = currentAartiId,
           let idx = queueAartis.firstIndex(where: { $0.id == id }), idx > 0 {
            playQueue(queueAartis, startId: queueAartis[idx - 1].id)
        } else {
            player.seek(to: .zero)
            updateProgress()
        }
    }

    func seek(toFraction fraction: Double) {
        guard let item = player.currentItem else { return }
        let dur = item.duration.seconds
        guard dur.isFinite, dur > 0 else { return }
        let target = CMTime(seconds: max(0, min(1, fraction)) * dur, preferredTimescale: 600)
        player.seek(to: target) { [weak self] _ in
            Task { @MainActor in self?.updateProgress() }
        }
    }

    func stop() {
        player.pause()
        player.removeAllItems()
        itemToAarti.removeAll()
        queueAartis = []
        currentAartiId = nil
        title = ""
        subtitle = ""
        isPlaying = false
        isBuffering = false
        hasQueue = false
        progress = 0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        #if os(iOS)
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
        #endif
    }

    // MARK: - Setup

    private func configureSessionAndCommands() {
        #if os(iOS)
        let session = AVAudioSession.sharedInstance()
        // Primary music-style playback (no ducking) so it behaves like a real player.
        try? session.setCategory(.playback, mode: .default, options: [])
        try? session.setActive(true, options: [])
        #endif

        guard !didConfigureCommands else { return }
        didConfigureCommands = true

        let center = MPRemoteCommandCenter.shared()
        center.playCommand.addTarget { [weak self] _ in
            self?.player.play(); self?.isPlaying = true; self?.updateNowPlaying(); return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            self?.player.pause(); self?.isPlaying = false; self?.updateNowPlaying(); return .success
        }
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.togglePlayPause(); return .success
        }
        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.next(); return .success
        }
        center.nextTrackCommand.isEnabled = true
        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.previous(); return .success
        }
        center.previousTrackCommand.isEnabled = true

        #if os(iOS)
        // Auto-pause on a phone call / Siri, resume when the interruption ends (Spotify-style).
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance()
        )
        #endif
    }

    private func observePlayer() {
        currentItemObserver = player.observe(\.currentItem, options: [.new]) { [weak self] _, _ in
            Task { @MainActor in self?.handleCurrentItemChange() }
        }
        rateObserver = player.observe(\.rate, options: [.new]) { [weak self] p, _ in
            Task { @MainActor in
                guard let self else { return }
                self.isPlaying = p.rate != 0
                self.updateNowPlaying()
            }
        }
        statusObserver = player.observe(\.timeControlStatus, options: [.new]) { [weak self] p, _ in
            Task { @MainActor in self?.isBuffering = p.timeControlStatus == .waitingToPlayAtSpecifiedRate }
        }

        if timeObserver == nil {
            timeObserver = player.addPeriodicTimeObserver(
                forInterval: CMTime(seconds: 0.5, preferredTimescale: 600),
                queue: .main
            ) { [weak self] _ in
                Task { @MainActor in self?.updateProgress() }
            }
        }
    }

    // MARK: - State plumbing

    private func handleCurrentItemChange() {
        guard let item = player.currentItem, let aarti = itemToAarti[ObjectIdentifier(item)] else {
            // Queue reached the end. Keep the bar visible (paused) so the user can replay.
            isPlaying = false
            progress = 0
            updateNowPlaying()
            return
        }
        currentAartiId = aarti.id
        currentAarti = aarti
        title = aarti.title
        subtitle = aarti.subtitle ?? "Aarti"
        hasQueue = true
        updateProgress()
        updateNowPlaying()
    }

    private func updateProgress() {
        guard let item = player.currentItem else { progress = 0; elapsed = 0; return }
        let dur = item.duration.seconds
        let cur = item.currentTime().seconds
        if cur.isFinite { elapsed = cur }
        if dur.isFinite, dur > 0 {
            duration = dur
            if cur.isFinite { progress = min(max(cur / dur, 0), 1) }
        }
        updateNowPlaying()
    }

    private func updateNowPlaying() {
        guard currentAartiId != nil else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            return
        }
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: subtitle.isEmpty ? "BhaktiChat" : subtitle,
            MPMediaItemPropertyAlbumTitle: "BhaktiChat Aartis"
        ]
        if let item = player.currentItem {
            let dur = item.duration.seconds
            if dur.isFinite, dur > 0 { info[MPMediaItemPropertyPlaybackDuration] = dur }
            let cur = item.currentTime().seconds
            if cur.isFinite { info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = cur }
        }
        info[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    #if os(iOS)
    @objc private func handleInterruption(_ note: Notification) {
        guard
            let info = note.userInfo,
            let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else { return }

        Task { @MainActor in
            switch type {
            case .began:
                player.pause()
                isPlaying = false
                updateNowPlaying()
            case .ended:
                let shouldResume = (info[AVAudioSessionInterruptionOptionKey] as? UInt)
                    .map { AVAudioSession.InterruptionOptions(rawValue: $0).contains(.shouldResume) } ?? false
                if shouldResume, player.currentItem != nil {
                    try? AVAudioSession.sharedInstance().setActive(true, options: [])
                    player.play()
                    isPlaying = true
                    updateNowPlaying()
                }
            @unknown default:
                break
            }
        }
    }
    #endif
}
