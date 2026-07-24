import SwiftUI
#if os(iOS)
import Photos
import UIKit
#endif

/// Full-screen immersive wallpaper viewer — Save to Photos, Share, and a "Set as Wallpaper"
/// action (iOS has no programmatic wallpaper API, so this saves to Photos then shows the
/// user how to finish the job from there). Mirrors Android's `WallpaperDetailScreen.kt`.
struct WallpaperDetailScreen: View {
    let wallpaper: Wallpaper

    @Environment(\.dismiss) private var dismiss
    @State private var saveState: SaveState = .idle
    @State private var showSetWallpaperInstructions = false

    private enum SaveState: Equatable {
        case idle, saving, saved, denied, failed
    }

    private var shareURL: URL? {
        guard let data = PackageAssetLoader.data(named: wallpaper.assetName) else { return nil }
        let file = FileManager.default.temporaryDirectory
            .appendingPathComponent("wallpaper_\(wallpaper.id).png")
        try? data.write(to: file, options: .atomic)
        return file
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            PackageAssetLoader.image(named: wallpaper.assetName)
                .resizable()
                .scaledToFit()

            LinearGradient(
                stops: [
                    .init(color: Color.black.opacity(0.55), location: 0),
                    .init(color: .clear, location: 0.14),
                    .init(color: .clear, location: 0.78),
                    .init(color: Color.black.opacity(0.75), location: 1)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack {
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 40, height: 40)
                            .background(Color.black.opacity(0.001)) // full hit target
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Back")
                    Spacer()
                }
                .padding(.top, 8)
                .padding(.horizontal, 10)

                Spacer()

                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(wallpaper.title)
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundStyle(.white)
                        Text(wallpaper.subtitle)
                            .font(.system(size: 13))
                            .foregroundStyle(Color.white.opacity(0.85))
                    }

                    HStack(spacing: 10) {
                        actionButton(icon: saveIcon, label: saveLabel, action: { Task { await save() } })
                            .disabled(saveState == .saving || saveState == .saved)

                        if let shareURL {
                            ShareLink(item: shareURL) {
                                actionButtonLabel(icon: "square.and.arrow.up", label: "Share")
                            }
                        }

                        actionButton(icon: "photo.on.rectangle", label: "Set") {
                            Task {
                                await save()
                                showSetWallpaperInstructions = true
                            }
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.bottom, BhaktiBottomNavBar.overlayClearance + 12)
            }
        }
        .bhaktiHideNavigationBar()
        .alert("Set as wallpaper", isPresented: $showSetWallpaperInstructions) {
            Button("Got it", role: .cancel) {}
        } message: {
            Text("Saved to Photos. Open the Photos app, select this image, tap Share, then choose \"Use as Wallpaper\".")
        }
    }

    private var saveIcon: String {
        switch saveState {
        case .saved: return "checkmark.circle.fill"
        case .denied, .failed: return "exclamationmark.circle.fill"
        default: return "arrow.down.to.line"
        }
    }

    private var saveLabel: String {
        switch saveState {
        case .idle: return "Save"
        case .saving: return "Saving…"
        case .saved: return "Saved"
        case .denied: return "Denied"
        case .failed: return "Failed"
        }
    }

    private func actionButton(icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            actionButtonLabel(icon: icon, label: label)
        }
        .buttonStyle(.plain)
    }

    private func actionButtonLabel(icon: String, label: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .semibold))
            Text(label)
                .font(.system(size: 12, weight: .bold))
        }
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color.white.opacity(0.14))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    #if os(iOS)
    @MainActor
    private func save() async {
        guard saveState != .saving, saveState != .saved else { return }
        guard let data = PackageAssetLoader.data(named: wallpaper.assetName),
              let image = UIImage(data: data) else {
            saveState = .failed
            return
        }

        let status = PHPhotoLibrary.authorizationStatus(for: .addOnly)
        let authorized: Bool
        if status == .authorized || status == .limited {
            authorized = true
        } else {
            let result = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
            authorized = result == .authorized || result == .limited
        }

        guard authorized else {
            saveState = .denied
            return
        }

        saveState = .saving
        do {
            try await PHPhotoLibrary.shared().performChanges {
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            withAnimation(BhaktiTheme.Animation.quick) { saveState = .saved }
        } catch {
            saveState = .failed
        }
    }
    #else
    private func save() async {}
    #endif
}
