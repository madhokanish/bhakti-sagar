import SwiftUI

private enum HomeRoute: Hashable {
    case profile
    case guidePicker
    case aartis
    case choghadiya
    case wallpapers
    case divineHome
    case divineCreate(templateId: String)
    case divineResult(creationId: String)
}

struct HomeScreen: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var streaks: StreakStore
    @State private var path: [HomeRoute] = []
    @ObservedObject private var aartiPlayer = AartiPlayer.shared
    @State private var choghadiyaSlots: [ChoghadiyaSlot] = []
    @State private var showDarshanSheet = false

    private let situationColumns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    greetingHeader

                    sectionHeader(title: "Your guides", action: "See all") {
                        path.append(.guidePicker)
                    }

                    guidesRow

                    sectionHeader(title: "Life Situations", action: nil, onAction: nil)

                    situationsGrid

                    reelsShelf

                    aartiSpotlightCard

                    divineImageCard

                    choghadiyaRow

                    wallpapersRow
                }
                // Clamp to the proposed width. Without this the VStack sizes to its widest
                // child's *ideal* width (full-resolution artwork is thousands of points across)
                // and the whole page renders centred against those oversized bounds, shifted
                // off-screen left.
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, BhaktiBottomNavBar.overlayClearance)
            }
            .bhaktiPageBackground()
            .bhaktiHideNavigationBar()
            .safeAreaInset(edge: .top, spacing: 0) { topBar }
            .task { await loadChoghadiyaPreview() }
            .sheet(isPresented: $showDarshanSheet) {
                DailyDarshanSheet()
                    .environmentObject(streaks)
            }
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
                case .wallpapers:
                    WallpapersScreen()
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

    // MARK: - Greeting header (replaces the always-on streak hero card)

    private var greetingHeader: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(greeting)
                    .font(.system(size: 19, weight: .heavy))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                Text(dateSubtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(BhaktiTheme.textSecondary)
            }

            Spacer(minLength: 8)

            Button { showDarshanSheet = true } label: {
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 11, weight: .bold))
                    Text("\(streaks.currentStreak)")
                        .font(.system(size: 12.5, weight: .heavy))
                }
                .foregroundStyle(BhaktiTheme.accentDeep)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(BhaktiTheme.surface)
                .overlay(
                    Capsule().stroke(BhaktiTheme.accentDeep.opacity(0.18), lineWidth: 1)
                )
                .clipShape(Capsule())
            }
            .buttonStyle(BhaktiPressEffect())
            .accessibilityLabel("Daily darshan streak, \(streaks.currentStreak) days")
        }
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        let part: String
        switch hour {
        case 4..<12:  part = "Good morning"
        case 12..<17: part = "Good afternoon"
        default:      part = "Good evening"
        }
        // Signed-out users just get the bare greeting rather than a placeholder name.
        let firstName = appState.authSession.name
            .split(separator: " ")
            .first
            .map(String.init) ?? ""
        return firstName.isEmpty ? part : "\(part), \(firstName)"
    }

    private var dateSubtitle: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, d MMMM"
        return "\(formatter.string(from: Date())) · \(PakshaCalculator.paksha().rawValue)"
    }

    private func sectionHeader(
        title: String,
        subtitle: String? = nil,
        action: String? = nil,
        badge: String? = nil,
        onAction: (() -> Void)? = nil
    ) -> some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(title)
                        .font(.system(size: 15.5, weight: .heavy))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                    if let badge {
                        Text(badge)
                            .font(.system(size: 9, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(BhaktiTheme.accentPrimary)
                            .clipShape(Capsule())
                    }
                }
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundStyle(BhaktiTheme.textSecondary)
                }
            }
            Spacer(minLength: 8)
            if let action, let onAction {
                Button(action: onAction) {
                    Text(action)
                        .font(.system(size: 11.5, weight: .bold))
                        .foregroundStyle(BhaktiTheme.accentDeep)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func sectionHeader(title: String, action: String, onAction: @escaping () -> Void) -> some View {
        sectionHeader(title: title, subtitle: nil, action: action, badge: nil, onAction: onAction)
    }

    // MARK: - Reels shelf

    private var reelsShelf: some View {
        let clips = Array(ReelsRepository.reels(for: .top).prefix(8))

        return VStack(alignment: .leading, spacing: 12) {
            sectionHeader(
                title: "Reels",
                subtitle: nil,
                action: "See all",
                badge: "NEW",
                onAction: { appState.selectedTab = .reels }
            )

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(Array(clips.enumerated()), id: \.element.id) { index, clip in
                        Button {
                            // Open the feed on *this* clip, not wherever it was left.
                            appState.pendingReelId = clip.id
                            appState.selectedTab = .reels
                        } label: {
                            ReelShelfCard(reel: clip, animateZoom: index == 0)
                        }
                        .buttonStyle(BhaktiPressEffect())
                    }
                }
                .padding(.trailing, 16)
            }
        }
    }

    // MARK: - Choghadiya + Wallpapers (full-width labelled rows)

    private var choghadiyaRow: some View {
        Button { path.append(.choghadiya) } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.16))
                    .frame(width: 38, height: 38)
                    .overlay(
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(.white)
                    )

                VStack(alignment: .leading, spacing: 4) {
                    Text("CHOGHADIYA NOW")
                        .font(.system(size: 9.5, weight: .heavy))
                        .tracking(0.8)
                        .foregroundStyle(Color.white.opacity(0.6))

                    Text(choghadiyaTitle)
                        .font(.system(size: 14.5, weight: .heavy))
                        .foregroundStyle(.white)
                        .lineLimit(1)

                    if let slot = currentChoghadiyaSlot {
                        HStack(spacing: 8) {
                            GeometryReader { proxy in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(Color.white.opacity(0.2))
                                    Capsule()
                                        .fill(Color.white)
                                        .frame(width: proxy.size.width * slotProgress(slot))
                                }
                            }
                            .frame(height: 3)

                            Text("ends \(slot.endLabel)")
                                .font(.system(size: 10.5))
                                .foregroundStyle(Color.white.opacity(0.7))
                                .fixedSize()
                        }
                    }
                }

                Image(systemName: "chevron.right")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.white.opacity(0.6))
            }
            .padding(14)
            .frame(maxWidth: .infinity)
            .background(
                LinearGradient(
                    colors: [
                        Color(red: 0x7A / 255, green: 0x24 / 255, blue: 0x24 / 255),
                        Color(red: 0x3D / 255, green: 0x0F / 255, blue: 0x0F / 255)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 20))
        }
        .buttonStyle(BhaktiPressEffect())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(choghadiyaAccessibilityLabel)
    }

    private var choghadiyaTitle: String {
        guard let slot = currentChoghadiyaSlot else { return "Loading today's timings…" }
        return "\(slot.displayLabel) · \(toneWord(for: slot))"
    }

    private func toneWord(for slot: ChoghadiyaSlot) -> String {
        switch ChoghadiyaCalculator.tone(for: slot.baseLabel) {
        case .auspicious:  return "auspicious"
        case .neutral:     return "neutral"
        case .challenging: return "caution"
        }
    }

    private func slotProgress(_ slot: ChoghadiyaSlot) -> Double {
        let total = slot.end.timeIntervalSince(slot.start)
        guard total > 0 else { return 0 }
        let elapsed = Date().timeIntervalSince(slot.start)
        return min(max(elapsed / total, 0), 1)
    }

    private var choghadiyaAccessibilityLabel: String {
        guard let slot = currentChoghadiyaSlot else { return "Choghadiya, loading today's timings" }
        return "Choghadiya, \(slot.displayLabel) period, \(toneWord(for: slot)), ends \(slot.endLabel), tap to view full timings"
    }

    private var wallpapersRow: some View {
        let strip = Array(WallpapersCatalog.all.prefix(4))

        return Button { path.append(.wallpapers) } label: {
            ZStack(alignment: .bottomLeading) {
                // Each crop gets a definite width computed from the container — `maxWidth:
                // .infinity` on a `scaledToFill` image still reports the artwork's full natural
                // width as its ideal, which is what blew up this row's layout.
                GeometryReader { proxy in
                    let cropWidth = (proxy.size.width - 6) / 4
                    HStack(spacing: 2) {
                        ForEach(strip) { wallpaper in
                            PackageAssetLoader.image(named: wallpaper.assetName)
                                .resizable()
                                .scaledToFill()
                                .frame(width: cropWidth, height: 136)
                                .clipped()
                        }
                    }
                }
                .frame(height: 136)

                LinearGradient(
                    stops: [
                        .init(color: Color.black.opacity(0.05), location: 0.38),
                        .init(color: Color.black.opacity(0.86), location: 1)
                    ],
                    startPoint: .top, endPoint: .bottom
                )

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Wallpapers")
                            .font(.system(size: 15, weight: .heavy))
                            .foregroundStyle(.white)
                        Text("\(WallpapersCatalog.all.count) deity portraits · save & share")
                            .font(.system(size: 11.5))
                            .foregroundStyle(Color.white.opacity(0.78))
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.white.opacity(0.8))
                }
                .padding(14)
            }
            .frame(height: 136)
            .clipShape(RoundedRectangle(cornerRadius: 20))
        }
        .buttonStyle(BhaktiPressEffect())
    }

    // MARK: - Choghadiya data

    private var currentChoghadiyaSlot: ChoghadiyaSlot? {
        let now = Date()
        return choghadiyaSlots.first { now >= $0.start && now < $0.end }
            ?? choghadiyaSlots.first { $0.end > now }
    }

    @MainActor
    private func loadChoghadiyaPreview() async {
        // Lightweight Home preview — always the default city (London). The full Choghadiya
        // screen lets the user pick/detect their real city; this teaser just needs *a* live
        // "what's auspicious right now" value, not a personalized one.
        let city = ChoghadiyaCatalog.all[0]
        guard let response = try? await appState.api.fetchChoghadiyaSun(for: city) else { return }
        let tz = TimeZone(identifier: city.tz) ?? .current
        choghadiyaSlots = ChoghadiyaCalculator.buildSlots(
            sunrise: parseISO(response.sunrise),
            sunset: parseISO(response.sunset),
            nextSunrise: parseISO(response.nextSunrise),
            timeZone: tz
        )
    }

    private func parseISO(_ value: String) -> Date {
        let f1 = ISO8601DateFormatter()
        f1.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f1.date(from: value) { return d }

        let f2 = ISO8601DateFormatter()
        f2.formatOptions = [.withInternetDateTime]
        if let d = f2.date(from: value) { return d }

        return .now
    }

    // MARK: - Aarti spotlight (Spotify-style hero card, live now-playing state)

    /// Card body opens the Aartis list; the trailing 44pt button is a *direct* `AartiPlayer`
    /// control (play in place), not navigation.
    private var aartiSpotlightCard: some View {
        let spotlight = aartiPlayer.currentAarti ?? (try? AartiRepository.loadAartis())?.first(where: \.isTop)

        return HStack(spacing: 12) {
            Button { path.append(.aartis) } label: {
                HStack(spacing: 12) {
                    if let spotlight {
                        AartiThumbnailView(aarti: spotlight, size: 52)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .shadow(color: BhaktiTheme.accentPrimary.opacity(0.3), radius: 10)
                    } else {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.white.opacity(0.15))
                            .frame(width: 52, height: 52)
                            .overlay(Image(systemName: "music.note").foregroundStyle(.white))
                    }

                    VStack(alignment: .leading, spacing: 3) {
                        Text(aartiPlayer.isPlaying ? "NOW PLAYING" : "TODAY'S AARTI")
                            .font(.system(size: 9.5, weight: .heavy))
                            .tracking(0.8)
                            .foregroundStyle(Color.white.opacity(0.6))

                        Text(spotlight?.title ?? "Aartis")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .lineLimit(1)

                        HStack(spacing: 6) {
                            AartiWaveform(isPlaying: aartiPlayer.isPlaying)
                            Text(aartiSubtitle(for: spotlight))
                                .font(.system(size: 10.5))
                                .foregroundStyle(Color.white.opacity(0.5))
                                .lineLimit(1)
                        }
                    }

                    Spacer(minLength: 0)
                }
            }
            .buttonStyle(.plain)

            Button(action: toggleAarti) {
                Image(systemName: aartiPlayer.isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(BhaktiTheme.accentPrimary)
                    .clipShape(Circle())
            }
            .buttonStyle(BhaktiPressEffect())
            .accessibilityLabel(aartiPlayer.isPlaying ? "Pause aarti" : "Play today's aarti")
        }
        .padding(14)
        .background(
            RadialGradient(
                colors: [
                    Color(red: 0x5A / 255, green: 0x34 / 255, blue: 0x18 / 255),
                    Color(red: 0x2A / 255, green: 0x1E / 255, blue: 0x14 / 255)
                ],
                center: UnitPoint(x: 0.85, y: 0.1),
                startRadius: 0,
                endRadius: 320
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private func aartiSubtitle(for aarti: Aarti?) -> String {
        let count = (try? AartiRepository.loadAartis())?.count ?? 0
        if let minutes = aarti?.durationMinutes {
            return "\(minutes) min · \(count) aartis"
        }
        return "\(count) aartis"
    }

    private func toggleAarti() {
        // Already has a queue → plain transport control. Otherwise seed the queue with the
        // full library starting at today's pick, so one tap actually plays something.
        if aartiPlayer.currentAarti != nil {
            aartiPlayer.togglePlayPause()
            return
        }
        guard let all = try? AartiRepository.loadAartis(), !all.isEmpty else { return }
        let start = all.first(where: \.isTop) ?? all[0]
        aartiPlayer.playQueue(all.filter(\.hasAudio), startId: start.id)
    }

    // MARK: - Divine Image (photo card with output social proof)

    private var divineImageCard: some View {
        Button { path.append(.divineHome) } label: {
            ZStack(alignment: .bottomLeading) {
                PackageAssetLoader.image(named: "photo_with_god")
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth: .infinity)
                    .frame(height: 224)
                    .clipped()

                LinearGradient(
                    stops: [
                        .init(color: Color(red: 0x14 / 255, green: 0x08 / 255, blue: 0x04 / 255, opacity: 0), location: 0.38),
                        .init(color: Color(red: 0x14 / 255, green: 0x08 / 255, blue: 0x04 / 255, opacity: 0.92), location: 1)
                    ],
                    startPoint: .top, endPoint: .bottom
                )

                // Two sample results, top-right — social proof of what the feature returns.
                VStack {
                    HStack(spacing: 6) {
                        Spacer()
                        ForEach(["demopic", "photo_at_temple"], id: \.self) { asset in
                            PackageAssetLoader.image(named: asset)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 38, height: 38)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.white.opacity(0.55), lineWidth: 1.5)
                                )
                        }
                    }
                    Spacer()
                }
                .padding(14)

                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 5) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 10, weight: .bold))
                        Text("DIVINE IMAGE")
                            .font(.system(size: 10, weight: .heavy))
                            .tracking(1)
                    }
                    .foregroundStyle(Color(red: 0xFF / 255, green: 0xE7 / 255, blue: 0xC6 / 255))

                    Text("Create your darshan")
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundStyle(.white)

                    // Timing claim matches the app's own generating-state estimate (60–90s)
                    // rather than the brief's "about 20 seconds", which isn't what it does.
                    Text("Your photo, beside your deity — ready in about a minute.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Color.white.opacity(0.85))

                    HStack(spacing: 4) {
                        Text("Upload a photo")
                            .font(.system(size: 13, weight: .heavy))
                        Image(systemName: "arrow.right")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundStyle(Color(red: 0x7C / 255, green: 0x2D / 255, blue: 0x12 / 255))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.white)
                    .clipShape(Capsule())
                    .padding(.top, 2)
                }
                .padding(16)
            }
            .frame(height: 224)
            .clipShape(RoundedRectangle(cornerRadius: 22))
        }
        .buttonStyle(BhaktiPressEffect())
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
        case "fear":                return Color(red: 0.55, green: 0.42, blue: 0.69)  // courage violet
        case "relationship_issues": return Color(red: 0.82, green: 0.45, blue: 0.55)  // rose
        default:                    return BhaktiTheme.accentPrimary
        }
    }

}
