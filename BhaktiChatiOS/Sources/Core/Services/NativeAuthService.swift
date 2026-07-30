import Foundation

#if canImport(AuthenticationServices)
import AuthenticationServices
#endif

#if canImport(GoogleSignIn)
import GoogleSignIn
#endif

#if os(iOS)
import UIKit
#endif

struct NativeAuthResult {
    let name: String
    let email: String
    let photoURL: String
    let provider: AuthProvider
}

enum NativeAuthError: LocalizedError, Equatable {
    case missingGoogleConfiguration
    case missingPresentationContext
    case missingGoogleAccount
    case missingAppleCredential
    case missingAppleProfile
    case canceled

    var errorDescription: String? {
        switch self {
        case .missingGoogleConfiguration:
            return "Google Sign-In is not configured yet. Add the iOS Google client ID and reversed client ID to the app target first."
        case .missingPresentationContext:
            return "Unable to open the native sign in flow on this device right now."
        case .missingGoogleAccount:
            return "Google Sign-In did not return an account. Please try again."
        case .missingAppleCredential:
            return "Apple Sign-In did not return an account. Please try again."
        case .missingAppleProfile:
            return "Apple did not return your name or email. Please use the same Apple account again, or sign in with Google."
        case .canceled:
            return "Sign in was canceled."
        }
    }
}

@MainActor
enum NativeAuthService {
    static var isGoogleConfigured: Bool {
        !googleClientID.isEmpty && !googleReversedClientID.isEmpty
    }

    static func signInWithGoogle() async throws -> NativeAuthResult {
        #if canImport(GoogleSignIn) && os(iOS)
        guard isGoogleConfigured else {
            throw NativeAuthError.missingGoogleConfiguration
        }
        guard let presentingViewController = TopViewController.find() else {
            throw NativeAuthError.missingPresentationContext
        }

        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: googleClientID)

