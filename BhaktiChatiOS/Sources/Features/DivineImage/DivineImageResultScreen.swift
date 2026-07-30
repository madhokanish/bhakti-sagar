import SwiftUI
#if os(iOS)
import Photos
import UIKit
#endif

struct DivineImageResultScreen: View {
    let creationId: String

    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var saveState: SaveState = .idle
    @State private var localFeedbackRating: String?
    @State private var interstitialShown = false

    /// Looked up live from `appState.divineCreations` (rather than passed by value) so this
    /// screen updates reactively once the in-flight `.generating` placeholder resolves to its
    /// final success/failed state. Mirrors Android's Result screen, which observes `creation`
    /// as a StateFlow for the same reason.
    private var creation: DivineCreation? {
        appState.divineCreations.first(where: { $0.id == creationId })
    }

    private enum SaveState: Equatable {
        case idle, saving, saved, denied, failed(String)

        var label: String {
            switch self {
            case .idle:           return "Save to Photos"
            case .saving:         return "Saving…"
            case .saved:          return "Saved!"
            case .denied:         return "Access denied"
            case .failed(let m):  return m
            }
        }

        var icon: String {
            switch self {
            case .saved:   return "checkmark.circle.fill"
            case .denied,
                 .failed:  return "exclamationmark.circle.fill"
            default:       return "arrow.down.to.line"
            }
        }

        var tint: Color {
            switch self {
            case .saved:   return BhaktiTheme.accentSuccess
            case .denied,
                 .failed:  return BhaktiTheme.accentError
            default:       return BhaktiTheme.accentPrimary
            }
        }
    }

    /// Mirrors Android's `creation?.status ?: CreationStatus.GENERATING` — while the
    /// placeholder hasn't landed in `appState.divineCreations` yet (should be momentary),
    /// treat it the same as an in-flight generation rather than flashing a failure state.
    private var status: CreationStatus {
        creation?.status ?? .generating
    }

    private var base64ImageData: Data? {
        guard let payload = creation?.outputImageBase64 else { return nil }
        return ImageDataURL.decodeBase64Payload(payload)
    }

