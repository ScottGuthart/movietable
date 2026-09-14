import Foundation
import Testing

@testable import MovieTableCore

extension FilterValue {
    static func n(_ value: Double) -> FilterValue { .number(value) }
    static func s(_ value: String) -> FilterValue { .string(value) }
    static func l(_ values: [FilterValue]) -> FilterValue { .list(values) }
}

private let movie = ScoredMovie(
    slug: "the-great-film",
    title: "The Great Film",
    year: 2020,
    popularity: 500,
    users: 80,
    critics: 90,
    link: "https://www.metacritic.com/movie/test",
    language: "French",
    subgenres: ["Gangster", "Epic"],
    oscarWins: 2,
    oscarNominations: 9,
    popularityScore: 62,
    finalScore: 85,
    forYou: nil
)

private func rule(_ field: String, _ operatorValue: String, _ value: FilterValue? = nil) -> FilterRule {
    FilterRule(id: "\(field)-\(operatorValue)", path: [field], operator: operatorValue, value: value)
}

private func group(_ combinator: FilterCombinator, _ rules: [FilterNode]) -> FilterQuery {
    FilterQuery(id: "group", combinator: combinator, rules: rules)
}

private func node(_ combinator: FilterCombinator, _ rules: [FilterNode]) -> FilterNode {
    .group(id: "group", combinator: combinator, rules: rules)
}

private func check(_ field: String, _ operatorValue: String, _ value: FilterValue? = nil, row: ScoredMovie = movie) -> Bool {
    matchesQuery(row, group(.and, [.rule(rule(field, operatorValue, value))]))
}

private func asMovie(_ scored: ScoredMovie) -> Movie {
    Movie(
        slug: scored.slug, title: scored.title, year: scored.year,
        popularity: scored.popularity, users: scored.users, critics: scored.critics,
        link: scored.link, language: scored.language, subgenres: scored.subgenres,
        oscarWins: scored.oscarWins, oscarNominations: scored.oscarNominations, signals: scored.signals
    )
}

@Suite("movie query evaluation")
struct MovieFiltersTests {
    @Test("no filter is applied by default, so the catalogue arrives whole")
    func defaultQuery() throws {
        func raw(_ title: String, _ year: Int, _ usersRated: Double?) -> Movie {
            normalizeMovie(RawMovie(
                title: title, year: year, users_rated: usersRated, userscore: 80, metascore: 80,
                link: "https://www.metacritic.com/movie/\(title)"
            ))
        }
        let scored = try scoreMovies([
            raw("in-range", 2010, 500),
            raw("too-early", 1999, 500),
            raw("too-recent", 2025, 500),
            raw("obscure", 2010, 299),
            raw("huge", 2010, 100_001),
            raw("no-count", 2010, .nan),
        ], criticWeight: 0.5)
        #expect(DEFAULT_QUERY.rules.isEmpty)
        #expect(scored.filter { matchesQuery($0, DEFAULT_QUERY) }.count == 6)
        #expect(scored.filter { matchesQuery($0, emptyQuery()) }.count == 6)
    }

    @Test("text operator with value", arguments: [
        ("contains", FilterValue.s("GREAT"), true),
        ("contains", FilterValue.s("bad"), false),
        ("not_contains", FilterValue.s("great"), false),
        ("not_contains", FilterValue.s("bad"), true),
        ("starts_with", FilterValue.s("the"), true),
        ("starts_with", FilterValue.s("great"), false),
        ("ends_with", FilterValue.s("FILM"), true),
        ("ends_with", FilterValue.s("great"), false),
        ("is", FilterValue.s("the great film"), true),
        ("is", FilterValue.s("film"), false),
        ("is_not", FilterValue.s("the great film"), false),
        ("is_not", FilterValue.s("film"), true),
        ("empty", nil, false),
        ("not_empty", nil, true),
    ])
    func textOperators(operatorValue: String, value: FilterValue?, expected: Bool) {
        #expect(check("title", operatorValue, value) == expected)
    }

