import Foundation

/// A Metacritic person: slug plus display name.
public struct Person: Hashable, Codable, Sendable {
    public var slug: String
    public var name: String

    public init(slug: String, name: String) {
        self.slug = slug
        self.name = name
    }
}

/// Facts every film carries inline so the table can search, group, filter,
/// and mark availability without a fetch.
public struct FilmSignals: Hashable, Codable, Sendable {
    /// Billing order.
    public var directors: [Person]
    public var writers: [Person]
    public var genres: [String]
    /// JustWatch provider ids carrying a subscription (flatrate) offer in the US.
    public var streamOn: [Int]
    /// True when a free or ad-supported offer exists.
    public var free: Bool

    public init(directors: [Person] = [], writers: [Person] = [], genres: [String] = [], streamOn: [Int] = [], free: Bool = false) {
        self.directors = directors
        self.writers = writers
        self.genres = genres
        self.streamOn = streamOn
        self.free = free
    }
}

/// A normalized catalogue row. Missing numbers are `nil`, never zero.
public struct Movie: Hashable, Codable, Sendable {
    public var slug: String
    public var title: String
    public var year: Int
    /// Number of audience ratings on Metacritic.
    public var popularity: Double?
    /// Metacritic user score, 0-100.
    public var users: Double?
    /// Metascore, 0-100.
    public var critics: Double?
    public var link: String
    public var language: String?
    public var subgenres: [String]
    /// Academy Award counts from Wikidata; nil when the film has no IMDb match. Indicative, not complete.
    public var oscarWins: Int?
    public var oscarNominations: Int?
    /// Absent when the catalogue had no credits or offers for the film.
    public var signals: FilmSignals?

    public init(
        slug: String,
        title: String,
        year: Int,
        popularity: Double? = nil,
        users: Double? = nil,
        critics: Double? = nil,
        link: String,
        language: String? = nil,
        subgenres: [String] = [],
        oscarWins: Int? = nil,
        oscarNominations: Int? = nil,
        signals: FilmSignals? = nil
    ) {
        self.slug = slug
        self.title = title
        self.year = year
        self.popularity = popularity
        self.users = users
        self.critics = critics
        self.link = link
        self.language = language
        self.subgenres = subgenres
        self.oscarWins = oscarWins
        self.oscarNominations = oscarNominations
        self.signals = signals
    }
}

/// A movie plus the scores derived for the current view.
public struct ScoredMovie: Hashable, Codable, Sendable {
    public var slug: String
    public var title: String
    public var year: Int
    public var popularity: Double?
    public var users: Double?
    public var critics: Double?
    public var link: String
    public var language: String?
    public var subgenres: [String]
    public var oscarWins: Int?
    public var oscarNominations: Int?
    public var signals: FilmSignals?
    /// Popularity as a catalogue percentile, 0-100. Nil when the film has no rating count.
    public var popularityScore: Int?
    public var finalScore: Int?
    /// Taste match, 0-100. Nil until the visitor likes a film; filled by `rankMovies`.
    public var forYou: Int?

    public init(
        slug: String,
        title: String,
        year: Int,
        popularity: Double? = nil,
        users: Double? = nil,
        critics: Double? = nil,
        link: String,
        language: String? = nil,
        subgenres: [String] = [],
        oscarWins: Int? = nil,
        oscarNominations: Int? = nil,
        signals: FilmSignals? = nil,
        popularityScore: Int? = nil,
        finalScore: Int? = nil,
        forYou: Int? = nil
    ) {
        self.slug = slug
        self.title = title
        self.year = year
        self.popularity = popularity
        self.users = users
        self.critics = critics
        self.link = link
        self.language = language
        self.subgenres = subgenres
        self.oscarWins = oscarWins
        self.oscarNominations = oscarNominations
        self.signals = signals
        self.popularityScore = popularityScore
        self.finalScore = finalScore
        self.forYou = forYou
    }

    public init(movie: Movie, popularityScore: Int? = nil, finalScore: Int? = nil, forYou: Int? = nil) {
        self.init(
            slug: movie.slug,
            title: movie.title,
            year: movie.year,
            popularity: movie.popularity,
            users: movie.users,
            critics: movie.critics,
            link: movie.link,
            language: movie.language,
            subgenres: movie.subgenres,
            oscarWins: movie.oscarWins,
            oscarNominations: movie.oscarNominations,
            signals: movie.signals,
            popularityScore: popularityScore,
            finalScore: finalScore,
            forYou: forYou
        )
    }
}

/// A raw catalogue row, shaped as PostgREST returns it.
public struct RawMovie: Hashable, Codable, Sendable {
    public var slug: String?
    public var title: String
    public var year: Int
    public var users_rated: Double?
    public var userscore: Double?
    public var metascore: Double?
    public var link: String
    public var language: String?
    public var subgenres: [String]?
    public var oscar_wins: Double?
    public var oscar_nominations: Double?

    public init(
        slug: String? = nil,
        title: String,
        year: Int,
        users_rated: Double? = nil,
        userscore: Double? = nil,
        metascore: Double? = nil,
        link: String,
        language: String? = nil,
        subgenres: [String]? = nil,
        oscar_wins: Double? = nil,
        oscar_nominations: Double? = nil
    ) {
        self.slug = slug
        self.title = title
        self.year = year
        self.users_rated = users_rated
        self.userscore = userscore
        self.metascore = metascore
        self.link = link
        self.language = language
        self.subgenres = subgenres
        self.oscar_wins = oscar_wins
        self.oscar_nominations = oscar_nominations
    }
}

public let DEFAULT_CRITIC_WEIGHT = 0.5
/// Popularity stays out of the blend until the visitor asks for it, so Final Score is unchanged on arrival.
public let DEFAULT_POPULARITY_WEIGHT = 0.0