    private var shareURL: URL? {
        if let urlString = creation?.outputImageURL, let url = URL(string: urlString) { return url }
        guard let data = base64ImageData, let creation else { return nil }
        let file = FileManager.default.temporaryDirectory
            .appendingPathComponent("divine_\(creation.id).png")
        try? data.write(to: file, options: .atomic)
        return file
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.xl) {
                topBar
                imageCard
                if status == .success { actionBar }
                if shouldShowFeedback { feedbackCard }
                if status != .generating { detailsCard }
            }
            .padding(BhaktiTheme.Spacing.lg)
        }
        .bhaktiPageBackground()
        .bhaktiHideNavigationBar()
        .onAppear {
            // Seed local state from any previously persisted rating.
            if localFeedbackRating == nil {
                localFeedbackRating = creation?.feedbackRating
            }
        }
        .task(id: status) {
            // Fires once, right as this screen appears mid-generation — by now the
            // interstitial has had the full Create-screen dwell time plus this
            // navigation to finish loading, unlike showing it mid-request on the
            // Create screen (see DivineImageCreateScreen.generate()).
            #if os(iOS)
            guard !interstitialShown, status == .generating else { return }
            interstitialShown = true
            // TopViewController.find() walks to the true frontmost controller rather than
            // just rootViewController — still correct even now that this screen is an
            // ordinary pushed destination, not a modal (see TopViewController.swift).
            InterstitialAdManager.shared.loadThenShow(from: TopViewController.find(), placement: "divine_generation")
            #endif
        }
    }

    // MARK: - Top bar

    private var topBar: some View {
        AppTopBar(
            leftContent: {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .frame(width: 40, height: 40)
                        .background(BhaktiTheme.surface)
                        .overlay(Circle().stroke(BhaktiTheme.border, lineWidth: 1))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Back")
            },
            centerContent: {
                Text(status == .generating ? "Creating…" : "Divine Image")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            },
            rightContent: {
                Color.clear.frame(width: 40, height: 40)
            }
        )
    }

    // MARK: - Feedback card (A/B test)

    private var shouldShowFeedback: Bool {
        status == .success
            && (creation?.requestId?.isEmpty == false)
            && (creation?.variant?.isEmpty == false)
    }

    @ViewBuilder
    private var feedbackCard: some View {
        VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.md) {
            Text("Rate this image")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BhaktiTheme.textSecondary)
                .textCase(.uppercase)
                .tracking(0.8)

            if let rating = localFeedbackRating {
                HStack(spacing: BhaktiTheme.Spacing.sm) {
                    Image(systemName: rating == "up" ? "hand.thumbsup.fill" : "hand.thumbsdown.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.accentSuccess)
                    Text("Thanks for your feedback!")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                    Spacer()
                }
                .padding(.vertical, 13)
                .padding(.horizontal, BhaktiTheme.Spacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BhaktiTheme.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md)
                        .stroke(BhaktiTheme.border, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))
            } else {
                HStack(spacing: BhaktiTheme.Spacing.sm) {
                    feedbackButton(rating: "up", title: "Looks great", systemImage: "hand.thumbsup")
                    feedbackButton(rating: "down", title: "Needs work", systemImage: "hand.thumbsdown")
                }
            }
        }
    }

    private func feedbackButton(rating: String, title: String, systemImage: String) -> some View {
        Button {
            submitFeedback(rating: rating)
        } label: {
            HStack(spacing: 6) {
                Image(systemName: systemImage)
                    .font(.system(size: 14, weight: .semibold))
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
            }
            .foregroundStyle(BhaktiTheme.textPrimary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .background(BhaktiTheme.surfaceElevated)
            .overlay(
                RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md)
                    .stroke(BhaktiTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))
        }
        .buttonStyle(BhaktiPressEffect())
        .disabled(localFeedbackRating != nil)
    }

    private func submitFeedback(rating: String) {
        guard let requestId = creation?.requestId, !requestId.isEmpty,
              let variant = creation?.variant, !variant.isEmpty else {
            return
        }
        // Optimistic UI + persistence first.
        withAnimation(BhaktiTheme.Animation.quick) {
            localFeedbackRating = rating
        }
        appState.setDivineFeedback(creationId: creationId, rating: rating)

        let mode = creation?.mode.rawValue ?? DivineMode.photoWithGod.rawValue
        let userKey = AnonUserKey.value
        Task {
            await appState.api.submitDivineImageFeedback(
                requestId: requestId,
                variant: variant,
                rating: rating,
                mode: mode,
                userKey: userKey
            )
        }
    }

    // MARK: - Image card

    private var imageCard: some View {
        VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.md) {
            if status != .generating {
                Text(status == .success ? "Your Divine Moment" : "Generation Status")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .textCase(.uppercase)
                    .tracking(0.8)
            }

            renderedImageView
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg))
                .overlay(
                    RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg)
                        .stroke(BhaktiTheme.border, lineWidth: 1)
                )
        }
    }

    @ViewBuilder
    private var renderedImageView: some View {
        if status == .generating {
            generatingState

        } else if status != .success {
            ContentUnavailableView(
                "Generation failed",
                systemImage: "xmark.circle",
                description: Text(creation?.errorMessage ?? "Please try again.")
            )
            .padding(BhaktiTheme.Spacing.xxl)
            .background(BhaktiTheme.surface)

        } else if let urlString = creation?.outputImageURL, let url = URL(string: urlString) {
            AsyncImage(url: url) { phase in
                switch phase {
                case let .success(image):
                    image.resizable().scaledToFit()
                case .failure:
                    failurePlaceholder("Image failed to load", icon: "exclamationmark.triangle")
                case .empty:
                    ZStack {
                        BhaktiTheme.surface
                        ProgressView()
                            .tint(BhaktiTheme.textSecondary)
                    }
                    .frame(height: 280)
                @unknown default:
                    EmptyView()
                }
            }

        } else if let data = base64ImageData, let platformImage = PlatformImageDecoder.decode(data) {
            Image(platformImage: platformImage)
                .resizable()
                .scaledToFit()

        } else {
            failurePlaceholder("Image unavailable", icon: "photo")
        }
    }

    private func failurePlaceholder(_ title: String, icon: String) -> some View {
        VStack(spacing: BhaktiTheme.Spacing.md) {
            Image(systemName: icon)
                .font(.system(size: 36))
                .foregroundStyle(BhaktiTheme.textSecondary)
            Text(title)
                .font(.subheadline)
                .foregroundStyle(BhaktiTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(BhaktiTheme.Spacing.xxl)
        .background(BhaktiTheme.surface)
    }

    // MARK: - Generating state (mirrors Android's `GeneratingState`)

    private var generatingState: some View {
        VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.lg) {
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0x3A / 255, green: 0x1E / 255, blue: 0x4E / 255),
                        Color(red: 0x7A / 255, green: 0x2F / 255, blue: 0x2C / 255),
                        Color(red: 0xC2 / 255, green: 0x4A / 255, blue: 0x16 / 255)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )

                VStack(spacing: BhaktiTheme.Spacing.md) {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(Color(red: 1, green: 0xD8 / 255, blue: 0x73 / 255))
                        .scaleEffect(1.5)
                    Text("Weaving your divine moment")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
            .frame(height: 300)
            .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.lg))

            HStack(spacing: 6) {
                Image(systemName: "clock")
                    .font(.system(size: 13))
                    .foregroundStyle(BhaktiTheme.textSecondary)
                Text("This usually takes 60–90 seconds")
                    .font(.system(size: 13))
                    .foregroundStyle(BhaktiTheme.textSecondary)
            }

            Text("Keep the app open while we create your image.")
                .font(.system(size: 12))
                .foregroundStyle(BhaktiTheme.textTertiary)
        }
        .padding(BhaktiTheme.Spacing.md)
    }

    // MARK: - Action bar

    private var actionBar: some View {
        HStack(spacing: BhaktiTheme.Spacing.sm) {
            if let shareURL {
                ShareLink(item: shareURL) {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(BhaktiTheme.surfaceElevated)
                        .overlay(
                            RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md)
                                .stroke(BhaktiTheme.border, lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))
                }
            }

#if os(iOS)
            if base64ImageData != nil {
                Button { Task { await save() } } label: {
                    HStack(spacing: 6) {
                        if saveState == .saving {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                                .scaleEffect(0.72)
                        } else {
                            Image(systemName: saveState.icon)
                                .font(.system(size: 14, weight: .semibold))
                        }
                        Text(saveState.label)
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(saveState.tint)
                    .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))
                }
                .buttonStyle(BhaktiPressEffect())
                .disabled(saveState == .saving || saveState == .saved)
            }
