import Foundation

public enum GroupKey: String, CaseIterable, Hashable, Sendable {
    case score
    case forYou
    case decade
    case director
    case popularity
    case language
    case oscars
}

public struct GroupKeyOption: Hashable, Sendable {
    public var value: GroupKey
    public var label: String

    public init(value: GroupKey, label: String) {
        self.value = value
        self.label = label
    }
}

public let GROUP_KEY_OPTIONS: [GroupKeyOption] = [
    .init(value: .score, label: "Final Score band"),
    .init(value: .forYou, label: "For you band"),
    .init(value: .decade, label: "Decade"),
    .init(value: .director, label: "Director"),
    .init(value: .popularity, label: "Popularity tier"),
    .init(value: .language, label: "Language"),
    .init(value: .oscars, label: "Oscars"),
]

public let DEFAULT_GROUP_KEY: GroupKey = .score

public struct MovieGroup: Hashable, Sendable {
    public var id: String
    public var label: String
    public var movies: [ScoredMovie]
    public var averageFinalScore: Int?

    public init(id: String, label: String, movies: [ScoredMovie], averageFinalScore: Int?) {
        self.id = id
        self.label = label
        self.movies = movies
        self.averageFinalScore = averageFinalScore
    }
}

struct Bucket {
    var id: String
    var label: String
    var min: Double
}

public struct GroupSlot {
    public var id: String
    public var label: String
    public var order: Double

    init(id: String, label: String, order: Double) {
        self.id = id
        self.label = label
        self.order = order
    }
}

let SCORE_BANDS: [Bucket] = [
    .init(id: "score-90", label: "90+", min: 90),
    .init(id: "score-80", label: "80–89", min: 80),
    .init(id: "score-70", label: "70–79", min: 70),
    .init(id: "score-60", label: "60–69", min: 60),
    .init(id: "score-under-60", label: "Under 60", min: -.infinity),
]

let UNSCORED = (id: "score-none", label: "Unscored")
let FOR_YOU_BANDS: [Bucket] = SCORE_BANDS.map { bucket in
    Bucket(id: bucket.id.replacingOccurrences(of: "score-", with: "for-you-"), label: bucket.label, min: bucket.min)
}
let NOT_RANKED = (id: "for-you-none", label: "Not yet ranked")

let POPULARITY_TIERS: [Bucket] = [
    .init(id: "popularity-10000", label: "10,000+ ratings", min: 10_000),
    .init(id: "popularity-2500", label: "2,500–9,999 ratings", min: 2_500),
    .init(id: "popularity-1000", label: "1,000–2,499 ratings", min: 1_000),
    .init(id: "popularity-300", label: "300–999 ratings", min: 300),
    .init(id: "popularity-under-300", label: "Under 300 ratings", min: -.infinity),
]
let NO_POPULARITY = (id: "popularity-none", label: "No popularity data")

func bucketSlot(_ value: Double?, _ buckets: [Bucket], fallback: (id: String, label: String)) -> GroupSlot {
    guard let value else { return GroupSlot(id: fallback.id, label: fallback.label, order: Double(buckets.count)) }
    guard let index = buckets.firstIndex(where: { value >= $0.min }) else {
        fatalError("No bucket accepts value \(value); the last bucket must have min -infinity.")
    }
    return GroupSlot(id: buckets[index].id, label: buckets[index].label, order: Double(index))
}

func languageSlot(_ language: String?) -> GroupSlot {
    guard let language, !language.isEmpty else {
        return GroupSlot(id: "language-unknown", label: "Unknown language", order: 1)
    }
    // Lowercase, then replace every run of non-alphanumerics with a dash.
    let parts = language.lowercased().split { !($0.isLetter || $0.isNumber) }
    return GroupSlot(id: "language-\(parts.joined(separator: "-"))", label: language, order: 0)
}

func oscarSlot(wins: Int?, nominations: Int?) -> GroupSlot {
    if (wins ?? 0) >= 3 { return GroupSlot(id: "oscars-3", label: "3+ Oscar wins", order: 0) }
    if (wins ?? 0) >= 1 { return GroupSlot(id: "oscars-1", label: "1–2 Oscar wins", order: 1) }
    if (nominations ?? 0) >= 1 { return GroupSlot(id: "oscars-nominated", label: "Nominated only", order: 2) }
    return GroupSlot(id: "oscars-none", label: "No Oscar record", order: 3)
}

/// Directors with fewer films than this in the current view share one closing band.
public let DIRECTOR_BAND_MIN_FILMS = 2
let OTHER_DIRECTORS = (id: "director-other", label: "Other directors")

func directorSlot(_ movie: ScoredMovie) -> GroupSlot {
    guard let lead = movie.signals?.directors.first else {
        return GroupSlot(id: OTHER_DIRECTORS.id, label: OTHER_DIRECTORS.label, order: .infinity)
    }
    return GroupSlot(id: "director-\(lead.slug)", label: lead.name, order: 0)
}

func decadeSlot(_ year: Int) -> GroupSlot {
    let decade = year / 10 * 10
    return GroupSlot(id: "decade-\(decade)", label: "\(decade)s", order: -Double(decade))
}

