import SwiftUI
import MovieTableCore
import MovieTableData

/// Appearance choices held in the account menu; guests follow the system.
public enum LedgerAppearance: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    public var id: String { rawValue }

    public var label: String {
        switch self {
        case .system: "Match system"
        case .light: "Light"
        case .dark: "Dark"
        }
    }

    public var scheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}

/// Sign-in state, ratings sync, appearance, and the destructive clear, wired
/// to the catalogue view model's ratings.
@MainActor
@Observable
public final class AccountModel {
    public private(set) var session: AuthSession?
    public private(set) var syncStatus: SyncStatus = .offline
    public private(set) var lastError: String?
    public var isConfigured: Bool { auth.isConfigured }
    public var appearance: LedgerAppearance = .system

    private let model: CatalogueViewModel
    private let auth: AuthController
    private let sync: RatingsSync?

    public init(model: CatalogueViewModel, config: SupabaseConfig?) {
        self.model = model
        auth = AuthController(config: config)
        if let config {
            sync = RatingsSync(dependencies: .init(
                backend: SupabaseRatingsBackend(config: config),
                store: .applicationSupport()
            ))
        } else {
            sync = nil
        }
        model.onRatingsChange = { [weak self] ratings in
            self?.applyLocal(ratings)
        }
    }

    public func start() async {
        await auth.restore()
        session = auth.session
        if let session {
            await runSync(session.userID)
        }
    }

    public func handle(_ url: URL) async {
        do {
            try await auth.handle(url)
            session = auth.session
            if let session {
                await runSync(session.userID)
            }
        } catch {
            syncStatus = .failed
            lastError = "\(error)"
        }
    }

    public func signInWithApple(idToken: String, nonce: String?) async throws {
        try await auth.signInWithApple(idToken: idToken, nonce: nonce)
        session = auth.session
        if let session {
            await runSync(session.userID)
        }
    }

    public func signInWithGoogle(idToken: String) async throws {
        try await auth.signInWithGoogle(idToken: idToken)
        session = auth.session
        if let session {
            await runSync(session.userID)
        }
    }

    public func signInWithGoogle() async throws {
        try await auth.signInWithGoogle()
        session = auth.session
        if let session {
            await runSync(session.userID)
        }
    }

    public func sendMagicLink(email: String) async throws {
        try await auth.sendMagicLink(email: email)
    }

    /// Signing out clears local ratings so a shared device starts clean.
    public func signOut() async {
        await sync?.signOut()
        try? await auth.signOut()
        session = nil
        model.applyRatings([:])
        syncStatus = .offline
    }

    /// Clear ratings: the account's saved rows and this device's.
    public func clearRatings() async {
        do {
            if let sync {
                try await sync.clearRatings()
            } else {
                try? CatalogueStore.applicationSupport().saveGuestRatings([:])
            }
            model.applyRatings([:])
            syncStatus = .idle
        } catch {
            syncStatus = .failed
            lastError = "\(error)"
        }
    }

    public var statusLine: String {
        switch syncStatus {
        case .offline: "Ratings are saved on this device."
        case .idle: "Ratings saved to your account."
        case .syncing: "Syncing your ratings…"
        case .failed: lastError ?? "Sign-in failed."
        }
    }

    private func runSync(_ userID: UUID) async {
        guard let sync else { return }
        syncStatus = .syncing
        do {
            let merged = try await sync.signIn(userID: userID)
            model.applyRatings(merged)
            syncStatus = .idle
        } catch {
            syncStatus = .failed
            lastError = "\(error)"
        }
    }

    private func applyLocal(_ ratings: StampedVerdicts) {
        guard let sync else { return }
        Task { await sync.applyLocal(ratings) }
    }
}
