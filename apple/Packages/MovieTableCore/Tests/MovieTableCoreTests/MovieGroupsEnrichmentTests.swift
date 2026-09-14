import Foundation
import Testing

@testable import MovieTableCore

private func movie(_ title: String, _ configure: (inout ScoredMovie) -> Void) -> ScoredMovie {
    var base = try! scoreMovies([normalizeMovie(RawMovie(
        title: title, year: 2000, users_rated: 500, userscore: 80, metascore: 80,
        link: "https://www.metacritic.com/movie/\(title)"
    ))], criticWeight: 0.5)[0]
    configure(&base)
    return base
}

@Suite("language and Oscar grouping")
struct MovieGroupsEnrichmentTests {
    @Test("offers both groupings")
    func options() {
        let values = Set(GROUP_KEY_OPTIONS.map(\.value))
        #expect(values.contains(.language))
        #expect(values.contains(.oscars))
    }

    @Test("groups languages alphabetically with unknown last")
    func languages() {
        let groups = groupMovies([
            movie("c") { $0.language = "Japanese" },
            movie("a") { $0.language = nil },
            movie("b") { $0.language = "English" },
            movie("d") { $0.language = "English" },
        ], .language)
        #expect(groups.map(\.label) == ["English", "Japanese", "Unknown language"])
        #expect(groups[0].movies.map(\.title) == ["b", "d"])
    }

    @Test("bands Oscars by wins, then nominations, then nothing")
    func oscars() {
        #expect(groupSlotFor(movie("a") { $0.oscarWins = 3; $0.oscarNominations = 11 }, .oscars).label == "3+ Oscar wins")
        #expect(groupSlotFor(movie("a") { $0.oscarWins = 3; $0.oscarNominations = 11 }, .oscars).order == 0)
        #expect(groupSlotFor(movie("b") { $0.oscarWins = 1; $0.oscarNominations = 2 }, .oscars).label == "1–2 Oscar wins")
        #expect(groupSlotFor(movie("b") { $0.oscarWins = 1; $0.oscarNominations = 2 }, .oscars).order == 1)
        #expect(groupSlotFor(movie("c") { $0.oscarWins = 0; $0.oscarNominations = 4 }, .oscars).label == "Nominated only")
        #expect(groupSlotFor(movie("c") { $0.oscarWins = 0; $0.oscarNominations = 4 }, .oscars).order == 2)
        #expect(groupSlotFor(movie("d") { $0.oscarWins = 0; $0.oscarNominations = 0 }, .oscars).label == "No Oscar record")
        #expect(groupSlotFor(movie("d") { $0.oscarWins = 0; $0.oscarNominations = 0 }, .oscars).order == 3)
        #expect(groupSlotFor(movie("e") { $0.oscarWins = nil; $0.oscarNominations = nil }, .oscars).label == "No Oscar record")
        #expect(groupSlotFor(movie("e") { $0.oscarWins = nil; $0.oscarNominations = nil }, .oscars).order == 3)
    }
}