    @Test("numeric operator with value", arguments: [
        ("eq", FilterValue.n(80), true),
        ("eq", FilterValue.n(81), false),
        ("neq", FilterValue.n(80), false),
        ("neq", FilterValue.n(81), true),
        ("gt", FilterValue.n(79), true),
        ("gt", FilterValue.n(80), false),
        ("gte", FilterValue.n(80), true),
        ("gte", FilterValue.n(81), false),
        ("lt", FilterValue.n(81), true),
        ("lt", FilterValue.n(80), false),
        ("lte", FilterValue.n(80), true),
        ("lte", FilterValue.n(79), false),
        ("between", FilterValue.l([.n(80), .n(80)]), true),
        ("between", FilterValue.l([.n(81), .n(100)]), false),
        ("not_between", FilterValue.l([.n(80), .n(80)]), false),
        ("not_between", FilterValue.l([.n(81), .n(100)]), true),
        ("empty", nil, false),
        ("not_empty", nil, true),
    ])
    func numericOperators(operatorValue: String, value: FilterValue?, expected: Bool) {
        #expect(check("users", operatorValue, value) == expected)
    }

    @Test("all exposed fields and operators have evaluation coverage")
    func coverage() {
        let covered: Set<String> = [
            "contains", "not_contains", "starts_with", "ends_with", "is", "is_not",
            "is_any_of", "is_none_of", "has_any_of", "has_all_of", "has_none_of",
            "eq", "neq", "gt", "gte", "lt", "lte", "between", "not_between", "empty", "not_empty",
        ]
        #expect(MOVIE_FIELDS.map(\.id) == [
            "title", "genre", "year", "popularity", "users", "critics", "finalScore",
            "language", "subgenres", "oscarWins", "oscarNominations",
        ])
        for field in MOVIE_FIELDS {
            for fieldOperator in field.operators {
                #expect(covered.contains(fieldOperator.value), "\(field.id) exposes \(fieldOperator.value)")
            }
        }
        let numericValues: [String: FilterValue] = [
            "year": .n(2020), "popularity": .n(500), "users": .n(80),
            "critics": .n(90), "finalScore": .n(85),
        ]
        for (field, value) in numericValues {
            #expect(check(field, "eq", value))
        }
    }

    @Test("unknown numeric values are not zero, including in negative comparisons")
    func unknownNumbers() {
        var missing = movie
        missing.users = nil
        #expect(check("users", "empty", nil, row: missing))
        #expect(!check("users", "not_empty", nil, row: missing))
        #expect(!check("users", "eq", .n(0), row: missing))
        #expect(!check("users", "neq", .n(0), row: missing))
        #expect(!check("users", "not_between", .l([.n(0), .n(100)]), row: missing))
        var zero = movie
        zero.users = 0
        #expect(check("users", "eq", .n(0), row: zero))
    }

    @Test("evaluates nested AND / OR without flattening")
    func nestedGroups() {
        let query = group(.and, [
            .rule(rule("year", "gte", .n(2000))),
            node(.or, [
                .rule(rule("title", "contains", .s("great"))),
                .rule(rule("critics", "lt", .n(50))),
            ]),
        ])
        #expect(matchesQuery(movie, query))
        var old = movie; old.year = 1999
        #expect(!matchesQuery(old, query))
        var retitled = movie; retitled.title = "Another Film"
        #expect(!matchesQuery(retitled, query))
        var weak = retitled; weak.critics = 40
        #expect(matchesQuery(weak, query))
    }

    @Test("supports rule negation")
    func negation() {
        var negatedTitle = rule("title", "contains", .s("great"))
        negatedTitle.negated = true
        #expect(!matchesQuery(movie, group(.and, [.rule(negatedTitle)])))
        var negatedYear = rule("year", "lt", .n(2000))
        negatedYear.negated = true
        #expect(matchesQuery(movie, group(.and, [.rule(negatedYear)])))
    }

    @Test("ignores incomplete rules inside OR rather than treating them as matches")
    func incompleteRules() {
        let query = group(.or, [
            .rule(rule("title", "contains", .s("missing"))),
            .rule(rule("users", "gte", .s(""))),
            node(.and, []),
        ])
        #expect(!matchesQuery(movie, query))
        #expect(matchesQuery(movie, group(.or, [.rule(rule("users", "gte", .s("")))])))
        #expect(matchesQuery(movie, group(.and, [.rule(rule("users", "gte", .s("")))])))
    }

    @Test("empty roots and nested groups impose no condition")
    func emptyGroups() {
        #expect(matchesQuery(movie, emptyQuery()))
        #expect(matchesQuery(movie, group(.or, [])))
        #expect(matchesQuery(movie, group(.and, [node(.or, [])])))
    }

    @Test("validates finite numeric values, preserves zero and rejects reversed ranges", arguments: [
        FilterValue.s(""), FilterValue.s(" "), FilterValue.null, FilterValue.l([]),
        FilterValue.n(.nan), FilterValue.n(.infinity), FilterValue.s("not a number"),
    ])
    func invalidNumbers(value: FilterValue) {
        #expect(numericValue(value) == nil)
    }

    @Test("accepts zero in every spelling")
    func zeroValues() {
        #expect(numericValue(.s("0")) == 0)
        #expect(numericValue(.n(0)) == 0)
        #expect(isCompleteRule(rule("users", "gte", .s("0"))))
    }

    @Test("rejects incomplete ranges, blank text, unknown fields, and unknown operators")
    func incompleteRulesDetail() {
        #expect(!isCompleteRule(rule("users", "between", .l([.n(90), .n(80)]))))
        #expect(!isCompleteRule(rule("users", "between", .l([.n(80)]))))
        #expect(!isCompleteRule(rule("users", "between", .l([.s(""), .n(100)]))))
        #expect(!isCompleteRule(rule("users", "between", .l([.null, .n(100)]))))
        #expect(!isCompleteRule(rule("title", "contains", .s("  "))))
        #expect(!isCompleteRule(rule("link", "contains", .s("https"))))
        #expect(!isCompleteRule(rule("year", "unsupported", .n(2020))))
    }

    @Test("filters re-evaluate the derived final score after changing weights")
    func finalScoreRefilter() throws {
        let query = group(.and, [.rule(rule("finalScore", "gte", .n(89)))])
        #expect(try scoreMovies([asMovie(movie)], criticWeight: 0).filter { matchesQuery($0, query) }.isEmpty)
        #expect(try scoreMovies([asMovie(movie)], criticWeight: 1).filter { matchesQuery($0, query) }.count == 1)
    }

    @Test("renders parenthesized grouping and negation in the expression")
    func describe() {
        var negatedCritics = rule("critics", "lt", .n(50))
        negatedCritics.negated = true
        let query = group(.and, [
            .rule(rule("year", "gte", .n(2000))),
            node(.or, [
                .rule(rule("title", "contains", .s("great"))),
                .rule(negatedCritics),
            ]),
        ])
        #expect(describeQuery(.group(id: query.id, combinator: query.combinator, rules: query.rules))
            == "Year at least 2000 AND (Title contains \"great\" OR NOT (Critics less than 50))")
        #expect(describeQuery(.group(id: emptyQuery().id, combinator: .and, rules: [])) == "All movies")
        #expect(describeQuery(.group(id: "group", combinator: .and, rules: [.rule(rule("users", "gte", .s("")))]))
            .contains("incomplete — ignored"))
    }
}

