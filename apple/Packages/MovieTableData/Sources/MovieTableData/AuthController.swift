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
    /// A custom scheme callback works on devices before universal-link
    /// provisioning is finished. Supabase's OAuth/PKCE client exchanges the
    /// callback query for a session.
    public static let callbackURL = URL(string: "movietable://auth/callback")

    public private(set) var session: AuthSession?
    public private(set) var isConfigured: Bool
    private var client: SupabaseClient?

    public init(config: SupabaseConfig?) {
        isConfigured = config != nil
        guard let config else { return }
        client = SupabaseClient(
            supabaseURL: config.url,
            supabaseKey: config.anonKey,
            options: SupabaseClientOptions(
                auth: .init(emitLocalSessionAsInitialSession: true)
            )
        )
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
                    case .initialSession:
                        // The opt-in initial event can carry an expired local
                        // session; wait for the follow-up refresh before
                        // treating the user as signed in.
                        if let current, !current.isExpired {
                            self.session = AuthSession(userID: current.user.id, email: current.user.email)
                        } else {
                            self.session = nil
                        }
                    case .signedIn, .tokenRefreshed, .userUpdated:
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

    /// Google through Supabase's configured web OAuth client. This avoids
    /// requiring a separate GoogleSignIn iOS client while still returning a
    /// session to the app via `movietable://auth/callback`.
    public func signInWithGoogle() async throws {
        guard let client else { throw AuthError.notConfigured }
        let session = try await client.auth.signInWithOAuth(
            provider: .google,
            redirectTo: Self.callbackURL
        )
        self.session = AuthSession(
            userID: session.user.id,
            email: session.user.email
        )
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
        try await client.auth.signInWithOTP(
            email: email,
            redirectTo: Self.callbackURL
        )
    }

    /// A custom-scheme or universal-link callback from a magic link or OAuth
    /// flow. Awaiting the session keeps the app in sync before the caller reads it.
    public func handle(_ url: URL) async throws {
        guard let client else { return }
        let session = try await client.auth.session(from: url)
        self.session = AuthSession(
            userID: session.user.id,
            email: session.user.email
        )
    }

    public func signOut() async throws {
        guard let client else { throw AuthError.notConfigured }
        try await client.auth.signOut()
        session = nil
    }

    /// Deletes the caller's account server-side, then drops the local session.
    /// The server function deletes by `auth.uid()`, so only the signed-in
    /// account can go. The local sign-out skips the network: the account, and
    /// with it the session's refresh token, is already gone.
    public func deleteAccount() async throws {
        guard let client else { throw AuthError.notConfigured }
        try await client.rpc("delete_own_account").execute()
        try? await client.auth.signOut(scope: .local)
        session = nil
    }
}

// supabase-swift's `signInWithIdToken` takes its own provider enum.
typealias AppleOAuthProvider = OpenIDConnectCredentials.Provider
