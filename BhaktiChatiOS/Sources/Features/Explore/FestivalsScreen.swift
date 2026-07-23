import SwiftUI

/// Static list of upcoming Hindu festivals & vrat. Mirrors Android's `FestivalsScreen.kt`
/// exactly (same static content — not backed by an API on either platform).
struct FestivalsScreen: View {
    private struct Festival {
        let day: String
        let month: String
        let name: String
        let subtitle: String
        let gradient: [Color]
    }

    private let festivals: [Festival] = [
        Festival(day: "16", month: "AUG", name: "Hariyali Teej",
                  subtitle: "Monsoon festival honouring Goddess Parvati",
                  gradient: [Color(red: 0x6E / 255, green: 0xE7 / 255, blue: 0xB7 / 255),
                             Color(red: 0x05 / 255, green: 0x96 / 255, blue: 0x69 / 255)]),
        Festival(day: "18", month: "AUG", name: "Nag Panchami",
                  subtitle: "Worship of the serpent deities",
                  gradient: ExplorePalette.festivalGradient),
        Festival(day: "28", month: "AUG", name: "Raksha Bandhan",
                  subtitle: "The sacred bond between siblings",
                  gradient: ExplorePalette.aartiGradient),
        Festival(day: "04", month: "SEP", name: "Krishna Janmashtami",
                  subtitle: "Birth of Lord Krishna",
                  gradient: [Color(red: 0xFD / 255, green: 0xBA / 255, blue: 0x74 / 255),
                             Color(red: 0xEA / 255, green: 0x58 / 255, blue: 0x0C / 255)])
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text("Upcoming Hindu festivals & vrat")
                    .font(.system(size: 14))
                    .foregroundStyle(ExplorePalette.textSecondary)

                ForEach(Array(festivals.enumerated()), id: \.offset) { _, festival in
                    festivalCard(festival)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance + 12)
        }
        .bhaktiPageBackground()
        .navigationTitle("Festivals")
        .bhaktiInlineNavigationTitle()
    }

    private func festivalCard(_ festival: Festival) -> some View {
        HStack(spacing: 14) {
            VStack(spacing: 0) {
                Text(festival.day)
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(.white)
                Text(festival.month)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(Color.white.opacity(0.9))
            }
            .frame(width: 52, height: 52)
            .background(
                LinearGradient(colors: festival.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 2) {
                Text(festival.name)
                    .font(.system(size: 15.5, weight: .bold))
                    .foregroundStyle(ExplorePalette.textPrimary)
                Text(festival.subtitle)
                    .font(.system(size: 12.5))
                    .foregroundStyle(ExplorePalette.textSecondary)
            }

            Spacer()
        }
        .padding(14)
        .background(ExplorePalette.card)
        .overlay(
            RoundedRectangle(cornerRadius: 18).stroke(ExplorePalette.cardBorder, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}
