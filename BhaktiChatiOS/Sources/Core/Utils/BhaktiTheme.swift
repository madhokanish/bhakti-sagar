import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

enum BhaktiTheme {
    // MARK: - Backgrounds
    static var background: Color {
        Color.dynamic(
            light: Color(red: 245/255, green: 247/255, blue: 250/255),   // #F5F7FA — very light blue-gray
            dark:  Color(red: 15/255,  green: 15/255,  blue: 17/255)     // #0F0F11
        )
    }
    static var surface: Color {
        Color.dynamic(
            light: Color.white,                                          // #FFFFFF — pure white
            dark:  Color(red: 28/255,  green: 28/255,  blue: 31/255)     // #1C1C1F
        )
    }
    static var surfaceElevated: Color {
        Color.dynamic(
            light: Color(red: 240/255, green: 242/255, blue: 245/255),   // #F0F2F5 — slightly raised
            dark:  Color(red: 36/255,  green: 36/255,  blue: 40/255)     // #242428
        )
    }

    // MARK: - Border
    static var border: Color {
        Color.dynamic(
            light: Color(red: 228/255, green: 228/255, blue: 231/255),   // #E4E4E7 — zinc-200
            dark:  Color(red: 39/255,  green: 39/255,  blue: 42/255)     // #27272A — zinc-800
        )
    }

    // MARK: - Accent (kept the same in both modes)
    static let accentPrimary    = Color(red: 249/255, green: 115/255, blue: 22/255)    // #F97316 — orange-500
    static let accentWarm       = Color(red: 251/255, green: 191/255, blue: 36/255)    // #FBBF24 — amber
    static let accentError      = Color(red: 239/255, green: 68/255,  blue: 68/255)    // #EF4444
    static let accentSuccess    = Color(red: 34/255,  green: 197/255, blue: 94/255)    // #22C55E

    // MARK: - Text
    static var textPrimary: Color {
        Color.dynamic(
            light: Color(red: 24/255,  green: 24/255,  blue: 27/255),    // #18181B — zinc-900
            dark:  Color(red: 244/255, green: 244/255, blue: 245/255)    // #F4F4F5 — zinc-100
        )
    }
    static var textSecondary: Color {
        Color.dynamic(
            light: Color(red: 113/255, green: 113/255, blue: 122/255),   // #71717A — zinc-500
            dark:  Color(red: 161/255, green: 161/255, blue: 170/255)    // #A1A1AA — zinc-400
        )
    }
    static var textTertiary: Color {
        Color.dynamic(
            light: Color(red: 161/255, green: 161/255, blue: 170/255),   // #A1A1AA — zinc-400
            dark:  Color(red: 113/255, green: 113/255, blue: 122/255)    // #71717A — zinc-500
        )
    }

    // MARK: - Gradients
    static var pageGradient: LinearGradient {
        LinearGradient(
            colors: [surface, background],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    static let accentGradient = LinearGradient(
        colors: [
            Color(red: 251/255, green: 146/255, blue: 60/255),  // orange-400
            Color(red: 234/255, green: 88/255,  blue: 12/255)   // orange-600
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let warmGradient = LinearGradient(
        colors: [
            Color(red: 252/255, green: 211/255, blue: 77/255),  // amber-300
            Color(red: 245/255, green: 158/255, blue: 11/255)   // amber-500
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    // MARK: - Layout
    // Every screen was designed at iPhone width. Rather than stretch that same layout
    // across a full iPad-width canvas (leaving large, unintentional-looking empty
    // margins on every screen), the whole app is capped to this width and centered —
    // reads as a deliberate single-column iPad experience instead of an unfinished one.
    static let contentMaxWidth: CGFloat = 600

    // MARK: - Spacing
    enum Spacing {
        static let xs:  CGFloat = 4
        static let sm:  CGFloat = 8
        static let md:  CGFloat = 12
        static let lg:  CGFloat = 16
        static let xl:  CGFloat = 20
        static let xxl: CGFloat = 28
    }

    // MARK: - Corner radius
    enum Radius {
        static let sm:   CGFloat = 10
        static let md:   CGFloat = 14
        static let lg:   CGFloat = 20
        static let xl:   CGFloat = 26
        static let pill: CGFloat = 999
    }

    // MARK: - Animation
    enum Animation {
        static let quick  = SwiftUI.Animation.easeOut(duration: 0.18)
        static let normal = SwiftUI.Animation.easeOut(duration: 0.26)
        static let spring = SwiftUI.Animation.spring(response: 0.35, dampingFraction: 0.72)
    }

    // MARK: - Typography
    static func label(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }
}

// MARK: - Color dynamic helper

private extension Color {
    /// Returns a `Color` that adapts between light and dark variants based on the
    /// active `UITraitCollection.userInterfaceStyle`. Falls back to the light color
    /// on platforms without UIKit.
    static func dynamic(light: Color, dark: Color) -> Color {
        #if canImport(UIKit)
        return Color(UIColor { trait in
            trait.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
        #else
        return light
        #endif
    }
}

// MARK: - View modifiers

struct BhaktiCard: ViewModifier {
    var padding: CGFloat = BhaktiTheme.Spacing.md

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(BhaktiTheme.surface)
            .overlay(
                RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md)
                    .stroke(BhaktiTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: BhaktiTheme.Radius.md))
    }
}

struct BhaktiPressEffect: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .opacity(configuration.isPressed ? 0.88 : 1)
            .animation(BhaktiTheme.Animation.quick, value: configuration.isPressed)
    }
}

extension View {
    func bhaktiCard(padding: CGFloat = BhaktiTheme.Spacing.md) -> some View {
        modifier(BhaktiCard(padding: padding))
    }

    func bhaktiPageBackground() -> some View {
        background(BhaktiTheme.pageGradient.ignoresSafeArea())
    }

    @ViewBuilder
    func bhaktiInlineNavigationTitle() -> some View {
#if os(iOS)
        navigationBarTitleDisplayMode(.inline)
#else
        self
#endif
    }

    @ViewBuilder
    func bhaktiHideNavigationBar() -> some View {
#if os(iOS)
        toolbar(.hidden, for: .navigationBar)
#else
        self
#endif
    }
}
