import SwiftUI

/// Deity wallpaper gallery — poster-style grid, tap through to a full-screen viewer with
/// Save/Share/Set-as-Wallpaper actions. Mirrors Android's `WallpapersScreen.kt`.
struct WallpapersScreen: View {
    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text("Deity wallpapers to save, share, or set as your status")
                    .font(.system(size: 13))
                    .foregroundStyle(ExplorePalette.textSecondary)

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(WallpapersCatalog.all) { wallpaper in
                        NavigationLink {
                            WallpaperDetailScreen(wallpaper: wallpaper)
                        } label: {
                            WallpaperTile(wallpaper: wallpaper)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance + 12)
        }
        .bhaktiPageBackground()
        .navigationTitle("Wallpapers")
        .bhaktiInlineNavigationTitle()
    }
}

private struct WallpaperTile: View {
    let wallpaper: Wallpaper

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            PackageAssetLoader.image(named: wallpaper.assetName)
                .resizable()
                .scaledToFill()
                .clipped()

            LinearGradient(
                stops: [
                    .init(color: .clear, location: 0.45),
                    .init(color: Color.black.opacity(0.78), location: 1)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            // Small glass badge, top-right — signals "tap for actions" without cluttering the art.
            VStack {
                HStack {
                    Spacer()
                    Image(systemName: "photo.on.rectangle.angled")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(6)
                        .background(Color.black.opacity(0.35))
                        .clipShape(Circle())
                        .padding(10)
                }
                Spacer()
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(wallpaper.title)
                    .font(.system(size: 15.5, weight: .bold))
                    .foregroundStyle(.white)
                Text(wallpaper.subtitle)
                    .font(.system(size: 11.5))
                    .foregroundStyle(Color.white.opacity(0.85))
            }
            .padding(14)
        }
        .aspectRatio(0.72, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}
