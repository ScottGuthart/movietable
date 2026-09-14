import Foundation
import Testing

@testable import MovieTableCore

private func film(_ slug: String, _ configure: (inout TasteFilm) -> Void = { _ in }) -> TasteFilm {
    var base = TasteFilm(slug: slug)
    configure(&base)
    return base
}

private func close(_ a: Double, _ b: Double) -> Bool {
    abs(a - b) < 1e-9
}

private let people = [
    "Francis Ford Coppola", "Mario Puzo", "Marlon Brando", "Al Pacino", "James Caan", "Robert Duvall",
    "Diane Keaton", "Michael Mann", "Robert De Niro", "Hayao Miyazaki", "Rumi Hiiragi", "Jean-Pierre Jeunet",
]
private enum P {
    static let coppola = 0, puzo = 1, brando = 2, pacino = 3, caan = 4, duvall = 5
    static let keaton = 6, mann = 7, deniro = 8, miyazaki = 9, hiiragi = 10, jeunet = 11
}

private let catalogue = TasteCatalogue(
    films: [
        film("the-godfather") {
            $0.year = 1972; $0.genres = ["Crime", "Drama"]; $0.directors = [P.coppola]
            $0.writers = [P.puzo, P.coppola]; $0.cast = [P.brando, P.pacino, P.caan]
        },
        film("the-godfather-part-ii") {
            $0.year = 1974; $0.genres = ["Crime", "Drama"]; $0.directors = [P.coppola]
            $0.writers = [P.coppola, P.puzo]; $0.cast = [P.pacino, P.duvall, P.keaton]
        },
        film("heat") {
            $0.year = 1995; $0.genres = ["Crime", "Drama", "Thriller"]; $0.directors = [P.mann]
            $0.writers = [P.mann]; $0.cast = [P.pacino, P.deniro]
        },
        film("spirited-away") {
            $0.year = 2001; $0.genres = ["Animation", "Adventure", "Family"]; $0.directors = [P.miyazaki]
            $0.writers = [P.miyazaki]; $0.cast = [P.hiiragi]
        },
        film("amelie") {
            $0.year = 2001; $0.genres = ["Comedy", "Romance"]; $0.directors = [P.jeunet]
        },
    ],
    people: people
)

private func scored(_ slug: String, _ finalScore: Int? = 90) -> ScoredMovie {
    var movie = ScoredMovie(
        slug: slug, title: slug, year: 2000, popularity: 1000, users: finalScore.map(Double.init),
        critics: finalScore.map(Double.init), link: "https://www.metacritic.com/movie/\(slug)/"
    )
    movie.finalScore = finalScore
    movie.popularityScore = 50
    return movie
}

private func forYouOf(_ rows: [ScoredMovie], _ slug: String) -> Int? {
    rows.first { $0.slug == slug }?.forYou
}

@Suite("film features")
struct FilmFeaturesTests {
    @Test("derives one feature per genre, credit, and decade")
    func features() throws {
        let godfather = try #require(catalogue.films.first { $0.slug == "the-godfather" })
        let features = filmFeatures(godfather)
        #expect(features.contains(Feature(kind: .decade, key: "1970")))
        #expect(features.contains(Feature(kind: .genre, key: "Crime")))
        #expect(features.contains(Feature(kind: .director, key: "0")))
        #expect(features.contains(Feature(kind: .writer, key: "1")))
        #expect(features.contains(Feature(kind: .cast, key: "3")))
        #expect(features.count == 1 + 2 + 1 + 2 + 3)
    }

    @Test("adds subgenres and the language as features of their own kinds")
    func subgenreFeatures() {
        let features = filmFeatures(film("x") { $0.subgenres = ["Gangster", "Epic"]; $0.language = "Italian" })
        #expect(features.contains(Feature(kind: .subgenre, key: "Gangster")))
        #expect(features.contains(Feature(kind: .subgenre, key: "Epic")))
        #expect(features.contains(Feature(kind: .language, key: "Italian")))
        #expect(features.count == 3)
    }

