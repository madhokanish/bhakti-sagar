import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct ChatThreadScreen: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var bookmarks: BookmarkStore
    @EnvironmentObject private var entitlements: EntitlementStore
    @StateObject private var keyboard = KeyboardObserver()
    @StateObject private var speech = SpeechInputManager()

    let thread: ChatThread
    let guide: Guide

    @State private var input = ""
    @State private var isSendButtonPressed = false
    @State private var isAtBottom = true
    @State private var latestAssistantReply: ChatMessage? = nil
    @State private var lastTranscript: String = ""
    private let composerClearance = BhaktiBottomNavBar.overlayClearance

    private var messages: [ChatMessage] {
        appState.threadMessages(threadId: thread.id)
    }

    private var isSending: Bool {
        appState.isThreadSending(thread.id)
    }

    private var shouldShowTypingIndicator: Bool {
        isSending && messages.last?.role == .user
    }

    private func computeLatestAssistantReply(from msgs: [ChatMessage]) -> ChatMessage? {
        msgs.reversed().first(where: { $0.role == .assistant && !$0.content.hasPrefix("Error:") })
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 10) {
                        ForEach(Array(messages.enumerated()), id: \.element.id) { index, message in
                            if index == 0 || !Calendar.current.isDate(message.createdAt, inSameDayAs: messages[index - 1].createdAt) {
                                DateSeparatorView(label: dateSeparatorLabel(for: message.createdAt))
                            }
                            let isLastAssistant = message.role == .assistant
                                && message.id == latestAssistantReply?.id
                                && !message.content.hasPrefix("Error:")
                            ChatBubbleRow(
                                text: message.content,
                                isUser: message.role == .user,
                                avatarAssetName: guide.avatarAssetName,
                                timestamp: timestampText(for: message.createdAt),
                                isError: message.content.hasPrefix("Error:"),
                                isBookmarked: bookmarks.isMessageBookmarked(message.id),
                                showBookmark: message.role == .assistant,
                                showRegenerate: isLastAssistant,
                                isRegenerating: isSending,
                                onCopy: { copyToPasteboard(message.content) },
                                onToggleBookmark: { bookmarks.toggleMessage(message.id) },
                                onRegenerate: {
                                    Task { await appState.regenerateLastReply(in: thread.id, guide: guide) }
                                }
                            )
                            .id(message.id)
                        }

                        if shouldShowTypingIndicator {
                            TypingBubbleRow(avatarAssetName: guide.avatarAssetName)
                                .id("typing")
                        }

                        Color.clear.frame(height: 1).id("bottom")
                            .onAppear { isAtBottom = true }
                            .onDisappear { isAtBottom = false }
                    }
                    .padding(.horizontal, BhaktiTheme.Spacing.md)
                    .padding(.top, BhaktiTheme.Spacing.lg)
                    .padding(.bottom, BhaktiTheme.Spacing.xl)
                }
                .scrollDismissesKeyboard(.interactively)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .overlay(alignment: .bottomTrailing) {
                    if !isAtBottom {
                        Button {
                            withAnimation(BhaktiTheme.Animation.spring) {
                                proxy.scrollTo("bottom", anchor: .bottom)
                            }
                        } label: {
                            Image(systemName: "arrow.down.circle.fill")
                                .font(.system(size: 32, weight: .semibold))
                                .foregroundStyle(BhaktiTheme.accentPrimary)
                                .background(Color.white.clipShape(Circle()))
                                .shadow(color: BhaktiTheme.border, radius: 6, x: 0, y: 3)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Scroll to latest message")
                        .padding(.trailing, BhaktiTheme.Spacing.lg)
                        .padding(.bottom, BhaktiTheme.Spacing.md)
                        .transition(.scale(scale: 0.7).combined(with: .opacity))
                    }
                }
                .animation(BhaktiTheme.Animation.spring, value: isAtBottom)
                .onAppear {
                    scrollToBottom(proxy: proxy, animated: false)
                    latestAssistantReply = computeLatestAssistantReply(from: messages)
                }
                .onChange(of: messages.count) { _, _ in
                    scrollToBottom(proxy: proxy)
                    latestAssistantReply = computeLatestAssistantReply(from: messages)
                }
                .onChange(of: shouldShowTypingIndicator) { _, _ in scrollToBottom(proxy: proxy) }
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) { composerBar }
        .task(id: thread.id) { await appState.reloadThreadIfNeeded(threadId: thread.id, guide: guide) }
        .bhaktiPageBackground()
        .bhaktiHideNavigationBar()
    }

    // MARK: - Top bar

    private var topBar: some View {
        HStack(spacing: BhaktiTheme.Spacing.md) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .frame(width: 40, height: 40)
                    .background(BhaktiTheme.surface)
                    .overlay(Circle().stroke(BhaktiTheme.border, lineWidth: 1))
                    .clipShape(Circle())
            }
            .buttonStyle(BhaktiPressEffect())
            .accessibilityLabel("Back")

            PackageAssetLoader.image(named: guide.avatarAssetName)
                .resizable()
                .scaledToFill()
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                .overlay(Circle().stroke(BhaktiTheme.accentPrimary.opacity(0.4), lineWidth: 1.5))
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text(guide.displayName)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)

                HStack(spacing: 5) {
                    Circle()
                        .fill(BhaktiTheme.accentSuccess)
                        .frame(width: 7, height: 7)
                    Text(guide.status)
                        .font(.system(size: 12))
                        .foregroundStyle(BhaktiTheme.textSecondary)
                }
            }

            Spacer()

            Menu {
                if let latestAssistantReply {
                    Button {
                        copyToPasteboard(latestAssistantReply.content)
                    } label: {
                        Label("Copy latest reply", systemImage: "doc.on.doc")
                    }
                }
                Button {
                    copyToPasteboard(conversationTranscript())
                } label: {
                    Label("Copy conversation", systemImage: "text.append")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .frame(width: 40, height: 40)
                    .background(BhaktiTheme.surface)
                    .overlay(Circle().stroke(BhaktiTheme.border, lineWidth: 1))
                    .clipShape(Circle())
            }
            .buttonStyle(BhaktiPressEffect())
            .accessibilityLabel("Chat options")
        }
        .padding(.horizontal, BhaktiTheme.Spacing.md)
        .padding(.top, BhaktiTheme.Spacing.sm)
        .padding(.bottom, BhaktiTheme.Spacing.md)
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(BhaktiTheme.border.opacity(0.7))
                .frame(height: 0.5)
        }
    }

    // MARK: - Composer

    private var composerBar: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(BhaktiTheme.border.opacity(0.7))
                .frame(height: 0.5)

            HStack(alignment: .bottom, spacing: BhaktiTheme.Spacing.sm) {
                TextField("Share what's on your mind…", text: $input, axis: .vertical)
                    .lineLimit(1...5)
                    .submitLabel(.send)
                    .onSubmit { Task { await send() } }
                    .padding(.horizontal, BhaktiTheme.Spacing.lg)
                    .padding(.vertical, BhaktiTheme.Spacing.md)
                    .frame(minHeight: 48, alignment: .leading)
                    .background(BhaktiTheme.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg)
                            .stroke(BhaktiTheme.border, lineWidth: 1.5)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .onChange(of: speech.transcribedText) { _, newValue in
                        // Append only the newly transcribed delta so user-typed text is preserved.
                        guard !newValue.isEmpty, newValue != lastTranscript else { return }
                        let delta: String
                        if newValue.hasPrefix(lastTranscript) {
                            delta = String(newValue.dropFirst(lastTranscript.count))
                        } else {
                            delta = newValue
                        }
                        if !delta.isEmpty {
                            input += delta
                        }
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
                        .frame(width: 46, height: 46)
                        .background(
                            Circle().fill(speech.isRecording ? BhaktiTheme.accentError : BhaktiTheme.surface)
                        )
                        .overlay(Circle().stroke(BhaktiTheme.border, lineWidth: speech.isRecording ? 0 : 1))
                }
                .buttonStyle(BhaktiPressEffect())
                .accessibilityLabel(speech.isRecording ? "Stop dictation" : "Start dictation")

                let canSend = !isSending && !input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty

                Button {
                    Task { await send() }
                } label: {
                    ZStack {
                        Circle()
                            .fill(canSend ? BhaktiTheme.accentGradient : LinearGradient(colors: [BhaktiTheme.surface], startPoint: .top, endPoint: .bottom))
                            .overlay(Circle().stroke(BhaktiTheme.border, lineWidth: canSend ? 0 : 1))

                        if isSending {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(BhaktiTheme.textSecondary)
                                .scaleEffect(0.75)
                        } else {
                            Image(systemName: "arrow.up")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(canSend ? Color.white : BhaktiTheme.textTertiary)
                        }
                    }
                    .frame(width: 46, height: 46)
                    .scaleEffect(isSendButtonPressed ? 0.92 : 1)
                    .animation(BhaktiTheme.Animation.quick, value: isSendButtonPressed)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Send message")
                .disabled(!canSend)
                .simultaneousGesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { _ in isSendButtonPressed = true }
                        .onEnded { _ in isSendButtonPressed = false }
                )
            }
            .padding(.horizontal, BhaktiTheme.Spacing.md)
            .padding(.top, BhaktiTheme.Spacing.md)
            .padding(.bottom, BhaktiTheme.Spacing.md + (keyboard.isVisible ? 0 : composerClearance))
            .background(.ultraThinMaterial)
        }
    }

    // MARK: - Helpers

    @MainActor
    private func send() async {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        // Hard gate: if the user has burned through their free chat quota
        // they must subscribe before sending another message. We do NOT
        // clear the input — keep the message so they can send it after
        // subscribing.
        if !entitlements.canUseChat {
            entitlements.presentForBlockedFeature(.messageQuota)
            return
        }

        input = ""
#if canImport(UIKit)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
#endif
        await appState.sendMessage(text: text, in: thread.id, guide: guide)
    }

    private func scrollToBottom(proxy: ScrollViewProxy, animated: Bool = true) {
        if animated {
            withAnimation(BhaktiTheme.Animation.normal) { proxy.scrollTo("bottom", anchor: .bottom) }
        } else {
            proxy.scrollTo("bottom", anchor: .bottom)
        }
    }

    private func dateSeparatorLabel(for date: Date) -> String {
        let cal = Calendar.current
        if cal.isDateInToday(date) { return "Today" }
        if cal.isDateInYesterday(date) { return "Yesterday" }
        let f = DateFormatter()
        f.dateFormat = "d MMM"
        return f.string(from: date)
    }

    private func timestampText(for date: Date) -> String {
        let ago = Date.now.timeIntervalSince(date)
        if ago < 60 { return "just now" }
        if ago < 3600 { return "\(Int(ago / 60))m ago" }
        return Self.clockFormatter.string(from: date)
    }

    private func conversationTranscript() -> String {
        messages
            .map { "\($0.role == .user ? "You" : guide.displayName): \($0.content)" }
            .joined(separator: "\n\n")
    }

    private func copyToPasteboard(_ text: String) {
#if canImport(UIKit)
        UIPasteboard.general.string = text
        UINotificationFeedbackGenerator().notificationOccurred(.success)
#endif
    }

    private static let clockFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()
}

