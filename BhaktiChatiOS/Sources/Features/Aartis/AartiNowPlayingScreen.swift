import SwiftUI

/// Full-screen "now playing" surface, Spotify-style: large artwork, a scrubber with time labels,
/// and previous / play-pause / next transport. Presented over the Aartis screen when the user
/// taps the mini-player. Drives the shared `AartiPlayer`.
struct AartiNowPlayingScreen: View {
    @ObservedObject private var player = AartiPlayer.shared
    @Environment(\.dismiss) private var dismiss

    @State private var scrubValue: Double = 0
    @State private var isScrubbing = false

    var body: some View {
        ZStack {
            backgroundGradient

            VStack(spacing: 0) {
                header

                Spacer(minLength: 12)

                artwork
                    .padding(.horizontal, 32)

                Spacer(minLength: 24)

                VStack(spacing: 6) {
                    Text(player.title.isEmpty ? "Aarti" : player.title)
                        .font(.title2.weight(.bold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                    Text(player.subtitle.isEmpty ? "BhaktiChat Aartis" : player.subtitle)
                        .font(.headline)
                        .foregroundStyle(BhaktiTheme.textSecondary)
                        .lineLimit(1)
                }
                .padding(.horizontal, 32)

                Spacer(minLength: 20)

                scrubber
                    .padding(.horizontal, 28)

                Spacer(minLength: 20)

                controls
                    .padding(.bottom, 40)
            }
        }
        .onAppear { scrubValue = player.progress }
        .onChange(of: player.progress) { newValue in
            if !isScrubbing { scrubValue = newValue }
        }
    }

    private var header: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.down")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Minimize player")

            Spacer()

            VStack(spacing: 2) {
                Text("PLAYING FROM")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textSecondary.opacity(0.8))
                Text("BhaktiChat Aartis")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
            }

            Spacer()

            Color.clear.frame(width: 44, height: 44)
        }
        .padding(.horizontal, 12)
        .padding(.top, 8)
    }

    @ViewBuilder
    private var artwork: some View {
        GeometryReader { geo in
            let side = min(geo.size.width, geo.size.height)
            Group {
                if let aarti = player.currentAarti {
                    AartiArtworkView(aarti: aarti)
                } else {
                    ZStack {
                        BhaktiTheme.surfaceElevated
                        Image(systemName: "music.note")
                            .font(.system(size: 64, weight: .semibold))
                            .foregroundStyle(BhaktiTheme.accentPrimary)
                    }
                }
            }
            .frame(width: side, height: side)
            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(BhaktiTheme.border, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.25), radius: 24, x: 0, y: 12)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .aspectRatio(1, contentMode: .fit)
    }

    private var scrubber: some View {
        VStack(spacing: 6) {
            Slider(value: $scrubValue, in: 0...1) { editing in
                isScrubbing = editing
                if !editing { player.seek(toFraction: scrubValue) }
            }
            .tint(BhaktiTheme.accentPrimary)

            HStack {
                Text(timeString(player.duration > 0 ? scrubValue * player.duration : player.elapsed))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(BhaktiTheme.textSecondary)
                Spacer()
                Text(player.isBuffering ? "Buffering…" : timeString(player.duration))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(BhaktiTheme.textSecondary)
            }
        }
    }

    private var controls: some View {
        HStack(spacing: 44) {
            Button {
                player.previous()
            } label: {
                Image(systemName: "backward.end.fill")
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Previous aarti")

            Button {
                player.togglePlayPause()
            } label: {
                ZStack {
                    Circle()
                        .fill(BhaktiTheme.accentPrimary)
                        .frame(width: 76, height: 76)
                    Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 30, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
            .buttonStyle(.plain)
            .accessibilityLabel(player.isPlaying ? "Pause" : "Play")

            Button {
                player.next()
            } label: {
                Image(systemName: "forward.end.fill")
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Next aarti")
        }
    }

    private var backgroundGradient: some View {
        LinearGradient(
            colors: [
                BhaktiTheme.accentPrimary.opacity(0.22),
                BhaktiTheme.background
            ],
            startPoint: .top,
            endPoint: .center
        )
        .ignoresSafeArea()
        .background(BhaktiTheme.background.ignoresSafeArea())
    }

    private func timeString(_ seconds: Double) -> String {
        guard seconds.isFinite, seconds >= 0 else { return "0:00" }
        let total = Int(seconds)
        return String(format: "%d:%02d", total / 60, total % 60)
    }
}

/// Larger artwork for the full-screen player — reuses the same deity images as the thumbnail.
private struct AartiArtworkView: View {
    let aarti: Aarti

    var body: some View {
        ZStack {
            BhaktiTheme.surfaceElevated
            image
                .resizable()
                .scaledToFill()
        }
    }

    private var image: Image {
        if let imageAsset = aarti.imageAsset {
            return PackageAssetLoader.image(named: imageAsset)
        }
        switch aarti.deity {
        case .ganesh: return PackageAssetLoader.image(named: "ic_ganesh_top_aarti")
        case .shiv: return PackageAssetLoader.image(named: "ic_shiv_top_aarti")
        case .lakshmi: return PackageAssetLoader.image(named: "ic_lakshmi_top_aarti")
        case .krishna: return PackageAssetLoader.image(named: "avatar_krishna")
        case .hanuman: return PackageAssetLoader.image(named: "hanumanji")
        default: return Image(systemName: "music.note")
        }
    }
}
