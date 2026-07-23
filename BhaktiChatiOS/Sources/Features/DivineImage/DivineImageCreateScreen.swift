import PhotosUI
import SwiftUI

/// "Create a divine image" screen — the destination after the user taps a
/// template card on the Divine Image home (e.g. "Photo with God",
/// "Photo at Temple", or a quick preset like "Krishna blessing you").
///
/// Layout philosophy (v2 redesign):
///   1. Photo — single big drop-zone-style card, always at the top.
///   2. Choose your guide — horizontal row of deity AVATARS (replaces the old
///      hidden dropdown). Skipped on preset templates.
///   3. Pick the scene / temple / moment — horizontal chip row.
///   4. Add extra details — collapsed by default; for power users only.
///   5. Generate dock — sticky at the bottom, always visible.
///
/// Generation logic (`generate()`, `buildPrompt()`) is preserved verbatim from
/// the previous version so this is purely a UI rework — no behaviour changes.
struct DivineImageCreateScreen: View {
    private let dockClearance = BhaktiBottomNavBar.overlayClearance

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var entitlements: EntitlementStore

    let template: DivineTemplate
    let onCreated: (String) -> Void

    @State private var customPrompt = ""
    @State private var isGenerating = false
    @State private var errorText: String?
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var selectedImageData: Data?
    @State private var showAdvancedPrompt = false

    @State private var selectedDeity: String = DivineTemplateCatalog.deityOptions.first ?? "Lord Krishna"
    @State private var selectedScene: String = DivineTemplateCatalog.sceneOptions.first ?? "blessing you"
    @State private var selectedTemple: String = DivineTemplateCatalog.templeOptions.first ?? "Kashi Vishwanath"
    @State private var selectedTempleMoment: String = DivineTemplateCatalog.templeMoments.first ?? "during aarti"

    /// True for quick-presets like "Krishna blessing you" / "Lakshmi blessing
    /// your home" — these arrive with deity+scene (or temple+scene) baked in
    /// and don't need an interactive picker.
    private var isPreset: Bool {
        template.deityTag != nil || template.templeName != nil
    }

    private var hasPhoto: Bool { selectedImageData != nil }
    private var canGenerate: Bool { hasPhoto && !isGenerating }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                topBar
                introBlurb
                photoZone

                if isPreset {
                    presetSummaryBlock
                } else if template.mode == .photoWithGod {
                    deitySection
                    sceneSection
                } else {
                    templeSection
                    momentSection
                }

                advancedPromptSection

                if let errorText {
                    DivineErrorCard(text: errorText)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            // Generate dock is ~110pt tall; leave room so the last section is
            // fully reachable above it.
            .padding(.bottom, 120 + dockClearance)
        }
        .scrollDismissesKeyboard(.interactively)
        .bhaktiPageBackground()
        .bhaktiHideNavigationBar()
        .safeAreaInset(edge: .bottom, spacing: 0) { generateDock }
        .onAppear {
            if let deity = template.deityTag { selectedDeity = deity }
            if let scene = template.sceneName { selectedScene = scene }
            if let temple = template.templeName { selectedTemple = temple }
            #if os(iOS)
            // Preload now so it's ready by the time the Result screen shows it
            // (see DivineImageResultScreen — never shown here, mid-request).
            InterstitialAdManager.shared.load()
            #endif
        }
        .onChange(of: selectedPhotoItem) { _, newValue in
            guard let newValue else { return }
            Task {
                if let data = try? await newValue.loadTransferable(type: Data.self) {
                    await MainActor.run {
                        selectedImageData = data
                        errorText = nil
                    }
                }
            }
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
                Text(template.title)
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

    // MARK: - Intro blurb

    private var introBlurb: some View {
        Text(template.description)
            .font(.system(size: 14))
            .foregroundStyle(BhaktiTheme.textSecondary)
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 2)
    }

    // MARK: - Photo zone

    private var photoZone: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(number: "1", title: "Your photo")

