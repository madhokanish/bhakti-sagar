import SwiftUI

struct ChoghadiyaScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @StateObject private var locationResolver = LocationCityResolver()
    @State private var city = ChoghadiyaCatalog.all[0]
    @State private var recentCityIds: [String] = [ChoghadiyaCatalog.all[0].id]
    @State private var citySearch = ""
    @State private var showCitySheet = false
    @State private var meaningsExpanded = false
    @State private var locationStatus: String?
    @State private var attemptedSilentLocationSync = false
    @State private var slots: [ChoghadiyaSlot] = []
    @State private var sunriseLabel = "--"
    @State private var sunsetLabel = "--"
    @State private var nextSunriseLabel = "--"
    @State private var loading = false
    @State private var errorText: String?

    private var now: Date { Date() }

    private var currentSlot: ChoghadiyaSlot? {
        slots.first { now >= $0.start && now < $0.end } ?? slots.first { $0.end > now } ?? slots.last
    }

    private var nextGoodSlot: ChoghadiyaSlot? {
        slots.first { $0.start > now && ChoghadiyaCalculator.isAuspicious($0.baseLabel) }
    }

    private var timelineSlots: [ChoghadiyaSlot] {
        slots.sorted { $0.start < $1.start }
    }

    private var filteredCities: [ChoghadiyaCity] {
        let query = citySearch.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return ChoghadiyaCatalog.all }
        return ChoghadiyaCatalog.all.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }

    private var recentCities: [ChoghadiyaCity] {
        recentCityIds.compactMap { id in
            ChoghadiyaCatalog.all.first(where: { $0.id == id })
        }
    }

    private var todayLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, d MMMM"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: city.tz) ?? .current
        return formatter.string(from: now)
    }

    private var currentProgress: CGFloat {
        guard let currentSlot else { return 0 }
        let total = currentSlot.end.timeIntervalSince(currentSlot.start)
        guard total > 0 else { return 0 }
        let elapsed = min(max(now.timeIntervalSince(currentSlot.start), 0), total)
        return elapsed / total
    }

    private var nextGoodCountdown: String? {
        guard let nextGoodSlot else { return nil }
        let remaining = max(nextGoodSlot.start.timeIntervalSince(now), 0)
        let hours = Int(remaining) / 3600
        let minutes = (Int(remaining) % 3600) / 60

        switch (hours, minutes) {
        case let (h, m) where h > 0 && m > 0:
            return "In \(h) \(h == 1 ? "hour" : "hours") \(m) \(m == 1 ? "minute" : "minutes")"
        case let (h, _) where h > 0:
            return "In \(h) \(h == 1 ? "hour" : "hours")"
        case let (_, m) where m > 0:
            return "In \(m) \(m == 1 ? "minute" : "minutes")"
        default:
            return "Starting now"
        }
    }

    var body: some View {
        ZStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    topBar

                    #if os(iOS)
                    // See AartisScreen — GADBannerView needs an explicit frame in SwiftUI.
                    BannerAdView(placement: "choghadiya")
                        .frame(width: 320, height: 50)
                    #endif

                    heroSummaryCard
                    nextGoodTimeCard
                    sunCycleCard
                    timelineSection
                    meaningsAccordion
                    askShaniCard
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, BhaktiBottomNavBar.overlayClearance)
            }
            .bhaktiPageBackground()
            .bhaktiHideNavigationBar()

            if loading && slots.isEmpty {
                ProgressView()
                    .tint(BhaktiTheme.accentPrimary)
                    .scaleEffect(1.1)
                    .padding(18)
                    .background(BhaktiTheme.surface.opacity(0.94))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(BhaktiTheme.border, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 18))
            }
        }
        .task {
            Analytics.choghadiyaOpened()
            await load()
            if !attemptedSilentLocationSync {
                attemptedSilentLocationSync = true
                await autoDetectLocation(promptIfNeeded: false, showErrors: false)
            }
        }
        .onChange(of: city) { _, _ in
            Task { await load() }
        }
        .sheet(isPresented: $showCitySheet) {
            citySelectionSheet
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }

    private var topBar: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .frame(width: 44, height: 44)
                        .background(BhaktiTheme.surface)
                        .overlay(
                            Circle()
                                .stroke(BhaktiTheme.border, lineWidth: 1)
                        )
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Back")

                Spacer()

                Button {
                    showCitySheet = true
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "location.fill")
                            .font(.caption.weight(.bold))
                        Text(city.name.components(separatedBy: ",").first ?? city.name)
                            .font(.subheadline.weight(.semibold))
                            .lineLimit(1)
                        Image(systemName: "chevron.down")
                            .font(.caption.weight(.bold))
                    }
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(BhaktiTheme.surface)
                    .overlay(
                        Capsule()
                            .stroke(BhaktiTheme.border, lineWidth: 1)
                    )
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Change city")
                .accessibilityValue(city.name)

                Button {
                    Task { await load() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .frame(width: 40, height: 40)
                        .background(BhaktiTheme.surface)
                        .overlay(
                            Circle()
                                .stroke(BhaktiTheme.border, lineWidth: 1)
                        )
                        .clipShape(Circle())
                        .opacity(loading ? 0.5 : 1)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Refresh")
                .disabled(loading)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Choghadiya")
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(BhaktiTheme.textPrimary)

                Text(todayLabel)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(BhaktiTheme.textSecondary)
            }
        }
    }

    private var heroSummaryCard: some View {
        let tone = currentSlot.map { ChoghadiyaCalculator.tone(for: $0.baseLabel) } ?? .neutral

        return VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.14))
                    Image(systemName: iconName(for: currentSlot?.baseLabel ?? ""))
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(Color.white)
                }
                .frame(width: 42, height: 42)

                Text("Auspicious time right now")
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(Color.white.opacity(0.94))
            }

            if loading && slots.isEmpty {
                ProgressView()
                    .tint(.white)
            } else if let currentSlot {
                Text("\(currentSlot.displayLabel) kaal active")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(Color.white)

                Text("\(currentSlot.startLabel) to \(currentSlot.endLabel)")
                    .font(.headline)
                    .foregroundStyle(Color.white.opacity(0.94))

                Text(currentGuidance(for: currentSlot))
                    .font(.body)
                    .foregroundStyle(Color.white.opacity(0.92))

                progressBar(progress: currentProgress)
            } else {
                Text("Unable to calculate the current period yet.")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(Color.white)

                Text(errorText ?? "Please try another city or refresh in a moment.")
                    .font(.body)
                    .foregroundStyle(Color.white.opacity(0.92))
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: heroGradient(for: tone),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 26)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 26))
    }

    private var nextGoodTimeCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "clock")
                    .foregroundStyle(BhaktiTheme.accentPrimary)
                Text("Next auspicious period")
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
            }

            if let nextGoodSlot {
                Text("\(nextGoodSlot.displayLabel) kaal at \(nextGoodSlot.startLabel)")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(BhaktiTheme.textPrimary)

                Text("\(nextGoodSlot.startLabel) to \(nextGoodSlot.endLabel)")
                    .font(.subheadline)
                    .foregroundStyle(BhaktiTheme.textSecondary)

                if let nextGoodCountdown {
                    Text(nextGoodCountdown)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.accentPrimary)
                }
            } else {
                Text("No more auspicious periods are left in the current cycle.")
                    .font(.body)
                    .foregroundStyle(BhaktiTheme.textSecondary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private var sunCycleCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Sun cycle")
                .font(.headline.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)

            HStack(spacing: 10) {
                sunBlock(label: "Sunrise", value: sunriseLabel)
                sunBlock(label: "Sunset", value: sunsetLabel)
                sunBlock(label: "Next sunrise", value: nextSunriseLabel)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private var timelineSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Today timeline")
                .font(.title2.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)

            if let errorText, timelineSlots.isEmpty {
                Text(errorText)
                    .font(.body)
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.red.opacity(0.18))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color.red.opacity(0.35), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 20))
            } else if timelineSlots.isEmpty {
                Text(loading ? "Loading timeline..." : "No slots available yet.")
                    .font(.body)
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .padding(.vertical, 4)
            } else {
                VStack(spacing: 12) {
                    ForEach(Array(timelineSlots.enumerated()), id: \.element.id) { index, slot in
                        timelineRow(slot: slot, showConnector: index < timelineSlots.count - 1)
                    }
                }
            }
        }
    }

    private var meaningsAccordion: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    meaningsExpanded.toggle()
                }
            } label: {
                HStack {
                    Text("What do these mean?")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)

                    Spacer()

                    Image(systemName: meaningsExpanded ? "chevron.up" : "chevron.down")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textSecondary)
                        .accessibilityHidden(true)
                }
                .padding(16)
            }
            .buttonStyle(.plain)
            .accessibilityHint(meaningsExpanded ? "Collapse" : "Expand")

            if meaningsExpanded {
                VStack(alignment: .leading, spacing: 12) {
                    meaningRow(title: "Shubh", body: "Supportive for important actions, planning, and new starts.")
                    meaningRow(title: "Labh", body: "Useful for gains, business progress, and practical wins.")
                    meaningRow(title: "Amrit", body: "Excellent for sacred work, blessings, and meaningful beginnings.")
                    meaningRow(title: "Rog", body: "Better for routine tasks. Avoid high stakes commitments.")
                    meaningRow(title: "Chal", body: "Good for movement, travel, and flexible work.")
                    meaningRow(title: "Kaal", body: "Best handled with patience, caution, and low risk tasks.")
                    meaningRow(title: "Udveg", body: "A restless phase. Slow down and avoid pressure.")
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
        }
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private var askShaniCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Not sure when to act?")
                .font(.headline.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)

            Text("Ask for practical guidance before you begin an important task.")
                .font(.body)
                .foregroundStyle(BhaktiTheme.textSecondary)

            Button {
                Task {
                    _ = await appState.startThread(
                        for: "shani",
                        includeOpeningScene: false,
                        initialPrompt: "Mujhe aaj ka choghadiya samjhao"
                    )
                    appState.selectedTab = .bhaktiChat
                }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "bubble.left.and.bubble.right.fill")
                        .font(.system(size: 14, weight: .semibold))
                    Text("Ask Shani Dev about todays choghadiya")
                        .font(.subheadline.weight(.semibold))
                }
                .foregroundStyle(Color.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(BhaktiTheme.accentGradient)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(BhaktiPressEffect())
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private var citySelectionSheet: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Choose a city")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)

                TextField("Search cities", text: $citySearch)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(BhaktiTheme.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(BhaktiTheme.border, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .foregroundStyle(BhaktiTheme.textPrimary)

                Button {
                    Task {
                        await autoDetectLocation(promptIfNeeded: true, showErrors: true)
                    }
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "location.circle.fill")
                            .foregroundStyle(BhaktiTheme.accentPrimary)

                        Text(locationResolver.isLocating ? "Detecting location..." : "Auto detect location")
                            .font(.body.weight(.semibold))
                            .foregroundStyle(BhaktiTheme.textPrimary)

                        Spacer()

                        if locationResolver.isLocating {
                            ProgressView()
                                .tint(BhaktiTheme.textPrimary)
                        }
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BhaktiTheme.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(BhaktiTheme.border, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                }
                .buttonStyle(.plain)
                .disabled(locationResolver.isLocating)

                if let locationStatus {
                    Text(locationStatus)
                        .font(.caption)
                        .foregroundStyle(BhaktiTheme.textSecondary)
                }

                if citySearch.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !recentCities.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Recent cities")
                            .font(.headline.weight(.semibold))
                            .foregroundStyle(BhaktiTheme.textPrimary)

                        ForEach(recentCities) { recentCity in
                            cityRow(recentCity)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("All cities")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)

                    ForEach(filteredCities) { candidate in
                        cityRow(candidate)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 28)
        }
        .bhaktiPageBackground()
        .bhaktiHideNavigationBar()
    }

    private func cityRow(_ candidate: ChoghadiyaCity) -> some View {
        Button {
            selectCity(candidate)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(candidate.name)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Text(candidate.tz)
                        .font(.caption)
                        .foregroundStyle(BhaktiTheme.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                if candidate == city {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(BhaktiTheme.accentPrimary)
                        .accessibilityHidden(true)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BhaktiTheme.surface)
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(candidate == city ? BhaktiTheme.accentPrimary.opacity(0.55) : BhaktiTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(candidate == city ? .isSelected : [])
    }

    private func timelineRow(slot: ChoghadiyaSlot, showConnector: Bool) -> some View {
        let isCurrent = currentSlot?.id == slot.id
        let isFuture = slot.start > now
        let tone = ChoghadiyaCalculator.tone(for: slot.baseLabel)
        let accent = accentColor(for: tone)

        return HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 4) {
                Circle()
                    .fill(accent)
                    .frame(width: isCurrent ? 16 : 14, height: isCurrent ? 16 : 14)
                    .padding(.top, 12)

                if showConnector {
                    Rectangle()
                        .fill(BhaktiTheme.border)
                        .frame(width: 2, height: 74)
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: iconName(for: slot.baseLabel))
                        .foregroundStyle(accent)

                    Text(slot.displayLabel)
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)

                    if slot.isNight {
                        slotChip("Night")
                    }

                    Spacer(minLength: 0)

                    if isCurrent {
                        Text("Now")
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(accent)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(accent.opacity(0.14))
                            .clipShape(Capsule())
                    }
                }

                Text("\(slot.startLabel) to \(slot.endLabel)")
                    .font(.subheadline)
                    .foregroundStyle(BhaktiTheme.textPrimary)

                Text(timelineMeaning(for: slot))
                    .font(.caption)
                    .foregroundStyle(BhaktiTheme.textSecondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BhaktiTheme.surface)
            .overlay(
                RoundedRectangle(cornerRadius: 22)
                    .stroke(isCurrent ? accent.opacity(0.7) : BhaktiTheme.border.opacity(0.9), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 22))
            .opacity(isFuture && !isCurrent ? 0.76 : 1)
        }
    }

    private func sunBlock(label: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(BhaktiTheme.textSecondary)
            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(BhaktiTheme.surfaceElevated.opacity(0.86))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func meaningRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)
            Text(body)
                .font(.caption)
                .foregroundStyle(BhaktiTheme.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func progressBar(progress: CGFloat) -> some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.white.opacity(0.18))

                Capsule()
                    .fill(Color.white.opacity(0.94))
                    .frame(width: proxy.size.width * max(0, min(progress, 1)))
            }
        }
        .frame(height: 6)
    }

    private func slotChip(_ title: String) -> some View {
        Text(title)
            .font(.caption2.weight(.bold))
            .foregroundStyle(BhaktiTheme.textSecondary)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(BhaktiTheme.surfaceElevated)
            .clipShape(Capsule())
    }

    private func heroGradient(for tone: ChoghadiyaTone) -> [Color] {
        switch tone {
        case .auspicious:
            return [
                Color(red: 19 / 255, green: 109 / 255, blue: 86 / 255),
                Color(red: 15 / 255, green: 69 / 255, blue: 79 / 255)
            ]
        case .neutral:
            return [
                Color(red: 92 / 255, green: 74 / 255, blue: 21 / 255),
                Color(red: 57 / 255, green: 40 / 255, blue: 14 / 255)
            ]
        case .challenging:
            return [
                Color(red: 109 / 255, green: 36 / 255, blue: 36 / 255),
                Color(red: 63 / 255, green: 19 / 255, blue: 34 / 255)
            ]
        }
    }

    private func accentColor(for tone: ChoghadiyaTone) -> Color {
        switch tone {
        case .auspicious:
            return Color(red: 94 / 255, green: 211 / 255, blue: 148 / 255)
        case .neutral:
            return Color(red: 1, green: 184 / 255, blue: 84 / 255)
        case .challenging:
            return Color(red: 1, green: 112 / 255, blue: 112 / 255)
        }
    }

    private func iconName(for baseLabel: String) -> String {
        switch baseLabel {
        case "Shubh":
            return "sparkles"
        case "Labh":
            return "chart.line.uptrend.xyaxis"
        case "Amrit":
            return "drop.fill"
        case "Char":
            return "figure.walk"
        case "Rog":
            return "cross.case.fill"
        case "Kaal":
            return "exclamationmark.triangle.fill"
        default:
            return "bolt.fill"
        }
    }

    private func currentGuidance(for slot: ChoghadiyaSlot) -> String {
        switch slot.baseLabel {
        case "Shubh":
            return "Good for starting new work and important decisions."
        case "Labh":
            return "Helpful for business, progress, and practical gains."
        case "Amrit":
            return "Excellent for meaningful actions, prayers, and fresh starts."
        case "Char":
            return "Steady for movement, admin work, and flexible plans."
        case "Rog":
            return "Best for routine tasks and reflection."
        case "Kaal":
            return "Avoid major decisions. Keep tasks simple and low risk."
        default:
            return "Pause, review, and move gently before taking big action."
        }
    }

    private func timelineMeaning(for slot: ChoghadiyaSlot) -> String {
        switch slot.baseLabel {
        case "Shubh":
            return "A supportive window for important actions."
        case "Labh":
            return "Useful for growth, planning, and practical gains."
        case "Amrit":
            return "Strong for blessings, new starts, and sacred work."
        case "Char":
            return "Good for movement, communication, and routine flow."
        case "Rog":
            return "Keep to ordinary tasks and avoid high stakes decisions."
        case "Kaal":
            return "Better for restraint, patience, and lighter commitments."
        default:
            return "A restless phase. Move slowly and avoid pressure."
        }
    }

    private func selectCity(_ selectedCity: ChoghadiyaCity) {
        city = selectedCity
        citySearch = ""
        locationStatus = nil
        showCitySheet = false

        recentCityIds.removeAll { $0 == selectedCity.id }
        recentCityIds.insert(selectedCity.id, at: 0)
        recentCityIds = Array(recentCityIds.prefix(3))
    }

    @MainActor
    private func autoDetectLocation(promptIfNeeded: Bool, showErrors: Bool) async {
        do {
            let detectedCity = try await locationResolver.nearestCity(
                from: ChoghadiyaCatalog.all,
                promptIfNeeded: promptIfNeeded
            )
            selectCity(detectedCity)
            locationStatus = "Using \(detectedCity.name)"
        } catch {
            if showErrors {
                locationStatus = error.localizedDescription
            }
        }
    }

    @MainActor
    private func load() async {
        loading = true
        errorText = nil
        defer { loading = false }

        do {
            let response = try await appState.api.fetchChoghadiyaSun(for: city)
            let tz = TimeZone(identifier: city.tz) ?? .current
            let sunrise = parseISO(response.sunrise)
            let sunset = parseISO(response.sunset)
            let nextSunrise = parseISO(response.nextSunrise)

            sunriseLabel = formatTime(sunrise, tz: tz)
            sunsetLabel = formatTime(sunset, tz: tz)
            nextSunriseLabel = formatTime(nextSunrise, tz: tz)
            slots = ChoghadiyaCalculator.buildSlots(
                sunrise: sunrise,
                sunset: sunset,
                nextSunrise: nextSunrise,
                timeZone: tz
            )
        } catch {
            errorText = error.localizedDescription
            slots = []
        }
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

    private func formatTime(_ date: Date, tz: TimeZone) -> String {
        let df = DateFormatter()
        df.dateFormat = "h:mm a"
        df.locale = Locale(identifier: "en_US_POSIX")
        df.timeZone = tz
        return df.string(from: date)
    }
}