@Suite("enrichment filters")
struct EnrichmentFiltersTests {
    @Test("language is a select field matched exactly or by membership")
    func language() {
        #expect(check("language", "is", .s("French")))
        #expect(!check("language", "is", .s("English")))
        #expect(check("language", "is_any_of", .l([.s("English"), .s("French")])))
        #expect(!check("language", "is_none_of", .l([.s("French")])))
        #expect(!check("language", "empty", nil))
        var unknown = movie
        unknown.language = nil
        #expect(check("language", "empty", nil, row: unknown))
    }

    @Test("subgenres is a multiselect field matched by any, all, or none")
    func subgenres() {
        #expect(check("subgenres", "has_any_of", .l([.s("Epic"), .s("Western")])))
        #expect(check("subgenres", "has_all_of", .l([.s("Epic"), .s("Gangster")])))
        #expect(!check("subgenres", "has_all_of", .l([.s("Epic"), .s("Western")])))
        #expect(check("subgenres", "has_none_of", .l([.s("Western")])))
        var empty = movie
        empty.subgenres = []
        #expect(check("subgenres", "empty", nil, row: empty))
    }

    @Test("Oscar wins and nominations are numeric fields and unknown counts read as empty")
    func oscars() {
        #expect(check("oscarWins", "gte", .n(1)))
        #expect(!check("oscarNominations", "gt", .n(9)))
        var unknown = movie
        unknown.oscarWins = nil
        #expect(check("oscarWins", "empty", nil, row: unknown))
    }