    @Test("weights a subgenre between a genre and a writer, and a language like a cast member")
    func subgenreWeights() throws {
        let solo = TasteCatalogue(films: [film("s") { $0.subgenres = ["Gangster"]; $0.language = "Italian" }], people: [])
        let profile = buildProfile(solo, ["s": .rated(5)])
        #expect(profile["subgenre:Gangster"] == 1.5)
        #expect(profile["language:Italian"] == 1)
        #expect(explainMatch(profile, solo.films[0], []) == [
            MatchReason(kind: .subgenre, label: "Gangster"),
            MatchReason(kind: .language, label: "Italian"),
        ])
    }

    @Test("skips the decade when the year is unknown")
    func unknownYear() {
        #expect(filmFeatures(film("x") { $0.genres = ["Drama"] }) == [Feature(kind: .genre, key: "Drama")])
    }
}

@Suite("profile")
struct ProfileTests {
    @Test("weights a like by feature kind")
    func weights() {
        let profile = buildProfile(catalogue, ["the-godfather": .rated(5)])
        #expect(profile["director:0"] == 3)
        #expect(profile["genre:Crime"] == 2)
        #expect(profile["writer:1"] == 1.5)
        #expect(profile["cast:3"] == 1)
        #expect(profile["decade:1970"] == 1)
    }

    @Test("scales a rating around three stars: five is full weight, two is minus half, three is nothing")
    func scaling() {
        let profile = buildProfile(catalogue, ["the-godfather": .rated(5), "heat": .rated(3), "amelie": .rated(4)])
        #expect(profile["director:0"] == 3)
        #expect(profile["director:7"] == nil)
        #expect(profile["genre:Thriller"] == nil)
        #expect(profile["director:11"] == 1.5)
        #expect(profile["genre:Comedy"] == 1)
    }

    @Test("a two-star rating counts against a film at two fifths weight and skips carry nothing")
    func negativeWeights() {
        let profile = buildProfile(catalogue, ["spirited-away": .rated(2), "amelie": .skip])
        #expect(close(profile["genre:Animation"] ?? 0, -0.8))
        #expect(close(profile["director:9"] ?? 0, -1.2))
        #expect(profile["director:11"] == nil)
    }

    @Test("accumulates across films")
    func accumulation() {
        let profile = buildProfile(catalogue, ["the-godfather": .rated(5), "the-godfather-part-ii": .rated(5), "heat": .rated(2)])
        #expect(profile["director:0"] == 6)
        #expect(close(profile["cast:3"] ?? 0, 1.6))
    }

    @Test("only four or five stars make a profile")
    func favouritesOnly() {
        #expect(!hasPositive(["a": .rated(2), "b": .skip]))
        #expect(hasPositive(["a": .rated(2), "b": .rated(4)]))
        #expect(ratedCount(["a": .rated(2), "b": .rated(5), "c": .skip]) == 2)
    }
}

@Suite("For you score")
struct ForYouScoreTests {
    @Test("blends match strength with Final Score and floors")
    func blends() {
        #expect(forYouScore(1, 90) == 96)
        #expect(forYouScore(0.5, 70) == 58)
        #expect(forYouScore(0, 100) == 40)
    }

    @Test("is unavailable when either input is missing")
    func missing() {
        #expect(forYouScore(nil, 90) == nil)
        #expect(forYouScore(1, nil) == nil)
    }
}

@Suite("ranking")
struct RankingTests {
    let movies = ["the-godfather", "the-godfather-part-ii", "heat", "spirited-away", "amelie", "no-metadata"].map { scored($0) }

    @Test("leaves For you empty without a like or a catalogue")
    func noProfile() {
        #expect(rankMovies(movies, catalogue, [:]).allSatisfy { $0.forYou == nil })
        #expect(rankMovies(movies, catalogue, ["heat": .rated(2)]).allSatisfy { $0.forYou == nil })
        #expect(rankMovies(movies, nil, ["heat": .rated(5)]).allSatisfy { $0.forYou == nil })
    }

    @Test("liking The Godfather ranks Coppola and crime films above unrelated ones")
    func godfatherRanking() {
        let ranked = rankMovies(movies, catalogue, ["the-godfather": .rated(5)])
        #expect(forYouOf(ranked, "the-godfather-part-ii") == 96)
        #expect(forYouOf(ranked, "the-godfather") == 96)
        #expect(forYouOf(ranked, "heat") == 58)
        #expect((forYouOf(ranked, "heat") ?? 0) > (forYouOf(ranked, "spirited-away") ?? 0))
        #expect(forYouOf(ranked, "amelie") == 36)
    }