public func groupSlotFor(_ movie: ScoredMovie, _ key: GroupKey) -> GroupSlot {
    switch key {
    case .score: return bucketSlot(movie.finalScore.map(Double.init), SCORE_BANDS, fallback: UNSCORED)
    case .forYou: return bucketSlot(movie.forYou.map(Double.init), FOR_YOU_BANDS, fallback: NOT_RANKED)
    case .decade: return decadeSlot(movie.year)
    case .director: return directorSlot(movie)
    case .popularity: return bucketSlot(movie.popularity, POPULARITY_TIERS, fallback: NO_POPULARITY)
    case .language: return languageSlot(movie.language)
    case .oscars: return oscarSlot(wins: movie.oscarWins, nominations: movie.oscarNominations)
    }
}

public func averageFinalScore(_ movies: [ScoredMovie]) -> Int? {
    let scored = movies.compactMap(\.finalScore)
    guard !scored.isEmpty else { return nil }
    let mean = Double(scored.reduce(0, +)) / Double(scored.count)
    return Int(mean.rounded(.toNearestOrAwayFromZero))
}

/// Bands by first-billed director, most films first, then name. Directors below
/// the threshold and films without a director close the list as one band.
func groupByDirector(_ movies: [ScoredMovie]) -> [MovieGroup] {
    var byDirector: [String: (name: String, movies: [ScoredMovie])] = [:]
    for movie in movies {
        guard let lead = movie.signals?.directors.first else { continue }
        var entry = byDirector[lead.slug] ?? (name: lead.name, movies: [])
        entry.movies.append(movie)
        byDirector[lead.slug] = entry
    }
    let banded = byDirector
        .filter { $0.value.movies.count >= DIRECTOR_BAND_MIN_FILMS }
        .sorted { a, b in
            if a.value.movies.count != b.value.movies.count {
                return a.value.movies.count > b.value.movies.count
            }
            return a.value.name.localizedStandardCompare(b.value.name) == .orderedAscending
        }
    let bandedSlugs = Set(banded.map(\.key))
    let rest = movies.filter { movie in
        guard let lead = movie.signals?.directors.first else { return true }
        return !bandedSlugs.contains(lead.slug)
    }
    var groups = banded.map { slug, entry in
        MovieGroup(id: "director-\(slug)", label: entry.name, movies: entry.movies, averageFinalScore: averageFinalScore(entry.movies))
    }
    if !rest.isEmpty {
        groups.append(MovieGroup(id: OTHER_DIRECTORS.id, label: OTHER_DIRECTORS.label, movies: rest, averageFinalScore: averageFinalScore(rest)))
    }
    return groups
}

/// Buckets movies into fixed-order groups for the chosen key.
///
/// Input order is preserved inside each group, so sort before grouping.
/// Empty groups are omitted; group order never depends on sort direction.
public func groupMovies(_ movies: [ScoredMovie], _ key: GroupKey) -> [MovieGroup] {
    if key == .director { return groupByDirector(movies) }
    struct SlotWithMovies {
        var slot: GroupSlot
        var movies: [ScoredMovie]
    }
    var slots: [String: SlotWithMovies] = [:]
    for movie in movies {
        let slot = groupSlotFor(movie, key)
        if var existing = slots[slot.id] {
            existing.movies.append(movie)
            slots[slot.id] = existing
        } else {
            slots[slot.id] = SlotWithMovies(slot: slot, movies: [movie])
        }
    }
    return slots.values
        .sorted { a, b in
            if a.slot.order != b.slot.order { return a.slot.order < b.slot.order }
            return a.slot.label.localizedStandardCompare(b.slot.label) == .orderedAscending
        }
        .map { entry in
            MovieGroup(id: entry.slot.id, label: entry.slot.label, movies: entry.movies, averageFinalScore: averageFinalScore(entry.movies))
        }
}

public enum SortableMovieColumn: String, Hashable, Sendable {
    case year
    case title
    case popularity
    case users
    case critics
    case finalScore
    case forYou
}

public struct SortRule: Hashable, Sendable {
    public var id: String
    public var desc: Bool

    public init(id: String, desc: Bool) {
        self.id = id
        self.desc = desc
    }
}

func compareNullableNumbers(_ a: Double?, _ b: Double?, desc: Bool) -> Double {
    switch (a, b) {
    case (nil, nil): return 0
    case (nil, _): return 1
    case (_, nil): return -1
    case (let a?, let b?): return desc ? b - a : a - b
    }
}

func numericColumn(_ movie: ScoredMovie, _ column: SortableMovieColumn) -> Double? {
    switch column {
    case .year: return Double(movie.year)
    case .title: return nil
    case .popularity: return movie.popularity
    case .users: return movie.users
    case .critics: return movie.critics
    case .finalScore: return movie.finalScore.map(Double.init)
    case .forYou: return movie.forYou.map(Double.init)
    }
}

/// Sorts movies by the table's first sorting rule.
///
/// Missing numbers sort last in both directions so an unscored film never
/// tops a descending column. Ties keep input order.
public func sortMovies(_ movies: [ScoredMovie], _ sorting: [SortRule]) -> [ScoredMovie] {
    guard let rule = sorting.first, let column = SortableMovieColumn(rawValue: rule.id) else {
        return movies
    }
    return movies.enumerated()
        .sorted { a, b in
            let result: Double
            if column == .title {
                let order = a.element.title.localizedStandardCompare(b.element.title)
                result = rule.desc ? (order == .orderedAscending ? 1 : order == .orderedDescending ? -1 : 0)
                                   : (order == .orderedAscending ? -1 : order == .orderedDescending ? 1 : 0)
            } else {
                result = compareNullableNumbers(
                    numericColumn(a.element, column),
                    numericColumn(b.element, column),
                    desc: rule.desc
                )
            }
            if result != 0 { return result < 0 }
            return a.offset < b.offset
        }
        .map(\.element)
}
