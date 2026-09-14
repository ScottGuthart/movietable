import Foundation

/// A rating in half-star steps from half a star to five.
public typealias Stars = Double

/// What the visitor said about a film: stars, or `skip` for "haven't seen",
/// which carries no taste signal.
public enum Verdict: Hashable, Sendable {
    case rated(Stars)
    case skip
}

extension Verdict: Codable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let stars = try? container.decode(Double.self) {
            self = .rated(stars)
        } else if let text = try? container.decode(String.self) {
            guard text == "skip" else {
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unknown verdict")
            }
            self = .skip
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unknown verdict")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .rated(let stars): try container.encode(stars)
        case .skip: try container.encode("skip")
        }
    }
}

/// Verdicts keyed by Metacritic film slug.
public typealias Verdicts = [String: Verdict]

/// A saved value as storage or an account row can carry it: a number, a legacy
/// thumbs word, null, or something else entirely.
public enum VerdictValue: Hashable, Sendable {
    case number(Double)
    case string(String)
    case null
    case other
}

public struct TasteFilm: Hashable, Codable, Sendable {
    public var slug: String
    public var year: Int?
    public var summary: String?
    public var genres: [String]
    /// Cleaned Wikidata subgenres, most common first.
    public var subgenres: [String]
    public var language: String?
    /// Indexes into `TasteCatalogue.people`, in billing order.
    public var directors: [Int]
    public var writers: [Int]
    public var cast: [Int]

    public init(
        slug: String,
        year: Int? = nil,
        summary: String? = nil,
        genres: [String] = [],
        subgenres: [String] = [],
        language: String? = nil,
        directors: [Int] = [],
        writers: [Int] = [],
        cast: [Int] = []
    ) {
        self.slug = slug
        self.year = year
        self.summary = summary
        self.genres = genres
        self.subgenres = subgenres
        self.language = language
        self.directors = directors
        self.writers = writers
        self.cast = cast
    }
}

public struct TasteCatalogue: Hashable, Codable, Sendable {
    public var films: [TasteFilm]
    /// Display names; credits refer to a person by index.
    public var people: [String]

    public init(films: [TasteFilm] = [], people: [String] = []) {
        self.films = films
        self.people = people
    }
}

public enum FeatureKind: String, CaseIterable, Hashable, Sendable {
    case director
    case genre
    case subgenre
    case writer
    case cast
    case language
    case decade

    var weight: Double {
        switch self {
        case .director: 3
        case .genre: 2
        case .subgenre: 1.5
        case .writer: 1.5
        case .cast: 1
        case .language: 1
        case .decade: 1
        }
    }
}

public struct Feature: Hashable, Sendable {
    public var kind: FeatureKind
    public var key: String

    public init(kind: FeatureKind, key: String) {
        self.kind = kind
        self.key = key
    }
}

/// Summed feature weights keyed by `kind:key`.
public typealias Profile = [String: Double]

public struct MatchReason: Hashable, Sendable {
    public var kind: FeatureKind
    public var label: String

    public init(kind: FeatureKind, label: String) {
        self.kind = kind
        self.label = label
    }
}

public struct HandCandidate: Hashable, Sendable {
    public var slug: String
    public var year: Int?
    public var genres: [String]
    public var popularity: Double?

    public init(slug: String, year: Int? = nil, genres: [String] = [], popularity: Double? = nil) {
        self.slug = slug
        self.year = year
        self.genres = genres
        self.popularity = popularity
    }
}

let STARS: [Double] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
let NEUTRAL_STARS = 3.0
let MAX_STARS = 5.0
let MIN_STARS = 0.5
/// Ratings at or above this many stars count as a favourite and can build a profile on their own.
let FAVOURITE_STARS = 4.0
/// For you = MATCH_SHARE × match strength + QUALITY_SHARE × Final Score, so equal matches keep the stronger film ahead.
let MATCH_SHARE = 60.0
let QUALITY_SHARE = 0.4

public let HAND_SIZE = 12
public let SHARP_PROFILE_SIZE = 5

public func decadeOf(_ year: Int) -> Int {
    year / 10 * 10
}

func featureId(_ feature: Feature) -> String {
    "\(feature.kind.rawValue):\(feature.key)"
}

func parseFeatureId(_ id: String) -> Feature {
    let separator = id.firstIndex(of: ":") ?? id.startIndex
    let kind = FeatureKind(rawValue: String(id[..<separator])) ?? .decade
    let key = separator < id.endIndex ? String(id[id.index(after: separator)...]) : ""
    return Feature(kind: kind, key: key)
}

