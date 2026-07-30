import SwiftUI

#if canImport(AuthenticationServices)
import AuthenticationServices
#endif

struct ProfileScreen: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState

    @State private var authError: String?
    @State private var isGoogleSigningIn = false
    @State private var showGoogleSetupAlert = false
    @State private var showLogoutConfirmation = false
    @State private var showDeleteConfirmation = false
    @State private var isDeletingAccount = false

    @AppStorage("bhakti_theme_mode") private var themeMode: String = "system"
    // Auto-enrolled at app launch (see BhaktiChatIOSApp) — everyone starts with the daily
    // reminder on at 10am; these defaults just match that so a fresh read is consistent.
    @AppStorage("bhakti_notifications_enabled") private var notificationsEnabled: Bool = true
    @AppStorage("bhakti_reminder_hour") private var reminderHour: Int = 10
    @AppStorage("bhakti_reminder_minute") private var reminderMinute: Int = 0
    @State private var notificationPermissionDenied = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                topBar

                if appState.authSession.isLoggedIn {
                    signedInContent
                } else {
                    signedOutContent
                }

                // Theme and Notifications are device-level preferences, not account data — show
                // them regardless of sign-in state so a signed-out user can still control them.
                themeSection
                notificationsSection
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            // Clear the floating bottom nav bar so the last content (terms /
            // log-out button) is fully reachable on every device.
            .padding(.bottom, BhaktiBottomNavBar.overlayClearance + 24)
        }
        .bhaktiPageBackground()
        .bhaktiHideNavigationBar()
        .confirmationDialog("Log out of Bhakti Chat?", isPresented: $showLogoutConfirmation, titleVisibility: .visible) {
            Button("Log out", role: .destructive) {
                appState.signOut()
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You can sign back in at any time.")
        }
        .confirmationDialog("Delete your account?", isPresented: $showDeleteConfirmation, titleVisibility: .visible) {
            Button("Delete account", role: .destructive) {
                isDeletingAccount = true
                Task {
                    await appState.deleteAccount()
                    isDeletingAccount = false
                    dismiss()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This permanently deletes your account and all your data on this device — conversations, saved aartis, bookmarks, and preferences. This can’t be undone.")
        }
        .alert("Google Sign-In isn’t ready yet", isPresented: $showGoogleSetupAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Add the iOS Google client ID and reversed client ID in Build Settings for the BhaktiChatMobile target, then rebuild the app.")
        }
    }

    private var topBar: some View {
        AppTopBar(
            leftContent: {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .frame(width: 42, height: 42)
                        .background(BhaktiTheme.surface.opacity(0.92))
                        .overlay(
                            Circle()
                                .stroke(BhaktiTheme.border, lineWidth: 1)
                        )
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Back")
            },
            centerContent: {
                // When signed out the sign-in hero acts as the page title, so
                // we suppress the centered text. When signed in we keep the
                // "Account" header so the user knows where they are.
                if appState.authSession.isLoggedIn {
                    Text("Account")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                } else {
                    Color.clear.frame(height: 1)
                }
            },
            rightContent: {
                Color.clear
                    .frame(width: 42, height: 42)
            }
        )
    }

    /// Industry-standard sign-in layout: centered brand hero at the top of the
    /// reading area, OAuth buttons stacked (Apple first per Apple HIG), a small
    /// trust note + error slot, then terms at the bottom.
    private var signedOutContent: some View {
        VStack(spacing: 0) {
            // Top breathing room — lets the hero sit comfortably below the
            // chevron rather than crashing into it.
            Spacer().frame(height: 28)

            signInHero

            Spacer().frame(height: 36)

            // OAuth buttons — Apple first (HIG: "If you offer third-party
            // sign-in services, Sign in with Apple must also appear").
            VStack(spacing: 12) {
                appleSignInButton

                Button {
                    startGoogleSignIn()
                } label: {
                    GooglePrimaryButtonLabel(
                        isLoading: isGoogleSigningIn,
                        isEnabled: !isGoogleSigningIn
                    )
                }
                .buttonStyle(.plain)
                .disabled(isGoogleSigningIn)
            }
            .padding(.horizontal, 4)

            // Subtle trust note — short, no "card-in-card" wrapper.
            HStack(spacing: 8) {
                Image(systemName: "lock.shield.fill")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.accentPrimary)
                Text("Secure sign in. Your account never leaves this device.")
                    .font(.footnote)
                    .foregroundStyle(BhaktiTheme.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.top, 18)

            // Inline configuration / error messages — only shown when relevant.
            if !NativeAuthService.isGoogleConfigured {
                Text("Google Sign-In is almost ready. Add your iOS Google client ID and reversed client ID in the app target to enable it.")
                    .font(.footnote)
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 8)
                    .padding(.top, 10)
            }

            if let authError, !authError.isEmpty {
                Text(authError)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 8)
                    .padding(.top, 10)
            }

            Spacer().frame(height: 32)

            termsFooter
        }
        .frame(maxWidth: .infinity, alignment: .center)
    }

    private var signInHero: some View {
        VStack(spacing: 18) {
            BhaktiBrandMedallion()

            VStack(spacing: 8) {
                Text("Welcome to BhaktiChat")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .multilineTextAlignment(.center)

                Text("Sign in to save your conversations, sync across devices,\nand keep your guides close.")
                    .font(.system(size: 15))
                    .foregroundStyle(BhaktiTheme.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 16)
        }
    }

    private var termsFooter: some View {
        VStack(spacing: 4) {
            Text("By continuing you agree to our")
                .font(.system(size: 11))
                .foregroundStyle(BhaktiTheme.textTertiary)
            HStack(spacing: 4) {
                Button("Terms of Service") {}
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.accentPrimary)
                Text("·")
                    .font(.system(size: 11))
                    .foregroundStyle(BhaktiTheme.textTertiary)
                Button("Privacy Policy") {}
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BhaktiTheme.accentPrimary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .center)
    }

    private var signedInContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            SignedInAccountCard(session: appState.authSession)

            HStack(spacing: 10) {
                Button {
                    dismiss()
                } label: {
                    Text("Back to app")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(BhaktiTheme.surfaceElevated)
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .stroke(BhaktiTheme.border, lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                }
                .buttonStyle(.plain)

                Button {
                    showLogoutConfirmation = true
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .font(.system(size: 16, weight: .semibold))
                            .accessibilityHidden(true)
                        Text("Log out")
                            .font(.headline.weight(.semibold))
                    }
                    .foregroundStyle(BhaktiTheme.textPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(BhaktiTheme.accentError.opacity(0.82))
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                }
                .buttonStyle(BhaktiPressEffect())
            }

            // Account deletion — required by App Store Guideline 5.1.1(v). Kept visually quieter
            // than Log out (a text button) since it's destructive and irreversible.
            Button {
                showDeleteConfirmation = true
            } label: {
                HStack(spacing: 8) {
                    if isDeletingAccount {
                        ProgressView()
                            .progressViewStyle(.circular)
                            .tint(BhaktiTheme.accentError)
                    } else {
                        Image(systemName: "trash")
                            .font(.system(size: 14, weight: .semibold))
                            .accessibilityHidden(true)
                    }
                    Text(isDeletingAccount ? "Deleting…" : "Delete account")
                        .font(.subheadline.weight(.semibold))
                }
                .foregroundStyle(BhaktiTheme.accentError)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(BhaktiTheme.accentError.opacity(0.4), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .disabled(isDeletingAccount)
            .accessibilityLabel("Delete account")

            Text("Permanently deletes your account and all data on this device.")
                .font(.footnote)
                .foregroundStyle(BhaktiTheme.textSecondary)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    @ViewBuilder
    private var appleSignInButton: some View {
        #if canImport(AuthenticationServices)
        SignInWithAppleButton(.continue) { request in
            request.requestedScopes = [.fullName, .email]
        } onCompletion: { result in
            handleAppleSignIn(result)
        }
        .signInWithAppleButtonStyle(.black)
        .frame(height: 54)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        #else
        Text("Sign in with Apple is unavailable on this build.")
            .font(.footnote)
            .foregroundStyle(BhaktiTheme.textSecondary)
        #endif
    }

    private func startGoogleSignIn() {
        authError = nil
        guard NativeAuthService.isGoogleConfigured else {
            authError = NativeAuthError.missingGoogleConfiguration.localizedDescription
            showGoogleSetupAlert = true
            return
        }

        isGoogleSigningIn = true

        Task {
            do {
                let result = try await NativeAuthService.signInWithGoogle()
                await MainActor.run {
                    isGoogleSigningIn = false
                    appState.completeNativeSignIn(result)
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isGoogleSigningIn = false
                    if NativeAuthService.isCancellation(error) {
                        authError = nil
                        return
                    }
                    authError = nativeAuthMessage(for: error)
                }
            }
        }
    }

    #if canImport(AuthenticationServices)
    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        authError = nil

        switch result {
        case let .success(authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
                authError = NativeAuthError.missingAppleCredential.localizedDescription
                return
            }

            do {
                let authResult = try NativeAuthService.makeAppleResult(
                    from: credential,
                    existingSession: appState.authSession
                )
                appState.completeNativeSignIn(authResult)
                dismiss()
            } catch {
                authError = nativeAuthMessage(for: error)
            }

        case let .failure(error):
            if let appleError = error as? ASAuthorizationError, appleError.code == .canceled {
                return
            }
            authError = nativeAuthMessage(for: error)
        }
    }
    #endif

    // MARK: - Theme section

    private var themeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Theme")
                .font(.title3.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)

            HStack(spacing: 8) {
                ForEach(themeOptions, id: \.value) { option in
                    Button {
                        themeMode = option.value
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: option.icon)
                                .font(.system(size: 18, weight: .semibold))
                            Text(option.label)
                                .font(.subheadline.weight(.semibold))
                        }
                        .foregroundStyle(themeMode == option.value ? Color.white : BhaktiTheme.textPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(themeMode == option.value ? BhaktiTheme.accentPrimary : BhaktiTheme.surfaceElevated)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(themeMode == option.value ? Color.clear : BhaktiTheme.border, lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(BhaktiPressEffect())
                    .accessibilityLabel("\(option.label) theme")
                }
            }
        }
        .padding(18)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }

    private var themeOptions: [(label: String, value: String, icon: String)] {
        [
            ("System", "system", "iphone"),
            ("Light",  "light",  "sun.max"),
            ("Dark",   "dark",   "moon.fill")
        ]
    }

    // MARK: - Notifications section

    private var notificationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Notifications")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(BhaktiTheme.textPrimary)
                Spacer()
                Toggle("", isOn: Binding(
                    get: { notificationsEnabled },
                    set: { newValue in
                        notificationsEnabled = newValue
                        if newValue {
                            DailyReminderScheduler.requestAuthorizationAndSchedule(hour: reminderHour, minute: reminderMinute) { granted in
                                notificationPermissionDenied = !granted
                                notificationsEnabled = granted
                            }
                        } else {
                            DailyReminderScheduler.cancel()
                        }
                    }
                ))
                .labelsHidden()
                .tint(BhaktiTheme.accentPrimary)
            }

            Text("Get a gentle daily nudge to spend a few minutes with your guide.")
                .font(.subheadline)
                .foregroundStyle(BhaktiTheme.textSecondary)

            if notificationsEnabled {
                Divider()
                    .background(BhaktiTheme.border)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Daily reminder time")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(BhaktiTheme.textPrimary)

                    DatePicker(
                        "Reminder time",
                        selection: Binding(
                            get: { reminderDate(forHour: reminderHour, minute: reminderMinute) },
                            set: { newDate in
                                let components = Calendar.current.dateComponents([.hour, .minute], from: newDate)
                                let hour = components.hour ?? reminderHour
                                let minute = components.minute ?? reminderMinute
                                reminderHour = hour
                                reminderMinute = minute
                                DailyReminderScheduler.schedule(hour: hour, minute: minute)
                            }
                        ),
                        displayedComponents: [.hourAndMinute]
                    )
                    .labelsHidden()
                    .datePickerStyle(.compact)
                }
            }

            if notificationPermissionDenied {
                Text("Notification permission was denied. Enable it in Settings to receive daily reminders.")
                    .font(.footnote)
                    .foregroundStyle(BhaktiTheme.accentError)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(18)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }

    private func reminderDate(forHour hour: Int, minute: Int) -> Date {
        var components = DateComponents()
        components.hour = hour
        components.minute = minute
        return Calendar.current.date(from: components) ?? Date()
    }


    private func nativeAuthMessage(for error: Error) -> String {
        if NativeAuthService.isCancellation(error) {
            return ""
        }
        if let authError = error as? NativeAuthError {
            return authError.localizedDescription
        }
        return error.localizedDescription
    }
}

