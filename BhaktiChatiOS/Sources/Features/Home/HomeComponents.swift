import SwiftUI

/// 6-bar equaliser for the Home aarti card. Animates only while audio is actually playing,
/// and holds a static shape when paused or when Reduce Motion is on.
struct AartiWaveform: View {
    let isPlaying: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let restingHeights: [CGFloat] = [5, 12, 8, 11, 6, 9]

    private var animates: Bool { isPlaying && !reduceMotion }

    var body: some View {
        HStack(alignment: .bottom, spacing: 3) {
            ForEach(Array(restingHeights.enumerated()), id: \.offset) { index, height in
                Capsule()
                    .fill(isPlaying ? BhaktiTheme.accentPrimary : Color.white.opacity(0.3))
                    .frame(width: 3, height: height)
                    .scaleEffect(y: animates ? 1 : 0.55, anchor: .bottom)
                    .animation(
                        animates
                        ? .easeInOut(duration: 1.1)
                            .repeatForever(autoreverses: true)
                            .delay(Double(index) * 0.15)
                        : .easeOut(duration: 0.2),
                        value: animates
                    )
            }
        }
        .frame(height: 12, alignment: .bottom)
    }
}

/// Poster card in Home's horizontal Reels shelf.
struct ReelShelfCard: View {
    let reel: Reel
    /// The lead card gets a slow Ken Burns push so the shelf reads as motion-capable content.
    let animateZoom: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var zoomedIn = false

    private var zooms: Bool { animateZoom && !reduceMotion }

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            poster
                .frame(width: 126, height: 196)
                .clipped()

            LinearGradient(
                stops: [
                    .init(color: .clear, location: 0.45),
                    .init(color: Color.black.opacity(0.82), location: 1)
                ],
                startPoint: .top, endPoint: .bottom
            )

            // Duration chip, top-right.
            VStack {
                HStack {
                    Spacer()
                    Text(reel.durationLabel)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Color.black.opacity(0.5))
                        .clipShape(Capsule())
                }
                Spacer()
            }
            .padding(8)

            Image(systemName: "play.fill")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 30, height: 30)
                .background(Color.white.opacity(0.22))
                .clipShape(Circle())
                .frame(width: 126, height: 196, alignment: .center)

            VStack(alignment: .leading, spacing: 1) {
                Text(reel.title)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                Text(reel.creatorName)
                    .font(.system(size: 9.5))
                    .foregroundStyle(Color.white.opacity(0.75))
                    .lineLimit(1)
            }
            .padding(10)
        }
        .frame(width: 126, height: 196)
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    @ViewBuilder
    private var poster: some View {
        if let asset = reel.posterAsset {
            PackageAssetLoader.image(named: asset)
                .resizable()
                .scaledToFill()
                .scaleEffect(zooms && zoomedIn ? 1.13 : 1.03)
                .animation(
                    zooms
                    ? .easeInOut(duration: 10).repeatForever(autoreverses: true)
                    : nil,
                    value: zoomedIn
                )
                .onAppear { if zooms { zoomedIn = true } }
        } else {
            Color.black
        }
    }
}

/// Destination for Home's streak pill. All values come from `StreakStore` — no new persistence.
struct DailyDarshanSheet: View {
    @EnvironmentObject private var streaks: StreakStore
    @Environment(\.dismiss) private var dismiss

    @ObservedObject private var aartiPlayer = AartiPlayer.shared

    private var weekdaySymbols: [String] {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEEE"
        let calendar = Calendar.current
        return (0..<7).compactMap { offset in
            calendar.date(byAdding: .day, value: offset - 6, to: Date())
                .map { formatter.string(from: $0) }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            header
            weekRow
            longestStreakRow
            Spacer(minLength: 0)
            cta
        }
        .padding(20)
        .padding(.top, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BhaktiTheme.background)
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text("DAILY DARSHAN")
                    .font(.system(size: 10.5, weight: .heavy))
                    .tracking(1)
                    .foregroundStyle(BhaktiTheme.accentDeep)

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text("\(streaks.currentStreak)")
                        .font(.system(size: 40, weight: .heavy))
                        .foregroundStyle(BhaktiTheme.accentDeep)
                    Text("day streak")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(BhaktiTheme.headingWarm)
                }
            }

            Spacer()

            Image(systemName: "flame.fill")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(BhaktiTheme.accentPrimary)
                .frame(width: 62, height: 62)
                .background(BhaktiTheme.accentPrimary.opacity(0.14))
                .clipShape(Circle())
        }
    }

    /// Trailing 7 days. `StreakStore` exposes only the current run length, so the earned marks
    /// are derived from it rather than from per-day records.
    private var weekRow: some View {
        HStack(spacing: 8) {
            ForEach(Array(weekdaySymbols.enumerated()), id: \.offset) { index, symbol in
                let daysAgo = 6 - index
                let earned = daysAgo < streaks.currentStreak
                let isToday = daysAgo == 0

                VStack(spacing: 6) {
                    Circle()
                        .fill(earned ? BhaktiTheme.accentPrimary : Color(red: 0xFC / 255, green: 0xE7 / 255, blue: 0xD3 / 255))
                        .frame(width: 34, height: 34)
                        .overlay {
                            if earned {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                        }
                    Text(symbol)
                        .font(.system(size: 10.5, weight: isToday ? .bold : .regular))
                        .foregroundStyle(isToday ? BhaktiTheme.accentDeep : BhaktiTheme.textSecondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var longestStreakRow: some View {
        HStack {
            Text("Longest streak")
                .font(.system(size: 13.5, weight: .medium))
                .foregroundStyle(BhaktiTheme.headingWarm)
            Spacer()
            Text("\(streaks.longestStreak) days")
                .font(.system(size: 20, weight: .heavy))
                .foregroundStyle(BhaktiTheme.accentDeep)
        }
        .padding(14)
        .background(Color(red: 0xFF / 255, green: 0xF6 / 255, blue: 0xEC / 255))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var cta: some View {
        VStack(spacing: 8) {
            Button {
                playTodaysAarti()
                dismiss()
            } label: {
                Text("Do today's darshan")
                    .font(.system(size: 14.5, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(BhaktiTheme.accentGradient)
                    .clipShape(Capsule())
            }
            .buttonStyle(BhaktiPressEffect())

            Text("Play today's aarti or ask your guide — either keeps the streak")
                .font(.system(size: 11.5))
                .foregroundStyle(BhaktiTheme.textSecondary)
                .multilineTextAlignment(.center)
        }
    }

    /// The CTA has to actually earn today's mark, so it starts playback *and* records the visit.
    private func playTodaysAarti() {
        streaks.recordVisit()
        guard let all = try? AartiRepository.loadAartis() else { return }
        let playable = all.filter(\.hasAudio)
        guard !playable.isEmpty else { return }
        let start = playable.first(where: \.isTop) ?? playable[0]
        aartiPlayer.playQueue(playable, startId: start.id)
    }
}
