import SwiftUI

#if os(iOS)
import UIKit
#endif

struct AartiDetailScreen: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var bookmarks: BookmarkStore
    @StateObject private var player = AartiSpeechPlayer()
    @ObservedObject private var audioPlayer = AartiPlayer.shared
    @Environment(\.dismiss) private var dismiss

    private var isAudioCurrent: Bool { audioPlayer.currentAartiId == aarti.id }
    private var isAudioPlayingThis: Bool { isAudioCurrent && audioPlayer.isPlaying }

    let aarti: Aarti

    private var spokenText: String {
        aarti.lyricVerses.joined(separator: ". ")
    }

    private var watchURL: URL? {
        guard let id = aarti.youtubeVideoId, !id.isEmpty else { return nil }
        return URL(string: "https://www.youtube.com/watch?v=\(id)")
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                topBar
                headerCard
                actionButtons
                lyricsCard

                if let id = aarti.youtubeVideoId, !id.isEmpty {
                    videoSection(videoId: id)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .padding(.bottom, 30)
        }
        .bhaktiPageBackground()
        .bhaktiHideNavigationBar()
        .onAppear { Analytics.aartiOpened(aartiId: aarti.id) }
        .onDisappear { player.stop() }
    }

    private var topBar: some View {
        AppTopBar(
            leftContent: {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Back")
            },
            centerContent: {
                Text("Aarti")
                    .font(.title.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
            },
            rightContent: {
                HStack(spacing: 12) {
                    if aarti.hasAudio {
                        // Real recorded aarti — play the audio track, not the text-to-speech reading.
                        Button {
                            if isAudioCurrent {
                                audioPlayer.togglePlayPause()
                            } else {
                                player.stop()
                                let all = (try? AartiRepository.loadAartis()) ?? [aarti]
                                audioPlayer.playQueue(all, startId: aarti.id)
                            }
                        } label: {
                            Image(systemName: isAudioPlayingThis ? "pause.circle.fill" : "play.circle.fill")
                                .font(.system(size: 22, weight: .semibold))
                                .foregroundStyle(BhaktiTheme.accentPrimary)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(isAudioPlayingThis ? "Pause aarti" : "Play aarti")
                    } else {
                        // No recording available — fall back to reading the lyrics aloud (TTS).
                        Button {
                            player.toggle(text: spokenText)
                        } label: {
                            Image(systemName: player.isSpeaking ? "stop.circle.fill" : "play.circle.fill")
                                .font(.system(size: 22, weight: .semibold))
                                .foregroundStyle(player.isSpeaking ? BhaktiTheme.accentError : BhaktiTheme.accentPrimary)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(player.isSpeaking ? "Stop reading aarti" : "Read aarti aloud")
                    }

                    Button {
                        bookmarks.toggleAarti(aarti.slug)
                    } label: {
                        Image(systemName: bookmarks.isAartiBookmarked(aarti.slug) ? "bookmark.fill" : "bookmark")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(bookmarks.isAartiBookmarked(aarti.slug) ? BhaktiTheme.accentPrimary : BhaktiTheme.textPrimary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(bookmarks.isAartiBookmarked(aarti.slug) ? "Remove bookmark" : "Bookmark aarti")

                    Button {
                        copyLyrics()
                    } label: {
                        Image(systemName: "doc.on.doc")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(BhaktiTheme.textPrimary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Copy text")
                }
            }
        )
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .center, spacing: 12) {
                AartiThumbnailView(aarti: aarti, size: 54)

                VStack(alignment: .leading, spacing: 4) {
                    Text(aarti.title)
                        .font(.title2.weight(.bold))
                        .foregroundStyle(BhaktiTheme.textPrimary)

                    if let subtitle = aarti.subtitle {
                        Text(subtitle)
                            .font(.headline)
                            .foregroundStyle(BhaktiTheme.textSecondary)
                    }

                    Text(aartiMetadataLabel(aarti))
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(BhaktiTheme.textSecondary.opacity(0.9))
                }
            }

            Text(aarti.preview)
                .font(.body)
                .foregroundStyle(BhaktiTheme.textSecondary)
        }
        .padding(16)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private var actionButtons: some View {
        HStack(spacing: 10) {
            Button {
                Task {
                    let prompt = aarti.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                        ? "Mujhe is aarti ka matlab samjhao"
                        : "Mujhe \(aarti.title) aarti ka matlab samjhao"
                    _ = await appState.startThread(
                        for: "krishna",
                        includeOpeningScene: false,
                        initialPrompt: prompt
                    )
                    appState.selectedTab = .bhaktiChat
                }
            } label: {
                Text("Ask Lord Krishna")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 14)
            .background(BhaktiTheme.accentPrimary)
            .foregroundStyle(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))

            Button {
                appState.toggleSavedAarti(aarti.id)
                // Mirror the choice in BookmarkStore so the "Saved" view in History stays in sync.
                let appSaved = appState.isAartiSaved(aarti.id)
                let storeSaved = bookmarks.isAartiBookmarked(aarti.slug)
                if appSaved != storeSaved {
                    bookmarks.toggleAarti(aarti.slug)
                }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: appState.isAartiSaved(aarti.id) ? "bookmark.fill" : "bookmark")
                    Text(appState.isAartiSaved(aarti.id) ? "Saved" : "Save")
                        .font(.subheadline.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 14)
            .background(BhaktiTheme.surfaceElevated)
            .foregroundStyle(BhaktiTheme.textPrimary)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(BhaktiTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .accessibilityLabel(appState.isAartiSaved(aarti.id) ? "Unsave aarti" : "Save aarti")
        }
    }

    private var lyricsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Lyrics")
                .font(.title3.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)

            VStack(spacing: 10) {
                // stable order; verses never reorder, and may repeat (e.g., refrain), so offset is the correct id
                ForEach(Array(aarti.lyricVerses.enumerated()), id: \.offset) { index, verse in
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Verse \(index + 1)")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(BhaktiTheme.accentPrimary)

                        Text(verse)
                            .font(.body)
                            .foregroundStyle(BhaktiTheme.textPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .textSelection(.enabled)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BhaktiTheme.surfaceElevated.opacity(0.92))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(BhaktiTheme.border, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                }
            }
        }
        .padding(16)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private func videoSection(videoId: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Video")
                .font(.title3.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)

            YouTubeEmbedView(videoId: videoId)
                .frame(height: 220)
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(BhaktiTheme.border, lineWidth: 1)
                )

            if let watchURL {
                Link(destination: watchURL) {
                    Text("Play video")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(BhaktiTheme.surface)
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(BhaktiTheme.border, lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            }
        }
    }

    private func copyLyrics() {
        #if os(iOS)
        UIPasteboard.general.string = aarti.lyrics.joined(separator: "\n")
        #endif
    }
}
