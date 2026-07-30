import SwiftUI

/// The "Explore" tab: featured Divine Image, service rows (Aartis/Choghadiya/Festivals/
/// Panchang), and cosmetic "Coming soon" placeholders. Mirrors Android's `ExploreScreen`
/// in `ui/screens/explore/ExploreScreen.kt` (design_handoff_bhaktichat_ia).
private enum ExploreRoute: Hashable {
    case divineHome
    case divineCreate(templateId: String)
    case divineResult(creationId: String)
}

struct ExploreScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var path: [ExploreRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Button {
                        path.append(.divineHome)
                    } label: {
                        FeaturedDivineImageCard()
                    }
                    .buttonStyle(.plain)

                    Text("Services")
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundStyle(ExplorePalette.textPrimary)

                    NavigationLink {
                        AartisScreen()
                    } label: {
                        ServiceRow(
                            systemImage: "music.note",
                            gradient: ExplorePalette.aartiGradient,
                            title: "Aartis",
                            subtitle: "30+ devotional songs with lyrics & audio"
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        ChoghadiyaScreen()
                    } label: {
                        ServiceRow(
                            systemImage: "sun.max.fill",
                            gradient: ExplorePalette.choghadiyaGradient,
                            title: "Choghadiya",
                            subtitle: "Today's auspicious timings for your city"
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        FestivalsScreen()
                    } label: {
                        ServiceRow(
                            systemImage: "party.popper.fill",
                            gradient: ExplorePalette.festivalGradient,
                            title: "Festivals",
                            subtitle: "Upcoming Hindu festivals & vrat"
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        PanchangScreen()
                    } label: {
                        ServiceRow(
                            systemImage: "calendar",
                            gradient: ExplorePalette.panchangGradient,
                            title: "Panchang",
                            subtitle: "Tithi, nakshatra, sunrise & sunset today"
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        WallpapersScreen()
                    } label: {
                        ServiceRow(
                            systemImage: "photo.on.rectangle.angled",
                            gradient: ExplorePalette.wallpaperGradient,
                            title: "Wallpapers",
                            subtitle: "Deity wallpapers to save & share"
                        )
                    }
                    .buttonStyle(.plain)

                    Text("Coming soon")
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundStyle(ExplorePalette.textPrimary)

                    HStack(spacing: 12) {
                        ComingSoonCard(systemImage: "sparkles", title: "Rashifal", subtitle: "Daily horoscope")
                        ComingSoonCard(systemImage: "square.grid.2x2", title: "Kundli", subtitle: "Birth chart")
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, BhaktiBottomNavBar.overlayClearance + 12)
            }
            .bhaktiPageBackground()
            .bhaktiHideNavigationBar()
            .safeAreaInset(edge: .top, spacing: 0) { topBar }
            .navigationDestination(for: ExploreRoute.self) { route in
                switch route {
                case .divineHome:
                    DivineImageHomeScreen { templateId in
                        path.append(.divineCreate(templateId: templateId))
                    }
                case let .divineCreate(templateId):
                    if let template = DivineTemplateCatalog.byId(templateId) {
                        DivineImageCreateScreen(template: template) { creationId in
                            path.append(.divineResult(creationId: creationId))
                        }
                        .environmentObject(appState)
                    } else {
                        Text("Template not found")
                            .foregroundStyle(BhaktiTheme.textSecondary)
                            .bhaktiPageBackground()
                    }
                case let .divineResult(creationId):
                    DivineImageResultScreen(creationId: creationId)
                }
            }
        }
    }

    // MARK: - Top bar

    private var topBar: some View {
        AppTopBar(
            leftContent: {
                NavigationLink {
                    ProfileScreen()
                } label: {
                    Image(systemName: "person.circle")
                        .font(.system(size: 24, weight: .medium))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Profile")
            },
            centerContent: {
                Text("Explore")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
            },
            rightContent: {
                EmptyView()
            }
        )
        .padding(.horizontal, 16)
        .background(BhaktiTheme.background.opacity(0.96))
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(BhaktiTheme.border.opacity(0.6))
                .frame(height: 0.5)
        }
    }
}

private struct FeaturedDivineImageCard: View {
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            PackageAssetLoader.image(named: "photo_with_god")
                .resizable()
                .scaledToFill()

            LinearGradient(
                stops: [
                    .init(color: .clear, location: 0.25),
                    .init(color: Color.black.opacity(0.82), location: 1)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 4) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color(red: 0xFF / 255, green: 0xE7 / 255, blue: 0xC6 / 255))
                    Text("FEATURED")
                        .font(.system(size: 11, weight: .bold))
                        .tracking(1)
                        .foregroundStyle(Color(red: 0xFF / 255, green: 0xE7 / 255, blue: 0xC6 / 255))
                }
                Text("Divine Image")
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(.white)
                Text("Turn your photo into a sacred darshan")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.white.opacity(0.9))
                Spacer().frame(height: 2)
                HStack(spacing: 4) {
                    Text("Create yours")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(ExplorePalette.deepAccent)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(ExplorePalette.deepAccent)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color.white)
                .clipShape(Capsule())
            }
            .padding(16)
        }
        // Android uses a fixed 190dp here with the same padding/spacing/font sizes, and that
        // exact number was ported verbatim — but SF Pro renders this text stack a bit taller
        // than Android's Roboto at the same point sizes, which was clipping the "Create
        // yours" pill against the card's rounded bottom edge. minHeight keeps the same
        // visual size in the common case while letting it grow if content needs more.
        .frame(minHeight: 190)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
}

private struct ServiceRow: View {
    let systemImage: String
    let gradient: [Color]
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 14)
                .fill(LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 46, height: 46)
                .overlay(
                    Image(systemName: systemImage)
                        .font(.system(size: 19, weight: .semibold))
                        .foregroundStyle(.white)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(ExplorePalette.textPrimary)
                Text(subtitle)
                    .font(.system(size: 12.5))
                    .foregroundStyle(ExplorePalette.textSecondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(ExplorePalette.textMuted)
        }
        .padding(14)
        .background(ExplorePalette.card)
        .overlay(
            RoundedRectangle(cornerRadius: 18).stroke(ExplorePalette.cardBorder, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}

private struct ComingSoonCard: View {
    let systemImage: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: systemImage)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(ExplorePalette.textMuted)
            Text(title)
                .font(.system(size: 14.5, weight: .bold))
                .foregroundStyle(ExplorePalette.textPrimary.opacity(0.7))
            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(ExplorePalette.textMuted)
            Text("Coming soon")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(ExplorePalette.textSecondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(ExplorePalette.textMuted.opacity(0.15))
                .clipShape(Capsule())
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ExplorePalette.card.opacity(0.6))
        .overlay(
            RoundedRectangle(cornerRadius: 18).stroke(ExplorePalette.cardBorder, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}
