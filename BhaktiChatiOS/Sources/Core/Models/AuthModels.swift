import Foundation

enum AuthProvider: String, Codable, CaseIterable {
    case guest
    case google
    case apple
}

struct AuthSession: Codable, Hashable {
    var isLoggedIn: Bool
    var name: String
    var email: String
    var photoURL: String
    var provider: AuthProvider

    static let guest = AuthSession(
        isLoggedIn: false,
        name: "",
        email: "",
        photoURL: "",
        provider: .guest
    )
}