/// Centered brand mark for the sign-in hero. Mirrors the paywall medallion
/// so the BhaktiChat identity feels consistent across auth flows.
private struct BhaktiBrandMedallion: View {
    @State private var pulse = false

    var body: some View {
        ZStack {
            // Two soft pulsing rings
            ForEach(0..<2, id: \.self) { i in
                Circle()
                    .stroke(
                        BhaktiTheme.accentPrimary.opacity(0.18 - Double(i) * 0.06),
                        lineWidth: 1
                    )
                    .frame(width: 132 + CGFloat(i) * 28, height: 132 + CGFloat(i) * 28)
                    .scaleEffect(pulse ? 1.04 : 1.0)
                    .opacity(pulse ? 0.85 : 1.0)
                    .animation(
                        .easeInOut(duration: 2.6).repeatForever(autoreverses: true).delay(Double(i) * 0.3),
                        value: pulse
                    )
            }

            // Warm halo behind the disc
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BhaktiTheme.accentPrimary.opacity(0.28),
                            BhaktiTheme.accentPrimary.opacity(0.04),
                            .clear
                        ],
                        center: .center,
                        startRadius: 4,
                        endRadius: 90
                    )
                )
                .frame(width: 170, height: 170)
                .blur(radius: 6)

            // Saffron disc
            Circle()
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.984, green: 0.573, blue: 0.235),
                            Color(red: 0.918, green: 0.353, blue: 0.063)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 104, height: 104)
                .overlay(Circle().stroke(Color.white.opacity(0.35), lineWidth: 1.2))
                .shadow(color: BhaktiTheme.accentPrimary.opacity(0.42), radius: 16, x: 0, y: 10)

            // Om glyph
            Text("ॐ")
                .font(.system(size: 64, weight: .semibold))
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.18), radius: 3, x: 0, y: 2)
        }
        .frame(height: 170)
        .onAppear { pulse = true }
        .accessibilityHidden(true)
    }
}

