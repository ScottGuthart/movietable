import Foundation
import Testing
import MovieTableCore

@testable import MovieTableData

private func award(
    _ awardName: String,
    _ result: String,
    _ personName: String?,
    _ year: Int? = 1973
) -> AwardRow {
    AwardRow(
        award_name: awardName,
        result: result,
        year: year,
        person_name: personName,
        person_slug: personName?.lowercased().replacingOccurrences(of: " ", with: "-")
    )
}

private func detailRow(summary: String? = "  A poor family schemes.  ") -> DetailRow {
    let bong = Person(slug: "bong-joon-ho", name: "Bong Joon Ho")
    let han = Person(slug: "han-jin-won", name: "Han Jin-won")
    func credit(_ role: String, _ billing: Int, _ person: Person, _ character: String? = nil) -> CreditRow {
        CreditRow(role: role, billing: billing, person_slug: person.slug, name: person.name, character: character)
    }
    return DetailRow(
        slug: "parasite",
        summary: summary,
        justwatch_url: "https://www.justwatch.com/us/movie/parasite-2019",
        movie_imdb: ImdbRow(imdb_id: "tt6751668"),
        movie_genres: [GenreRow(genre_name: "Drama")],
        credits: [
            credit("cast", 2, Person(slug: "choi-woo-sik", name: "Choi Woo-sik"), "Ki-woo"),
            credit("cast", 1, Person(slug: "song-kang-ho", name: "Song Kang-ho"), "Ki-taek"),
            credit("director", 1, bong),
            credit("writer", 1, han),
        ],
        streaming_offers: [
            OfferRow(
                monetization: "rent", quality: "HD", url: "https://a", price: .number(3.99), currency_code: "USD",
                providers: Provider(id: 2, name: "Apple TV")
            ),
            OfferRow(
                monetization: "flatrate", quality: "4K", url: "https://h",
                providers: Provider(id: 27, name: "HBO Max", icon_url: "https://images/hbo")
            ),
        ]
    )
}

@Suite("award lines")
struct AwardLinesTests {
    @Test("drops the Academy Award prefix, names the person, and puts wins first")
    func winsFirst() {
        let summary = awardLines([
            award("Academy Award for Best Supporting Actor", "nominee", "Al Pacino"),
            award("Academy Award for Best Actor", "win", "Marlon Brando"),
            award("Academy Honorary Award", "win", "Charles Chaplin"),
        ])
        #expect(summary == AwardSummary(lines: [
            AwardLine(text: "Academy Honorary Award ·\u{00A0}Charles Chaplin", detail: "Won, 1973"),
            AwardLine(text: "Best Actor ·\u{00A0}Marlon Brando", detail: "Won, 1973"),
            AwardLine(text: "Best Supporting Actor ·\u{00A0}Al Pacino", detail: "Nominated, 1973"),
        ]))
    }

    @Test("keeps one line when Wikidata records a win and its nomination")
    func winOverridesNomination() {
        #expect(awardLines([
            award("Academy Award for Best Actress", "nominee", "Michelle Yeoh", 2023),
            award("Academy Award for Best Actress", "win", "Michelle Yeoh", 2023),
        ]).lines == [AwardLine(text: "Best Actress ·\u{00A0}Michelle Yeoh", detail: "Won, 2023")])
    }

    @Test("keeps a losing nominee beside the winner of the same category")
    func losingNominee() {
        #expect(awardLines([
            award("Academy Award for Best Supporting Actress", "win", "Jamie Lee Curtis", 2023),
            award("Academy Award for Best Supporting Actress", "nominee", "Jamie Lee Curtis", 2023),
            award("Academy Award for Best Supporting Actress", "nominee", "Stephanie Hsu", 2023),
        ]).lines == [
            AwardLine(text: "Best Supporting Actress ·\u{00A0}Jamie Lee Curtis", detail: "Won, 2023"),
            AwardLine(text: "Best Supporting Actress ·\u{00A0}Stephanie Hsu", detail: "Nominated, 2023"),
        ])
    }

    @Test("joins the people who share one award")
    func sharedAward() {
        #expect(awardLines([
            award("Academy Award for Best Sound", "nominee", "Richard Portman"),
            award("Academy Award for Best Sound", "nominee", "Chris Newman"),
            award("Academy Award for Best Sound", "nominee", "Charles Grenzbach"),
        ]).lines == [
            AwardLine(text: "Best Sound ·\u{00A0}Charles Grenzbach, Chris Newman, Richard Portman", detail: "Nominated, 1973")
        ])
    }

    @Test("merges an award Wikidata recorded under two years, keeping the year most rows agree on")
    func yearMajority() {
        #expect(awardLines([
            award("Academy Award for Best Writing, Original Screenplay", "win", "Dan Kwan", 2023),
            award("Academy Award for Best Writing, Original Screenplay", "win", "Daniels", 2022),
            award("Academy Award for Best Writing, Original Screenplay", "win", "Daniel Scheinert", 2023),
        ]).lines == [
            AwardLine(text: "Best Writing, Original Screenplay ·\u{00A0}Dan Kwan, Daniel Scheinert, Daniels", detail: "Won, 2023")
        ])
    }

    @Test("counts the nominations it does not list and never hides a win")
    func hiddenNominations() {
        var rows = [award("Academy Award for Best Picture", "win", "Albert S. Ruddy")]
        for category in ["Actor", "Actress", "Costume Design", "Film Editing", "Sound", "Score", "Cinematography"] {
            rows.append(award("Academy Award for Best \(category)", "nominee", "Someone \(category)"))
        }
        let summary = awardLines(rows, 5)
        #expect(summary.lines.count == 6)
        #expect(summary.lines[0].detail == "Won, 1973")
        #expect(summary.hiddenNominations == 2)
    }

    @Test("names the category alone when the award went to the film")
    func filmAward() {
        #expect(awardLines([
            AwardRow(award_name: "Academy Award for Best International Feature Film", result: "nominee", year: 2007, person_name: "  ")
        ]).lines == [AwardLine(text: "Best International Feature Film", detail: "Nominated, 2007")])
    }

    @Test("omits the year when Wikidata has none, and handles no awards")
    func noYear() {
        #expect(awardLines([award("Academy Award for Best Director", "nominee", "Ang Lee", nil)]).lines[0].detail == "Nominated")
        #expect(awardLines([]) == AwardSummary())
    }
}

