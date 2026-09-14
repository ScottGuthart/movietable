import Foundation
import Testing

@testable import MovieTableCore

private let source = RawMovie(title: "A Movie", year: 2020, link: "https://www.metacritic.com/movie/a-movie")

@Suite("movie normalization and weighting")
struct MoviesTests {
    @Test("keeps missing scores distinct from zero")
    func missingScores() throws {
        let missing = normalizeMovie(source)
        #expect(missing.popularity == nil && missing.users == nil && missing.critics == nil)
        let zero = normalizeMovie(RawMovie(
            title: source.title, year: source.year,
            users_rated: 0, userscore: 0, metascore: 0, link: source.link
        ))
        #expect(zero.popularity == 0 && zero.users == 0 && zero.critics == 0)
        #expect(normalizeMovie(RawMovie(
            title: source.title, year: source.year,
            userscore: .nan, metascore: .infinity, link: source.link
        )).users == nil)
    }

    @Test("preserves score endpoints and floors the weighted result")
    func endpoints() throws {
        #expect(try finalScore(users: 83, critics: 98, criticWeight: 0) == 83)
        #expect(try finalScore(users: 83, critics: 98, criticWeight: 1) == 98)
        #expect(try finalScore(users: 83, critics: 98, criticWeight: 0.5) == 90)
        #expect(try finalScore(users: 83, critics: 98, criticWeight: 0.1) == 84)
    }

    @Test("requires only sources with a nonzero contribution")
    func contributions() throws {
        #expect(try finalScore(users: nil, critics: 96, criticWeight: 0.5) == nil)
        #expect(try finalScore(users: nil, critics: 96, criticWeight: 1) == 96)
        #expect(try finalScore(users: 70, critics: nil, criticWeight: 0) == 70)
        #expect(try finalScore(users: 70, critics: nil, criticWeight: 1) == nil)
        #expect(try finalScore(users: nil, critics: nil, criticWeight: 0) == nil)
        #expect(try finalScore(users: 0, critics: 0, criticWeight: 0.5) == 0)
        #expect(try finalScore(users: .nan, critics: 90, criticWeight: 0.5) == nil)
    }

    @Test("rejects invalid weights", arguments: [
        -0.1, 1.1, .infinity, .nan,
    ])
    func invalidCriticWeight(weight: Double) throws {
        #expect(throws: WeightRangeError.self) {
            _ = try finalScore(users: 80, critics: 90, criticWeight: weight)
        }
    }

    @Test("rejects invalid popularity weights", arguments: [
        -0.1, 1.1, .nan,
    ])
    func invalidPopularityWeight(weight: Double) throws {
        #expect(throws: WeightRangeError.self) {
            _ = try finalScore(users: 80, critics: 90, criticWeight: 0.5, popularityWeight: weight)
        }
    }

    @Test("ranks popularity as a catalogue percentile, tied counts sharing a rank")
    func percentiles() throws {
        let counts: [Double?] = [.nan, 10, 10, 1000, 100000]
        let movies = counts.map { usersRated in
            normalizeMovie(RawMovie(title: source.title, year: source.year, users_rated: usersRated, link: source.link))
        }
        #expect(popularityPercentiles(movies) == [nil, 25, 25, 63, 88])
        #expect(popularityPercentiles([]) == [])
        #expect(popularityPercentiles([normalizeMovie(source)]) == [nil])
    }

    @Test("leaves the blend untouched until popularity is weighted in")
    func popularityBlend() throws {
        #expect(try finalScore(users: 80, critics: 90, criticWeight: 0.5, popularityScore: 20) == 85)
        #expect(try finalScore(users: 80, critics: 90, criticWeight: 0.5, popularityScore: 20, popularityWeight: 0) == 85)
        #expect(try finalScore(users: 80, critics: 90, criticWeight: 0.5, popularityScore: 20, popularityWeight: 0.5) == 52)
        #expect(try finalScore(users: 80, critics: 90, criticWeight: 0.5, popularityScore: 20, popularityWeight: 1) == 20)
        #expect(try finalScore(users: 80, critics: 90, criticWeight: 0.5, popularityScore: nil, popularityWeight: 0.5) == nil)
        #expect(try finalScore(users: 80, critics: 90, criticWeight: 0.5, popularityScore: nil) == 85)
    }

    @Test("scores a catalogue with popularity folded in")
    func scoreCatalogue() throws {
        let raw = [1.0, 500.0, 100000.0].map { usersRated in
            normalizeMovie(RawMovie(
                title: source.title, year: source.year,
                users_rated: usersRated, userscore: 60, metascore: 60, link: source.link
            ))
        }
        let plain = try scoreMovies(raw, criticWeight: 0.5)
        #expect(plain.map(\.finalScore) == [60, 60, 60])
        #expect(plain.map(\.popularityScore) == [17, 50, 83])
        #expect(try scoreMovies(raw, criticWeight: 0.5, popularityWeight: 1).map(\.finalScore) == [17, 50, 83])
    }

    @Test("derives the year bounds and keeps scoring separate from normalization")
    func bounds() throws {
        let movies = [1916, 2026, 2020].map { year in
            normalizeMovie(RawMovie(title: source.title, year: year, link: source.link))
        }
        let bounds = try #require(getMovieBounds(movies))
        #expect(bounds.earliestYear == 1916 && bounds.latestYear == 2026)
        let scored = try scoreMovies(movies, criticWeight: 0.5)
        #expect(scored.allSatisfy { $0.finalScore == nil && $0.forYou == nil })
    }

    @Test("searches case-insensitively across visible fields", arguments: [
        "a movie", " MOVIE ", "2020", "1234", "80", "91", "85", "",
    ])
    func searchMatches(term: String) throws {
        let movie = ScoredMovie(
            movie: normalizeMovie(RawMovie(
                title: source.title, year: source.year,
                users_rated: 1234, userscore: 80, metascore: 91, link: source.link
            )),
            popularityScore: 50,
            finalScore: 85
        )
        #expect(matchesSearch(movie, term))
    }

    @Test("does not match text that is nowhere on the row")
    func searchMiss() throws {
        let movie = ScoredMovie(
            movie: normalizeMovie(RawMovie(
                title: source.title, year: source.year,
                users_rated: 1234, userscore: 80, metascore: 91, link: source.link
            )),
            popularityScore: 50,
            finalScore: 85
        )
        #expect(!matchesSearch(movie, "not in the title"))
    }

    @Test("never matches the string null")
    func searchNull() throws {
        var movie = ScoredMovie(
            movie: normalizeMovie(RawMovie(
                title: source.title, year: source.year,
                users_rated: 1234, userscore: 80, metascore: 91, link: source.link
            )),
            popularityScore: 50,
            finalScore: 85
        )
        movie.finalScore = nil
        #expect(!matchesSearch(movie, "null"))
    }

    @Test("matches the For you score")
    func searchForYou() throws {
        var movie = ScoredMovie(
            movie: normalizeMovie(RawMovie(
                title: source.title, year: source.year,
                users_rated: 1234, userscore: 80, metascore: 91, link: source.link
            )),
            popularityScore: 50,
            finalScore: 85
        )
        #expect(!matchesSearch(movie, "42"))
        movie.forYou = 42
        #expect(matchesSearch(movie, "42"))
    }
}

@Suite("slugs")
struct SlugTests {
    @Test("derives the Metacritic slug from a link")
    func slugs() throws {
        #expect(slugFromLink("https://www.metacritic.com/movie/the-godfather/") == "the-godfather")
        #expect(slugFromLink("https://www.metacritic.com/movie/heat") == "heat")
        #expect(normalizeMovie(source).slug == "a-movie")
        #expect(normalizeMovie(RawMovie(slug: "given", title: source.title, year: source.year, link: source.link)).slug == "given")
    }
}