#endif
        }
    }

    // MARK: - Details card

    private var detailsCard: some View {
        VStack(alignment: .leading, spacing: BhaktiTheme.Spacing.md) {
            Text("Details")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BhaktiTheme.textSecondary)
                .textCase(.uppercase)
                .tracking(0.8)

            VStack(spacing: 0) {
                detailRow(label: "Template", value: creation?.templateTitle ?? "")
                Divider().background(BhaktiTheme.border)
                detailRow(label: "Status", value: status.rawValue.capitalized)
            }
            .background(BhaktiTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))
            .overlay(
                RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md)
                    .stroke(BhaktiTheme.border, lineWidth: 1)
            )
        }
    }

    private func detailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundStyle(BhaktiTheme.textSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(BhaktiTheme.textPrimary)
        }
        .padding(.horizontal, BhaktiTheme.Spacing.md)
        .padding(.vertical, BhaktiTheme.Spacing.sm + 2)
    }

    // MARK: - Save logic

#if os(iOS)
    @MainActor
    private func save() async {
        guard let data = base64ImageData else { return }

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

        guard let image = UIImage(data: data) else {
            saveState = .failed("Could not decode image")
            return
        }

        do {
            try await PHPhotoLibrary.shared().performChanges {
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            withAnimation(BhaktiTheme.Animation.quick) { saveState = .saved }
            Analytics.divineImageSaved(mode: creation?.mode.rawValue ?? DivineMode.photoWithGod.rawValue)
        } catch {
            saveState = .failed("Save failed")
        }
    }
#endif
}
