import Foundation
import Testing

@testable import MovieTableCore

private func film(_ title: String, _ directors: [Person], finalScore: Int = 80) -> ScoredMovie {
    var base = try! scoreMovies([normalizeMovie(RawMovie(
        title: title, year: 2000, users_rated: 500, userscore: Double(finalScore), metascore: Double(finalScore),
        link: "https://www.metacritic.com/movie/\(title)"
    ))], criticWeight: 0.5)[0]
    base.finalScore = finalScore
    base.signals = FilmSignals(directors: directors, writers: [], genres: [], streamOn: [], free: false)
    return base
}

private let bong = Person(slug: "bong-joon-ho", name: "Bong Joon Ho")
private let nolan = Person(slug: "christopher-nolan", name: "Christopher Nolan")
private let solo = Person(slug: "solo", name: "One Timer")

@Suite("groupMovies by director")
struct MovieGroupsDirectorTests {
    @Test("bands directors with enough films, most films first, then name")
    func bands() {
        let groups = groupMovies([
            film("a", [nolan]), film("b", [bong]), film("c", [bong]), film("d", [nolan]), film("e", [bong]),
        ], .director)
        #expect(groups.map(\.label) == ["Bong Joon Ho", "Christopher Nolan"])
        #expect(groups[0].movies.map(\.title) == ["b", "c", "e"])
    }

    @Test("gathers single-film directors and undirected films into a closing Other directors band")
    func otherDirectors() {
        let groups = groupMovies([film("a", [solo]), film("b", [bong]), film("c", [bong]), film("d", [])], .director)
        #expect(groups.map(\.label) == ["Bong Joon Ho", "Other directors"])
        #expect(groups[1].movies.map(\.title) == ["a", "d"])
        #expect(DIRECTOR_BAND_MIN_FILMS == 2)
    }

    @Test("uses the first-billed director for co-directed films")
    func firstBilled() {
        let groups = groupMovies([film("a", [nolan, bong]), film("b", [nolan])], .director)
        #expect(groups.map(\.label) == ["Christopher Nolan"])
    }

    @Test("keeps sort order inside a band and averages Final Score")
    func bandOrder() throws {
        let groups = groupMovies([film("hi", [bong], finalScore: 95), film("lo", [bong], finalScore: 71)], .director)
        let group = try #require(groups.first)
        #expect(group.movies.map(\.title) == ["hi", "lo"])
        #expect(group.averageFinalScore == 83)
    }
}