@Suite("links and Oscar summary")
struct AwardLinkTests {
    @Test("builds the IMDb title url from the id")
    func imdb() {
        #expect(imdbUrl("tt0068646") == "https://www.imdb.com/title/tt0068646/")
    }

    @Test("summarises Oscar counts in words", arguments: [
        (2, 9, "2 Oscars, 9 nominations"),
        (1, 1, "1 Oscar, 1 nomination"),
        (0, 3, "Nominated for 3 Oscars"),
        (0, 0, nil as String?),
        (nil, nil, nil as String?),
    ])
    func oscar(wins: Int?, nominations: Int?, expected: String?) {
        #expect(oscarSummary(wins, nominations) == expected)
    }
}

@Suite("toFilmDetail")
struct ToFilmDetailTests {
    @Test("orders cast by billing, keeps the total, trims the summary, and sorts offers stream first")
    func assembly() {
        let detail = toFilmDetail(detailRow())
        #expect(detail.summary == "A poor family schemes.")
        #expect(detail.cast.map(\.name) == ["Song Kang-ho", "Choi Woo-sik"])
        #expect(detail.cast[0].character == "Ki-taek")
        #expect(detail.castTotal == 2)
        #expect(detail.directors == [Person(slug: "bong-joon-ho", name: "Bong Joon Ho")])
        #expect(detail.offers.map(\.provider) == ["HBO Max", "Apple TV"])
        #expect(detail.offers[1].monetization == .rent)
        #expect(detail.offers[1].quality == "HD")
        #expect(detail.offers[1].price == 3.99)
        #expect(detail.offers[1].currency == "USD")
    }

    @Test("an empty summary becomes null")
    func emptySummary() {
        #expect(toFilmDetail(detailRow(summary: "   ")).summary == nil)
    }

    @Test("links IMDb from the match and reads string prices PostgREST sends for numerics")
    func prices() {
        var row = detailRow()
        row.streaming_offers[0].price = .string("3.99")
        let detail = toFilmDetail(row)
        #expect(detail.imdbUrl == "https://www.imdb.com/title/tt6751668/")
        #expect(detail.offers[1].price == 3.99)
    }

    @Test("has no IMDb link without a match and no award lines by default")
    func noImdb() {
        var row = detailRow()
        row.movie_imdb = nil
        let detail = toFilmDetail(row)
        #expect(detail.imdbUrl == nil)
        #expect(detail.awards == AwardSummary())
    }

    @Test("turns award rows into lines, wins first")
    func awards() {
        let detail = toFilmDetail(detailRow(), [
            AwardRow(award_name: "Academy Award for Best Director", result: "nominee", year: 2020, person_name: "Bong Joon-ho", person_slug: "bong-joon-ho"),
            AwardRow(award_name: "Academy Award for Best Picture", result: "win", year: 2020, person_name: "", person_slug: nil),
        ])
        #expect(detail.awards == AwardSummary(lines: [
            AwardLine(text: "Best Picture", detail: "Won, 2020"),
            AwardLine(text: "Best Director ·\u{00A0}Bong Joon-ho", detail: "Nominated, 2020"),
        ]))
    }
}

@Suite("toSignals")
struct ToSignalsTests {
    @Test("splits credits by role in billing order and collects subscription providers once")
    func signals() {
        let bong = Person(slug: "bong-joon-ho", name: "Bong Joon Ho")
        let han = Person(slug: "han-jin-won", name: "Han Jin-won")
        func credit(_ role: String, _ billing: Int, _ person: Person) -> CreditRow {
            CreditRow(role: role, billing: billing, person_slug: person.slug, name: person.name)
        }
        let row = SignalRow(
            slug: "parasite",
            movie_genres: [GenreRow(genre_name: "Drama"), GenreRow(genre_name: "Thriller")],
            credits: [credit("writer", 2, han), credit("director", 1, bong), credit("writer", 1, bong)],
            streaming_offers: [
                SignalOfferRow(provider_id: 9, monetization: "flatrate"),
                SignalOfferRow(provider_id: 9, monetization: "flatrate"),
                SignalOfferRow(provider_id: 3, monetization: "flatrate"),
                SignalOfferRow(provider_id: 7, monetization: "ads"),
            ]
        )
        #expect(toSignals([row])["parasite"] == FilmSignals(
            directors: [bong],
            writers: [bong, han],
            genres: ["Drama", "Thriller"],
            streamOn: [3, 9],
            free: true
        ))
    }

    @Test("a film with no offers is not free and streams nowhere")
    func quiet() {
        #expect(toSignals([SignalRow(slug: "quiet")])["quiet"] == FilmSignals())
    }
}