// MARK: - Date separator

private struct DateSeparatorView: View {
    let label: String

    var body: some View {
        HStack(spacing: 10) {
            Rectangle()
                .fill(BhaktiTheme.border)
                .frame(height: 1)
            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(BhaktiTheme.textTertiary)
                .fixedSize()
            Rectangle()
                .fill(BhaktiTheme.border)
                .frame(height: 1)
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Chat bubble

private struct ChatBubbleRow: View {
    let text: String
    let isUser: Bool
    let avatarAssetName: String
    let timestamp: String?
    let isError: Bool
    var isBookmarked: Bool = false
    var showBookmark: Bool = false
    var showRegenerate: Bool = false
    var isRegenerating: Bool = false
    let onCopy: () -> Void
    var onToggleBookmark: () -> Void = {}
    var onRegenerate: () -> Void = {}

    private let maxBubbleWidth: CGFloat = 280

    private var displaySegments: [String] {
        if isUser { return [text] }
        let formatted = GuideReplyFormatter.format(text)
        let parts = formatted
            .components(separatedBy: "\n\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? [formatted] : parts
    }

    private var bubbleColor: Color {
        if isError { return BhaktiTheme.accentError.opacity(0.15) }
        return isUser ? BhaktiTheme.accentPrimary : BhaktiTheme.surface
    }

    private var bubbleBorder: Color {
        if isError { return BhaktiTheme.accentError.opacity(0.4) }
        return isUser ? Color.clear : BhaktiTheme.border
    }

    var body: some View {
        HStack(alignment: .bottom, spacing: BhaktiTheme.Spacing.sm) {
            if isUser {
                Spacer(minLength: 56)
            } else {
                PackageAssetLoader.image(named: avatarAssetName)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 28, height: 28)
                    .clipShape(Circle())
                    .padding(.bottom, 20)
            }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 6) {
                // stable order; segments are derived from `text` and never reorder, so offset is safe
                ForEach(Array(displaySegments.enumerated()), id: \.offset) { index, segment in
                    Text(segment)
                        .font(.system(size: 15))
                        .foregroundStyle(isError ? BhaktiTheme.accentError : (isUser ? Color.white : BhaktiTheme.textPrimary))
                        .multilineTextAlignment(isUser ? .trailing : .leading)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, BhaktiTheme.Spacing.md)
                        .padding(.vertical, 10)
                        .background(bubbleColor)
                        .overlay(
                            BubbleShape(isUser: isUser, hasMultiple: displaySegments.count > 1, index: index, total: displaySegments.count)
                                .stroke(bubbleBorder, lineWidth: 1)
                        )
                        .clipShape(BubbleShape(isUser: isUser, hasMultiple: displaySegments.count > 1, index: index, total: displaySegments.count))
                        .frame(maxWidth: maxBubbleWidth, alignment: isUser ? .trailing : .leading)
                        .textSelection(.enabled)
                        .contextMenu {
                            Button { onCopy() } label: {
                                Label("Copy", systemImage: "doc.on.doc")
                            }
                        }
                }

                if showBookmark && !isError {
                    HStack(spacing: 10) {
                        Button(action: onToggleBookmark) {
                            Image(systemName: isBookmarked ? "bookmark.fill" : "bookmark")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(isBookmarked ? BhaktiTheme.accentPrimary : BhaktiTheme.textTertiary)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(isBookmarked ? "Remove bookmark" : "Bookmark message")

                        if showRegenerate {
                            Button(action: onRegenerate) {
                                HStack(spacing: 4) {
                                    Image(systemName: "arrow.clockwise")
                                        .font(.system(size: 11, weight: .semibold))
                                    Text("Regenerate")
                                        .font(.system(size: 11, weight: .medium))
                                }
                                .foregroundStyle(BhaktiTheme.textSecondary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(BhaktiTheme.surfaceElevated)
                                .overlay(
                                    Capsule().stroke(BhaktiTheme.border, lineWidth: 1)
                                )
                                .clipShape(Capsule())
                                .opacity(isRegenerating ? 0.5 : 1)
                            }
                            .buttonStyle(.plain)
                            .disabled(isRegenerating)
                            .accessibilityLabel("Regenerate reply")
                        }
                    }
                    .padding(.horizontal, 4)
                }

                if let timestamp {
                    HStack(spacing: 4) {
                        if isError {
                            Image(systemName: "exclamationmark.circle.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(BhaktiTheme.accentError)
                        }
                        Text(timestamp)
                            .font(.system(size: 10))
                            .foregroundStyle(BhaktiTheme.textTertiary)
                    }
                    .padding(.horizontal, 4)
                }
            }
            .frame(maxWidth: .infinity, alignment: isUser ? .trailing : .leading)

            if !isUser {
                Spacer(minLength: 56)
            }
        }
        .transition(.opacity.combined(with: .move(edge: isUser ? .trailing : .leading)))
    }
}

// Rounded bubble with a small tail on the outermost corner
private struct BubbleShape: Shape {
    let isUser: Bool
    let hasMultiple: Bool
    let index: Int
    let total: Int

    private var r: CGFloat { 16 }
    private var tailR: CGFloat { hasMultiple ? (isFirst || isLast ? 6 : r) : 6 }
    private var isFirst: Bool { index == 0 }
    private var isLast: Bool { index == total - 1 }

    func path(in rect: CGRect) -> Path {
        let tl = isUser ? r : (isFirst ? tailR : r)
        let tr = isUser ? (isFirst ? tailR : r) : r
        let bl = isUser ? r : (isLast ? tailR : r)
        let br = isUser ? (isLast ? tailR : r) : r

        var path = Path()
        path.move(to: CGPoint(x: rect.minX + tl, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - tr, y: rect.minY))
        path.addArc(center: CGPoint(x: rect.maxX - tr, y: rect.minY + tr), radius: tr, startAngle: .degrees(-90), endAngle: .degrees(0), clockwise: false)
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - br))
        path.addArc(center: CGPoint(x: rect.maxX - br, y: rect.maxY - br), radius: br, startAngle: .degrees(0), endAngle: .degrees(90), clockwise: false)
        path.addLine(to: CGPoint(x: rect.minX + bl, y: rect.maxY))
        path.addArc(center: CGPoint(x: rect.minX + bl, y: rect.maxY - bl), radius: bl, startAngle: .degrees(90), endAngle: .degrees(180), clockwise: false)
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + tl))
        path.addArc(center: CGPoint(x: rect.minX + tl, y: rect.minY + tl), radius: tl, startAngle: .degrees(180), endAngle: .degrees(270), clockwise: false)
        path.closeSubpath()
        return path
    }
}