    @Test("a pass pulls similar films down")
    func passPullsDown() {
        let liked = rankMovies(movies, catalogue, ["the-godfather": .rated(5)])
        let passed = rankMovies(movies, catalogue, ["the-godfather": .rated(5), "heat": .rated(2)])
        #expect((forYouOf(passed, "heat") ?? 0) < (forYouOf(liked, "heat") ?? 0))
    }

    @Test("a film without attributes or without a Final Score shows nothing")
    func missingAttributes() {
        var extended = catalogue
        extended.films.append(film("amelie-unscored") { $0.genres = ["Comedy"] })
        var rows = movies
        rows.append(scored("amelie-unscored", nil))
        let ranked = rankMovies(rows, extended, ["the-godfather": .rated(5)])
        #expect(forYouOf(ranked, "no-metadata") == nil)
        #expect(forYouOf(ranked, "amelie-unscored") == nil)
    }

    @Test("scales matches against the best unrated film, not the liked film itself")
    func scaleBestUnrated() {
        let ranked = rankMovies(movies, catalogue, ["the-godfather": .rated(5), "the-godfather-part-ii": .rated(2)])
        #expect(forYouOf(ranked, "heat") == 96)
    }

    @Test("still scores when every film with attributes has been rated")
    func allRated() {
        let solo = TasteCatalogue(films: [film("seed") { $0.genres = ["Crime"] }], people: [])
        #expect(forYouOf(rankMovies([scored("seed", 70)], solo, ["seed": .rated(5)]), "seed") == 88)
    }

    @Test("equal match never lets a weaker film beat a stronger one")
    func qualityBreaksTies() {
        let twins = TasteCatalogue(
            films: [
                film("a") { $0.genres = ["Crime"] },
                film("b") { $0.genres = ["Crime"] },
                film("seed") { $0.genres = ["Crime"] },
            ],
            people: []
        )
        let ranked = rankMovies([scored("a", 85), scored("b", 40), scored("seed", 70)], twins, ["seed": .rated(5)])
        #expect((forYouOf(ranked, "a") ?? 0) > (forYouOf(ranked, "b") ?? 0))
    }

    @Test("keeps input order and every other field")
    func keepsOrder() {
        let ranked = rankMovies(movies, catalogue, ["the-godfather": .rated(5)])
        #expect(ranked.map(\.slug) == movies.map(\.slug))
        #expect(ranked[0].title == "the-godfather")
        #expect(ranked[0].finalScore == 90)
        #expect(ranked[0].link == movies[0].link)
    }
}

@Suite("explanations")
struct ExplanationsTests {
    let profile = buildProfile(catalogue, ["the-godfather": .rated(5), "spirited-away": .rated(2)])

    @Test("names the strongest shared attributes, heaviest first, at most three")
    func strongestFirst() throws {
        let sequel = try #require(catalogue.films.first { $0.slug == "the-godfather-part-ii" })
        let reasons = explainMatch(profile, sequel, people)
        #expect(reasons.first == MatchReason(kind: .director, label: "Francis Ford Coppola"))
        #expect(reasons.count == 3)
        #expect(!reasons.map(\.kind).contains(.cast))
    }

    @Test("names an unrecorded person honestly")
    func unknownPerson() throws {
        let godfather = try #require(catalogue.films.first { $0.slug == "the-godfather" })
        let reasons = explainMatch(profile, godfather, [])
        #expect(reasons.first == MatchReason(kind: .director, label: UNKNOWN_PERSON))
    }

    @Test("says nothing when every shared attribute counts against the film")
    func negativeOnly() throws {
        let spirited = try #require(catalogue.films.first { $0.slug == "spirited-away" })
        let amelie = try #require(catalogue.films.first { $0.slug == "amelie" })
        #expect(explainMatch(profile, spirited, people).isEmpty)
        #expect(explainMatch(profile, amelie, people).isEmpty)
    }

    @Test("labels decades as a range")
    func decadeLabels() throws {
        let spirited = try #require(catalogue.films.first { $0.slug == "spirited-away" })
        let reasons = explainMatch(buildProfile(catalogue, ["amelie": .rated(5)]), spirited, people)
        #expect(reasons == [MatchReason(kind: .decade, label: "2000s")])
    }
}

