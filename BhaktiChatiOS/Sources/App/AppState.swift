import Foundation

enum AppTab: Hashable {
    case home
    case bhaktiChat
    case explore
    case history

    var analyticsName: String {
        switch self {
        case .home:
            return "home"
        case .bhaktiChat:
            return "bhakti_chat"
        case .explore:
            return "explore"
        case .history:
            return "history"
        }
    }
}

@MainActor
final class AppState: ObservableObject {
    private static let threadReloadCooldown: TimeInterval = 45

    @Published var selectedTab: AppTab = .home
    @Published var selectedGuideId: String = "krishna"
    @Published var selectedThreadId: String?
    @Published private(set) var threads: [ChatThread] = []
    @Published private(set) var messagesByThread: [String: [ChatMessage]] = [:]
    @Published private(set) var divineCreations: [DivineCreation] = []
    @Published private(set) var savedAartiIDs: Set<String> = []
    @Published private(set) var authSession: AuthSession = .guest
    @Published private(set) var typingByThread: [String: String] = [:]
    @Published private(set) var sendingThreadIDs: Set<String> = []

    private var syncingThreadIDs: Set<String> = []
    private let remoteDateFormatter = ISO8601DateFormatter()
    private let fallbackRemoteDateFormatter = ISO8601DateFormatter()

    let api = BhaktiAPIClient()
    private let persistence = StatePersistence()

    /// Free-tier usage tracker. Set from `BhaktiChatAppRoot` after both stores
    /// are constructed. Optional so unit tests can leave it nil.
    weak var entitlements: EntitlementStore?

    /// Review-prompt eligibility tracker. Set from `BhaktiChatAppRoot`. Optional so unit
    /// tests can leave it nil.
    weak var reviewPrompt: ReviewPromptStore?

    init() {
        remoteDateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        fallbackRemoteDateFormatter.formatOptions = [.withInternetDateTime]
        Task {
            await loadState()
        }
    }

    func loadState() async {
        let start = Telemetry.begin("app.state.load")
        let state = await persistence.load()
        selectedGuideId = state.selectedGuideId
        threads = state.threads.sorted { $0.updatedAt > $1.updatedAt }
        messagesByThread = state.messagesByThread
        divineCreations = state.divineCreations
        savedAartiIDs = state.savedAartiIDs
        authSession = state.authSession
        selectedThreadId = nil
        Telemetry.end(
            "app.state.load",
            from: start,
            [
                "threadCount": String(threads.count),
                "creationCount": String(divineCreations.count)
            ]
        )
    }

    func signIn(name: String, email: String, provider: AuthProvider, photoURL: String = "") {
        authSession = AuthSession(
            isLoggedIn: true,
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            email: email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased(),
            photoURL: photoURL.trimmingCharacters(in: .whitespacesAndNewlines),
            provider: provider
        )
        Telemetry.track("auth.sign_in", ["provider": provider.rawValue])
        Analytics.identify(distinctId: authSession.email, userProperties: ["provider": provider.rawValue])
        persist()
    }

    func signOut() {
        NativeAuthService.signOut(provider: authSession.provider)
        authSession = .guest
        Telemetry.track("auth.sign_out")
        Analytics.reset()
        persist()
    }

    func completeNativeSignIn(_ result: NativeAuthResult) {
        signIn(
            name: result.name,
            email: result.email,
            provider: result.provider,
            photoURL: result.photoURL
        )
    }

    func restoreNativeAuthIfNeeded() async {
        guard !authSession.isLoggedIn else { return }
        guard let restoredSession = await NativeAuthService.restorePreviousGoogleSignIn() else { return }
        completeNativeSignIn(restoredSession)
    }

    func isAartiSaved(_ aartiId: String) -> Bool {
        savedAartiIDs.contains(aartiId)
    }

    func toggleSavedAarti(_ aartiId: String) {
        if savedAartiIDs.contains(aartiId) {
            savedAartiIDs.remove(aartiId)
        } else {
            savedAartiIDs.insert(aartiId)
        }
        persist()
    }

