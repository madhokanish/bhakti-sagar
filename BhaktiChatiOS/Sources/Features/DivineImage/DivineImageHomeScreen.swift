import SwiftUI

/// The Divine Image landing screen — pushed onto whichever tab's own navigation stack
/// got here (Home or Explore), not presented modally. Template selection is reported via
/// `onSelectTemplate` rather than pushed internally, so this view stays agnostic of which
/// route type (`HomeRoute`/`ExploreRoute`) its host uses — same pattern
/// `DivineImageCreateScreen.onCreated` already used for its own completion.
struct DivineImageHomeScreen: View {
    let onSelectTemplate: (String) -> Void

    @Environment(\.dismiss) private var dismiss

    private let horizontalPadding: CGFloat = 16
    private let gridSpacing: CGFloat = 10

    /// `DivineTemplateCatalog.inspirations` grouped into rows of 2 for the one-tap grid.
    private var inspirationRows: [[DivineTemplate]] {
        stride(from: 0, to: DivineTemplateCatalog.inspirations.count, by: 2).map { start in
            Array(DivineTemplateCatalog.inspirations[start..<min(start + 2, DivineTemplateCatalog.inspirations.count)])
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                topBar

                Text("Create your divine moment in seconds")
                    .font(.title3)
                    .foregroundStyle(BhaktiTheme.textSecondary)

                VStack(spacing: 12) {
                    ForEach(DivineTemplateCatalog.homeOptions) { template in
                        Button {
                            onSelectTemplate(template.id)
                        } label: {
                            DivineMomentOptionCard(template: template)
                        }
                        .buttonStyle(BhaktiPressEffect())
                    }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("One-tap ideas")
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                    Text("Pre-built devotional setups — skip straight to create")
                        .font(.system(size: 12.5))
                        .foregroundStyle(ExplorePalette.textSecondary)
                }
                .padding(.top, 6)

                // A manual VStack-of-HStacks, not LazyVGrid: `.frame(maxWidth: .infinity)`
                // siblings inside an HStack reliably split the available width equally,
                // where the same shape inside a LazyVGrid + Button/ButtonStyle sized each
                // cell toward its own ideal content width instead — overlapping/clipping,
                // same failure mode originally hit (and fixed differently) on WallpapersScreen.
                VStack(spacing: gridSpacing) {
                    ForEach(Array(inspirationRows.enumerated()), id: \.offset) { _, row in
                        HStack(spacing: gridSpacing) {
                            ForEach(row) { template in
                                Button {
                                    onSelectTemplate(template.id)
                                } label: {
                                    OneTapIdeaCard(template: template)
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(BhaktiPressEffect())
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, horizontalPadding)
            .padding(.top, 8)
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance)
            .frame(maxWidth: BhaktiTheme.contentMaxWidth)
            .frame(maxWidth: .infinity)
        }
        .bhaktiPageBackground()
        .bhaktiHideNavigationBar()
    }

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
                Text("Divine Image")
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
}

private struct DivineMomentOptionCard: View {
    let template: DivineTemplate

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            PackageAssetLoader.image(named: template.thumbnailAssetName)
                .resizable()
                .scaledToFill()
                .frame(maxWidth: .infinity)
                .frame(height: 168)
                .clipped()

            LinearGradient(
                stops: [
                    .init(color: .clear, location: 0.45),
                    .init(color: Color.black.opacity(0.8), location: 1)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 3) {
                Text(template.title)
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundStyle(Color.white)

                Text(template.description)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.white.opacity(0.85))
                    .lineLimit(2)
            }
            .padding(14)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 168)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.04), radius: 1, x: 0, y: 1)
        .shadow(color: .black.opacity(0.08), radius: 9, x: 0, y: 8)
    }
}

private struct OneTapIdeaCard: View {
    let template: DivineTemplate

    private static let badgeText = Color(red: 0x7C / 255, green: 0x2D / 255, blue: 0x12 / 255)

    var body: some View {
        // GeometryReader absorbs whatever width the parent HStack proposes and reports it
        // back as a concrete `proxy.size` — without this, the fill-image's own intrinsic
        // size (from `.scaledToFill()`) could leak upward through the Button/ButtonStyle
        // wrapping as an "ideal" width preference, overriding the proposed column width and
        // causing the same overlap/clipping bug seen with a plain `.frame(maxWidth: .infinity)`.
        GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                PackageAssetLoader.image(named: template.thumbnailAssetName)
                    .resizable()
                    .scaledToFill()
                    .frame(width: proxy.size.width, height: proxy.size.height, alignment: .top)
                    .clipped()

                LinearGradient(
                    stops: [
                        .init(color: .clear, location: 0.5),
                        .init(color: Color.black.opacity(0.78), location: 1)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )

                Text("ONE TAP")
                    .font(.system(size: 9, weight: .heavy))
                    .foregroundStyle(Self.badgeText)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.white.opacity(0.9))
                    .clipShape(Capsule())
                    .padding(8)

                VStack {
                    Spacer()
                    Text(template.title)
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                        .frame(width: proxy.size.width, alignment: .leading)
                }
                .padding(10)
            }
        }
        .frame(height: 172)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 1, x: 0, y: 1)
        .shadow(color: .black.opacity(0.08), radius: 7, x: 0, y: 6)
    }
}