// MARK: - Typing indicator

private struct TypingBubbleRow: View {
    let avatarAssetName: String

    var body: some View {
        HStack(alignment: .bottom, spacing: BhaktiTheme.Spacing.sm) {
            PackageAssetLoader.image(named: avatarAssetName)
                .resizable()
                .scaledToFill()
                .frame(width: 28, height: 28)
                .clipShape(Circle())
                .padding(.bottom, 6)

            AnimatedTypingDots()
                .padding(.horizontal, BhaktiTheme.Spacing.md)
                .padding(.vertical, 12)
                .background(BhaktiTheme.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md)
                        .stroke(BhaktiTheme.border, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))

            Spacer(minLength: 56)
        }
        .transition(.opacity.combined(with: .scale(scale: 0.95, anchor: .leading)))
    }
}

private struct AnimatedTypingDots: View {
    @State private var phase: Int = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private let timer = Timer.publish(every: 0.38, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(BhaktiTheme.textSecondary)
                    .frame(width: 7, height: 7)
                    .scaleEffect(reduceMotion ? 1 : (phase == i ? 1.35 : 0.85))
                    .opacity(reduceMotion ? (i == 1 ? 1 : 0.45) : (phase == i ? 1 : 0.45))
                    .animation(reduceMotion ? nil : BhaktiTheme.Animation.spring, value: phase)
            }
        }
        .onReceive(timer) { _ in
            if !reduceMotion { phase = (phase + 1) % 3 }
        }
        .accessibilityLabel("Guide is typing")
    }
}

