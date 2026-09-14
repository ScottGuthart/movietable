import Foundation
import MovieTableCore

/// Turns a Wikidata film-genre label into a sentence-case subgenre: "crime drama film" becomes "Crime drama".
public func cleanSubgenre(_ label: String) -> String {
    let trimmed = label.trimmingCharacters(in: .whitespacesAndNewlines)
    var stripped = trimmed
    if let range = trimmed.range(of: "\\s+films?$", options: .regularExpression) {
        stripped = String(trimmed[..<range.lowerBound]).trimmingCharacters(in: .whitespacesAndNewlines)
    }
    if stripped.isEmpty { stripped = trimmed }
    return stripped.prefix(1).uppercased() + stripped.dropFirst()
}

struct SubgenreContext {
    /// How many films carry each cleaned label.
    var frequency: [String: Int]
    /// Every Metacritic genre in the catalogue, lower-cased; a subgenre that repeats one adds nothing.
    var genres: Set<String>
}

/// Cleaned subgenres for one film, without Metacritic genres, ordered by how common each is across the catalogue.
func filmSubgenres(_ subgenres: [SubgenreRow], _ context: SubgenreContext) -> [String] {
    let labels = Array(Set(subgenres.map { cleanSubgenre($0.subgenre_name) }))
        .filter { !context.genres.contains($0.lowercased()) }
    return labels.sorted { a, b in
        let fa = context.frequency[a] ?? 0
        let fb = context.frequency[b] ?? 0
        if fa != fb { return fa > fb }
        return a.localizedStandardCompare(b) == .orderedAscending
    }
}

func subgenreContext<T>(_ rows: [T], genres: (T) -> [GenreRow], subgenres: (T) -> [SubgenreRow]) -> SubgenreContext {
    var frequency: [String: Int] = [:]
    var genresSet = Set<String>()
    for row in rows {
        for entry in genres(row) {
            genresSet.insert(entry.genre_name.lowercased())
        }
        for label in Set(subgenres(row).map { cleanSubgenre($0.subgenre_name) }) {
            frequency[label, default: 0] += 1
        }
    }
    return SubgenreContext(frequency: frequency, genres: genresSet)
}

public struct RawMoviesResult: Sendable {
    public var movies: [RawMovie]
    public var dropped: Int
}

public func toRawMovies(_ rows: [MovieRow]) -> RawMoviesResult {
    let context = subgenreContext(rows, genres: \.movie_genres, subgenres: \.movie_subgenres)
    var movies: [RawMovie] = []
    for row in rows {
        guard let year = row.year else { continue }
        movies.append(RawMovie(
            slug: row.slug,
            title: row.title,
            year: year,
            users_rated: row.users_rated,
            userscore: row.userscore,
            metascore: row.metascore,
            link: row.link,
            language: row.movie_imdb?.language,
            subgenres: filmSubgenres(row.movie_subgenres, context),
            oscar_wins: row.movie_imdb?.oscar_wins.map(Double.init),
            oscar_nominations: row.movie_imdb?.oscar_nominations.map(Double.init)
        ))
    }
    return RawMoviesResult(movies: movies, dropped: rows.count - movies.count)
}

public let SUMMARY_LIMIT = 160
private let SENTENCE_FLOOR = 0.4

/// Trims a summary for a card: whole sentences when one fits comfortably, otherwise a word cut with an ellipsis.
public func truncateSummary(_ text: String?, _ limit: Int = SUMMARY_LIMIT) -> String? {
    guard let text else { return nil }
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.count <= limit { return trimmed }
    let head = String(trimmed.prefix(limit))
    let sentenceEnd = [
        head.range(of: ". ", options: .backwards)?.lowerBound,
        head.range(of: "! ", options: .backwards)?.lowerBound,
        head.range(of: "? ", options: .backwards)?.lowerBound,
    ].compactMap { $0 }.max()
    if let sentenceEnd {
        let index = trimmed.distance(from: trimmed.startIndex, to: sentenceEnd)
        if Double(index) >= Double(limit) * SENTENCE_FLOOR {
            return String(trimmed.prefix(index + 1))
        }
    }
    let wordEnd = head.range(of: " ", options: .backwards)
    let cut: String
    if let wordEnd, trimmed.distance(from: trimmed.startIndex, to: wordEnd.lowerBound) > 0 {
        cut = String(trimmed[..<wordEnd.lowerBound])
    } else {
        cut = String(trimmed.prefix(limit - 1))
    }
    let withoutTrailingPunctuation = cut.last.map { ",;:".contains($0) } == true ? String(cut.dropLast()) : cut
    return "\(withoutTrailingPunctuation)…"
}

let CAST_LIMIT = 8

struct RetainedCredits {
    var row: TasteRow
    var directors: [CreditRow]
    var writers: [CreditRow]
    var cast: [CreditRow]
}

func retainCredits(_ row: TasteRow) -> RetainedCredits {
    let sorted = row.credits.sorted { a, b in a.billing < b.billing }
    let directors = sorted.filter { $0.role == "director" }
    let writers = sorted.filter { $0.role == "writer" }
    let cast = Array(sorted.filter { $0.role == "cast" }.prefix(CAST_LIMIT))
    return RetainedCredits(row: row, directors: directors, writers: writers, cast: cast)
}

/// Builds the taste payload: films reference people by index into one sorted name list.
public func toTasteCatalogue(_ rows: [TasteRow]) -> TasteCatalogue {
    let context = subgenreContext(rows, genres: \.movie_genres, subgenres: \.movie_subgenres)
    let retained = rows.map(retainCredits)
    var names: [String: String] = [:]
    for entry in retained {
        for credit in entry.directors + entry.writers + entry.cast {
            names[credit.person_slug] = credit.people.name
        }
    }
    let slugs = names.keys.sorted()
    var indexOf: [String: Int] = [:]
    for (index, slug) in slugs.enumerated() { indexOf[slug] = index }
    func indexes(_ credits: [CreditRow]) -> [Int] {
        credits.compactMap { indexOf[$0.person_slug] }
    }
    let films = retained.map { entry in
        TasteFilm(
            slug: entry.row.slug,
            year: entry.row.year,
            summary: truncateSummary(entry.row.summary),
            genres: entry.row.movie_genres.map(\.genre_name),
            subgenres: filmSubgenres(entry.row.movie_subgenres, context),
            language: entry.row.movie_imdb?.language,
            directors: indexes(entry.directors),
            writers: indexes(entry.writers),
            cast: indexes(entry.cast)
        )
    }
    return TasteCatalogue(films: films, people: slugs.map { names[$0] ?? $0 })
}

func people(_ credits: [CreditRow], _ role: String) -> [Person] {
    credits
        .filter { $0.role == role }
        .sorted { $0.billing < $1.billing }
        .map { Person(slug: $0.person_slug, name: $0.people.name) }
}

/// Folds signal rows into a slug-keyed map; subscription providers are deduplicated and sorted by id.
public func toSignals(_ rows: [SignalRow]) -> [String: FilmSignals] {
    var signals: [String: FilmSignals] = [:]
    for row in rows {
        let streamOn = Array(Set(row.streaming_offers.filter { $0.monetization == "flatrate" }.map(\.provider_id))).sorted()
        signals[row.slug] = FilmSignals(
            directors: people(row.credits, "director"),
            writers: people(row.credits, "writer"),
            genres: row.movie_genres.map(\.genre_name),
            streamOn: streamOn,
            free: row.streaming_offers.contains { $0.monetization == "free" || $0.monetization == "ads" }
        )
    }
    return signals
}
