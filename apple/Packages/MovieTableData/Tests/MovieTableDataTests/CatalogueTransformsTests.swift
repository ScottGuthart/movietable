import Foundation
import Testing

@testable import MovieTableData

private func movieRow(
    slug: String,
    title: String? = nil,
    year: Int? = 2000,
    metascore: Double? = 80,
    userscore: Double? = 75,
    usersRated: Double? = 400,
    imdb: ImdbRow? = nil,
    genres: [String] = [],
    subgenres: [String] = []
) -> MovieRow {
    MovieRow(
        slug: slug,
        title: title ?? slug,
        year: year,
        metascore: metascore,
        userscore: userscore,
        users_rated: usersRated,
        link: "https://www.metacritic.com/movie/\(slug)/",
        justwatch_url: nil,
        movie_imdb: imdb,
        movie_genres: genres.map { GenreRow(genre_name: $0) },
        movie_subgenres: subgenres.map { SubgenreRow(subgenre_name: $0) }
    )
}

@Suite("movie rows")
struct MovieRowTests {
    @Test("maps database rows onto the app's raw movie shape")
    func maps() {
        let result = toRawMovies([movieRow(slug: "heat", title: "Heat", year: 1995, userscore: 88.5)])
        let movie = result.movies.first
        #expect(result.dropped == 0)
        #expect(movie?.slug == "heat")
        #expect(movie?.title == "Heat")
        #expect(movie?.year == 1995)
        #expect(movie?.metascore == 80)
        #expect(movie?.userscore == 88.5)
        #expect(movie?.users_rated == 400)
        #expect(movie?.link == "https://www.metacritic.com/movie/heat/")
        #expect(movie?.language == nil)
        #expect(movie?.subgenres == [])
        #expect(movie?.oscar_wins == nil)
        #expect(movie?.oscar_nominations == nil)
    }

    @Test("drops films without a release year and counts them")
    func dropsMissingYear() {
        let result = toRawMovies([movieRow(slug: "a"), movieRow(slug: "b", year: nil)])
        #expect(result.movies.map(\.slug) == ["a"])
        #expect(result.dropped == 1)
    }
}

@Suite("enrichment on movie rows")
struct MovieEnrichmentTests {
    @Test("carries language and Oscar counts and cleans subgenres, most common first, dropping Metacritic genres")
    func enrichment() {
        let rows = [
            movieRow(
                slug: "a",
                imdb: ImdbRow(language: "Italian", oscar_wins: 2, oscar_nominations: 9),
                genres: ["Crime", "Drama"],
                subgenres: ["epic film", "gangster film", "crime film", "drama film"]
            ),
            movieRow(slug: "b", subgenres: ["gangster film"]),
            movieRow(slug: "c", genres: ["Animation"], subgenres: ["drama film", "anime"]),
        ]
        let movies = toRawMovies(rows).movies
        #expect(movies[0].language == "Italian")
        #expect(movies[0].oscar_wins == 2)
        #expect(movies[0].oscar_nominations == 9)
        #expect(movies[0].subgenres == ["Gangster", "Epic"])
        #expect(movies[1].language == nil)
        #expect(movies[1].oscar_wins == nil)
        #expect(movies[1].oscar_nominations == nil)
        #expect(movies[1].subgenres == ["Gangster"])
        #expect(movies[2].subgenres == ["Anime"])
    }

    @Test("cleans Wikidata labels into sentence-case subgenres", arguments: [
        ("crime drama film", "Crime drama"),
        ("Spaghetti Western", "Spaghetti Western"),
        ("LGBTQ-related film", "LGBTQ-related"),
        ("Western films", "Western"),
        ("film noir", "Film noir"),
    ])
    func cleans(label: String, expected: String) {
        #expect(cleanSubgenre(label) == expected)
    }
}

@Suite("taste rows")
struct TasteRowTests {
    private let taste = TasteRow(
        slug: "the-godfather",
        year: 1972,
        summary: "Aging patriarch.",
        movie_imdb: ImdbRow(language: "English"),
        movie_genres: [GenreRow(genre_name: "Crime"), GenreRow(genre_name: "Drama")],
        movie_subgenres: [SubgenreRow(subgenre_name: "gangster film"), SubgenreRow(subgenre_name: "crime film")],
        credits: [
            CreditRow(role: "cast", billing: 2, person_slug: "al-pacino", name: "Al Pacino"),
            CreditRow(role: "director", billing: 1, person_slug: "francis-ford-coppola", name: "Francis Ford Coppola"),
            CreditRow(role: "cast", billing: 1, person_slug: "marlon-brando", name: "Marlon Brando"),
            CreditRow(role: "writer", billing: 1, person_slug: "mario-puzo", name: "Mario Puzo"),
        ] + (0..<12).map { index in
            CreditRow(role: "cast", billing: index + 3, person_slug: "extra-\(index)", name: "extra-\(index)")
        }
    )

