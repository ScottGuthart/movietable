import Foundation
import Testing

@testable import MovieTableCore

private func film(_ genres: [String]?) -> ScoredMovie {
    let base = try! scoreMovies([normalizeMovie(RawMovie(
        title: "x", year: 2000, users_rated: 1, userscore: 80, metascore: 80,
        link: "https://www.metacritic.com/movie/x"
    ))], criticWeight: 0.5)[0]
    var copy = base
    if let genres {
        copy.signals = FilmSignals(directors: [], writers: [], genres: genres, streamOn: [], free: false)
    }
    return copy
}

private func query(_ operatorValue: String, _ value: FilterValue?) -> FilterQuery {
    FilterQuery(id: "q", combinator: .and, rules: [
        .rule(FilterRule(id: "r", path: [GENRE_FIELD_ID], operator: operatorValue, value: value)),
    ])
}

@Suite("genre filter")
struct MovieFiltersGenreTests {
    @Test("has any of / has all of / has none of")
    func membership() {
        let drama = film(["Drama", "Thriller"])
        #expect(matchesQuery(drama, query("has_any_of", .l([.s("Comedy"), .s("Thriller")]))))
        #expect(!matchesQuery(drama, query("has_all_of", .l([.s("Drama"), .s("Comedy")]))))
        #expect(matchesQuery(drama, query("has_all_of", .l([.s("Drama"), .s("Thriller")]))))
        #expect(matchesQuery(drama, query("has_none_of", .l([.s("Comedy")]))))
        #expect(!matchesQuery(drama, query("has_none_of", .l([.s("Drama")]))))
    }

    @Test("films without signals count as having no genres")
    func noSignals() {
        #expect(!matchesQuery(film(nil), query("has_any_of", .l([.s("Drama")]))))
        #expect(matchesQuery(film(nil), query("empty", nil)))
        #expect(matchesQuery(film(["Drama"]), query("not_empty", nil)))
    }

    @Test("an empty selection is an incomplete rule and matches everything")
    func emptySelection() {
        #expect(matchesQuery(film(["Drama"]), query("has_any_of", .l([]))))
    }

    @Test("describes chosen genres as a list")
    func describes() {
        #expect(describeQuery(.group(id: "q", combinator: .and, rules: [
            .rule(FilterRule(id: "r", path: [GENRE_FIELD_ID], operator: "has_any_of", value: .l([.s("Drama"), .s("Comedy")]))),
        ])) == "Genre has any of Drama, Comedy")
    }

    @Test("createMovieFields fills the genre field's options and leaves the rest alone")
    func options() {
        let fields = createMovieFields(FilterVocabulary(genres: ["Action", "Drama"]))
        #expect(fields.first { $0.id == GENRE_FIELD_ID }?.options.map(\.value) == ["Action", "Drama"])
        #expect(fields.count == MOVIE_FIELDS.count)
        #expect(MOVIE_FIELDS.first { $0.id == GENRE_FIELD_ID }?.options.isEmpty == true)
    }
}