            ZStack {
                if let data = selectedImageData,
                   let img = PlatformImageDecoder.decode(data) {
                    Image(platformImage: img)
                        .resizable()
                        .scaledToFill()
                        .frame(maxWidth: .infinity)
                        .frame(height: 230)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(BhaktiTheme.border, lineWidth: 1)
                        )
                        .overlay(alignment: .topTrailing) {
                            PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                                HStack(spacing: 5) {
                                    Image(systemName: "arrow.triangle.2.circlepath")
                                        .font(.system(size: 11, weight: .bold))
                                    Text("Change")
                                        .font(.system(size: 12, weight: .semibold))
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 7)
                                .background(Color.black.opacity(0.55))
                                .clipShape(Capsule())
                            }
                            .buttonStyle(.plain)
                            .padding(10)
                        }
                } else {
                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        VStack(spacing: 10) {
                            Image(systemName: "photo.badge.plus")
                                .font(.system(size: 36, weight: .medium))
                                .foregroundStyle(BhaktiTheme.accentPrimary)
                            Text("Tap to add your photo")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(BhaktiTheme.textPrimary)
                            Text("A clear face photo works best.")
                                .font(.system(size: 12))
                                .foregroundStyle(BhaktiTheme.textSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 230)
                        .background(BhaktiTheme.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .strokeBorder(BhaktiTheme.border, style: StrokeStyle(lineWidth: 1.5, dash: [6, 4]))
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                    }
                    .buttonStyle(.plain)
                }
            }

            // Demo photo as a secondary link — keeps the option present
            // without giving it equal visual weight to the main upload.
            Button { useDemoPhoto() } label: {
                Label("Try with demo photo", systemImage: "sparkles")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(BhaktiTheme.accentPrimary)
            }
            .buttonStyle(.plain)
            .padding(.leading, 2)
        }
    }

    // MARK: - Preset summary (for quick templates)

    private var presetSummaryBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(number: "2", title: "Your divine moment")

            HStack(spacing: 14) {
                Group {
                    if let deityTag = template.deityTag,
                       let asset = deityAvatarAsset(forName: deityTag) {
                        PackageAssetLoader.image(named: asset)
                            .resizable()
                            .scaledToFill()
                    } else {
                        ZStack {
                            Circle().fill(BhaktiTheme.accentPrimary.opacity(0.14))
                            Image(systemName: "building.columns.fill")
                                .font(.system(size: 22, weight: .semibold))
                                .foregroundStyle(BhaktiTheme.accentPrimary)
                        }
                    }
                }
                .frame(width: 56, height: 56)
                .clipShape(Circle())
                .overlay(Circle().stroke(BhaktiTheme.accentPrimary.opacity(0.35), lineWidth: 1.5))

                VStack(alignment: .leading, spacing: 3) {
                    Text(template.deityTag ?? template.templeName ?? "")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                    if let scene = template.sceneName {
                        Text(scene.capitalizingFirstLetter())
                            .font(.system(size: 13))
                            .foregroundStyle(BhaktiTheme.textSecondary)
                    }
                }

                Spacer()

                Text("Preset")
                    .font(.system(size: 10, weight: .black))
                    .tracking(0.5)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(BhaktiTheme.accentPrimary)
                    .clipShape(Capsule())
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BhaktiTheme.surface)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(BhaktiTheme.border, lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    // MARK: - Deity selector (horizontal avatar row)

    private var deitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader(number: "2", title: "Choose your guide")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(DivineTemplateCatalog.deityOptions, id: \.self) { deity in
                        deityChip(deity: deity)
                    }
                }
                .padding(.horizontal, 2)
                .padding(.vertical, 2)
            }
        }
    }

    @ViewBuilder
    private func deityChip(deity: String) -> some View {
        let isSelected = selectedDeity == deity
        let asset = deityAvatarAsset(forName: deity)

        Button {
            withAnimation(BhaktiTheme.Animation.quick) {
                selectedDeity = deity
            }
        } label: {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .stroke(isSelected ? BhaktiTheme.accentPrimary : Color.clear, lineWidth: 2.5)
                        .frame(width: 74, height: 74)

                    Group {
                        if let asset {
                            PackageAssetLoader.image(named: asset)
                                .resizable()
                                .scaledToFill()
                        } else {
                            ZStack {
                                Circle().fill(BhaktiTheme.surface)
                                Text(deity.first.map(String.init) ?? "")
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundStyle(BhaktiTheme.accentPrimary)
                            }
                        }
                    }
                    .frame(width: 62, height: 62)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(BhaktiTheme.border.opacity(0.45), lineWidth: 1))
                }
                .scaleEffect(isSelected ? 1.05 : 1.0)

                Text(deityShortName(deity))
                    .font(.system(size: 11, weight: isSelected ? .semibold : .medium))
                    .foregroundStyle(isSelected ? BhaktiTheme.accentPrimary : BhaktiTheme.textSecondary)
                    .lineLimit(1)
            }
            .frame(width: 78)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(deity)
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }

    // MARK: - Scene / Temple / Moment chip selectors

    private var sceneSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(number: "3", title: "Pick the scene")
            OptionChipScroller(
                options: DivineTemplateCatalog.sceneOptions,
                selected: selectedScene,
                onSelect: { selectedScene = $0 }
            )
        }
    }

    private var templeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(number: "2", title: "Choose a temple")
            OptionChipScroller(
                options: DivineTemplateCatalog.templeOptions,
                selected: selectedTemple,
                onSelect: { selectedTemple = $0 }
            )
        }
    }

    private var momentSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(number: "3", title: "Pick the moment")
            OptionChipScroller(
                options: DivineTemplateCatalog.templeMoments,
                selected: selectedTempleMoment,
                onSelect: { selectedTempleMoment = $0 }
            )
        }
    }

    // MARK: - Advanced prompt

    private var advancedPromptSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    showAdvancedPrompt.toggle()
                }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: showAdvancedPrompt ? "chevron.up" : "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(BhaktiTheme.textSecondary)
                    Text("Add extra details")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                    Text("(optional)")
                        .font(.system(size: 12))
                        .foregroundStyle(BhaktiTheme.textTertiary)
                    Spacer()
                }
                .padding(.horizontal, 2)
            }
            .buttonStyle(.plain)
            .accessibilityHint(showAdvancedPrompt ? "Collapse" : "Expand")

            if showAdvancedPrompt {
                TextField(
                    "e.g. 'sunset background', 'wearing kurta', 'looking peaceful'",
                    text: $customPrompt,
                    axis: .vertical
                )
                .lineLimit(3...5)
                .submitLabel(.done)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(BhaktiTheme.surface)
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(BhaktiTheme.border, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .foregroundStyle(BhaktiTheme.textPrimary)
            }
        }
        .padding(.top, 4)
    }

    // MARK: - Section header helper

    @ViewBuilder
    private func sectionHeader(number: String, title: String) -> some View {
        HStack(spacing: 8) {
            Text(number)
                .font(.system(size: 11, weight: .black))
                .foregroundStyle(.white)
                .frame(width: 20, height: 20)
                .background(BhaktiTheme.accentPrimary)
                .clipShape(Circle())
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)
            Spacer()
        }
    }

    // MARK: - Generate dock

    private var generateDock: some View {
        // Note: this dock never shows a "Generating…" state — tapping Generate navigates to
        // the Result screen immediately (see generate()), so there's no in-place wait to
        // reflect here. An earlier version swapped this button's icon/text based on
        // `isGenerating` for the brief instant before that navigation fired, which produced
        // a visible pop/resize right as the push transition began.
        VStack(spacing: 8) {
            Button {
                Task { await generate() }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 16, weight: .bold))
                    Text("Generate divine image")
                        .font(.system(size: 16, weight: .semibold))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(BhaktiTheme.accentGradient)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: BhaktiTheme.accentPrimary.opacity(canGenerate ? 0.30 : 0), radius: 12, x: 0, y: 6)
                .opacity(canGenerate ? 1 : 0.55)
            }
            .buttonStyle(.plain)
            .disabled(!canGenerate)

            Text(footerHintText)
                .font(.system(size: 11))
                .foregroundStyle(BhaktiTheme.textSecondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 14 + dockClearance)
        .background(BhaktiTheme.background.opacity(0.98))
        .overlay(alignment: .top) {
            Rectangle()
                .fill(BhaktiTheme.border.opacity(0.8))
                .frame(height: 1)
        }
    }

    private var footerHintText: String {
        if !hasPhoto { return "Add your photo to continue" }
        return "Ready · tap to generate"
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MARK: - Generation (UNCHANGED from previous version)
    // ─────────────────────────────────────────────────────────────────────────

    @MainActor
    private func generate() async {
        guard selectedImageData != nil else {
            errorText = "Please choose a photo first."
            return
        }

        // Hard gate: divine image generation is metered. Block once quota hit.
        if !entitlements.canUseDivineImage {
            entitlements.presentForBlockedFeature(.imageQuota)
            return
        }

        let finalPrompt = buildPrompt()
        let cleaned = finalPrompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty else {
            errorText = "Please add prompt details first."
            return
        }

        isGenerating = true
        errorText = nil
        Analytics.divineImageGenerationStarted(mode: template.mode.rawValue)

        // Navigate immediately with a `.generating` placeholder — mirrors Android, which
        // pushes to the Result screen right away and shows the interstitial there once it
        // appears. Showing the interstitial here instead (mid-request, before the network
        // call even starts) risks the ad simply not being loaded yet — especially via the
        // "demo photo" shortcut, which reaches Generate far faster than a real upload flow —
        // and InterstitialAdManager.show() silently no-ops when the ad isn't ready.
        let creationId = UUID().uuidString
        let placeholder = DivineCreation(
            id: creationId,
            mode: template.mode,
            templateId: template.id,
            templateTitle: template.title,
            inputPrompt: cleaned,
            outputImageURL: nil,
            outputImageBase64: nil,
            status: .generating,
            errorMessage: nil,
            variant: nil,
            requestId: nil,
            feedbackRating: nil
        )
        appState.addDivineCreation(placeholder)
        onCreated(creationId)
        isGenerating = false

        do {
            let safePrompt = "\(DivineTemplateCatalog.identityPrefix)\n\n\(cleaned)"
            // Off-main-thread: encoding a full-resolution photo (decode + redraw + JPEG
            // re-encode) is real CPU work that was previously running inline on the main
            // actor, right as this screen mid-transitions into the Result screen — it
            // stalled the push animation and made generation feel like it hung before the
            // network request even started. Android does the equivalent work under
            // Dispatchers.IO; this matches that.
            let photoData = selectedImageData
            let dataURL = await Task.detached(priority: .userInitiated) {
                photoData.map { ImageDataURL.encodeUploadDataURL(from: $0) }
            }.value
            let response = try await appState.api.generateDivineImage(
                mode: template.mode,
                prompt: safePrompt,
                inputImageDataURL: dataURL
            )
            // Always resolve to local bytes and watermark client-side before caching/
            // displaying — matches Android, which watermarks regardless of whether the
            // backend returned inline base64 or a remote URL.
            let watermarkedBase64 = await Self.watermarkedBase64(from: response)
            let hasOutput = watermarkedBase64 != nil
            let creation = DivineCreation(
                id: creationId,
                mode: template.mode,
                templateId: template.id,
                templateTitle: template.title,
                inputPrompt: cleaned,
                outputImageURL: nil,
                outputImageBase64: watermarkedBase64,
                status: hasOutput ? .success : .failed,
                errorMessage: hasOutput ? nil : (response.error ?? "No image returned"),
                variant: response.variant,
                requestId: response.requestId,
                feedbackRating: nil
            )
            appState.updateDivineCreation(creation)
            if creation.status == .success {
                appState.entitlements?.recordImageGenerated()
                Analytics.divineImageGenerated(mode: template.mode.rawValue)
            }
        } catch {
            let creation = DivineCreation(
                id: creationId,
                mode: template.mode,
                templateId: template.id,
                templateTitle: template.title,
                inputPrompt: cleaned,
                outputImageURL: nil,
                outputImageBase64: nil,
                status: .failed,
                errorMessage: error.localizedDescription,
                variant: nil,
                requestId: nil,
                feedbackRating: nil
            )
            appState.updateDivineCreation(creation)
        }
    }

    /// Resolves the generated image to raw bytes (decoding base64, or downloading if only
    /// a remote URL was returned), watermarks it, and returns the base64 payload to persist.
    private static func watermarkedBase64(from response: DivineImageResponse) async -> String? {
        var imageData: Data?
        if let base64 = response.imageBase64 {
            imageData = ImageDataURL.decodeBase64Payload(base64)
        } else if let urlString = response.imageUrl, let url = URL(string: urlString) {
            imageData = try? await URLSession.shared.data(from: url).0
        }
        guard let imageData, let watermarked = DivineImageWatermark.watermarkedPNGData(from: imageData) else {
            return nil
        }
        return watermarked.base64EncodedString()
    }

    private func buildPrompt() -> String {
        let freeform = customPrompt.trimmingCharacters(in: .whitespacesAndNewlines)
        switch template.mode {
        case .photoWithGod:
            let deity = template.deityTag ?? selectedDeity
            let scene = template.sceneName ?? selectedScene
            var prompt = template.promptSkeleton
                .replacingOccurrences(of: "[DEITY NAME]", with: deity)
                .replacingOccurrences(of: "[SCENE NAME]", with: scene)
            if !freeform.isEmpty {
                prompt += "\n\nAdditional details: \(freeform)"
            }
            return prompt
        case .photoAtTemple:
            let temple = template.templeName ?? selectedTemple
            let moment = template.sceneName ?? selectedTempleMoment
            var prompt = template.promptSkeleton
                .replacingOccurrences(of: "[TEMPLE NAME]", with: temple)
                .replacingOccurrences(of: "[SCENE NAME]", with: moment)
            if !freeform.isEmpty {
                prompt += "\n\nAdditional details: \(freeform)"
            }
            return prompt
        }
    }

    private func useDemoPhoto() {
        guard let demoData = loadBundledDemoPhotoData() else {
            errorText = "Demo photo could not be loaded."
            return
        }
        selectedPhotoItem = nil
        selectedImageData = demoData
        errorText = nil
    }

    private func loadBundledDemoPhotoData() -> Data? {
        PackageAssetLoader.data(named: "demopic.png")
    }

    // MARK: - Display helpers

    private func deityAvatarAsset(forName deity: String) -> String? {
        switch deity {
        case "Lord Krishna": return "avatar_krishna"
        case "Lakshmi Ji":   return "avatar_lakshmi"
        case "Shiv Ji":      return "shivji"
        case "Hanuman Ji":   return "hanumanji"
        case "Ganesh Ji":    return "ic_ganesh_top_aarti"
        default:             return nil
        }
    }

    private func deityShortName(_ deity: String) -> String {
        switch deity {
        case "Lord Krishna": return "Krishna"
        case "Lakshmi Ji":   return "Lakshmi"
        case "Shiv Ji":      return "Shiv"
        case "Hanuman Ji":   return "Hanuman"
        case "Ganesh Ji":    return "Ganesh"
        default:             return deity
        }
    }
}

