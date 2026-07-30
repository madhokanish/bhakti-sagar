import SwiftUI

private enum ChatTab: String, CaseIterable {
    case chats = "All chats"
    case creations = "Creations"
    case saved = "Saved"
}

private enum ChatRoute: Hashable {
    case profile
    case thread(String)
    case creation(String)
    case aarti(String) // slug
}

struct BhaktiChatScreen: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var bookmarks: BookmarkStore
    @State private var tab: ChatTab = .chats
    @State private var path: [ChatRoute] = []
    @State private var searchQuery = ""
    @State private var showClearAllConfirmation = false

    // Pinned composer
    @StateObject private var speech = SpeechInputManager()
    @State private var composerText = ""
    @FocusState private var composerFocused: Bool

    // MARK: - Filtered data

    private var sortedThreads: [ChatThread] {
        // At most one row per guide — collapsed duplicates stay in appState.threads
        // (archived, not deleted) but never show up here.
        let all = appState.visibleThreads
        let q = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return all }
        return all.filter { thread in
            let guideName = GuidesCatalog.byId(thread.guideId)?.displayName.lowercased() ?? ""
            let preview = appState.threadMessages(threadId: thread.id).last?.content.lowercased() ?? ""
            return guideName.contains(q) || preview.contains(q)
        }
    }

    private var sortedCreations: [DivineCreation] {
        let all = Array(appState.divineCreations.reversed())
        let q = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return all }
        return all.filter { $0.templateTitle.lowercased().contains(q) }
    }

    // MARK: - Body

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    #if os(iOS)
                    // See AartisScreen — GADBannerView needs an explicit frame in SwiftUI.
                    BannerAdView(placement: "bhakti_chat_list")
                        .frame(width: 320, height: 50)
                    #endif

                    startNewChatRow

                    conversationsHeader
                    searchBar
                    segmentedControl

                    switch tab {
                    case .chats:     chatsContent
                    case .creations: creationsContent
                    case .saved:     savedContent
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, BhaktiBottomNavBar.overlayClearance)
            }
            .bhaktiPageBackground()
            .bhaktiHideNavigationBar()
            .safeAreaInset(edge: .top, spacing: 0) { topBar }
            .safeAreaInset(edge: .bottom, spacing: 0) { composer }
            .onChange(of: speech.transcribedText) { _, text in
                guard !text.isEmpty else { return }
                composerText = text
            }
            // Every entry point that opens a deity's conversation (Home's guides row/ask
            // field/situation cards, this tab's own guides row/prompt tiles, Reels' "Ask about
            // this") sets `appState.selectedThreadId` and switches to this tab — this is what
            // actually pushes into that thread once we land here, mirroring the retired
            // BhaktiChatHubScreen's `openPendingThreadIfNeeded`.
            .onAppear(perform: openPendingThreadIfNeeded)
            .onChange(of: appState.selectedThreadId) { _, _ in
                openPendingThreadIfNeeded()
            }
            .navigationDestination(for: ChatRoute.self) { route in
                switch route {
                case .profile:
                    ProfileScreen()
                case let .thread(threadId):
                    if let thread = appState.threads.first(where: { $0.id == threadId }),
                       let guide = GuidesCatalog.byId(thread.guideId) {
                        ChatThreadScreen(thread: thread, guide: guide)
                    } else {
                        chatFallback("Chat not found")
                    }
                case let .creation(creationId):
                    if appState.divineCreations.contains(where: { $0.id == creationId }) {
                        DivineImageResultScreen(creationId: creationId)
                    } else {
                        chatFallback("Creation not found")
                    }
                case let .aarti(slug):
                    if let aarti = (try? AartiRepository.loadAartis())?.first(where: { $0.slug == slug }) {
                        AartiDetailScreen(aarti: aarti)
                    } else {
                        chatFallback("Aarti not found")
                    }
                }
            }
            .confirmationDialog(
                tab == .creations ? "Clear all creations?" : "Clear all chats?",
                isPresented: $showClearAllConfirmation,
                titleVisibility: .visible
            ) {
                Button("Clear all", role: .destructive) {
                    withAnimation(BhaktiTheme.Animation.normal) {
                        if tab == .creations {
                            appState.deleteAllDivineCreations()
                        } else {
                            appState.deleteAllThreads()
                        }
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This cannot be undone.")
            }
        }
    }

    // MARK: - Top bar

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
                .accessibilityLabel("Profile")
            },
            centerContent: {
                Text("Bhakti Chat")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
            },
            rightContent: {
                // No trailing control — "Clear all" moved down into the conversations header.
                Color.clear.frame(width: 40, height: 40)
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

    // MARK: - Your conversations header

    private var conversationsHeader: some View {
        HStack(alignment: .firstTextBaseline) {
            Text("Your conversations")
                .font(.system(size: 17, weight: .heavy))
                .foregroundStyle(BhaktiTheme.textPrimary)

            Spacer(minLength: 8)

            let hasContent: Bool = {
                switch tab {
                case .chats:     return !appState.visibleThreads.isEmpty
                case .creations: return !appState.divineCreations.isEmpty
                case .saved:     return false
                }
            }()

            if hasContent {
                Button { showClearAllConfirmation = true } label: {
                    Text("Clear all")
                        .font(.system(size: 11.5, weight: .bold))
                        .foregroundStyle(BhaktiTheme.accentDeep)
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Start something new (from the retired hub screen)

    /// Floating guide heads + a plain caption, ahead of the conversation list — tapping a guide
    /// directly opens (or resumes, per the one-thread-per-deity rule) their chat. No intermediate
    /// prompt-picking step; the guide tap itself is the "start a new chat" action.
    private var startNewChatRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Start a new chat")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BhaktiTheme.textSecondary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(DiscoveryCatalog.guides) { guide in
                        Button {
                            startNewChat(with: guide.id)
                        } label: {
                            GuideAvatarItemView(
                                title: guide.title,
                                imageAssetName: guide.imageAssetName,
                                isSelected: appState.selectedGuideId == guide.id,
                                itemWidth: 84,
                                outerDiameter: 58,
                                imageDiameter: 58
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.trailing, 16)
            }
        }
    }

    // MARK: - Pinned composer

    private var composer: some View {
        HStack(spacing: 10) {
            TextField(composerPlaceholder, text: $composerText, axis: .vertical)
                .font(.system(size: 14))
                .foregroundStyle(BhaktiTheme.textPrimary)
                .lineLimit(1...4)
                .focused($composerFocused)
                .padding(.horizontal, 16)
                .padding(.vertical, 13)
                .background(BhaktiTheme.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(BhaktiTheme.border, lineWidth: 1.5)
                )
                .clipShape(RoundedRectangle(cornerRadius: 18))

            Button {
                Task { await speech.toggleRecording() }
            } label: {
                Image(systemName: speech.isRecording ? "mic.fill" : "mic")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(speech.isRecording ? BhaktiTheme.accentPrimary : BhaktiTheme.textSecondary)
                    .frame(width: 44, height: 44)
                    .background(BhaktiTheme.surface)
                    .overlay(Circle().stroke(BhaktiTheme.border, lineWidth: 1))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(speech.isRecording ? "Stop dictation" : "Dictate a message")

            Button { launch(prompt: composerText) } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(BhaktiTheme.accentGradient)
                    .clipShape(Circle())
                    .shadow(color: BhaktiTheme.accentPrimary.opacity(0.4), radius: 6, x: 0, y: 3)
            }
            .buttonStyle(.plain)
            .disabled(composerText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .opacity(composerText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.5 : 1)
            .accessibilityLabel("Send")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(BhaktiTheme.background.opacity(0.97))
        .overlay(alignment: .top) {
            Rectangle().fill(BhaktiTheme.border.opacity(0.6)).frame(height: 0.5)
        }
    }

    private var composerPlaceholder: String {
        let name = GuidesCatalog.byId(appState.selectedGuideId)?.displayName ?? "your guide"
        return "Ask \(name) anything…"
    }

    /// Every entry point here resolves to the selected deity's single conversation.
    /// Tapping a guide head in `startNewChatRow` — always a clean, fresh chat (just the guide's
    /// opening message), not a resume of whatever was said before. Per the one-thread-per-deity
    /// rule this clears that guide's existing conversation rather than creating a second one.
    private func startNewChat(with guideId: String) {
        if speech.isRecording { speech.stop() }
        let thread = appState.startFreshThread(for: guideId)
        path.append(.thread(thread.id))
    }

    private func launch(prompt: String) {
        let text = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        composerText = ""
        composerFocused = false
        if speech.isRecording { speech.stop() }
        Task {
            let thread = await appState.startThread(
                for: appState.selectedGuideId,
                includeOpeningScene: false,
                initialPrompt: text
            )
            path.append(.thread(thread.id))
        }
    }

    // MARK: - Search bar

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(BhaktiTheme.textTertiary)
                .font(.system(size: 15))

            TextField("Search history…", text: $searchQuery)
                .foregroundStyle(BhaktiTheme.textPrimary)
                .font(.body)
                .autocorrectionDisabled()

            if !searchQuery.isEmpty {
                Button {
                    searchQuery = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(BhaktiTheme.textTertiary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear search")
                .transition(.opacity)
            }
        }
        .padding(.horizontal, BhaktiTheme.Spacing.md)
        .padding(.vertical, 12)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))
        .animation(BhaktiTheme.Animation.quick, value: searchQuery.isEmpty)
    }

    // MARK: - Segmented control

    private var segmentedControl: some View {
        HStack(spacing: 8) {
            ForEach(ChatTab.allCases, id: \.self) { value in
                Button {
                    withAnimation(BhaktiTheme.Animation.quick) { tab = value }
                } label: {
                    Text(value.rawValue)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(tab == value ? BhaktiTheme.textPrimary : BhaktiTheme.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(tab == value ? BhaktiTheme.surfaceElevated : BhaktiTheme.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(
                                    tab == value ? BhaktiTheme.accentPrimary.opacity(0.85) : BhaktiTheme.border,
                                    lineWidth: 1
                                )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(6)
        .background(BhaktiTheme.surface.opacity(0.92))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    // MARK: - Content

    @ViewBuilder
    private var chatsContent: some View {
        if sortedThreads.isEmpty && !searchQuery.isEmpty {
            searchEmptyState(query: searchQuery)
        } else if sortedThreads.isEmpty {
            historyEmptyState(
                title: "No chats yet",
                subtitle: "Start a conversation with a guide and it will appear here.",
                tab: .chats
            )
        } else {
            VStack(spacing: 12) {
                ForEach(sortedThreads) { thread in
                    if let guide = GuidesCatalog.byId(thread.guideId) {
                        Button {
                            path.append(.thread(thread.id))
                        } label: {
                            HistoryChatCard(
                                guide: guide,
                                preview: chatPreview(for: thread),
                                timestamp: timestampText(for: thread.updatedAt)
                            )
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            Button(role: .destructive) {
                                withAnimation(BhaktiTheme.Animation.normal) {
                                    appState.deleteThread(thread.id)
                                }
                            } label: {
                                Label("Delete chat", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var creationsContent: some View {
        if sortedCreations.isEmpty && !searchQuery.isEmpty {
            searchEmptyState(query: searchQuery)
        } else if sortedCreations.isEmpty {
            historyEmptyState(
                title: "No creations yet",
                subtitle: "Generate a divine image and it will appear here.",
                tab: .creations
            )
        } else {
            VStack(spacing: 12) {
                ForEach(sortedCreations) { creation in
                    Button {
                        path.append(.creation(creation.id))
                    } label: {
                        HistoryCreationCard(
                            creation: creation,
                            timestamp: creation.status == .success ? "Saved result" : creation.status.rawValue.capitalized
                        )
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button(role: .destructive) {
                            withAnimation(BhaktiTheme.Animation.normal) {
                                appState.deleteDivineCreation(creation.id)
                            }
                        } label: {
                            Label("Delete creation", systemImage: "trash")
                        }
                    }
                }
            }
        }
    }

    // MARK: - Saved content

    private struct SavedMessageEntry: Identifiable {
        let id: String
        let threadId: String
        let guideName: String
        let content: String
        let createdAt: Date
    }

    private var savedMessages: [SavedMessageEntry] {
        let ids = bookmarks.bookmarkedMessageIds
        guard !ids.isEmpty else { return [] }
        var entries: [SavedMessageEntry] = []
        for thread in appState.threads {
            let guideName = GuidesCatalog.byId(thread.guideId)?.displayName ?? "Guide"
            for message in appState.threadMessages(threadId: thread.id)
            where ids.contains(message.id) {
                entries.append(.init(
                    id: message.id,
                    threadId: thread.id,
                    guideName: guideName,
                    content: message.content,
                    createdAt: message.createdAt
                ))
            }
        }
        return entries.sorted { $0.createdAt > $1.createdAt }
    }

    private var savedAartis: [Aarti] {
        let slugs = bookmarks.bookmarkedAartiSlugs
        guard !slugs.isEmpty else { return [] }
        let all = (try? AartiRepository.loadAartis()) ?? []
        return all.filter { slugs.contains($0.slug) }
    }

    @ViewBuilder
    private var savedContent: some View {
        let messages = savedMessages
        let aartis   = savedAartis

        if messages.isEmpty && aartis.isEmpty {
            historyEmptyState(
                title: "Nothing saved yet",
                subtitle: "Bookmark messages or aartis you want to revisit and they will appear here.",
                tab: .saved
            )
        } else {
            VStack(alignment: .leading, spacing: 16) {
                if !messages.isEmpty {
                    Text("Bookmarked messages")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                    VStack(spacing: 12) {
                        ForEach(messages) { entry in
                            Button {
                                path.append(.thread(entry.threadId))
                            } label: {
                                SavedMessageCard(
                                    guideName: entry.guideName,
                                    content: entry.content,
                                    timestamp: timestampText(for: entry.createdAt)
                                )
                            }
                            .buttonStyle(.plain)
                            .contextMenu {
                                Button(role: .destructive) {
                                    bookmarks.toggleMessage(entry.id)
                                } label: {
                                    Label("Remove bookmark", systemImage: "bookmark.slash")
                                }
                            }
                        }
                    }
                }

                if !aartis.isEmpty {
                    Text("Bookmarked aartis")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                    VStack(spacing: 12) {
                        ForEach(aartis) { aarti in
                            Button {
                                path.append(.aarti(aarti.slug))
                            } label: {
                                SavedAartiCard(aarti: aarti)
                            }
                            .buttonStyle(.plain)
                            .contextMenu {
                                Button(role: .destructive) {
                                    bookmarks.toggleAarti(aarti.slug)
                                } label: {
                                    Label("Remove bookmark", systemImage: "bookmark.slash")
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func openPendingThreadIfNeeded() {
        guard let threadId = appState.selectedThreadId else { return }
        guard path.last != .thread(threadId) else { return }
        path = [.thread(threadId)]
        appState.consumePendingThreadNavigation()
    }

    private func chatFallback(_ text: String) -> some View {
        Text(text)
            .font(.body)
            .foregroundStyle(BhaktiTheme.textSecondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
            .bhaktiPageBackground()
    }

    private func searchEmptyState(query: String) -> some View {
        VStack(spacing: BhaktiTheme.Spacing.md) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 28, weight: .medium))
                .foregroundStyle(BhaktiTheme.textTertiary)
            Text("No results for \"\(query)\"")
                .font(.headline.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)
            Text("Try a different keyword.")
                .font(.subheadline)
                .foregroundStyle(BhaktiTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, BhaktiTheme.Spacing.xxl)
    }

    private func historyEmptyState(title: String, subtitle: String, tab: ChatTab) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title)
                .font(.title3.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)
            Text(subtitle)
                .font(.body)
                .foregroundStyle(BhaktiTheme.textSecondary)

            Button {
                switch tab {
                case .chats, .saved: appState.selectedTab = .bhaktiChat
                case .creations:     appState.selectedTab = .explore
                }
            } label: {
                let (label, icon): (String, String) = {
                    switch tab {
                    case .chats:     return ("Start a chat", "bubble.left.and.bubble.right")
                    case .creations: return ("Create an image", "photo.on.rectangle")
                    case .saved:     return ("Start a chat", "bubble.left.and.bubble.right")
                    }
                }()
                Label(label, systemImage: icon)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.accentPrimary)
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(BhaktiTheme.surface.opacity(0.96))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private func chatPreview(for thread: ChatThread) -> String {
        let preview = appState.threadMessages(threadId: thread.id).last?.content
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return preview.isEmpty ? "Continue your conversation" : preview
    }

    private func timestampText(for date: Date) -> String {
        let seconds = Int(Date().timeIntervalSince(date))
        if seconds < 60 { return "Just now" }
        if seconds < 3600 { return "\(seconds / 60)m ago" }
        if seconds < 86400 { return "\(seconds / 3600)h ago" }
        if seconds < 172800 { return "Yesterday" }
        return date.formatted(date: .abbreviated, time: .omitted)
    }
}

// MARK: - Chat card

struct HistoryChatCard: View {
    let guide: Guide
    let preview: String
    let timestamp: String

    var body: some View {
        HStack(spacing: 14) {
            PackageAssetLoader.image(named: guide.avatarAssetName)
                .resizable()
                .scaledToFill()
                .frame(width: 58, height: 58)
                .clipShape(Circle())
                .overlay(Circle().stroke(BhaktiTheme.border, lineWidth: 1))

            VStack(alignment: .leading, spacing: 6) {
                Text(guide.displayName)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .lineLimit(1)

                Text(preview)
                    .font(.subheadline)
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .lineLimit(2)

                Text(timestamp)
                    .font(.caption)
                    .foregroundStyle(BhaktiTheme.textTertiary)
            }

            Spacer(minLength: 10)

            Image(systemName: "chevron.right")
                .font(.footnote.weight(.bold))
                .foregroundStyle(BhaktiTheme.textTertiary)
                .accessibilityHidden(true)
        }
        .padding(16)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

// MARK: - Creation card

private struct HistoryCreationCard: View {
    let creation: DivineCreation
    let timestamp: String

    private var base64ImageData: Data? {
        guard let payload = creation.outputImageBase64 else { return nil }
        return ImageDataURL.decodeBase64Payload(payload)
    }

    var body: some View {
        HStack(spacing: 14) {
            thumbnail

            VStack(alignment: .leading, spacing: 6) {
                Text(creation.templateTitle)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .lineLimit(2)

                Text(creation.status == .success
                     ? "Divine image ready to view"
                     : (creation.errorMessage ?? "Generation needs another try"))
                    .font(.subheadline)
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .lineLimit(2)

                HStack(spacing: 6) {
                    Circle()
                        .fill(creation.status == .success ? BhaktiTheme.accentSuccess : BhaktiTheme.accentError)
                        .frame(width: 6, height: 6)
                    Text(timestamp)
                        .font(.caption)
                        .foregroundStyle(BhaktiTheme.textTertiary)
                }
            }

            Spacer(minLength: 10)

            Image(systemName: "chevron.right")
                .font(.footnote.weight(.bold))
                .foregroundStyle(BhaktiTheme.textTertiary)
                .accessibilityHidden(true)
        }
        .padding(16)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    @ViewBuilder
    private var thumbnail: some View {
        Group {
            if let data = base64ImageData, let image = PlatformImageDecoder.decode(data) {
                Image(platformImage: image).resizable().scaledToFill()
            } else if let urlString = creation.outputImageURL, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case let .success(img): img.resizable().scaledToFill()
                    default: placeholderThumbnail
                    }
                }
            } else {
                placeholderThumbnail
            }
        }
        .frame(width: 72, height: 72)
        .background(BhaktiTheme.surfaceElevated)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(BhaktiTheme.border, lineWidth: 1))
    }

    private var placeholderThumbnail: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 18).fill(BhaktiTheme.surfaceElevated)
            VStack(spacing: 6) {
                Image(systemName: creation.status == .success ? "photo" : "exclamationmark.triangle")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.accentPrimary)
                Text(creation.status.rawValue.capitalized)
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(BhaktiTheme.textSecondary)
            }
        }
    }
}

// MARK: - Saved cards

private struct SavedMessageCard: View {
    let guideName: String
    let content: String
    let timestamp: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "bookmark.fill")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(BhaktiTheme.accentPrimary)
                .padding(.top, 2)

            VStack(alignment: .leading, spacing: 6) {
                Text(guideName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                Text(content)
                    .font(.subheadline)
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .lineLimit(3)
                Text(timestamp)
                    .font(.caption)
                    .foregroundStyle(BhaktiTheme.textTertiary)
            }
            Spacer(minLength: 10)
            Image(systemName: "chevron.right")
                .font(.footnote.weight(.bold))
                .foregroundStyle(BhaktiTheme.textTertiary)
                .accessibilityHidden(true)
        }
        .padding(16)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

private struct SavedAartiCard: View {
    let aarti: Aarti

    var body: some View {
        HStack(spacing: 14) {
            AartiThumbnailView(aarti: aarti, size: 52)

            VStack(alignment: .leading, spacing: 4) {
                Text(aarti.title)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .lineLimit(1)
                if let subtitle = aarti.subtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(BhaktiTheme.textSecondary)
                        .lineLimit(1)
                }
                Text(aarti.preview)
                    .font(.caption)
                    .foregroundStyle(BhaktiTheme.textTertiary)
                    .lineLimit(2)
            }
            Spacer(minLength: 10)
            Image(systemName: "chevron.right")
                .font(.footnote.weight(.bold))
                .foregroundStyle(BhaktiTheme.textTertiary)
                .accessibilityHidden(true)
        }
        .padding(16)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}
