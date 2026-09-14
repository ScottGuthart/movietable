import Testing

@testable import MovieTableCore

private let base = try! scoreMovies([normalizeMovie(RawMovie(
    title: "Parasite", year: 2019, users_rated: 1, userscore: 88, metascore: 97,
    link: "https://www.metacritic.com/movie/parasite"
))], criticWeight: 0.5)[0]

private func withSignals(_ movie: ScoredMovie) -> ScoredMovie {
    var copy = movie
    copy.signals = FilmSignals(
        directors: [Person(slug: "bong-joon-ho", name: "Bong Joon Ho")],
        writers: [Person(slug: "han-jin-won", name: "Han Jin-won")],
        genres: ["Drama"]
    )
    return copy
}

@Suite("matchesSearch with people")
struct MoviesSearchTests {
    @Test("matches director and writer names", arguments: ["bong", "jin-won"])
    func matchesPeople(term: String) {
        #expect(matchesSearch(withSignals(base), term))
    }

    @Test("does not match genres or cast")
    func doesNotMatchGenresOrCast() {
        #expect(!matchesSearch(withSignals(base), "drama"))
    }

    @Test("still works without signals")
    func withoutSignals() {
        #expect(matchesSearch(base, "parasite"))
        #expect(!matchesSearch(base, "bong"))
    }
}
