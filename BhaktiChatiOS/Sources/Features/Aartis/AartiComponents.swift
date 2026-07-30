import SwiftUI

struct AartiFilter: Identifiable, Hashable {
    let key: String
    let label: String

    var id: String { key }
}

enum AartiFilters {
    static let all: [AartiFilter] = [
        AartiFilter(key: "all", label: "All"),
        AartiFilter(key: "popular", label: "Popular"),
        AartiFilter(key: "morning", label: "Morning"),
        AartiFilter(key: "evening", label: "Evening"),
        AartiFilter(key: "krishna", label: "Lord Krishna"),
        AartiFilter(key: "ganesh", label: "Ganesh Ji"),
        AartiFilter(key: "shiv", label: "Shiv Ji"),
        AartiFilter(key: "devi", label: "Devi"),
        AartiFilter(key: "vrat", label: "Vrat")
    ]
}

struct AartiThumbnailView: View {
    let aarti: Aarti
    var size: CGFloat = 40

    var body: some View {
        ZStack {
            Circle()
                .fill(BhaktiTheme.surfaceElevated)

            thumbnailImage
                .resizable()
                .scaledToFill()
                .frame(width: size, height: size)
                .clipShape(Circle())
        }
        .frame(width: size, height: size)
        .overlay(
            Circle()
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
    }

    private var thumbnailImage: Image {
        // Per-aarti generated artwork takes priority — most named deities (Durga, Kali,
        // Saraswati, etc.) are visually distinct enough that a shared per-deity fallback
        // would be wrong. Deity-level images remain as a fallback for older data.
        if let imageAsset = aarti.imageAsset {
            return PackageAssetLoader.image(named: imageAsset)
        }
        switch aarti.deity {
        case .ganesh:
            return PackageAssetLoader.image(named: "ic_ganesh_top_aarti")
        case .shiv:
            return PackageAssetLoader.image(named: "ic_shiv_top_aarti")
        case .lakshmi:
            return PackageAssetLoader.image(named: "ic_lakshmi_top_aarti")
        case .krishna:
            return PackageAssetLoader.image(named: "avatar_krishna")
        case .hanuman:
            return PackageAssetLoader.image(named: "hanumanji")
        default:
            return Image(systemName: "music.note")
        }
    }
}

struct AartiRowCard: View {
    @EnvironmentObject private var appState: AppState

    let aarti: Aarti
    var highlighted: Bool = false
    var trailingContent: (() -> AnyView)? = nil

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            AartiThumbnailView(aarti: aarti, size: 42)

            VStack(alignment: .leading, spacing: 4) {
                Text(aarti.title)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .lineLimit(1)

                if let subtitle = aarti.subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(BhaktiTheme.textSecondary)
                        .lineLimit(1)
                }

                Text(aartiMetadataLabel(aarti))
                    .font(.caption.weight(.medium))
                    .foregroundStyle(BhaktiTheme.textSecondary.opacity(0.9))
                    .lineLimit(1)
            }

            Spacer(minLength: 12)

            if let trailingContent {
                trailingContent()
            } else if appState.isAartiSaved(aarti.id) {
                Image(systemName: "bookmark.fill")
                    .foregroundStyle(BhaktiTheme.accentWarm)
                    .accessibilityLabel("Saved")
            } else {
                Image(systemName: "chevron.right")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textSecondary.opacity(0.7))
                    .accessibilityHidden(true)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(highlighted ? BhaktiTheme.surfaceElevated.opacity(0.9) : BhaktiTheme.surface.opacity(0.94))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}

struct AartiTileCard: View {
    let aarti: Aarti

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                AartiThumbnailView(aarti: aarti, size: 44)
                Spacer()
                if aarti.isTop {
                    Text("Top")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.accentPrimary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(BhaktiTheme.accentPrimary.opacity(0.12))
                        .clipShape(Capsule())
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(aarti.title)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .lineLimit(2)

                Text(aarti.preview)
                    .font(.caption)
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .lineLimit(3)
            }

            Spacer(minLength: 0)

            Text(aartiMetadataLabel(aarti))
                .font(.caption.weight(.medium))
                .foregroundStyle(BhaktiTheme.textSecondary.opacity(0.85))
                .lineLimit(1)
        }
        .padding(14)
        .frame(width: 220, height: 156, alignment: .topLeading)
        .background(BhaktiTheme.surface.opacity(0.96))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

struct AartiFilterChip: View {
    let filter: AartiFilter
    let isSelected: Bool

    var body: some View {
        Text(filter.label)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(isSelected ? Color.white : BhaktiTheme.textSecondary)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.surface)
            .overlay(
                Capsule()
                    .stroke(isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.border, lineWidth: 1)
            )
            .clipShape(Capsule())
    }
}

func aartiMetadataLabel(_ aarti: Aarti) -> String {
    var labels: [String] = []

    if let durationMinutes = aarti.durationMinutes {
        labels.append("\(durationMinutes) min")
    }

    if aarti.tags.contains(where: { $0.caseInsensitiveCompare("morning") == .orderedSame }) {
        labels.append("Morning")
    } else if aarti.tags.contains(where: { $0.caseInsensitiveCompare("evening") == .orderedSame }) {
        labels.append("Evening")
    }

    if let popularityCount = aarti.popularityCount {
        if popularityCount >= 1000 {
            labels.append("\(popularityCount / 1000)k plays")
        } else if popularityCount > 0 {
            labels.append("\(popularityCount) plays")
        }
    }

    if labels.isEmpty {
        labels.append("Calm daily recitation")
    }

    return labels.joined(separator: " • ")
}
