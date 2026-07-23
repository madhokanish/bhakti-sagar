import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// Bhakti Chat tab — the user's entry point for starting a conversation.
///
/// Layout philosophy (v2 redesign):
///   • Top bar is minimal — profile · "Bhakti Chat" title · PRO pill.
///     (The old guide-menu pill in the middle was removed; the Guides row
///     below is the single source of truth for guide selection.)
///   • A small contextual hero that reflects the active guide.
///   • Guides row — horizontal scrolling avatars. The right edge fades into
///     the background to hint at scroll without using a literal "Swipe" label.
///   • Continue your chats — recent threads with the *currently selected guide*
///     so the user can pick up where they left off without leaving the tab.
///     Hidden for new users / guides with no prior threads.
///   • Start with a prompt — categorised quick-start chips, each with a small
///     contextual icon for visual variety.
///   • Composer with a per-guide placeholder ("Ask Krishna anything…").
struct BhaktiChatHubScreen: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var entitlements: EntitlementStore
    @StateObject private var keyboard = KeyboardObserver()
    @StateObject private var speech = SpeechInputManager()
    @AppStorage("bhakti_pinned_guides") private var pinnedIdsRaw: String = ""
    @State private var path: [String] = []
    @State private var input = ""
    @State private var isLaunchingThread = false
    @State private var lastTranscript: String = ""
    private let composerClearance = BhaktiBottomNavBar.overlayClearance

    // MARK: - Derived state

    private var pinnedIds: Set<String> {
        Set(pinnedIdsRaw.split(separator: ",").map(String.init).filter { !$0.isEmpty })
    }

    private func togglePin(_ id: String) {
        var ids = pinnedIds
        if ids.contains(id) { ids.remove(id) } else { ids.insert(id) }
        pinnedIdsRaw = ids.sorted().joined(separator: ",")
    }

    private var orderedGuides: [Guide] {
        let pinned = pinnedIds
        let (p, rest) = GuidesCatalog.all.reduce(into: ([Guide](), [Guide]())) { acc, g in
            if pinned.contains(g.id) { acc.0.append(g) } else { acc.1.append(g) }
        }
        return p + rest
    }

    private var selectedGuide: Guide {
        GuidesCatalog.byId(appState.selectedGuideId) ?? GuidesCatalog.all[0]
    }

    private var promptChips: [String] {
        DiscoveryCatalog.hubPromptChips[selectedGuide.id] ?? []
    }

    /// Most recent threads with the *selected* guide. Capped at 3 so we never
    /// overwhelm the screen, and only rendered if the user has at least one.
    private var recentThreadsWithSelectedGuide: [ChatThread] {
        appState.threads
            .filter { $0.guideId == selectedGuide.id }
            .sorted { $0.updatedAt > $1.updatedAt }
            .prefix(3)
            .map { $0 }
    }

    private var canSendTypedPrompt: Bool {
        !input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isLaunchingThread
    }

    private var composerPlaceholder: String {
        "Ask \(selectedGuide.displayName) anything…"
    }

    // MARK: - Body

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    hero
                    guidesSection
                    if !recentThreadsWithSelectedGuide.isEmpty {
                        recentChatsSection
                    }
                    promptsSection
                }
                .padding(.horizontal, 16)
                .padding(.top, 4)
                .padding(.bottom, 12)
            }
            .scrollDismissesKeyboard(.interactively)
            .bhaktiPageBackground()
            .bhaktiHideNavigationBar()
            .safeAreaInset(edge: .top, spacing: 0) { topBar }
            .safeAreaInset(edge: .bottom, spacing: 0) { composerBar }
            .navigationDestination(for: String.self) { threadId in
                if let thread = appState.threads.first(where: { $0.id == threadId }),
                   let guide = GuidesCatalog.byId(thread.guideId) {
                    ChatThreadScreen(thread: thread, guide: guide)
                } else {
                    Text("Chat not found")
                        .foregroundStyle(BhaktiTheme.textSecondary)
                        .bhaktiPageBackground()
                }
            }
            .onAppear(perform: openPendingThreadIfNeeded)
            .onChange(of: appState.selectedThreadId) { _, _ in
                openPendingThreadIfNeeded()
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
                Text("Bhakti Chat")
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

    // MARK: - Hero (contextual, slim)

    private var hero: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(heroPrompt)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(BhaktiTheme.textPrimary)
                .fixedSize(horizontal: false, vertical: true)
                .lineLimit(2)
        }
    }

    private var heroPrompt: String {
        "What would you like to ask \(selectedGuide.displayName)?"
    }

    // MARK: - Guides section

    private var guidesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your guides")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)

            ZStack(alignment: .trailing) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 14) {
                        ForEach(orderedGuides) { guide in
                            guideChip(for: guide)
                        }
                    }
                    .padding(.horizontal, 2)
                    .padding(.vertical, 2)
                    .padding(.trailing, 16) // ensures last item isn't cut by the fade
                }

                // Right-edge fade to elegantly suggest horizontal scroll.
                LinearGradient(
                    colors: [BhaktiTheme.background.opacity(0), BhaktiTheme.background],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(width: 30)
                .allowsHitTesting(false)
            }
        }
    }

    @ViewBuilder
    private func guideChip(for guide: Guide) -> some View {
        let isPinned = pinnedIds.contains(guide.id)
        let isSelected = appState.selectedGuideId == guide.id

        Button {
            appState.selectGuide(guide.id)
#if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
#endif
        } label: {
            ZStack(alignment: .topTrailing) {
                GuideAvatarItemView(
                    title: guide.displayName,
                    imageAssetName: guide.avatarAssetName,
                    isSelected: isSelected,
                    selectedTextColor: BhaktiTheme.accentPrimary,
                    unselectedTextColor: BhaktiTheme.textSecondary,
                    itemWidth: 86,
                    outerDiameter: 72,
                    imageDiameter: 60
                )

                if isPinned {
                    Image(systemName: "pin.fill")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(3)
                        .background(BhaktiTheme.accentPrimary)
                        .clipShape(Circle())
                        .offset(x: -4, y: 0)
                        .accessibilityHidden(true)
                }
            }
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button {
                togglePin(guide.id)
            } label: {
                Label(isPinned ? "Unpin guide" : "Pin to top",
                      systemImage: isPinned ? "pin.slash" : "pin")
            }
        }
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }

    // MARK: - Recent chats section

    private var recentChatsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Continue your chats")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)

                Spacer()

                Text("with \(selectedGuide.displayName)")
                    .font(.system(size: 12))
                    .foregroundStyle(BhaktiTheme.textTertiary)
            }

            VStack(spacing: 8) {
                ForEach(recentThreadsWithSelectedGuide) { thread in
                    recentThreadRow(thread)
                }
            }
        }
    }

    private func recentThreadRow(_ thread: ChatThread) -> some View {
        let lastMessage = appState.threadMessages(threadId: thread.id).last
        let preview = lastMessage?.content.trimmingCharacters(in: .whitespacesAndNewlines) ?? "New conversation"
        let isFromUser = lastMessage?.role == .user

        return Button {
            path.append(thread.id)
        } label: {
            HStack(alignment: .center, spacing: 12) {
                PackageAssetLoader.image(named: selectedGuide.avatarAssetName)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 40, height: 40)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(BhaktiTheme.accentPrimary.opacity(0.2), lineWidth: 1))

                VStack(alignment: .leading, spacing: 2) {
                    Text(preview)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .lineLimit(1)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 4) {
                        if !isFromUser, lastMessage != nil {
                            Image(systemName: "arrow.uturn.left")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(BhaktiTheme.textTertiary)
                                .accessibilityHidden(true)
                        }
                        Text(relativeTime(thread.updatedAt))
                            .font(.system(size: 11))
                            .foregroundStyle(BhaktiTheme.textTertiary)
                    }
                }

                Spacer(minLength: 0)

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textTertiary)
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(BhaktiTheme.surface)
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(BhaktiTheme.border, lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Continue chat: \(preview)")
    }

    // MARK: - Prompts section

    private var promptsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(recentThreadsWithSelectedGuide.isEmpty ? "Start with a prompt" : "Or start fresh")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)

            // 2x2 grid stays — but cards now have per-prompt accent icons.
            VStack(spacing: 10) {
                ForEach(Array(promptChips.chunked(into: 2).prefix(2)), id: \.self) { row in
                    HStack(spacing: 10) {
                        ForEach(row, id: \.self) { prompt in
                            Button {
                                startThread(prompt: prompt)
                            } label: {
                                HubPromptTile(
                                    text: prompt,
                                    iconSystemName: promptIcon(for: prompt)
                                )
                            }
                            .buttonStyle(.plain)
                        }

                        if row.count == 1 {
                            Spacer().frame(maxWidth: .infinity)
                        }
                    }
                }
            }
        }
    }

    /// Maps a prompt's keywords to an SF Symbol so each card has a unique
    /// micro-icon — adds visual variety without color-coding.
    private func promptIcon(for prompt: String) -> String {
        let p = prompt.lowercased()
        if p.contains("money") || p.contains("save") || p.contains("financial") || p.contains("career") {
            return "indianrupeesign.circle.fill"
        }
        if p.contains("fear") || p.contains("protect") {
            return "shield.fill"
        }
        if p.contains("courage") {
            return "flame.fill"
        }
        if p.contains("discipline") || p.contains("consistent") {
            return "scalemass.fill"
        }
        if p.contains("calm") || p.contains("peace") || p.contains("still") || p.contains("detach") || p.contains("ease") {
            return "leaf.fill"
        }
        if p.contains("dharma") || p.contains("gita") || p.contains("verse") || p.contains("mahabharata") || p.contains("story") {
            return "book.fill"
        }
        if p.contains("karma") || p.contains("lesson") {
            return "arrow.triangle.2.circlepath"
        }
        if p.contains("bless") {
            return "sparkles"
        }
        if p.contains("confusion") {
            return "questionmark.bubble.fill"
        }
        return "sparkle"
    }

    // MARK: - Composer

    private var composerBar: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField(composerPlaceholder, text: $input, axis: .vertical)
                .lineLimit(1...4)
                .submitLabel(.send)
                .onSubmit { submitTypedPrompt() }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(BhaktiTheme.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(BhaktiTheme.border, lineWidth: 1.5)
                )
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .foregroundStyle(BhaktiTheme.textPrimary)
                .onChange(of: speech.transcribedText) { _, newValue in
                    guard !newValue.isEmpty, newValue != lastTranscript else { return }
                    let delta = newValue.hasPrefix(lastTranscript)
                        ? String(newValue.dropFirst(lastTranscript.count))
                        : newValue
                    if !delta.isEmpty { input += delta }
                    lastTranscript = newValue
                }
                .onChange(of: speech.isRecording) { _, recording in
                    if !recording { lastTranscript = "" }
                }

            Button {
                Task { await speech.toggleRecording() }
            } label: {
                Image(systemName: speech.isRecording ? "mic.fill" : "mic")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(speech.isRecording ? Color.white : BhaktiTheme.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(
                        Circle().fill(speech.isRecording ? BhaktiTheme.accentError : BhaktiTheme.surface)
                    )
                    .overlay(Circle().stroke(BhaktiTheme.border, lineWidth: speech.isRecording ? 0 : 1))
            }
            .buttonStyle(BhaktiPressEffect())
            .accessibilityLabel(speech.isRecording ? "Stop dictation" : "Start dictation")

            Button {
                submitTypedPrompt()
            } label: {
                ZStack {
                    Circle()
                        .fill(BhaktiTheme.accentGradient)
                        .frame(width: 48, height: 48)

                    if isLaunchingThread {
                        ProgressView()
                            .progressViewStyle(.circular)
                            .tint(.white)
                            .scaleEffect(0.72)
                    } else {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                .opacity(canSendTypedPrompt ? 1 : 0.45)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Send")
            .disabled(!canSendTypedPrompt)
        }
        .padding(.horizontal, 12)
        .padding(.top, 10)
        .padding(.bottom, 10 + (keyboard.isVisible ? 0 : composerClearance))
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(BhaktiTheme.border.opacity(0.85))
                .frame(height: 1)
        }
    }

    // MARK: - Helpers

    private func startThread(prompt: String) {
        // Hard gate: starting a thread sends a first message, so it counts
        // against the chat quota. Block at the entry point.
        if !entitlements.canUseChat {
            entitlements.presentForBlockedFeature(.messageQuota)
            return
        }
        isLaunchingThread = true
        Task {
            _ = await appState.startThread(
                for: selectedGuide.id,
                includeOpeningScene: false,
                initialPrompt: prompt
            )
            isLaunchingThread = false
        }
    }

    private func submitTypedPrompt() {
        let prompt = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !prompt.isEmpty, !isLaunchingThread else { return }
        input = ""
        startThread(prompt: prompt)
    }

    private func openPendingThreadIfNeeded() {
        guard let threadId = appState.selectedThreadId else { return }
        guard path.last != threadId else { return }
        path = [threadId]
        appState.consumePendingThreadNavigation()
    }

    private func relativeTime(_ date: Date) -> String {
        let interval = Date.now.timeIntervalSince(date)
        if interval < 60                 { return "just now" }
        if interval < 3600               { return "\(Int(interval / 60))m ago" }
        if interval < 86_400             { return "\(Int(interval / 3600))h ago" }
        if interval < 2 * 86_400         { return "yesterday" }
        if interval < 7 * 86_400         { return "\(Int(interval / 86_400))d ago" }
        let f = DateFormatter()
        f.dateFormat = "d MMM"
        return f.string(from: date)
    }
}

// MARK: - HubPromptTile (per-prompt accent icon)

private struct HubPromptTile: View {
    let text: String
    let iconSystemName: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack {
                Circle()
                    .fill(BhaktiTheme.accentPrimary.opacity(0.13))
                    .frame(width: 32, height: 32)
                Image(systemName: iconSystemName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.accentPrimary)
            }

            Text(text)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)
                .multilineTextAlignment(.leading)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, minHeight: 90, alignment: .topLeading)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Array.chunked(into:)

private extension Array {
    func chunked(into size: Int) -> [[Element]] {
        guard size > 0 else { return [self] }
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0 ..< Swift.min($0 + size, count)])
        }
    }
}
