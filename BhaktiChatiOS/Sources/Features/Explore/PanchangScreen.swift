import SwiftUI

/// Static Panchang (Hindu almanac) snapshot: Tithi, Nakshatra, sunrise/sunset, etc.
/// Mirrors Android's `PanchangScreen.kt` exactly (static content, no API on either platform).
struct PanchangScreen: View {
    private let rows: [(label: String, value: String)] = [
        ("Tithi", "Shukla Dwitiya"),
        ("Nakshatra", "Pushya"),
        ("Vaar", "Shanivaar (Saturday)"),
        ("Yoga", "Siddhi"),
        ("Karana", "Balava"),
        ("Rahu Kaal", "9:00 – 10:30 AM")
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Saturday, 5 July · Mumbai")
                    .font(.system(size: 14))
                    .foregroundStyle(ExplorePalette.textSecondary)

                HStack(spacing: 12) {
                    statTile(systemImage: "sun.max.fill", label: "Sunrise", value: "6:04 AM",
                              gradient: ExplorePalette.panchangGradient)
                    statTile(systemImage: "sun.haze.fill", label: "Sunset", value: "7:15 PM",
                              gradient: ExplorePalette.festivalGradient)
                }

                VStack(spacing: 0) {
                    ForEach(Array(rows.enumerated()), id: \.offset) { index, row in
                        HStack {
                            Text(row.label)
                                .font(.system(size: 14))
                                .foregroundStyle(ExplorePalette.textSecondary)
                            Spacer()
                            Text(row.value)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(ExplorePalette.textPrimary)
                        }
                        .padding(.vertical, 12)
                        if index < rows.count - 1 {
                            Divider().background(ExplorePalette.cardBorder)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .background(ExplorePalette.card)
                .overlay(
                    RoundedRectangle(cornerRadius: 18).stroke(ExplorePalette.cardBorder, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 18))
            }
            .padding(.horizontal, 16)
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance + 12)
        }
        .bhaktiPageBackground()
        .navigationTitle("Panchang")
        .bhaktiInlineNavigationTitle()
    }

    private func statTile(systemImage: String, label: String, value: String, gradient: [Color]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: systemImage)
                .font(.system(size: 19, weight: .semibold))
                .foregroundStyle(.white)
            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(Color.white.opacity(0.9))
            Text(value)
                .font(.system(size: 17, weight: .heavy))
                .foregroundStyle(.white)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 96, alignment: .topLeading)
        .background(LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing))
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}