    @discardableResult
    func startThread(
        for guideId: String,
        includeOpeningScene: Bool = true,
        initialPrompt: String? = nil
    ) async -> ChatThread {
        Telemetry.track("chat.thread.start", ["guideId": guideId])
        selectedGuideId = guideId
        let thread = createThread(for: guideId, includeOpeningScene: includeOpeningScene)
        if let prompt = initialPrompt?.trimmingCharacters(in: .whitespacesAndNewlines), !prompt.isEmpty,
           let guide = GuidesCatalog.byId(guideId) {
            let threadId = thread.id
            sendingThreadIDs.insert(threadId)
            Task { @MainActor [weak self] in
                guard let self else { return }
                await self.sendMessage(text: prompt, in: threadId, guide: guide, prelocked: true)
            }
        }
        return thread
    }

    func addDivineCreation(_ creation: DivineCreation) {
        divineCreations.insert(creation, at: 0)
        persist()
    }

    /// Replaces an in-flight `.generating` placeholder with its final state once
    /// generation completes, so any observer (e.g. the pushed result screen) updates live.
    func updateDivineCreation(_ creation: DivineCreation) {
        guard let index = divineCreations.firstIndex(where: { $0.id == creation.id }) else {
            addDivineCreation(creation)
            return
        }
        divineCreations[index] = creation
        persist()
    }

    func deleteThread(_ threadId: String) {
        threads.removeAll { $0.id == threadId }
        messagesByThread.removeValue(forKey: threadId)
        if selectedThreadId == threadId { selectedThreadId = nil }
        persist()
    }

    func deleteAllThreads() {
        for thread in threads { messagesByThread.removeValue(forKey: thread.id) }
        threads.removeAll()
        selectedThreadId = nil
        persist()
    }

    func deleteDivineCreation(_ creationId: String) {
        divineCreations.removeAll { $0.id == creationId }
        persist()
    }

    /// Sets the A/B feedback rating ("up" or "down") on a creation and persists.
    func setDivineFeedback(creationId: String, rating: String) {
        guard let index = divineCreations.firstIndex(where: { $0.id == creationId }) else { return }
        divineCreations[index].feedbackRating = rating
        persist()
    }

    func deleteAllDivineCreations() {
        divineCreations.removeAll()
        persist()
    }

    func threadMessages(threadId: String) -> [ChatMessage] {
        messagesByThread[threadId] ?? []
    }

    func threadsForSelectedGuide() -> [ChatThread] {
        threads
            .filter { $0.guideId == selectedGuideId }
            .sorted { $0.updatedAt > $1.updatedAt }
    }

    @discardableResult
    func createThread(for guideId: String, includeOpeningScene: Bool = true) -> ChatThread {
        let now = Date()
        let thread = ChatThread(
            id: UUID().uuidString,
            guideId: guideId,
            createdAt: now,
            updatedAt: now,
            remoteConversationId: nil,
            stateAnchor: nil,
            earlierSummary: nil,
            lastRemoteSyncAt: nil
        )
        threads.insert(thread, at: 0)
        selectedThreadId = thread.id

        if includeOpeningScene, let guide = GuidesCatalog.byId(guideId) {
            let opening = ChatMessage(
                id: UUID().uuidString,
                threadId: thread.id,
                role: .assistant,
                content: guide.openingScene,
                createdAt: now
            )
            messagesByThread[thread.id, default: []].append(opening)
        }

        persist()
        return thread
    }

    func selectGuide(_ guideId: String) {
        selectedGuideId = guideId
        Analytics.guideSelected(guideId: guideId)
        persist()
    }

    func selectThread(_ threadId: String) {
        selectedThreadId = threadId
        if let thread = threads.first(where: { $0.id == threadId }) {
            selectedGuideId = thread.guideId
        }
    }

    func consumePendingThreadNavigation() {
        selectedThreadId = nil
    }

    func isThreadSending(_ threadId: String) -> Bool {
        sendingThreadIDs.contains(threadId)
    }