    @Test("membership rules are incomplete until they carry at least one value")
    func membershipCompleteness() {
        #expect(!isCompleteRule(rule("language", "is_any_of", .l([]))))
        #expect(isCompleteRule(rule("language", "is_any_of", .l([.s("French")]))))
        #expect(isCompleteRule(rule("subgenres", "has_any_of", .l([.s("Epic")]))))
        #expect(!isCompleteRule(rule("language", "is", .s(""))))
    }

    @Test("fields can carry the catalogue's vocabulary as options")
    func vocabularyOptions() {
        let fields = createMovieFields(FilterVocabulary(languages: ["English", "French"], subgenres: ["Epic", "Gangster"]))
        #expect(fields.first { $0.id == "language" }?.options.map(\.value) == ["English", "French"])
        #expect(fields.first { $0.id == "subgenres" }?.options.map(\.label) == ["Epic", "Gangster"])
        #expect(MOVIE_FIELDS.map(\.id) == [
            "title", "genre", "year", "popularity", "users", "critics", "finalScore",
            "language", "subgenres", "oscarWins", "oscarNominations",
        ])
    }

    @Test("describes membership rules with their values")
    func describeMembership() {
        #expect(describeQuery(.group(id: "group", combinator: .and, rules: [.rule(rule("subgenres", "has_any_of", .l([.s("Epic"), .s("Gangster")])))]))
            == "Subgenre has any of Epic, Gangster")
    }
}

@Suite("filter vocabulary")
struct FilterVocabularyTests {
    @Test("collects distinct languages, subgenres, and genres in alphabetical order")
    func vocabulary() {
        let signals = FilmSignals(directors: [], writers: [], genres: [], streamOn: [], free: false)
        var japanese = movie
        japanese.language = "Japanese"
        japanese.subgenres = ["Gangster", "Epic"]
        japanese.signals = FilmSignals(directors: [], writers: [], genres: ["Thriller", "Drama"], streamOn: [], free: false)
        var none = movie
        none.language = nil
        none.subgenres = ["Epic", "Anime"]
        none.signals = FilmSignals(directors: [], writers: [], genres: ["Drama"], streamOn: [], free: false)
        var english = movie
        english.language = "English"
        english.subgenres = []
        english.signals = nil
        let vocabulary = filterVocabulary([japanese, none, english])
        #expect(vocabulary.languages == ["English", "Japanese"])
        #expect(vocabulary.subgenres == ["Anime", "Epic", "Gangster"])
        #expect(vocabulary.genres == ["Drama", "Thriller"])
    }
}
