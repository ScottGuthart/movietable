import Foundation
import MovieTableCore

public enum Monetization: String, Hashable, Codable, Sendable {
    case flatrate
    case free
    case ads
    case rent
    case buy

    var sortOrder: Int {
        switch self {
        case .flatrate: 0
        case .free: 1
        case .ads: 2
        case .rent: 3
        case .buy: 4
        }
    }
}

public struct FilmOffer: Hashable, Codable, Sendable {
    public var providerId: Int
    public var provider: String
    public var iconUrl: String?
    public var monetization: Monetization
    public var quality: String
    public var url: String
    public var price: Double?
    public var currency: String?

    public init(providerId: Int, provider: String, iconUrl: String? = nil, monetization: Monetization, quality: String, url: String, price: Double? = nil, currency: String? = nil) {
        self.providerId = providerId
        self.provider = provider
        self.iconUrl = iconUrl
        self.monetization = monetization
        self.quality = quality
        self.url = url
        self.price = price
        self.currency = currency
    }
}

public struct CastMember: Hashable, Codable, Sendable {
    public var slug: String
    public var name: String
    public var character: String?

    public init(slug: String, name: String, character: String? = nil) {
        self.slug = slug
        self.name = name
        self.character = character
    }
}

public struct AwardLine: Hashable, Codable, Sendable {
    public var text: String
    public var detail: String

    public init(text: String, detail: String) {
        self.text = text
        self.detail = detail
    }
}

public struct AwardSummary: Hashable, Codable, Sendable {
    public var lines: [AwardLine]
    /// Nominations left off the list once the limit is reached; wins are never hidden.
    public var hiddenNominations: Int

    public init(lines: [AwardLine] = [], hiddenNominations: Int = 0) {
        self.lines = lines
        self.hiddenNominations = hiddenNominations
    }
}

public struct FilmDetail: Hashable, Codable, Sendable {
    public var slug: String
    public var summary: String?
    public var justwatchUrl: String?
    public var imdbUrl: String?
    public var genres: [String]
    public var directors: [Person]
    public var writers: [Person]
    /// Top-billed cast, at most `CAST_LIMIT`.
    public var cast: [CastMember]
    public var castTotal: Int
    public var offers: [FilmOffer]
    /// Oscar categories from `movie_awards`: wins first, then up to five nominations and a count of the rest.
    public var awards: AwardSummary

    public init(
        slug: String, summary: String? = nil, justwatchUrl: String? = nil, imdbUrl: String? = nil,
        genres: [String] = [], directors: [Person] = [], writers: [Person] = [], cast: [CastMember] = [],
        castTotal: Int = 0, offers: [FilmOffer] = [], awards: AwardSummary = AwardSummary()
    ) {
        self.slug = slug
        self.summary = summary
        self.justwatchUrl = justwatchUrl
        self.imdbUrl = imdbUrl
        self.genres = genres
        self.directors = directors
        self.writers = writers
        self.cast = cast
        self.castTotal = castTotal
        self.offers = offers
        self.awards = awards
    }
}

private let ACADEMY_PREFIX = "Academy Award for "
public let NOMINATION_LIMIT = 5

/// "Academy Award for Best Actor" is the category "Best Actor"; other award names stand alone.
func categoryOf(_ awardName: String) -> String {
    awardName.hasPrefix(ACADEMY_PREFIX) ? String(awardName.dropFirst(ACADEMY_PREFIX.count)) : awardName
}

