import Foundation
import Testing

@testable import MovieTableCore

/// Builds a scored movie through the real normalizer so new Movie fields keep compiling.
private func movie(title: String, configure: (inout ScoredMovie) -> Void = { _ in }) -> ScoredMovie {
    let link = "https://www.metacritic.com/movie/\(title.lowercased().replacingOccurrences(of: " ", with: "-"))"
    var base = try! scoreMovies([normalizeMovie(RawMovie(
        title: title, year: 2000, users_rated: 500, userscore: 80, metascore: 80, link: link
    ))], criticWeight: 0.5)[0]
    configure(&base)
    return base
}

@Suite("groupSlotFor")
struct GroupSlotTests {
    @Test("score bands split on 90, 80, 70, 60 and send null to Unscored")
    func scoreBands() {
        #expect(groupSlotFor(movie(title: "a") { $0.finalScore = 100 }, .score).label == "90+")
        #expect(groupSlotFor(movie(title: "b") { $0.finalScore = 90 }, .score).label == "90+")
        #expect(groupSlotFor(movie(title: "c") { $0.finalScore = 89 }, .score).label == "80–89")
        #expect(groupSlotFor(movie(title: "d") { $0.finalScore = 60 }, .score).label == "60–69")
        #expect(groupSlotFor(movie(title: "e") { $0.finalScore = 59 }, .score).label == "Under 60")
        #expect(groupSlotFor(movie(title: "f") { $0.finalScore = 0 }, .score).label == "Under 60")
        #expect(groupSlotFor(movie(title: "g") { $0.finalScore = nil }, .score).label == "Unscored")
    }

    @Test("decades floor the year and order newest first")
    func decades() {
        #expect(groupSlotFor(movie(title: "a") { $0.year = 1916 }, .decade).label == "1910s")
        #expect(groupSlotFor(movie(title: "b") { $0.year = 2024 }, .decade).label == "2020s")
        #expect(groupSlotFor(movie(title: "c") { $0.year = 2020 }, .decade).order
            < groupSlotFor(movie(title: "d") { $0.year = 2019 }, .decade).order)
    }

    @Test("popularity tiers split on 10,000, 2,500, 1,000, 300 and send null last")
    func popularityTiers() {
        #expect(groupSlotFor(movie(title: "a") { $0.popularity = 10_000 }, .popularity).label == "10,000+ ratings")
        #expect(groupSlotFor(movie(title: "b") { $0.popularity = 9_999 }, .popularity).label == "2,500–9,999 ratings")
        #expect(groupSlotFor(movie(title: "c") { $0.popularity = 300 }, .popularity).label == "300–999 ratings")
        #expect(groupSlotFor(movie(title: "d") { $0.popularity = 299 }, .popularity).label == "Under 300 ratings")
        #expect(groupSlotFor(movie(title: "e") { $0.popularity = nil }, .popularity).label == "No popularity data")
        #expect(groupSlotFor(movie(title: "e") { $0.popularity = nil }, .popularity).order
            > groupSlotFor(movie(title: "d") { $0.popularity = 299 }, .popularity).order)
    }
}

@Suite("averageFinalScore")
struct AverageFinalScoreTests {
    @Test("rounds the mean of scored films and ignores unscored ones")
    func rounds() {
        let scored = [movie(title: "a") { $0.finalScore = 90 }, movie(title: "b") { $0.finalScore = 93 }, movie(title: "c") { $0.finalScore = nil }]
        #expect(averageFinalScore(scored) == 92)
        #expect(averageFinalScore([movie(title: "d") { $0.finalScore = 90 }, movie(title: "e") { $0.finalScore = 91 }]) == 91)
    }

    @Test("is null when nothing is scored")
    func unscored() {
        #expect(averageFinalScore([]) == nil)
        #expect(averageFinalScore([movie(title: "a") { $0.finalScore = nil }]) == nil)
    }
}

@Suite("groupMovies")
struct GroupMoviesTests {
    let movies = [
        movie(title: "Low") { $0.finalScore = 55 },
        movie(title: "Top") { $0.finalScore = 95 },
        movie(title: "Missing") { $0.finalScore = nil; $0.users = nil },
        movie(title: "Top two") { $0.finalScore = 91 },
    ]

    @Test("keeps fixed band order regardless of input order and drops empty bands")
    func bandOrder() {
        #expect(groupMovies(movies, .score).map(\.label) == ["90+", "Under 60", "Unscored"])
    }

    @Test("preserves input order inside a group and computes the average")
    func insideGroups() throws {
        let top = try #require(groupMovies(movies, .score).first)
        #expect(top.movies.map(\.title) == ["Top", "Top two"])
        #expect(top.averageFinalScore == 93)
    }

    @Test("returns no groups for no movies")
    func empty() {
        #expect(groupMovies([], .decade).isEmpty)
    }

    @Test("decade groups run newest to oldest")
    func decades() {
        let groups = groupMovies([
            movie(title: "a") { $0.year = 1994 },
            movie(title: "b") { $0.year = 2021 },
            movie(title: "c") { $0.year = 1999 },
        ], .decade)
        #expect(groups.map(\.label) == ["2020s", "1990s"])
        #expect(groups[1].movies.map(\.title) == ["a", "c"])
    }
}

@Suite("sortMovies")
struct SortMoviesTests {
    let movies = [
        movie(title: "Beta") { $0.users = 70; $0.popularity = nil },
        movie(title: "Alpha") { $0.users = nil; $0.popularity = 10 },
        movie(title: "Gamma") { $0.users = 90; $0.popularity = 5 },
    ]

    @Test("returns input order with no sorting rule")
    func noRule() {
        #expect(sortMovies(movies, []).map(\.title) == ["Beta", "Alpha", "Gamma"])
    }

    @Test("sorts numbers with nulls last in both directions")
    func numbers() {
        #expect(sortMovies(movies, [SortRule(id: "users", desc: true)]).map(\.title) == ["Gamma", "Beta", "Alpha"])
        #expect(sortMovies(movies, [SortRule(id: "users", desc: false)]).map(\.title) == ["Beta", "Gamma", "Alpha"])
    }

    @Test("sorts titles alphabetically and reverses on desc")
    func titles() {
        #expect(sortMovies(movies, [SortRule(id: "title", desc: false)]).map(\.title) == ["Alpha", "Beta", "Gamma"])
        #expect(sortMovies(movies, [SortRule(id: "title", desc: true)]).first?.title == "Gamma")
    }

    @Test("keeps input order on ties")
    func ties() {
        let tied = [movie(title: "First") { $0.users = 80 }, movie(title: "Second") { $0.users = 80 }]
        #expect(sortMovies(tied, [SortRule(id: "users", desc: true)]).map(\.title) == ["First", "Second"])
    }

    @Test("ignores unknown columns")
    func unknown() {
        #expect(sortMovies(movies, [SortRule(id: "link", desc: true)]).map(\.title) == ["Beta", "Alpha", "Gamma"])
    }
}