private struct GooglePrimaryButtonLabel: View {
    let isLoading: Bool
    let isEnabled: Bool

    var body: some View {
        HStack(spacing: 10) {
            if isLoading {
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(Color(red: 26 / 255, green: 115 / 255, blue: 232 / 255))
            } else {
                GoogleMark()
            }

            Text(isLoading ? "Connecting..." : "Continue with Google")
                .font(.headline.weight(.semibold))
        }
        .foregroundStyle(Color(red: 31 / 255, green: 31 / 255, blue: 31 / 255))
        .frame(maxWidth: .infinity)
        .frame(height: 54)
        .background(Color.white)
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(
                    isEnabled
                        ? Color.black.opacity(0.08)
                        : Color.black.opacity(0.04),
                    lineWidth: 1
                )
        )
        .opacity(isEnabled ? 1 : 0.72)
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}

private struct GoogleMark: View {
    var body: some View {
        ZStack {
            Text("G")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(Color(red: 26 / 255, green: 115 / 255, blue: 232 / 255))

            HStack(spacing: 12) {
                Capsule()
                    .fill(Color(red: 52 / 255, green: 168 / 255, blue: 83 / 255))
                    .frame(width: 3, height: 14)
                Capsule()
                    .fill(Color(red: 234 / 255, green: 67 / 255, blue: 53 / 255))
                    .frame(width: 3, height: 14)
            }
        }
        .frame(width: 24, height: 24)
    }
}

