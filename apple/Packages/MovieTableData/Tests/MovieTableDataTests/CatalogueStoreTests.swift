import Foundation
import Testing
import MovieTableCore

@testable import MovieTableData

@Suite("catalogue JSON store")
struct CatalogueStoreTests {
    private func temporaryStore() -> CatalogueStore {
        CatalogueStore(directory: FileManager.default.temporaryDirectory
            .appending(path: "MovieTableStoreTests-\(UUID().uuidString)"))
    }

    @Test("round-trips the snapshot, guest ratings, and detail cache")
    func roundTrip() throws {
        let store = temporaryStore()
        defer { try? FileManager.default.removeItem(at: store.directory) }

        let snapshot = CatalogueSnapshot(
            movies: [RawMovie(
                slug: "heat", title: "Heat", year: 1995, users_rated: 5100, userscore: 90,
                metascore: 76, link: "https://www.metacritic.com/movie/heat/",
                language: "English", subgenres: ["Heist"]
            )],
            signals: ["heat": FilmSignals(genres: ["Crime"], free: true)],
            taste: TasteCatalogue(films: [TasteFilm(slug: "heat", year: 1995)], people: []),
            providers: [Provider(id: 8, name: "Netflix")],
            fetchedAt: Date(timeIntervalSince1970: 1_789_344_000)
        )
        try store.saveSnapshot(snapshot)
        #expect(store.loadSnapshot() == snapshot)

        let ratings: StampedVerdicts = ["heat": StampedVerdict(verdict: .rated(4.5), updatedAt: 200)]
        try store.saveGuestRatings(ratings)
        #expect(store.loadGuestRatings() == ratings)

        let details: [String: FilmDetail] = [
            "heat": FilmDetail(slug: "heat", summary: "A meticulous thief.")
        ]
        try store.saveFilmDetails(details)
        #expect(store.loadFilmDetails() == details)
    }

    @Test("missing or invalid files read as empty state instead of throwing")
    func invalidFiles() throws {
        let store = temporaryStore()
        defer { try? FileManager.default.removeItem(at: store.directory) }
        #expect(store.loadSnapshot() == nil)
        #expect(store.loadGuestRatings() == [:])
        #expect(store.loadFilmDetails() == [:])

        try FileManager.default.createDirectory(at: store.directory, withIntermediateDirectories: true)
        try Data("not json".utf8).write(to: store.directory.appending(path: "guest-ratings.json"))
        #expect(store.loadGuestRatings() == [:])
    }
}
