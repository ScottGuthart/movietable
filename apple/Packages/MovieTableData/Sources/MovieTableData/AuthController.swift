import Foundation
import MovieTableCore
import Observation
import Supabase

/// A signed-in account: the id RatingsSync needs and the email the menu shows.
public struct AuthSession: Equatable, Sendable {
    public var userID: UUID
    public var email: String?

    public init(userID: UUID, email: String?) {
        self.userID = userID
        self.email = email
    }
}

public enum AuthError: Error, CustomStringConvertible {
    case noSession
    case notConfigured

    public var description: String {
        switch self {
        case .noSession: return "No signed-in session."
        case .notConfigured: return "Sign-in needs SUPABASE_URL and SUPABASE_ANON_KEY."
        }
    }
}

/// Supabase Auth for the app: Apple and Google through `signInWithIdToken`,
/// magic links over email, universal-link callbacks, and sign-out.
@MainActor
@Observable
public final class AuthController {
    public private(set) var session: AuthSession?
    public private(set) var isConfigured: Bool
    private var client: SupabaseClient?

    public init(config: SupabaseConfig?) {
        isConfigured = config != nil
        guard let config else { return }
        client = SupabaseClient(supabaseURL: config.url, supabaseKey: config.anonKey)
    }

    /// Restores an existing session at launch and follows auth changes.
    public func restore() async {
        guard let client else { return }
        restoreTask?.cancel()
        restoreTask = Task { [weak self] in
            for await (event, current) in client.auth.authStateChanges {
                let user = current?.user
                await MainActor.run {
                    guard let self else { return }
                    switch event {
                    case .signedOut:
                        self.session = nil
                    case .signedIn, .initialSession, .tokenRefreshed, .userUpdated:
                        if let user {
                            self.session = AuthSession(userID: user.id, email: user.email)
                        } else {
                            self.session = nil
                        }
                    default:
                        break
                    }
                }
            }
        }
    }

    private var restoreTask: Task<Void, Never>?

    public func signInWithApple(idToken: String, nonce: String?) async throws {
        let nonceValue = nonce
        try await signIn(idToken: idToken, nonce: nonceValue, provider: .apple)
    }

    public func signInWithGoogle(idToken: String) async throws {
        try await signIn(idToken: idToken, nonce: nil, provider: .google)
    }

    private func signIn(idToken: String, nonce: String?, provider: AppleOAuthProvider) async throws {
        guard let client else { throw AuthError.notConfigured }
        let response = try await client.auth.signInWithIdToken(
            credentials: .init(provider: provider, idToken: idToken, nonce: nonce)
        )
        session = AuthSession(userID: response.user.id, email: response.user.email)
    }

    public func sendMagicLink(email: String) async throws {
        guard let client else { throw AuthError.notConfigured }
        try await client.auth.signInWithOTP(email: email)
    }

    /// A universal link coming back from the emailed sign-in link; the auth
    /// state change above carries the resulting session.
    public func handle(_ url: URL) async {
        guard let client else { return }
        client.auth.handle(url)
    }

    public func signOut() async throws {
        guard let client else { throw AuthError.notConfigured }
        try await client.auth.signOut()
        session = nil
    }
}

// supabase-swift's `signInWithIdToken` takes its own provider enum.
typealias AppleOAuthProvider = OpenIDConnectCredentials.Provider
