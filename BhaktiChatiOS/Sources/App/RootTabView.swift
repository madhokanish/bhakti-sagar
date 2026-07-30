import SwiftUI

struct RootTabView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var keyboard = KeyboardObserver()
    @State private var hasTrackedInitialAppear = false

    var body: some View {
        ZStack {
            activeTabScreen
                .frame(maxWidth: BhaktiTheme.contentMaxWidth)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(BhaktiTheme.pageGradient.ignoresSafeArea())
        // Reels is full-bleed: the bar floats *over* the video on a dark gradient rather than
        // insetting the content (which would letterbox the feed and leave a cream strip).
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if !keyboard.isVisible && appState.selectedTab != .reels {
                BhaktiBottomNavBar(selectedTab: $appState.selectedTab)
                    .frame(maxWidth: BhaktiTheme.contentMaxWidth)
            }
        }
        .overlay(alignment: .bottom) {
            if !keyboard.isVisible && appState.selectedTab == .reels {
                BhaktiBottomNavBar(selectedTab: $appState.selectedTab, style: .overlay)
                    .frame(maxWidth: BhaktiTheme.contentMaxWidth)
            }
        }
        .onAppear {
            guard !hasTrackedInitialAppear else { return }
            hasTrackedInitialAppear = true
            Telemetry.track("app.root.appear", ["tab": appState.selectedTab.analyticsName])
        }
        .onChange(of: appState.selectedTab) { _, newValue in
            Telemetry.track("tab.switch", ["tab": newValue.analyticsName])
        }
    }

    @ViewBuilder
    private var activeTabScreen: some View {
        switch appState.selectedTab {
        case .home:
            HomeScreen()
        case .bhaktiChat:
            BhaktiChatScreen()
        case .reels:
            ReelsScreen()
        case .explore:
            ExploreScreen()
        }
    }
}