// MARK: - Text formatter (unchanged logic, kept here)

private enum GuideReplyFormatter {
    private static let cache = NSCache<NSString, NSString>()

    static func format(_ text: String) -> String {
        if let cached = cache.object(forKey: text as NSString) { return cached as String }

        let normalized = text
            .replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\n{3,}", with: "\n\n", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard !normalized.contains("\n\n"), normalized.count > 170 else {
            cache.setObject(normalized as NSString, forKey: text as NSString)
            return normalized
        }

        let sentenceBroken = normalized
            .replacingOccurrences(of: "([.!?।])\\s+", with: "$1\n\n", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        if sentenceBroken.contains("\n\n") {
            cache.setObject(sentenceBroken as NSString, forKey: text as NSString)
            return sentenceBroken
        }

        let clauses = normalized.split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        if clauses.count >= 3 {
            let result = makeParagraphs(from: clauses, targetLength: 110, separator: ", ")
            cache.setObject(result as NSString, forKey: text as NSString)
            return result
        }

        let words = normalized.split(separator: " ").map(String.init)
        guard words.count > 35 else {
            cache.setObject(normalized as NSString, forKey: text as NSString)
            return normalized
        }

        var chunks: [String] = []
        var current: [String] = []
        for word in words {
            let projected = (current + [word]).joined(separator: " ")
            if projected.count > 110, !current.isEmpty {
                chunks.append(current.joined(separator: " "))
                current = [word]
            } else {
                current.append(word)
            }
        }
        if !current.isEmpty { chunks.append(current.joined(separator: " ")) }
        let result = chunks.joined(separator: "\n\n")
        cache.setObject(result as NSString, forKey: text as NSString)
        return result
    }
}

private func makeParagraphs(from parts: [String], targetLength: Int, separator: String = " ") -> String {
    var paragraphs: [String] = []
    var current: [String] = []
    for part in parts {
        let projected = (current + [part]).joined(separator: separator)
        if projected.count > targetLength, !current.isEmpty {
            paragraphs.append(current.joined(separator: separator))
            current = [part]
        } else {
            current.append(part)
        }
    }
    if !current.isEmpty { paragraphs.append(current.joined(separator: separator)) }
    return paragraphs.joined(separator: "\n\n")
}