    func reloadThreadIfNeeded(threadId: String, guide: Guide) async {
        guard !sendingThreadIDs.contains(threadId) else { return }
        guard !syncingThreadIDs.contains(threadId) else { return }
        guard let thread = threads.first(where: { $0.id == threadId }) else { return }
        guard let remoteConversationId = thread.remoteConversationId, !remoteConversationId.isEmpty else { return }
        if let lastRemoteSyncAt = thread.lastRemoteSyncAt,
           Date().timeIntervalSince(lastRemoteSyncAt) < Self.threadReloadCooldown {
            return
        }

        syncingThreadIDs.insert(threadId)
        defer { syncingThreadIDs.remove(threadId) }

        do {
            let result = try await api.loadConversation(
                guideId: guide.serverPromptKey,
                conversationId: remoteConversationId,
                forceNewConversation: false,
                chatLang: chatLanguageForThread(thread)
            )

            let localMessages = threadMessages(threadId: threadId)
            let remoteMessages = convertRemoteMessages(result.messages, threadId: threadId)
            let mergedMessages = mergeLocalOpeningIfNeeded(
                localMessages: localMessages,
                remoteMessages: remoteMessages,
                threadId: threadId,
                guide: guide
            )

            guard !mergedMessages.isEmpty else { return }
            guard mergedMessages != localMessages || result.conversationId != thread.remoteConversationId else { return }

            messagesByThread[threadId] = mergedMessages
            updateThreadContext(
                threadId: threadId,
                remoteConversationId: result.conversationId ?? remoteConversationId,
                lastRemoteSyncAt: .now
            )
            persist()
        } catch {
            Telemetry.error(
                "chat.reload",
                message: error.localizedDescription,
                metadata: ["guideId": guide.id, "threadId": threadId]
            )
        }
    }

    /// Removes the trailing assistant message in the given thread (if any) and re-sends
    /// the preceding user prompt so the guide can produce a fresh reply. No-op if there
    /// is no assistant reply to regenerate or if the thread is already sending.
    func regenerateLastReply(in threadId: String, guide: Guide) async {
        guard !sendingThreadIDs.contains(threadId) else { return }
        var current = threadMessages(threadId: threadId)
        guard let lastIndex = current.lastIndex(where: { $0.role == .assistant }) else { return }

        // The most recent user message before this assistant reply is the prompt
        // we'll resend. If we can't find one there is nothing to regenerate.
        let prefix = current.prefix(lastIndex)
        guard let lastUser = prefix.reversed().first(where: { $0.role == .user }) else { return }
        let prompt = lastUser.content

        // Drop the assistant reply AND the originating user prompt so `sendMessage`
        // can re-append the prompt cleanly without producing a duplicate user bubble.
        current.remove(at: lastIndex)
        if let userIdx = current.lastIndex(where: { $0.id == lastUser.id }) {
            current.remove(at: userIdx)
        }
        messagesByThread[threadId] = current
        persist()

        await sendMessage(text: prompt, in: threadId, guide: guide)
    }

    func sendMessage(text: String, in threadId: String, guide: Guide, prelocked: Bool = false) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if !prelocked, sendingThreadIDs.contains(threadId) { return }
        Telemetry.track("chat.send", ["guideId": guide.id])

        sendingThreadIDs.insert(threadId)
        defer {
            typingByThread[threadId] = nil
            sendingThreadIDs.remove(threadId)
        }

        let user = ChatMessage(
            id: UUID().uuidString,
            threadId: threadId,
            role: .user,
            content: trimmed,
            createdAt: .now
        )
        messagesByThread[threadId, default: []].append(user)
        touchThread(threadId)
        persist()

        let threadContext = threads.first(where: { $0.id == threadId })
        let conversationId = threadContext?.remoteConversationId
        let promptPayload = ChatPromptSupport.buildPayload(
            guide: guide,
            message: trimmed,
            existingMessages: threadMessages(threadId: threadId),
            stateAnchor: threadContext?.stateAnchor,
            earlierSummary: threadContext?.earlierSummary,
            firstName: firstNameFromAuth()
        )
        let request = SendChatRequest(
            guideId: guide.serverPromptKey,
            conversationId: conversationId,
            forceNewConversation: false,
            chatLang: promptPayload.chatLang,
            message: trimmed,
            systemPrompt: promptPayload.systemPrompt,
            developerPrompt: promptPayload.developerPrompt,
            languageInstruction: promptPayload.languageInstruction,
            guidePersonaPrompt: promptPayload.guidePersonaPrompt,
            modeInstruction: promptPayload.modeInstruction,
            systemPromptStack: promptPayload.systemPromptStack,
            stateAnchor: threadContext?.stateAnchor,
            earlierSummary: threadContext?.earlierSummary,
            firstName: firstNameFromAuth(),
            secondaryGuard: promptPayload.secondaryGuard
        )