public struct WeightRangeError: Error, CustomStringConvertible {
    public let name: String
    public var description: String { "\(name) must be between 0 and 1." }
}

func finiteOrNull(_ value: Double?) -> Double? {
    guard let value, value.isFinite else { return nil }
    return value
}

/// Renders a number the way JavaScript's `String(number)` does, without a
/// trailing `.0`, so search and descriptions match the web app.
public func decimalString(_ value: Double) -> String {
    if value.isFinite && value == value.rounded() && abs(value) < 1e15 {
        return String(Int64(value))
    }
    return String(value)
}

/// The trailing path segment of a Metacritic link, e.g. `the-godfather`.
public func slugFromLink(_ link: String) -> String {
    let trimmed = link.drop { $0 == "/" }
    return String(trimmed.split(separator: "/").last ?? "")
}

public func normalizeMovie(_ raw: RawMovie) -> Movie {
    Movie(
        slug: raw.slug ?? slugFromLink(raw.link),
        title: raw.title,
        year: raw.year,
        popularity: finiteOrNull(raw.users_rated),
        users: finiteOrNull(raw.userscore),
        critics: finiteOrNull(raw.metascore),
        link: raw.link,
        language: raw.language,
        subgenres: raw.subgenres ?? [],
        oscarWins: finiteOrNull(raw.oscar_wins).map(Int.init),
        oscarNominations: finiteOrNull(raw.oscar_nominations).map(Int.init)
    )
}

/// Popularity as a percentile of the catalogue, 0-100.
///
/// Rating counts run from a handful to six figures and are heavily skewed, so
/// a linear rescale would press nearly every film against zero. A percentile
/// answers what the count is actually read for - how widely seen is this,
/// against everything else here - and lands on the same scale as the scores.
public func popularityPercentiles(_ movies: [Movie]) -> [Int?] {
    let counts = movies.map { finiteOrNull($0.popularity) }
    let ranked = counts.compactMap { $0 }.sorted()
    if ranked.isEmpty { return counts.map { _ in nil } }

    func cut(_ value: Double, orEqual: Bool) -> Int {
        var low = 0
        var high = ranked.count
        while low < high {
            let mid = (low + high) >> 1
            if orEqual ? ranked[mid] <= value : ranked[mid] < value {
                low = mid + 1
            } else {
                high = mid
            }
        }
        return low
    }

    // Midrank, so films on the same count share one percentile.
    return counts.map { count in
        guard let count else { return nil }
        let rank = Double(cut(count, orEqual: false) + cut(count, orEqual: true)) / 2.0
        return Int((rank / Double(ranked.count) * 100).rounded(.toNearestOrAwayFromZero))
    }
}

func checkWeight(_ weight: Double, _ name: String) throws {
    if !weight.isFinite || weight < 0 || weight > 1 {
        throw WeightRangeError(name: name)
    }
}

/// A weight of 0 or 1 takes that side alone, so a missing value on the unused
/// side never voids the result.
func weighted(_ low: Double?, _ high: Double?, _ weight: Double) -> Double? {
    if weight == 0 { return low }
    if weight == 1 { return high }
    guard let low, let high else { return nil }
    return (1 - weight) * low + weight * high
}

/// The visitor-weighted blend, rounded down. Critic weight slides between the
/// audience and critic scores; popularity weight then mixes in how widely seen
/// the film is. At zero popularity weight this is the critic/audience blend alone.
public func finalScore(
    users: Double?,
    critics: Double?,
    criticWeight: Double,
    popularityScore: Int? = nil,
    popularityWeight: Double = DEFAULT_POPULARITY_WEIGHT
) throws -> Int? {
    try checkWeight(criticWeight, "Critic weight")
    try checkWeight(popularityWeight, "Popularity weight")
    let base = weighted(finiteOrNull(users), finiteOrNull(critics), criticWeight)
    let blended = weighted(base, finiteOrNull(popularityScore.map(Double.init)), popularityWeight)
    return blended.map { Int($0.rounded(.down)) }
}

public func scoreMovies(
    _ movies: [Movie],
    criticWeight: Double,
    popularityWeight: Double = DEFAULT_POPULARITY_WEIGHT
) throws -> [ScoredMovie] {
    let percentiles = popularityPercentiles(movies)
    return try movies.enumerated().map { index, movie in
        let popularityScore = percentiles[index] ?? nil
        let score = try finalScore(
            users: movie.users,
            critics: movie.critics,
            criticWeight: criticWeight,
            popularityScore: popularityScore,
            popularityWeight: popularityWeight
        )
        return ScoredMovie(movie: movie, popularityScore: popularityScore, finalScore: score, forYou: nil)
    }
}

public struct MovieBounds: Hashable, Sendable {
    public var earliestYear: Int
    public var latestYear: Int
}

public func getMovieBounds(_ movies: [Movie]) -> MovieBounds? {
    guard let earliest = movies.map(\.year).min(), let latest = movies.map(\.year).max() else {
        return nil
    }
    return MovieBounds(earliestYear: earliest, latestYear: latest)
}

/// Free-text search across title, year, and the visible numeric columns,
/// plus director and writer names.
public func matchesSearch(_ movie: ScoredMovie, _ search: String) -> Bool {
    let term = search.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if term.isEmpty { return true }
    var candidates: [String] = [movie.title, String(movie.year)]
    for value in [movie.popularity, movie.users, movie.critics, movie.finalScore.map(Double.init), movie.forYou.map(Double.init)] {
        if let value { candidates.append(decimalString(value)) }
    }
    if let signals = movie.signals {
        for person in signals.directors + signals.writers {
            candidates.append(person.name)
        }
    }
    return candidates.contains { $0.lowercased().contains(term) }
}