public func filmFeatures(_ film: TasteFilm) -> [Feature] {
    var features: [Feature] = []
    if let year = film.year {
        features.append(Feature(kind: .decade, key: String(decadeOf(year))))
    }
    for key in film.genres { features.append(Feature(kind: .genre, key: key)) }
    for key in film.subgenres { features.append(Feature(kind: .subgenre, key: key)) }
    if let language = film.language, !language.isEmpty {
        features.append(Feature(kind: .language, key: language))
    }
    for index in film.directors { features.append(Feature(kind: .director, key: String(index))) }
    for index in film.writers { features.append(Feature(kind: .writer, key: String(index))) }
    for index in film.cast { features.append(Feature(kind: .cast, key: String(index))) }
    return features
}

/// Reads a saved verdict, accepting the thumbs stored before the star scale:
/// like became four stars, pass two.
public func parseVerdict(_ value: VerdictValue) -> Verdict? {
    switch value {
    case .string("skip"): return .skip
    case .string("like"): return .rated(4)
    case .string("pass"): return .rated(2)
    case .number(let stars): return STARS.contains(stars) ? .rated(stars) : nil
    default: return nil
    }
}

public func parseVerdict(_ stars: Double?) -> Verdict? {
    guard let stars else { return nil }
    return STARS.contains(stars) ? .rated(stars) : nil
}

/// How strongly a rating speaks for a film's attributes: five stars is +1,
/// three is neutral, half a star is -1.
public func ratingFactor(_ stars: Stars) -> Double {
    if stars >= NEUTRAL_STARS {
        return (stars - NEUTRAL_STARS) / (MAX_STARS - NEUTRAL_STARS)
    }
    return (stars - NEUTRAL_STARS) / (NEUTRAL_STARS - MIN_STARS)
}

public func hasPositive(_ verdicts: Verdicts) -> Bool {
    verdicts.values.contains { verdict in
        if case .rated(let stars) = verdict { return stars >= FAVOURITE_STARS }
        return false
    }
}

public func ratedCount(_ verdicts: Verdicts) -> Int {
    verdicts.values.filter { verdict in
        if case .rated = verdict { return true }
        return false
    }.count
}

func indexFilms(_ catalogue: TasteCatalogue) -> [String: TasteFilm] {
    var films: [String: TasteFilm] = [:]
    for film in catalogue.films { films[film.slug] = film }
    return films
}

/// Sums each rated film's weighted features, scaled by how far its rating sits
/// from three stars.
public func buildProfile(_ catalogue: TasteCatalogue, _ verdicts: Verdicts) -> Profile {
    let films = indexFilms(catalogue)
    var profile: Profile = [:]
    for (slug, verdict) in verdicts {
        guard case .rated(let stars) = verdict else { continue }
        guard let film = films[slug] else { continue }
        let factor = ratingFactor(stars)
        if factor == 0 { continue }
        for feature in filmFeatures(film) {
            let id = featureId(feature)
            profile[id, default: 0] += factor * feature.kind.weight
        }
    }
    return profile
}

/// Cosine similarity between the profile and each film's weighted attribute
/// vector, clamped at zero and rescaled so the best match among unrated films
/// reads 1. Rated films are excluded from the scale (a favourite matches itself
/// perfectly) and capped at 1.
func matchStrengths(_ catalogue: TasteCatalogue, _ profile: Profile, _ rated: Set<String>) -> [String: Double] {
    let profileSquared = profile.values.reduce(0) { $0 + $1 * $1 }
    let profileNorm = profileSquared.squareRoot()

    var strengths: [String: Double] = [:]
    var best = 0.0
    for film in catalogue.films {
        var dot = 0.0
        var filmSquared = 0.0
        for feature in filmFeatures(film) {
            let weight = feature.kind.weight
            filmSquared += weight * weight
            dot += weight * (profile[featureId(feature)] ?? 0)
        }
        let denominator = filmSquared.squareRoot() * profileNorm
        let similarity = denominator == 0 ? 0 : max(0, dot / denominator)
        strengths[film.slug] = similarity
        if !rated.contains(film.slug) && similarity > best {
            best = similarity
        }
    }
    if best == 0 {
        best = strengths.values.reduce(0, max)
    }
    if best > 0 {
        for (slug, similarity) in strengths {
            strengths[slug] = min(1, similarity / best)
        }
    }
    return strengths
}