    @Test("splits credits by role in billing order, caps cast at eight, and indexes people by slug order")
    func credits() {
        let catalogue = toTasteCatalogue([taste])
        #expect(catalogue.films.count == 1)
        #expect(catalogue.people == [
            "Al Pacino", "extra-0", "extra-1", "extra-2", "extra-3", "extra-4", "extra-5",
            "Francis Ford Coppola", "Mario Puzo", "Marlon Brando",
        ])
        #expect(catalogue.films[0].slug == "the-godfather")
        #expect(catalogue.films[0].year == 1972)
        #expect(catalogue.films[0].summary == "Aging patriarch.")
        #expect(catalogue.films[0].genres == ["Crime", "Drama"])
        #expect(catalogue.films[0].subgenres == ["Gangster"])
        #expect(catalogue.films[0].language == "English")
        #expect(catalogue.films[0].directors == [7])
        #expect(catalogue.films[0].writers == [8])
        #expect(catalogue.films[0].cast == [9, 0, 1, 2, 3, 4, 5, 6])
    }

    @Test("shares one index for a person credited on several films")
    func sharedPerson() {
        let second = TasteRow(
            slug: "the-godfather-part-ii",
            year: 1974,
            credits: [CreditRow(role: "director", billing: 1, person_slug: "francis-ford-coppola", name: "Francis Ford Coppola")]
        )
        let catalogue = toTasteCatalogue([taste, second])
        #expect(catalogue.films[1].directors == catalogue.films[0].directors)
        #expect(catalogue.people.filter { $0 == "Francis Ford Coppola" }.count == 1)
    }

    @Test("tolerates films with no genres or credits")
    func empty() {
        var row = taste
        row.movie_genres = []
        row.credits = []
        row.movie_imdb = nil
        row.movie_subgenres = []
        let film = toTasteCatalogue([row]).films[0]
        #expect(film.genres == [])
        #expect(film.subgenres == [])
        #expect(film.language == nil)
        #expect(film.directors == [])
        #expect(film.writers == [])
        #expect(film.cast == [])
    }
}

private final class StringLog: @unchecked Sendable {
    private let lock = NSLock()
    private var values: [String] = []

    func append(_ value: String) {
        lock.lock()
        do { values.append(value) }
        lock.unlock()
    }

    var recorded: [String] {
        lock.lock()
        defer { lock.unlock() }
        return values
    }
}

@Suite("keyset paging")
struct PageAllTests {
    private func slug(_ index: Int) -> String {
        String(format: "film-%04d", index)
    }

    @Test("asks for the page after the last slug until a short page arrives")
    func pages() async throws {
        let rows = (1...2500).map { slug($0) }
        let calls = StringLog()
        let all = try await pageAll({ afterSlug, limit in
            calls.append(afterSlug)
            return rows.filter { $0 > afterSlug }.prefix(limit).map { String($0) }
        }, keyOf: { $0 }, limit: 1000)
        #expect(all.count == 2500)
        #expect(calls.recorded == ["", slug(1000), slug(2000)])
    }

    @Test("stops after one empty page")
    func emptyPage() async throws {
        let all = try await pageAll({ _, _ in [] }, keyOf: { $0 }, limit: 1000)
        #expect(all.isEmpty)
    }
}

@Suite("summary trimming")
struct TruncateSummaryTests {
    private let long = "A harried film director, unable to finish his next picture, retreats into a swirl of memories and fantasies while producers, lovers, and critics press in from every side of the set."

    @Test("keeps short summaries and nulls untouched")
    func short() {
        #expect(truncateSummary("Short.") == "Short.")
        #expect(truncateSummary(nil) == nil)
    }

    @Test("ends at the last full sentence when one fits")
    func sentence() {
        let text = "A harried film director retreats into his memories and fantasies while the whole production waits. Then a great deal more happens over the following two hours that nobody needs to read on a small card."
        #expect(truncateSummary(text, 160) == "A harried film director retreats into his memories and fantasies while the whole production waits.")
    }

    @Test("otherwise cuts at a word boundary with an ellipsis")
    func wordCut() throws {
        let cut = try #require(truncateSummary(long, 160))
        #expect(cut.count <= 160)
        #expect(cut.hasSuffix("…"))
        #expect(long.hasPrefix(String(cut.dropLast())))
        #expect(!String(cut.dropLast()).hasSuffix(" "))
    }
}