        var reply = ""
        var nextConversationId = conversationId
        typingByThread[threadId] = ""

        do {
            for try await event in api.streamChat(request) {
                switch event {
                case let .token(token):
                    reply += token
                case let .conversationId(id):
                    if let id, !id.isEmpty {
                        nextConversationId = id
                    }
                case .done:
                    typingByThread[threadId] = nil
                    if !reply.isEmpty {
                        let assistant = ChatMessage(
                            id: UUID().uuidString,
                            threadId: threadId,
                            role: .assistant,
                            content: reply,
                            createdAt: .now
                        )
                        messagesByThread[threadId, default: []].append(assistant)
                        updateThreadContext(
                            threadId: threadId,
                            remoteConversationId: nextConversationId,
                            lastRemoteSyncAt: .now
                        )
                        persist()
                        // Count toward free-tier quota only on a *successful*
                        // assistant reply (server errors don't burn quota).
                        entitlements?.recordMessageSent()
                        reviewPrompt?.recordMessageSent()
                        Analytics.chatMessageSent(guideId: guide.id)
                    }
                case let .error(message):
                    typingByThread[threadId] = nil
                    Telemetry.error("chat.send", message: message, metadata: ["guideId": guide.id])
                    let assistant = ChatMessage(
                        id: UUID().uuidString,
                        threadId: threadId,
                        role: .assistant,
                        content: "Error: \(message)",
                        createdAt: .now
                    )
                    messagesByThread[threadId, default: []].append(assistant)
                    updateThreadContext(
                        threadId: threadId,
                        remoteConversationId: nextConversationId
                    )
                    persist()
                case .limitReached:
                    // Not a real failure — don't log as an error, don't burn quota (mirrors
                    // Android's early-return on ChatLimitReachedException), and show a warm
                    // reply rather than an "Error:"-prefixed one or the raw backend JSON.
                    typingByThread[threadId] = nil
                    Telemetry.track("chat.limit_reached", ["guideId": guide.id])
                    let assistant = ChatMessage(
                        id: UUID().uuidString,
                        threadId: threadId,
                        role: .assistant,
                        content: "I've reached my reply limit for now — thank you for your patience. Please try again in a little while, or feel free to ask me something else in the meantime.",
                        createdAt: .now
                    )
                    messagesByThread[threadId, default: []].append(assistant)
                    updateThreadContext(
                        threadId: threadId,
                        remoteConversationId: nextConversationId
                    )
                    persist()
                }
            }
        } catch {
            typingByThread[threadId] = nil
            Telemetry.error("chat.send", message: error.localizedDescription, metadata: ["guideId": guide.id])
            let assistant = ChatMessage(
                id: UUID().uuidString,
                threadId: threadId,
                role: .assistant,
                content: "Error: \(error.localizedDescription)",
                createdAt: .now
            )
            messagesByThread[threadId, default: []].append(assistant)
            updateThreadContext(
                threadId: threadId,
                remoteConversationId: nextConversationId
            )
            persist()
        }
    }

    private func updateThreadContext(threadId: String, remoteConversationId: String?) {
        updateThreadContext(threadId: threadId, remoteConversationId: remoteConversationId, lastRemoteSyncAt: nil)
    }

    private func updateThreadContext(threadId: String, remoteConversationId: String?, lastRemoteSyncAt: Date?) {
        let all = threadMessages(threadId: threadId)
        let recent = all.suffix(6)
        let locale = ChatPromptSupport.threadLanguage(for: all)
        let turns: [[String: String]] = recent.map { ["role": $0.role.rawValue, "content": $0.content] }
        let anchorData = try? JSONSerialization.data(withJSONObject: ["recentTurns": turns, "locale": locale], options: [])
        let anchor = anchorData.flatMap { String(data: $0, encoding: .utf8) }

        let olderCount = max(0, all.count - recent.count)
        let summary = olderCount > 0 ? "Conversation has \(olderCount) earlier messages before recent turns." : nil
        touchThread(
            threadId,
            remoteConversationId: remoteConversationId,
            stateAnchor: anchor,
            earlierSummary: summary,
            lastRemoteSyncAt: lastRemoteSyncAt
        )
    }

    private func touchThread(
        _ threadId: String,
        remoteConversationId: String? = nil,
        stateAnchor: String? = nil,
        earlierSummary: String? = nil,
        lastRemoteSyncAt: Date? = nil
    ) {
        guard let index = threads.firstIndex(where: { $0.id == threadId }) else { return }
        threads[index].updatedAt = .now
        if let remoteConversationId {
            threads[index].remoteConversationId = remoteConversationId
        }
        if let stateAnchor {
            threads[index].stateAnchor = stateAnchor
        }
        threads[index].earlierSummary = earlierSummary
        if let lastRemoteSyncAt {
            threads[index].lastRemoteSyncAt = lastRemoteSyncAt
        }
        let updated = threads.remove(at: index)
        threads.insert(updated, at: 0)
    }

    private func persist() {
        let payload = PersistedChatState(
            selectedGuideId: selectedGuideId,
            threads: threads,
            messagesByThread: messagesByThread,
            divineCreations: divineCreations,
            savedAartiIDs: savedAartiIDs,
            authSession: authSession
        )
        Task {
            await persistence.save(payload)
        }
    }

    private func firstNameFromAuth() -> String? {
        guard authSession.isLoggedIn else { return nil }
        let name = authSession.name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return nil }
        let first = name.components(separatedBy: .whitespaces).first?.trimmingCharacters(in: .whitespacesAndNewlines)
        return first?.isEmpty == false ? first : nil
    }

    private func chatLanguageForThread(_ thread: ChatThread) -> String {
        let messages = threadMessages(threadId: thread.id)
        if !messages.isEmpty {
            return ChatPromptSupport.threadLanguage(for: messages)
        }

        guard let payload = thread.stateAnchor else { return "en" }
        if payload.contains("\"locale\":\"hinglish\"") || payload.contains("\"locale\": \"hinglish\"") {
            return "hinglish"
        }
        if payload.contains("\"locale\":\"hi\"") || payload.contains("\"locale\": \"hi\"") {
            return "hi"
        }
        return "en"
    }

    private func convertRemoteMessages(_ remoteMessages: [RemoteChatMessage], threadId: String) -> [ChatMessage] {
        remoteMessages.compactMap { remote in
            guard let role = ChatRole(rawValue: remote.role.lowercased()) else { return nil }
            let content = remote.content.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !content.isEmpty else { return nil }

            return ChatMessage(
                id: remote.id.isEmpty ? UUID().uuidString : remote.id,
                threadId: threadId,
                role: role,
                content: content,
                createdAt: parseRemoteDate(remote.createdAt)
            )
        }
        .sorted { $0.createdAt < $1.createdAt }
    }

    private func mergeLocalOpeningIfNeeded(
        localMessages: [ChatMessage],
        remoteMessages: [ChatMessage],
        threadId: String,
        guide: Guide
    ) -> [ChatMessage] {
        guard let opening = localMessages.first,
              opening.role == .assistant,
              opening.content == guide.openingScene else {
            return remoteMessages
        }

        let remoteContainsOpening = remoteMessages.contains { message in
            message.role == .assistant && message.content == guide.openingScene
        }

        guard !remoteContainsOpening else { return remoteMessages }

        var merged = remoteMessages
        merged.insert(
            ChatMessage(
                id: opening.id,
                threadId: threadId,
                role: opening.role,
                content: opening.content,
                createdAt: opening.createdAt
            ),
            at: 0
        )
        return merged
    }

    private func parseRemoteDate(_ raw: String?) -> Date {
        guard let raw, !raw.isEmpty else { return .now }
        if let precise = remoteDateFormatter.date(from: raw) {
            return precise
        }
        return fallbackRemoteDateFormatter.date(from: raw) ?? .now
    }

}
