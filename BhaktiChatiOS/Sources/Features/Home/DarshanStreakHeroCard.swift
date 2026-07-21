import SwiftUI

/// Big hero streak card shown on Home when `streak > 0`. Mirrors Android's
/// `DarshanStreakHeroCard` in `DiscoveryScreen.kt` (design "2a" / daily-darshan streak row).
struct DarshanStreakHeroCard: View {
    let streak: Int
    let longestStreak: Int

    private static let deepAccent = Color(red: 0xC2 / 255, green: 0x41 / 255, blue: 0x0C / 255)
    private static let numberColor = Color(red: 0xEA / 255, green: 0x58 / 255, blue: 0x0C / 255)
    private static let labelColor = Color(red: 0xB4 / 255, green: 0x53 / 255, blue: 0x09 / 255)
    private static let subtitleColor = Color(red: 0x7C / 255, green: 0x3E / 255, blue: 0x12 / 255)
    private static let longestColor = Color(red: 0x92 / 255, green: 0x40 / 255, blue: 0x0E / 255)
    private static let emblemGradient = LinearGradient(
        colors: [
            Color(red: 0xFF / 255, green: 0xE7 / 255, blue: 0xC6 / 255),
            Color(red: 0xFB / 255, green: 0xBF / 255, blue: 0x7A / 255)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    private enum DayState {
        case off, lit, today
    }

    /// 7 slots, filled from the start: lit dots accumulate left→right as the streak grows,
    /// with today as the last lit dot and empty slots trailing to the right. (Previously
    /// filled from the end, which read as "streak trailing off" rather than "streak building
    /// up" — unintuitive per product review.)
    private var weekStates: [DayState] {
        let litCount = min(max(streak, 0), 7)
        return (0..<7).map { index in
            if index == litCount - 1 { return .today }
            return index < litCount - 1 ? .lit : .off
        }
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            VStack(alignment: .leading, spacing: 12) {
                Text("DAILY DARSHAN")
                    .font(.system(size: 12, weight: .bold))
                    .tracking(1)
                    .foregroundStyle(Self.labelColor)

                HStack(alignment: .lastTextBaseline, spacing: 8) {
                    Text("\(streak)")
                        .font(.system(size: 42, weight: .heavy))
                        .foregroundStyle(Self.numberColor)
                    Text("day darshan streak")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(Self.subtitleColor)
                        .padding(.bottom, 7)
                }

                HStack(spacing: 8) {
                    ForEach(Array(weekStates.enumerated()), id: \.offset) { _, state in
                        heroDot(state)
                    }
                }

                Text("Longest streak · \(longestStreak) days")
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(Self.longestColor)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)

            Circle()
                .fill(Color.white.opacity(0.4))
                .frame(width: 56, height: 56)
                .overlay(
                    Image(systemName: "flame.fill")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(Self.deepAccent)
                )
                .padding(18)
        }
        .background(Self.emblemGradient)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }

    @ViewBuilder
    private func heroDot(_ state: DayState) -> some View {
        let lit = state != .off
        Circle()
            .fill(lit ? Self.numberColor : Color.white.opacity(0.55))
            .overlay(
                Circle().stroke(Color.white.opacity(lit ? 0 : 0.25), lineWidth: lit ? 0 : 1)
            )
            .frame(width: 24, height: 24)
    }
}