public func forYouScore(_ match: Double?, _ finalScore: Int?) -> Int? {
    guard let match, let finalScore else { return nil }
    return Int((MATCH_SHARE * match + QUALITY_SHARE * Double(finalScore)).rounded(.down))
}

/// Fills `forYou` on every movie; leaves it nil without a favourite or
/// without attributes.
public func rankMovies(_ movies: [ScoredMovie], _ catalogue: TasteCatalogue?, _ verdicts: Verdicts) -> [ScoredMovie] {
    guard let catalogue, hasPositive(verdicts) else {
        return movies.map { movie in
            var copy = movie
            copy.forYou = nil
            return copy
        }
    }
    let rated = Set(
        verdicts.compactMap { slug, verdict -> String? in
            if case .rated = verdict { return slug }
            return nil
        }
    )
    let strengths = matchStrengths(catalogue, buildProfile(catalogue, verdicts), rated)
    return movies.map { movie in
        var copy = movie
        copy.forYou = forYouScore(strengths[movie.slug], movie.finalScore)
        return copy
    }
}

public let UNKNOWN_PERSON = "Unknown person"

func featureLabel(_ feature: Feature, _ people: [String]) -> String {
    switch feature.kind {
    case .decade: return "\(feature.key)s"
    case .genre, .subgenre, .language: return feature.key
    case .director, .writer, .cast:
        let index = Int(feature.key) ?? -1
        return people.indices.contains(index) ? people[index] : UNKNOWN_PERSON
    }
}

/// The film's attributes the profile rewards, heaviest first.
public func explainMatch(_ profile: Profile, _ film: TasteFilm, _ people: [String], limit: Int = 3) -> [MatchReason] {
    filmFeatures(film)
        .enumerated()
        .map { index, feature in
            (index: index, feature: feature, weight: (profile[featureId(feature)] ?? 0) * feature.kind.weight)
        }
        .filter { $0.weight > 0 }
        .sorted { a, b in
            if a.weight != b.weight { return a.weight > b.weight }
            return a.index < b.index
        }
        .prefix(limit)
        .map { entry in
            MatchReason(kind: entry.feature.kind, label: featureLabel(entry.feature, people))
        }
}

/// Up to two leading genres followed by the leading director.
public func summarizeProfile(_ profile: Profile, _ people: [String]) -> [String] {
    let positive = profile
        .filter { $0.value > 0 }
        .map { id, weight in
            let feature = parseFeatureId(id)
            return (kind: feature.kind, label: featureLabel(feature, people), weight: weight)
        }
        .sorted { a, b in
            if a.weight != b.weight { return a.weight > b.weight }
            return a.label.localizedStandardCompare(b.label) == .orderedAscending
        }
    func leading(_ kind: FeatureKind, _ count: Int) -> [String] {
        positive.filter { $0.kind == kind }.prefix(count).map(\.label)
    }
    return leading(.genre, 2) + leading(.director, 1)
}

/// Deals a deterministic hand: the most popular film from each unseen
/// decade-and-lead-genre combination first, then the rest by popularity.
/// Callers exclude films the visitor has already judged before dealing.
public func dealHand(_ candidates: [HandCandidate], _ offset: Int, _ size: Int = HAND_SIZE) -> [HandCandidate] {
    let ordered = candidates.sorted { a, b in
        switch (a.popularity, b.popularity) {
        case (nil, nil): return a.slug.localizedStandardCompare(b.slug) == .orderedAscending
        case (nil, _): return false
        case (_, nil): return true
        case (let x?, let y?):
            if x != y { return x > y }
            return a.slug.localizedStandardCompare(b.slug) == .orderedAscending
        }
    }
    var seen = Set<String>()
    var fresh: [HandCandidate] = []
    var repeats: [HandCandidate] = []
    for candidate in ordered {
        let decade = candidate.year.map { String(decadeOf($0)) } ?? "?"
        let combination = "\(decade)|\(candidate.genres.first ?? "?")"
        if seen.contains(combination) {
            repeats.append(candidate)
        } else {
            seen.insert(combination)
            fresh.append(candidate)
        }
    }
    let deck = fresh + repeats
    guard offset < deck.count else { return [] }
    return Array(deck[offset..<min(offset + size, deck.count)])
}