        let user: GIDGoogleUser = try await withCheckedThrowingContinuation { continuation in
            GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController) { signInResult, error in
                if let error {
                    if isCancellation(error) {
                        continuation.resume(throwing: NativeAuthError.canceled)
                        return
                    }
                    continuation.resume(throwing: error)
                    return
                }
                guard let user = signInResult?.user else {
                    continuation.resume(throwing: NativeAuthError.missingGoogleAccount)
                    return
                }
                continuation.resume(returning: user)
            }
        }

        let name = user.profile?.name.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty ?? "Bhakti Chat User"
        let email = user.profile?.email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard let email, !email.isEmpty else {
            throw NativeAuthError.missingGoogleAccount
        }

        let photoURL = user.profile?.imageURL(withDimension: 240)?.absoluteString ?? ""

        return NativeAuthResult(
            name: name,
            email: email,
            photoURL: photoURL,
            provider: .google
        )
        #else
        throw NativeAuthError.missingGoogleConfiguration
        #endif
    }

    static func restorePreviousGoogleSignIn() async -> NativeAuthResult? {
        #if canImport(GoogleSignIn)
        guard isGoogleConfigured else { return nil }
        guard GIDSignIn.sharedInstance.hasPreviousSignIn() else { return nil }

        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: googleClientID)

        do {
            let user: GIDGoogleUser? = try await withCheckedThrowingContinuation { continuation in
                GIDSignIn.sharedInstance.restorePreviousSignIn { user, error in
                    if let error {
                        continuation.resume(throwing: error)
                        return
                    }
                    continuation.resume(returning: user)
                }
            }

            guard let user else { return nil }

            let email = user.profile?.email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            guard let email, !email.isEmpty else { return nil }

            let name = user.profile?.name.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty ?? "Bhakti Chat User"
            let photoURL = user.profile?.imageURL(withDimension: 240)?.absoluteString ?? ""

            return NativeAuthResult(
                name: name,
                email: email,
                photoURL: photoURL,
                provider: .google
            )
        } catch {
            return nil
        }
        #else
        return nil
        #endif
    }

    static func signOut(provider: AuthProvider) {
        #if canImport(GoogleSignIn)
        if provider == .google {
            GIDSignIn.sharedInstance.signOut()
        }
        #endif
    }

    /// Account deletion: fully revoke/disconnect the third-party credential (stronger than
    /// signOut) and drop any locally-stored profile, so no trace of the account remains.
    static func revokeAccount(provider: AuthProvider) async {
        #if canImport(GoogleSignIn)
        if provider == .google {
            // `disconnect` revokes the token grant with Google, not just a local sign-out.
            _ = try? await GIDSignIn.sharedInstance.disconnect()
            GIDSignIn.sharedInstance.signOut()
        }
        #endif
        // Apple sign-in is stored locally (no server) — remove every cached Apple profile.
        AppleProfileStore.shared.removeAll()
    }

    static func handleOpenURL(_ url: URL) -> Bool {
        #if canImport(GoogleSignIn)
        GIDSignIn.sharedInstance.handle(url)
        #else
        false
        #endif
    }

    static func isCancellation(_ error: Error) -> Bool {
        if let authError = error as? NativeAuthError, authError == .canceled {
            return true
        }
        #if canImport(GoogleSignIn)
        let nsError = error as NSError
        if nsError.domain == kGIDSignInErrorDomain,
           nsError.code == GIDSignInError.canceled.rawValue {
            return true
        }
        #endif
        #if canImport(AuthenticationServices)
        if let appleError = error as? ASAuthorizationError, appleError.code == .canceled {
            return true
        }
        #endif
        return false
    }

    #if canImport(AuthenticationServices)
    static func makeAppleResult(
        from credential: ASAuthorizationAppleIDCredential,
        existingSession: AuthSession
    ) throws -> NativeAuthResult {
        let fallbackProfile = AppleProfileStore.shared.profile(for: credential.user)

        let personName = PersonNameComponentsFormatter()
            .string(from: credential.fullName ?? PersonNameComponents())
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .nonEmpty

        let name = personName
            ?? fallbackProfile?.name
            ?? (existingSession.provider == .apple ? existingSession.name.nonEmpty : nil)

        let email = credential.email?
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .nonEmpty
            ?? fallbackProfile?.email
            ?? (existingSession.provider == .apple ? existingSession.email.nonEmpty : nil)

        guard let name, let email else {
            throw NativeAuthError.missingAppleProfile
        }

        AppleProfileStore.shared.save(userID: credential.user, name: name, email: email)

        return NativeAuthResult(
            name: name,
            email: email,
            photoURL: "",
            provider: .apple
        )
    }
    #endif

    private static var googleClientID: String {
        Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String ?? ""
    }

    private static var googleReversedClientID: String {
        Bundle.main.object(forInfoDictionaryKey: "GIDReversedClientID") as? String ?? ""
    }

}

private struct AppleAuthProfile: Codable {
    let name: String
    let email: String
}

private final class AppleProfileStore {
    static let shared = AppleProfileStore()

    private let defaults = UserDefaults.standard
    private let keyPrefix = "bhaktichat.apple.profile."
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    func save(userID: String, name: String, email: String) {
        let profile = AppleAuthProfile(name: name, email: email)
        guard let data = try? encoder.encode(profile) else { return }
        defaults.set(data, forKey: keyPrefix + userID)
    }

    func profile(for userID: String) -> AppleAuthProfile? {
        guard let data = defaults.data(forKey: keyPrefix + userID) else { return nil }
        return try? decoder.decode(AppleAuthProfile.self, from: data)
    }

    func removeAll() {
        for key in defaults.dictionaryRepresentation().keys where key.hasPrefix(keyPrefix) {
            defaults.removeObject(forKey: key)
        }
    }
}

private extension String {
    var nonEmpty: String? {
        isEmpty ? nil : self
    }
}