// MARK: - Horizontal chip selector

private struct OptionChipScroller: View {
    let options: [String]
    let selected: String
    let onSelect: (String) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(options, id: \.self) { option in
                    chip(for: option)
                }
            }
            .padding(.horizontal, 2)
            .padding(.vertical, 2)
        }
    }

    @ViewBuilder
    private func chip(for option: String) -> some View {
        let isSelected = option == selected
        Button {
            withAnimation(BhaktiTheme.Animation.quick) {
                onSelect(option)
            }
        } label: {
            Text(option.capitalizingFirstLetter())
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(isSelected ? .white : BhaktiTheme.textPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background {
                    if isSelected {
                        BhaktiTheme.accentGradient
                    } else {
                        BhaktiTheme.surface
                    }
                }
                .overlay(
                    Capsule().stroke(isSelected ? Color.clear : BhaktiTheme.border, lineWidth: 1)
                )
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }
}

// MARK: - Error card

private struct DivineErrorCard: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.red)
                .accessibilityHidden(true)
            Text(text)
                .font(.system(size: 13))
                .foregroundStyle(BhaktiTheme.textPrimary)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.red.opacity(0.08))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - String helper

private extension String {
    func capitalizingFirstLetter() -> String {
        guard let first = first else { return self }
        return first.uppercased() + dropFirst()
    }
}
