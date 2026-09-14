import Foundation
import MovieTableCore
import Supabase

/// The taste_ratings service: every read and write is scoped to the signed-in
/// user's own rows (row-level security does the enforcement).
public protocol RatingsBackend: Sendable {
    func fetchRows(userID: UUID) async throws -> [RatingRow]
    func upsert(_ entries: [String: StampedVerdict], userID: UUID) async throws
    func delete(slugs: [String], userID: UUID) async throws
    func deleteAll(userID: UUID) async throws
}

public enum SyncStatus: String, Sendable {
    case offline
    case idle
    case syncing
    case failed
}

/// An upsert payload row for `taste_ratings`.
struct TasteRatingUpsert: Encodable {
    var user_id: UUID
    var slug: String
    var verdict: String
    var stars: Double?
    var updated_at: Date
}

/// supabase-swift backend for `taste_ratings`.
public struct SupabaseRatingsBackend: RatingsBackend {
    private let client: SupabaseClient

    public init(config: SupabaseConfig) {
        client = SupabaseClient(supabaseURL: config.url, supabaseKey: config.anonKey)
    }

    struct RatingRowData: Decodable {
        var slug: String
        var verdict: String
        var stars: Double?
        var updated_at: String

        enum CodingKeys: String, CodingKey {
            case slug, verdict, stars, updated_at
        }

        init(from decoder: Decoder) throws {
            let container = try decoder.container(keyedBy: CodingKeys.self)
            slug = try container.decode(String.self, forKey: .slug)
            verdict = try container.decode(String.self, forKey: .verdict)
            // PostgREST returns numeric columns as numbers in JSON (not strings), but be tolerant.
            if let number = try? container.decode(Double.self, forKey: .stars) {
                stars = number
            } else if let text = try? container.decode(String.self, forKey: .stars) {
                stars = Double(text)
            } else {
                stars = nil
            }
            updated_at = try container.decode(String.self, forKey: .updated_at)
        }
    }

    public func fetchRows(userID: UUID) async throws -> [RatingRow] {
        let data: [RatingRowData] = try await client.from("taste_ratings")
            .select()
            .eq("user_id", value: userID.uuidString)
            .execute()
            .value
        return data.map { row in
            RatingRow(
                slug: row.slug,
                verdict: row.verdict,
                stars: row.stars.map(RatingStars.number),
                updated_at: row.updated_at
            )
        }
    }

    public func upsert(_ entries: [String: StampedVerdict], userID: UUID) async throws {
        let rows = entries.map { slug, entry in
            TasteRatingUpsert(
                user_id: userID,
                slug: slug,
                verdict: { if case .skip = entry.verdict { return "skip" } else { return "rated" } }(),
                stars: { if case .rated(let stars) = entry.verdict { return stars } else { return nil } }(),
                updated_at: Date(timeIntervalSince1970: TimeInterval(entry.updatedAt) / 1000)
            )
        }
        if rows.isEmpty { return }
        try await client.from("taste_ratings").upsert(rows).execute()
    }

    public func delete(slugs: [String], userID: UUID) async throws {
        if slugs.isEmpty { return }
        try await client.from("taste_ratings")
            .delete()
            .eq("user_id", value: userID.uuidString)
            .in("slug", values: slugs)
            .execute()
    }

    public func deleteAll(userID: UUID) async throws {
        try await client.from("taste_ratings")
            .delete()
            .eq("user_id", value: userID.uuidString)
            .execute()
    }
}

/// Reads and writes `taste_ratings` for the signed-in user, merges on sign-in
/// with `mergeVerdicts`, pushes local changes after a short debounce, and
/// clears local ratings on sign-out.
public actor RatingsSync {
    public struct Dependencies: Sendable {
        public var backend: RatingsBackend
        public var store: CatalogueStore
        public var debounceMs: Int
        public var sleep: @Sendable (Int) async -> Void

        public init(backend: RatingsBackend, store: CatalogueStore, debounceMs: Int = 500, sleep: @escaping @Sendable (Int) async -> Void = { ms in
            try? await Task.sleep(nanoseconds: UInt64(ms) * 1_000_000)
        }) {
            self.backend = backend
            self.store = store
            self.debounceMs = debounceMs
            self.sleep = sleep
        }
    }

    private var dependencies: Dependencies
    private var userID: UUID?
    private var local: StampedVerdicts
    private var lastSynced: StampedVerdicts
    private var debounceTask: Task<Void, Never>?
    private(set) public var status: SyncStatus = .offline

    public init(dependencies: Dependencies) {
        self.dependencies = dependencies
        local = dependencies.store.loadGuestRatings()
        lastSynced = local
    }

    public var ratings: StampedVerdicts { local }

    /// Merges local ratings with the account's: union, newer wins, ties go to
    /// the account; whatever the account lacked is uploaded.
    @discardableResult
    public func signIn(userID: UUID) async throws -> StampedVerdicts {
        self.userID = userID
        status = .syncing
        do {
            let remote = rowsToStamped(try await dependencies.backend.fetchRows(userID: userID))
            let result = mergeVerdicts(local, remote)
            if !result.toUpload.isEmpty {
                try await dependencies.backend.upsert(result.toUpload, userID: userID)
            }
            local = result.merged
            lastSynced = result.merged
            try dependencies.store.saveGuestRatings(local)
            status = .idle
            return result.merged
        } catch {
            status = .failed
            throw error
        }
    }

    /// Every local change replaces the store copy and is pushed after a short pause.
    public func applyLocal(_ ratings: StampedVerdicts) {
        local = ratings
        try? dependencies.store.saveGuestRatings(ratings)
        schedulePush()
    }

    private func schedulePush() {
        guard userID != nil else { return }
        debounceTask?.cancel()
        let debounce = dependencies.debounceMs
        let sleep = dependencies.sleep
        debounceTask = Task { [weak self] in
            await sleep(debounce)
            guard !Task.isCancelled, let self else { return }
            await self.pushPending()
        }
    }

    /// Flushes any local changes since the last push.
    public func pushPending() async {
        guard let userID else { return }
        let diff = diffVerdicts(lastSynced, local)
        if diff.upserts.isEmpty && diff.deletes.isEmpty { return }
        status = .syncing
        do {
            if !diff.upserts.isEmpty {
                try await dependencies.backend.upsert(diff.upserts, userID: userID)
            }
            if !diff.deletes.isEmpty {
                try await dependencies.backend.delete(slugs: diff.deletes, userID: userID)
            }
            lastSynced = local
            status = .idle
        } catch {
            status = .failed
        }
    }

    /// Clears the account's saved ratings and this device's, and resets taste ranking.
    public func clearRatings() async throws {
        debounceTask?.cancel()
        if let userID {
            status = .syncing
            do {
                try await dependencies.backend.deleteAll(userID: userID)
            } catch {
                status = .failed
                throw error
            }
            status = .idle
        }
        local = [:]
        lastSynced = [:]
        try dependencies.store.saveGuestRatings([:])
    }

    /// Clears local ratings so a shared device starts clean.
    public func signOut() {
        debounceTask?.cancel()
        userID = nil
        local = [:]
        lastSynced = [:]
        try? dependencies.store.saveGuestRatings([:])
        status = .offline
    }
}
