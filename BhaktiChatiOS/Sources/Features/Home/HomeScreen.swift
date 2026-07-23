import SwiftUI

private enum HomeRoute: Hashable {
    case profile
    case guidePicker
    case aartis
    case choghadiya
}

struct HomeScreen: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var streaks: StreakStore
    @State private var path: [HomeRoute] = []
    @State private var showDivineImage = false

    private let situationColumns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if streaks.currentStreak > 0 && !streaks.isBannerDismissedToday {
                        DarshanStreakHeroCard(
                            streak: streaks.currentStreak,
                            longestStreak: streaks.longestStreak,
                            onDismiss: { streaks.dismissBannerForToday() }
                        )
                    }

                    ShellSectionHeader(
                        title: "Guides",
                        actionLabel: "See all",
                        onActionTap: { path.append(.guidePicker) }
                    )

                    guidesRow

                    ShellSectionHeader(title: "Life Situations")

                    situationsGrid

                    todayWidget

                    createDarshanPromoCard
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, BhaktiBottomNavBar.overlayClearance)
            }
            .bhaktiPageBackground()
            .bhaktiHideNavigationBar()
            .safeAreaInset(edge: .top, spacing: 0) { topBar }
            .navigationDestination(for: HomeRoute.self) { route in
                switch route {
                case .profile:
                    ProfileScreen()
                case .guidePicker:
                    GuidePickerScreen()
                case .aartis:
                    AartisScreen()
                case .choghadiya:
                    ChoghadiyaScreen()
                }
            }
        }
        #if os(iOS)
        .fullScreenCover(isPresented: $showDivineImage) {
            DivineImageHomeScreen()
        }
        #else
        .sheet(isPresented: $showDivineImage) {
            DivineImageHomeScreen()
        }
        #endif
    }

    private var topBar: some View {
        AppTopBar(
            leftContent: {
                Button {
                    path.append(.profile)
                } label: {
                    Image(systemName: "person.circle")
                        .font(.system(size: 24, weight: .medium))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                }
                .buttonStyle(.plain)
            },
            centerContent: {
                Text("Home")
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

    // MARK: - Today widget + Create Darshan promo
    // Mirrors Android's live Home (DiscoveryScreen.kt) — replaced the old
    // Explore tile row once the dedicated Explore tab existed.

    private var todayWidget: some View {
        VStack(spacing: 0) {
            todayRow(
                systemImage: "sun.max.fill",
                iconTint: Color(red: 0xD9 / 255, green: 0x77 / 255, blue: 0x06 / 255),
                title: "Best Muhurat now",
                value: "Amrit · 10:30 AM – 12:00 PM",
                action: { path.append(.choghadiya) }
            )
            Divider().background(ExplorePalette.cardBorder)
            todayRow(
                systemImage: "music.note",
                iconTint: Color(red: 0xDC / 255, green: 0x26 / 255, blue: 0x26 / 255),
                title: "Aarti of the day",
                value: "Om Jai Jagdish Hare",
                action: { path.append(.aartis) }
            )
        }
        .background(ExplorePalette.card)
        .overlay(
            RoundedRectangle(cornerRadius: 18).stroke(ExplorePalette.cardBorder, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private func todayRow(
        systemImage: String,
        iconTint: Color,
        title: String,
        value: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 11)
                    .fill(iconTint.opacity(0.14))
                    .frame(width: 38, height: 38)
                    .overlay(
                        Image(systemName: systemImage)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(iconTint)
                    )

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 13.5, weight: .semibold))
                        .foregroundStyle(ExplorePalette.textPrimary)
                    Text(value)
                        .font(.system(size: 12.5))
                        .foregroundStyle(ExplorePalette.textSecondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(ExplorePalette.textMuted)
            }
            .padding(14)
        }
        .buttonStyle(.plain)
    }

    private var createDarshanPromoCard: some View {
        Button {
            showDivineImage = true
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 5) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color(red: 0xFF / 255, green: 0xE7 / 255, blue: 0xC6 / 255))
                    Text("DIVINE IMAGE")
                        .font(.system(size: 11, weight: .bold))
                        .tracking(1)
                        .foregroundStyle(Color(red: 0xFF / 255, green: 0xE7 / 255, blue: 0xC6 / 255))
                }
                Text("Create your darshan")
                    .font(.system(size: 19, weight: .heavy))
                    .foregroundStyle(.white)
                Text("Turn your photo into a sacred moment with your deity.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.white.opacity(0.9))
                Spacer().frame(height: 4)
                HStack(spacing: 4) {
                    Text("Try it now")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(ExplorePalette.deepAccent)
                    Image(systemName: "arrow.right")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(ExplorePalette.deepAccent)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color.white)
                .clipShape(Capsule())
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [
                        Color(red: 0x7C / 255, green: 0x2D / 255, blue: 0x12 / 255),
                        Color(red: 0xC2 / 255, green: 0x41 / 255, blue: 0x0C / 255),
                        Color(red: 0xEA / 255, green: 0x58 / 255, blue: 0x0C / 255)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 22))
        }
        .buttonStyle(.plain)
    }

    private var guidesRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(DiscoveryCatalog.guides) { guide in
                    Button {
                        Task {
                            _ = await appState.startThread(for: guide.id, includeOpeningScene: true)
                            appState.selectedTab = .bhaktiChat
                        }
                    } label: {
                        GuideAvatarItemView(
                            title: guide.title,
                            imageAssetName: guide.imageAssetName,
                            isSelected: appState.selectedGuideId == guide.id
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 2)
            .padding(.trailing, 16)
        }
    }

    private var situationsGrid: some View {
        LazyVGrid(columns: situationColumns, spacing: 12) {
            ForEach(DiscoveryCatalog.situations) { situation in
                Button {
                    Task {
                        _ = await appState.startThread(
                            for: situation.defaultGuideId,
                            includeOpeningScene: false,
                            initialPrompt: situation.prompt
                        )
                        appState.selectedTab = .bhaktiChat
                    }
                } label: {
                    SituationCardView(
                        title: situation.title,
                        subtitle: GuidesCatalog.byId(situation.defaultGuideId).map { "Ask \($0.displayName)" } ?? "",
                        iconSystemName: situation.iconSystemName,
                        accentColor: Self.accentColor(forSituation: situation.id),
                        guideAvatarAssetName: GuidesCatalog.byId(situation.defaultGuideId)?.avatarAssetName
                    )
                }
                .buttonStyle(BhaktiPressEffect())
            }
        }
    }

    /// Maps each life-situation id to a curated, brand-warm accent color so
    /// the grid reads as a set of distinct emotional categories rather than
    /// a wall of identical orange tiles. Colors are intentionally muted so
    /// they harmonize with the rest of the saffron / cream palette.
    private static func accentColor(forSituation id: String) -> Color {
        switch id {
        case "money_stress":        return Color(red: 0.34, green: 0.62, blue: 0.46)  // emerald
        case "bad_luck":            return Color(red: 0.40, green: 0.45, blue: 0.62)  // slate-indigo
        case "anxiety":             return Color(red: 0.39, green: 0.58, blue: 0.78)  // calm blue
        case "fear":                return Color(red: 0.55, green: 0.42, blue: 0.69)  // courage violet
        case "relationship_issues": return Color(red: 0.82, green: 0.45, blue: 0.55)  // rose
        case "career_confusion":    return Color(red: 0.83, green: 0.58, blue: 0.27)  // amber
        case "exams":               return BhaktiTheme.accentPrimary                  // brand orange
        case "discipline":          return Color(red: 0.46, green: 0.42, blue: 0.40)  // stone
        default:                    return BhaktiTheme.accentPrimary
        }
    }

}
