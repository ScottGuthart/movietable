import Foundation
import Testing
import MovieTableCore

@testable import MovieTableData

private actor FakeBackend: RatingsBackend {
    var remote: StampedVerdicts
    var upserts: [String: StampedVerdict] = [:]
    var deletedSlugs: [String] = []
    var deletedAll = false

    init(remote: StampedVerdicts = [:]) {
        self.remote = remote
    }

    func fetchRows(userID: UUID) async throws -> [RatingRow] {
        remote.map { slug, entry in
            RatingRow(
                slug: slug,
                verdict: { if case .skip = entry.verdict { return "skip" } else { return "rated" } }(),
                stars: { if case .rated(let stars) = entry.verdict { return .number(stars) } else { return nil } }(),
                updated_at: ISO8601String(entry.updatedAt).string
            )
        }
    }

    func upsert(_ entries: [String: StampedVerdict], userID: UUID) async {
        upserts.merge(entries) { _, new in new }
    }

    func delete(slugs: [String], userID: UUID) async {
        deletedSlugs.append(contentsOf: slugs)
    }

    func deleteAll(userID: UUID) async {
        deletedAll = true
    }
}

private struct ISO8601String {
    let string: String

    init(_ milliseconds: Int) {
        let date = Date(timeIntervalSince1970: Double(milliseconds) / 1000)
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        string = formatter.string(from: date)
    }
}

private func at(_ verdict: Verdict, _ updatedAt: Int) -> StampedVerdict {
    StampedVerdict(verdict: verdict, updatedAt: updatedAt)
}

@Suite("ratings sync actor")
struct RatingsSyncTests {
    private func makeStore() -> CatalogueStore {
        CatalogueStore(directory: FileManager.default.temporaryDirectory
            .appending(path: "MovieTableRatingsSyncTests-\(UUID().uuidString)"))
    }

    @Test("loads guest ratings, merges on sign-in, and uploads what the account lacks")
    func signInMerge() async throws {
        let store = makeStore()
        defer { try? FileManager.default.removeItem(at: store.directory) }
        try store.saveGuestRatings([
            "heat": at(.rated(4.5), 200),
            "amelie": at(.rated(2), 50),
        ])
        let backend = FakeBackend(remote: [
            "heat": at(.rated(2), 100),
            "spirited-away": at(.rated(5), 300),
        ])
        let sync = RatingsSync(dependencies: RatingsSync.Dependencies(
            backend: backend,
            store: store,
            debounceMs: 10_000,
            sleep: { _ in try? await Task.sleep(nanoseconds: 1_000_000_000_000) }
        ))
        let merged = try await sync.signIn(userID: UUID())
        #expect(merged == [
            "heat": at(.rated(4.5), 200),
            "amelie": at(.rated(2), 50),
            "spirited-away": at(.rated(5), 300),
        ])
        let ratings = await sync.ratings
        #expect(ratings == merged)
        #expect(store.loadGuestRatings() == merged)
        let upserts = await backend.upserts
        #expect(upserts.keys.sorted() == ["amelie", "heat"])
        let status = await sync.status
        #expect(status == .idle)
    }

    @Test("saves local ratings immediately and pushes only the diff")
    func localDiff() async throws {
        let store = makeStore()
        defer { try? FileManager.default.removeItem(at: store.directory) }
        let backend = FakeBackend()
        let sync = RatingsSync(dependencies: RatingsSync.Dependencies(
            backend: backend,
            store: store,
            debounceMs: 10_000,
            sleep: { _ in try? await Task.sleep(nanoseconds: 1_000_000_000_000) }
        ))
        let userID = UUID()
        _ = try await sync.signIn(userID: userID)

        var ratings: StampedVerdicts = ["heat": at(.rated(5), 100)]
        await sync.applyLocal(ratings)
        #expect(store.loadGuestRatings() == ratings)
        await sync.pushPending()

        ratings["fresh"] = at(.rated(4), 200)
        ratings["heat"] = nil
        await sync.applyLocal(ratings)
        await sync.pushPending()
        let current = await sync.ratings
        #expect(current == ratings)
        let upserts = await backend.upserts
        #expect(upserts == [
            "heat": at(.rated(5), 100),
            "fresh": at(.rated(4), 200),
        ])
        let deletes = await backend.deletedSlugs
        #expect(deletes == ["heat"])
        let status = await sync.status
        #expect(status == .idle)
    }

    @Test("clear ratings removes the account and local copy")
    func clear() async throws {
        let store = makeStore()
        defer { try? FileManager.default.removeItem(at: store.directory) }
        try store.saveGuestRatings(["heat": at(.rated(5), 100)])
        let backend = FakeBackend()
        let sync = RatingsSync(dependencies: RatingsSync.Dependencies(
            backend: backend,
            store: store,
            debounceMs: 10_000,
            sleep: { _ in try? await Task.sleep(nanoseconds: 1_000_000_000_000) }
        ))
        _ = try await sync.signIn(userID: UUID())
        try await sync.clearRatings()
        let ratings = await sync.ratings
        #expect(ratings == [:])
        #expect(store.loadGuestRatings() == [:])
        let deletedAll = await backend.deletedAll
        #expect(deletedAll)
    }

    @Test("signing out clears the local device but not the account")
    func signOut() async throws {
        let store = makeStore()
        defer { try? FileManager.default.removeItem(at: store.directory) }
        try store.saveGuestRatings(["heat": at(.rated(5), 100)])
        let backend = FakeBackend()
        let sync = RatingsSync(dependencies: RatingsSync.Dependencies(
            backend: backend,
            store: store,
            debounceMs: 10_000,
            sleep: { _ in try? await Task.sleep(nanoseconds: 1_000_000_000_000) }
        ))
        _ = try await sync.signIn(userID: UUID())
        await sync.signOut()
        let ratings = await sync.ratings
        let status = await sync.status
        #expect(ratings == [:])
        #expect(store.loadGuestRatings() == [:])
        #expect(status == .offline)
        let deletedAll = await backend.deletedAll
        #expect(!deletedAll)
    }
}