private struct SignedInAccountCard: View {
    let session: AuthSession

    var body: some View {
        VStack(spacing: 14) {
            avatar

            Text(session.name)
                .font(.title2.weight(.semibold))
                .foregroundStyle(BhaktiTheme.textPrimary)
                .multilineTextAlignment(.center)

            Text(session.email)
                .font(.body)
                .foregroundStyle(BhaktiTheme.textSecondary)
                .multilineTextAlignment(.center)

            Rectangle()
                .fill(BhaktiTheme.border.opacity(0.8))
                .frame(height: 1)

            Text("Signed in with \(session.provider.rawValue.capitalized)")
                .font(.body.weight(.medium))
                .foregroundStyle(BhaktiTheme.accentPrimary)
        }
        .frame(maxWidth: .infinity)
        .padding(18)
        .background(BhaktiTheme.surface)
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(BhaktiTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }

    @ViewBuilder
    private var avatar: some View {
        if let url = URL(string: session.photoURL), !session.photoURL.isEmpty {
            AsyncImage(url: url) { phase in
                switch phase {
                case let .success(image):
                    image
                        .resizable()
                        .scaledToFill()
                default:
                    initialAvatar
                }
            }
            .frame(width: 72, height: 72)
            .clipShape(Circle())
            .overlay(
                Circle()
                    .stroke(BhaktiTheme.accentPrimary.opacity(0.25), lineWidth: 1)
            )
        } else {
            initialAvatar
        }
    }

    private var initialAvatar: some View {
        ZStack {
            Circle()
                .fill(BhaktiTheme.surfaceElevated)
            Text(session.name.first.map(String.init) ?? "B")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(BhaktiTheme.textPrimary)
        }
        .frame(width: 72, height: 72)
        .overlay(
            Circle()
                .stroke(BhaktiTheme.accentPrimary.opacity(0.25), lineWidth: 1)
        )
    }
}
