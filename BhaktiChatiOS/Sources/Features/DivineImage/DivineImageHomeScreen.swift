import SwiftUI

private enum DivineRoute: Hashable {
    case profile
    case create(templateId: String)
    case result(creationId: String)
}

struct DivineImageHomeScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var path: [DivineRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    topBar

                    Text("Create your divine moment in seconds")
                        .font(.title3)
                        .foregroundStyle(BhaktiTheme.textSecondary)

                    VStack(spacing: 14) {
                        ForEach(DivineTemplateCatalog.homeOptions) { template in
                            Button {
                                path.append(.create(templateId: template.id))
                            } label: {
                                DivineMomentOptionCard(template: template)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, BhaktiBottomNavBar.overlayClearance)
                .frame(maxWidth: BhaktiTheme.contentMaxWidth)
                .frame(maxWidth: .infinity)
            }
            .bhaktiPageBackground()
            .bhaktiHideNavigationBar()
            .navigationDestination(for: DivineRoute.self) { route in
                switch route {
                case .profile:
                    ProfileScreen()
                case let .create(templateId):
                    if let template = DivineTemplateCatalog.byId(templateId) {
                        DivineImageCreateScreen(template: template) { creationId in
                            path.append(.result(creationId: creationId))
                        }
                        .environmentObject(appState)
                    } else {
                        Text("Template not found")
                            .foregroundStyle(BhaktiTheme.textSecondary)
                            .bhaktiPageBackground()
                    }
                case let .result(creationId):
                    DivineImageResultScreen(creationId: creationId)
                }
            }
        }
    }

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
                Text("Divine Image")
                    .font(.title.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            },
            rightContent: {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 22, weight: .medium))
                        .foregroundStyle(BhaktiTheme.textSecondary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Close")
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
                .frame(height: 196)
                .clipped()

            LinearGradient(
                colors: [Color.clear, Color.black.opacity(0.78)],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 4) {
                Text(template.title)
                    .font(.title.weight(.semibold))
                    .foregroundStyle(Color.white)

                Text(template.description)
                    .font(.body)
                    .foregroundStyle(Color.white.opacity(0.88))
                    .lineLimit(2)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 196)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }
}
