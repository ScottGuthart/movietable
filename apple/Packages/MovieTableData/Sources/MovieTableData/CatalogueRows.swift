import Foundation
import MovieTableCore

/// A row of the Supabase `movies` table with its enrichment embedded; the slug is the key.
public struct MovieRow: Decodable, Sendable {
    public var slug: String
    public var title: String
    public var year: Int?
    public var metascore: Double?
    public var userscore: Double?
    public var users_rated: Double?
    public var link: String
    public var justwatch_url: String?
    public var movie_imdb: ImdbRow?
    public var movie_genres: [GenreRow]
    public var movie_subgenres: [SubgenreRow]

    public init(
        slug: String, title: String, year: Int?, metascore: Double? = nil, userscore: Double? = nil,
        users_rated: Double? = nil, link: String, justwatch_url: String? = nil,
        movie_imdb: ImdbRow? = nil, movie_genres: [GenreRow] = [], movie_subgenres: [SubgenreRow] = []
    ) {
        self.slug = slug
        self.title = title
        self.year = year
        self.metascore = metascore
        self.userscore = userscore
        self.users_rated = users_rated
        self.link = link
        self.justwatch_url = justwatch_url
        self.movie_imdb = movie_imdb
        self.movie_genres = movie_genres
        self.movie_subgenres = movie_subgenres
    }
}

public struct ImdbRow: Codable, Sendable {
    public var language: String?
    public var oscar_wins: Int?
    public var oscar_nominations: Int?
    public var imdb_id: String?

    public init(language: String? = nil, oscar_wins: Int? = nil, oscar_nominations: Int? = nil, imdb_id: String? = nil) {
        self.language = language
        self.oscar_wins = oscar_wins
        self.oscar_nominations = oscar_nominations
        self.imdb_id = imdb_id
    }
}

public struct GenreRow: Codable, Sendable {
    public var genre_name: String

    public init(genre_name: String) {
        self.genre_name = genre_name
    }
}

public struct SubgenreRow: Codable, Sendable {
    public var subgenre_name: String

    public init(subgenre_name: String) {
        self.subgenre_name = subgenre_name
    }
}

public struct CreditRow: Decodable, Sendable {
    public var role: String
    public var billing: Int
    public var person_slug: String
    public var people: PersonName
    public var character: String?

    public init(role: String, billing: Int, person_slug: String, name: String, character: String? = nil) {
        self.role = role
        self.billing = billing
        self.person_slug = person_slug
        self.people = PersonName(name: name)
        self.character = character
    }
}

public struct PersonName: Decodable, Sendable {
    public var name: String

    public init(name: String) {
        self.name = name
    }
}

/// A `movies` row with its genres and credits embedded by PostgREST.
public struct TasteRow: Decodable, Sendable {
    public var slug: String
    public var year: Int?
    public var summary: String?
    public var movie_imdb: ImdbRow?
    public var movie_genres: [GenreRow]
    public var movie_subgenres: [SubgenreRow]
    public var credits: [CreditRow]

    public init(
        slug: String, year: Int? = nil, summary: String? = nil, movie_imdb: ImdbRow? = nil,
        movie_genres: [GenreRow] = [], movie_subgenres: [SubgenreRow] = [], credits: [CreditRow] = []
    ) {
        self.slug = slug
        self.year = year
        self.summary = summary
        self.movie_imdb = movie_imdb
        self.movie_genres = movie_genres
        self.movie_subgenres = movie_subgenres
        self.credits = credits
    }
}

/// A `movies` row with the light embeds every film carries inline.
public struct SignalRow: Decodable, Sendable {
    public var slug: String
    public var movie_genres: [GenreRow]
    public var credits: [CreditRow]
    public var streaming_offers: [SignalOfferRow]

    public init(slug: String, movie_genres: [GenreRow] = [], credits: [CreditRow] = [], streaming_offers: [SignalOfferRow] = []) {
        self.slug = slug
        self.movie_genres = movie_genres
        self.credits = credits
        self.streaming_offers = streaming_offers
    }
}

public struct SignalOfferRow: Decodable, Sendable {
    public var provider_id: Int
    public var monetization: String

    public init(provider_id: Int, monetization: String) {
        self.provider_id = provider_id
        self.monetization = monetization
    }
}

/// Streaming, rental, and purchase services, keyed on JustWatch provider ids.
public struct Provider: Hashable, Codable, Sendable {
    public var id: Int
    public var name: String
    public var icon_url: String?

    public init(id: Int, name: String, icon_url: String? = nil) {
        self.id = id
        self.name = name
        self.icon_url = icon_url
    }
}

/// A PostgREST numeric column arrives as a number or a string.
public enum NumericValue: Codable, Sendable {
    case number(Double)
    case string(String)

    public var double: Double? {
        switch self {
        case .number(let number): return number
        case .string(let string): return Double(string)
        }
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let number = try? container.decode(Double.self) {
            self = .number(number)
        } else if let string = try? container.decode(String.self) {
            self = .string(string)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Expected number or numeric string")
        }
    }
}

public struct OfferRow: Decodable, Sendable {
    public var monetization: String
    public var quality: String
    public var url: String
    public var price: NumericValue?
    public var currency_code: String?
    public var providers: Provider

    public init(monetization: String, quality: String, url: String, price: NumericValue? = nil, currency_code: String? = nil, providers: Provider) {
        self.monetization = monetization
        self.quality = quality
        self.url = url
        self.price = price
        self.currency_code = currency_code
        self.providers = providers
    }
}

/// A `movies` row with everything the detail sheet shows.
public struct DetailRow: Decodable, Sendable {
    public var slug: String
    public var summary: String?
    public var justwatch_url: String?
    public var movie_imdb: ImdbRow?
    public var movie_genres: [GenreRow]
    public var credits: [CreditRow]
    public var streaming_offers: [OfferRow]

    public init(
        slug: String, summary: String? = nil, justwatch_url: String? = nil, movie_imdb: ImdbRow? = nil,
        movie_genres: [GenreRow] = [], credits: [CreditRow] = [], streaming_offers: [OfferRow] = []
    ) {
        self.slug = slug
        self.summary = summary
        self.justwatch_url = justwatch_url
        self.movie_imdb = movie_imdb
        self.movie_genres = movie_genres
        self.credits = credits
        self.streaming_offers = streaming_offers
    }
}

/// A row of `movie_awards`: a Wikidata award record, usually attributed to a person.
public struct AwardRow: Codable, Hashable, Sendable {
    public var award_name: String
    public var result: String
    public var year: Int?
    public var person_name: String?
    public var person_slug: String?

    public init(award_name: String, result: String, year: Int? = nil, person_name: String? = nil, person_slug: String? = nil) {
        self.award_name = award_name
        self.result = result
        self.year = year
        self.person_name = person_name
        self.person_slug = person_slug
    }
}