@Suite("profile summary")
struct ProfileSummaryTests {
    @Test("lists the leading genres then the leading director")
    func summary() {
        let profile = buildProfile(catalogue, ["the-godfather": .rated(5), "heat": .rated(5)])
        #expect(summarizeProfile(profile, people) == ["Crime", "Drama", "Francis Ford Coppola"])
    }

    @Test("is empty without likes")
    func empty() {
        #expect(summarizeProfile(buildProfile(catalogue, ["heat": .rated(2)]), people).isEmpty)
    }
}

@Suite("starter hand")
struct StarterHandTests {
    static let candidates: [HandCandidate] = [
        HandCandidate(slug: "d", year: 2004, genres: ["Drama"], popularity: 600),
        HandCandidate(slug: "a", year: 2001, genres: ["Drama"], popularity: 900),
        HandCandidate(slug: "e", year: 1975, genres: ["Crime"], popularity: 500),
        HandCandidate(slug: "c", year: 1995, genres: ["Crime"], popularity: 700),
        HandCandidate(slug: "b", year: 2002, genres: ["Drama"], popularity: 800),
        HandCandidate(slug: "f", year: 2005, genres: ["Drama"], popularity: nil),
    ]

    var candidates: [HandCandidate] { Self.candidates }

    @Test("deals the most popular film from each decade and genre first")
    func freshFirst() {
        #expect(dealHand(candidates, 0, 3).map(\.slug) == ["a", "c", "e"])
    }

    @Test("continues with the remaining films by popularity, unknown popularity last")
    func repeatsAfter() {
        #expect(dealHand(candidates, 3, 3).map(\.slug) == ["b", "d", "f"])
        #expect(dealHand(candidates, 0, 10).map(\.slug) == ["a", "c", "e", "b", "d", "f"])
    }

    @Test("is deterministic and never invents films")
    func deterministic() {
        #expect(dealHand(candidates, 0, 3) == dealHand(candidates.reversed(), 0, 3))
        #expect(dealHand([], 0, 12).isEmpty)
        #expect(dealHand(candidates, 99, 12).isEmpty)
    }
}

@Suite("verdicts")
struct VerdictTests {
    @Test("accept whole stars from one to five or a skip")
    func accepts() {
        let verdicts: Verdicts = ["a": .rated(1), "b": .rated(5), "c": .skip]
        #expect(verdicts.count == 3)
    }

    @Test("migrate saved thumbs, accept half steps, and reject anything else")
    func parsing() {
        #expect(parseVerdict(.string("like")) == .rated(4))
        #expect(parseVerdict(.string("pass")) == .rated(2))
        #expect(parseVerdict(.string("skip")) == .skip)
        #expect(parseVerdict(.number(3)) == .rated(3))
        #expect(parseVerdict(.number(3.5)) == .rated(3.5))
        #expect(parseVerdict(.number(0.5)) == .rated(0.5))
        #expect(parseVerdict(.number(5)) == .rated(5))
    }

    @Test("reject invalid values", arguments: [
        VerdictValue.number(0), VerdictValue.number(5.5), VerdictValue.number(6),
        VerdictValue.number(2.25), VerdictValue.string("loved"), VerdictValue.null, VerdictValue.other,
    ])
    func rejects(value: VerdictValue) {
        #expect(parseVerdict(value) == nil)
    }

    @Test("weights run from fully against at half a star to fully for at five, neutral at three")
    func factors() {
        #expect(ratingFactor(0.5) == -1)
        #expect(close(ratingFactor(1.5), -0.6))
        #expect(ratingFactor(3) == 0)
        #expect(ratingFactor(3.5) == 0.25)
        #expect(ratingFactor(4.5) == 0.75)
        #expect(ratingFactor(5) == 1)
        #expect(!hasPositive(["a": .rated(3.5)]))
        #expect(hasPositive(["a": .rated(4.5)]))
        #expect(buildProfile(catalogue, ["the-godfather": .rated(4.5)])["director:0"] == 2.25)
    }

    @Test("three stars count as rated but not as a favourite")
    func neutral() {
        #expect(ratedCount(["a": .rated(3), "b": .skip]) == 1)
        #expect(!hasPositive(["a": .rated(3)]))
        #expect(hasPositive(["a": .rated(4)]))
    }
}