/// Wikidata leaves the person blank for awards that go to the film rather than to someone.
func personOf(_ row: AwardRow) -> String {
    (row.person_name ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
}

struct AwardGroup {
    var category: String
    var won: Bool
    var years: [Int]
    var people: Set<String>
}

/// Wikidata dates the same award differently across records, so a group keeps the year its rows agree on.
func pickYear(_ years: [Int]) -> Int? {
    var counts: [Int: Int] = [:]
    for year in years { counts[year, default: 0] += 1 }
    var best: Int? = nil
    var bestCount = 0
    for (year, count) in counts {
        if count > bestCount || (count == bestCount && best != nil && year > best!) {
            best = year
            bestCount = count
        }
    }
    return best
}

/// One group per category and outcome, so everyone who shared an award shares a line.
func groupAwards(_ rows: [AwardRow]) -> [AwardGroup] {
    let wins = Set(rows.filter { $0.result == "win" }.map { "\(categoryOf($0.award_name)) \(personOf($0))" })
    var groups: [String: AwardGroup] = [:]
    for row in rows {
        let category = categoryOf(row.award_name)
        let person = personOf(row)
        if row.result == "nominee" && wins.contains("\(category) \(person)") { continue }
        let key = "\(category) \(row.result)"
        var group = groups[key] ?? AwardGroup(category: category, won: row.result == "win", years: [], people: [])
        if !person.isEmpty { group.people.insert(person) }
        if let year = row.year { group.years.append(year) }
        groups[key] = group
    }
    return groups.values.sorted { a, b in
        if a.won != b.won { return a.won && !b.won }
        return a.category.localizedStandardCompare(b.category) == .orderedAscending
    }
}

func lineOf(_ group: AwardGroup) -> AwardLine {
    let people = group.people.sorted { $0.localizedStandardCompare($1) == .orderedAscending }.joined(separator: ", ")
    let year = pickYear(group.years)
    return AwardLine(
        text: people.isEmpty ? group.category : "\(group.category) ·\u{00A0}\(people)",
        detail: (group.won ? "Won" : "Nominated") + (year.map { ", \($0)" } ?? "")
    )
}

/// Wins before nominations, each naming the category and the people it went to.
///
/// Wikidata records a win as both a nomination and a win, so a person's nomination is dropped
/// once they won that category. Long nomination lists are cut to `nominationLimit` and counted.
public func awardLines(_ rows: [AwardRow], _ nominationLimit: Int = NOMINATION_LIMIT) -> AwardSummary {
    var lines: [AwardLine] = []
    var listedNominations = 0
    var hiddenNominations = 0
    for group in groupAwards(rows) {
        if group.won {
            lines.append(lineOf(group))
            continue
        }
        if listedNominations >= nominationLimit {
            hiddenNominations += 1
            continue
        }
        listedNominations += 1
        lines.append(lineOf(group))
    }
    return AwardSummary(lines: lines, hiddenNominations: hiddenNominations)
}

public func imdbUrl(_ imdbId: String) -> String {
    "https://www.imdb.com/title/\(imdbId)/"
}

/// "2 Oscars, 9 nominations", "Nominated for 3 Oscars", or nil when there is nothing to say.
public func oscarSummary(_ wins: Int?, _ nominations: Int?) -> String? {
    if let wins, wins > 0 {
        let won = "\(wins) Oscar\(wins == 1 ? "" : "s")"
        if let nominations, nominations > 0 {
            return "\(won), \(nominations) nomination\(nominations == 1 ? "" : "s")"
        }
        return won
    }
    if let nominations, nominations > 0 {
        return "Nominated for \(nominations) Oscar\(nominations == 1 ? "" : "s")"
    }
    return nil
}

/// Detail assembly: ordering, trimming, and formatting. No network.
public func toFilmDetail(_ row: DetailRow, _ awards: [AwardRow] = []) -> FilmDetail {
    let cast = row.credits
        .filter { $0.role == "cast" }
        .sorted { $0.billing < $1.billing }
    let offers = row.streaming_offers
        .sorted { a, b in
            let orderA = Monetization(rawValue: a.monetization)?.sortOrder ?? Int.max
            let orderB = Monetization(rawValue: b.monetization)?.sortOrder ?? Int.max
            if orderA != orderB { return orderA < orderB }
            return a.providers.name.localizedStandardCompare(b.providers.name) == .orderedAscending
        }
        .map { offer in
            FilmOffer(
                providerId: offer.providers.id,
                provider: offer.providers.name,
                iconUrl: offer.providers.icon_url,
                monetization: Monetization(rawValue: offer.monetization) ?? .buy,
                quality: offer.quality,
                url: offer.url,
                price: offer.price?.double,
                currency: offer.currency_code
            )
        }
    let trimmedSummary: String? = {
        let trimmed = row.summary?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }()
    return FilmDetail(
        slug: row.slug,
        summary: trimmedSummary,
        justwatchUrl: row.justwatch_url,
        imdbUrl: row.movie_imdb?.imdb_id.map(imdbUrl),
        genres: row.movie_genres.map(\.genre_name),
        directors: people(row.credits, "director"),
        writers: people(row.credits, "writer"),
        cast: cast.prefix(CAST_LIMIT).map { CastMember(slug: $0.person_slug, name: $0.people.name, character: $0.character) },
        castTotal: cast.count,
        offers: offers,
        awards: awardLines(awards)
    )
}
