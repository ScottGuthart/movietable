import Foundation
import MovieTableCore

/// Supabase access, read from the gitignored Config.xcconfig through Info.plist.
public struct SupabaseConfig: Sendable {
    public var url: URL
    public var anonKey: String

    public init(url: URL, anonKey: String) {
        self.url = url
        self.anonKey = anonKey
    }

    public init?(bundle: Bundle = .main) {
        guard let urlString = bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              let url = URL(string: urlString),
              let key = bundle.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
              !key.isEmpty, !key.hasPrefix("$(") else {
            return nil
        }
        self.init(url: url, anonKey: key)
    }
}

public struct CatalogueError: Error, CustomStringConvertible {
    public var description: String

    public init(_ description: String) {
        self.description = description
    }
}

let PAGE_SIZE = 1000
/// Nested credits make taste rows heavy; smaller pages keep each response small.
let TASTE_PAGE_SIZE = 300
let SIGNAL_PAGE_SIZE = 500

let MOVIE_SELECT =
    "slug,title,year,metascore,userscore,users_rated,link,justwatch_url," +
    "movie_imdb(language,oscar_wins,oscar_nominations),movie_genres(genre_name),movie_subgenres(subgenre_name)"
let TASTE_SELECT =
    "slug,year,summary,movie_imdb(language),movie_genres(genre_name),movie_subgenres(subgenre_name)," +
    "credits(role,billing,person_slug,people(name))"
let SIGNAL_SELECT =
    "slug,movie_genres(genre_name),credits(role,billing,person_slug,people(name)),streaming_offers(provider_id,monetization)"
let DETAIL_SELECT =
    "slug,summary,justwatch_url,movie_imdb(imdb_id),movie_genres(genre_name),credits(role,billing,character,person_slug,people(name))," +
    "streaming_offers(monetization,quality,url,price,currency_code,providers(id,name,icon_url))"
let AWARDS_SELECT = "award_name,result,year,person_name,person_slug"

let SIGNAL_PARAMS: [String: String] = [
    "credits.role": "in.(director,writer)",
    "credits.order": "billing",
    "streaming_offers.monetization": "in.(flatrate,free,ads)",
]

/// Reads the catalogue over PostgREST, mirroring the selects the web app uses.
public struct SupabaseCatalogue: Sendable {
    public var config: SupabaseConfig
    public var fetch: HTTPFetch
    public var attempts: Int
    public var baseDelayMs: Int

    public init(
        config: SupabaseConfig,
        attempts: Int = 4,
        baseDelayMs: Int = 1000,
        fetch: @escaping HTTPFetch = urlSessionFetch
    ) {
        self.config = config
        self.fetch = fetch
        self.attempts = attempts
        self.baseDelayMs = baseDelayMs
    }

    func fetchTable<T: Decodable & Sendable>(_ table: String, params: [(String, String)]) async throws -> [T] {
        guard var components = URLComponents(url: config.url.appending(path: "rest/v1/\(table)"), resolvingAgainstBaseURL: false) else {
            throw CatalogueError("Invalid Supabase URL")
        }
        components.queryItems = params.map { URLQueryItem(name: $0.0, value: $0.1) }
        guard let url = components.url else { throw CatalogueError("Invalid Supabase URL") }
        let key = config.anonKey
        let response = try await fetchWithRetry(
            fetch,
            url,
            headers: [
                "apikey": key,
                "Authorization": "Bearer \(key)",
            ],
            attempts: attempts,
            baseDelayMs: baseDelayMs
        )
        guard (200..<300).contains(response.status) else {
            let body = String(data: response.data, encoding: .utf8)?
                .components(separatedBy: .whitespacesAndNewlines).joined(separator: " ")
                .prefix(200) ?? ""
            throw CatalogueError(
                "Supabase at \(url.host() ?? config.url.host() ?? "unknown") returned \(response.status) for the \(table) table" +
                (body.isEmpty ? "" : " (\(body))") +
                ". Check SUPABASE_URL and that the anon role can read the catalogue."
            )
        }
        do {
            return try JSONDecoder().decode([T].self, from: response.data)
        } catch {
            throw CatalogueError("Failed to decode the \(table) table: \(error.localizedDescription)")
        }
    }

    func fetchRows<T: Decodable & Sendable>(_ select: String, afterSlug: String, limit: Int, extra: [(String, String)] = []) async throws -> [T] {
        try await fetchTable("movies", params: [
            ("select", select),
            ("slug", "gt.\(afterSlug)"),
            ("order", "slug"),
            ("limit", String(limit)),
        ] + extra)
    }

    /// The full catalogue for the table.
    public func fetchCatalogue() async throws -> [RawMovie] {
        let rows = try await pageAll({ (afterSlug: String, limit: Int) in
            try await self.fetchRows(MOVIE_SELECT, afterSlug: afterSlug, limit: limit)
        }, keyOf: { (row: MovieRow) in row.slug })
        let result = toRawMovies(rows)
        if result.movies.isEmpty {
            throw CatalogueError("The Supabase movies table returned no films. Seed it before running.")
        }
        return result.movies
    }

    /// Genres, credits, and summaries for the taste profile.
    public func fetchTasteData() async throws -> TasteCatalogue {
        let rows = try await pageAll({ (afterSlug: String, limit: Int) in
            try await self.fetchRows(TASTE_SELECT, afterSlug: afterSlug, limit: limit)
        }, keyOf: { (row: TasteRow) in row.slug }, limit: TASTE_PAGE_SIZE)
        return toTasteCatalogue(rows)
    }

    /// Directors, writers, genres, and subscription availability for every film.
    public func fetchSignals() async throws -> [String: FilmSignals] {
        let rows = try await pageAll({ (afterSlug: String, limit: Int) in
            try await self.fetchRows(SIGNAL_SELECT, afterSlug: afterSlug, limit: limit, extra: SIGNAL_PARAMS.map { $0 })
        }, keyOf: { (row: SignalRow) in row.slug }, limit: SIGNAL_PAGE_SIZE)
        return toSignals(rows)
    }

    /// Every provider the offers table refers to.
    public func fetchProviders() async throws -> [Provider] {
        try await fetchTable("providers", params: [("select", "id,name,icon_url"), ("order", "id")])
    }

    /// Synopsis, credits, awards, and every US offer for one film, or nil when the slug is unknown.
    public func fetchFilmDetail(_ slug: String) async throws -> FilmDetail? {
        async let rows: [DetailRow] = fetchTable("movies", params: [
            ("select", DETAIL_SELECT),
            ("slug", "eq.\(slug)"),
            ("credits.order", "billing"),
            ("limit", "1"),
        ])
        async let awardRows: [AwardRow] = fetchTable("movie_awards", params: [
            ("select", AWARDS_SELECT),
            ("movie_slug", "eq.\(slug)"),
            ("order", "award_name"),
        ])
        let (details, awards) = try await (rows, awardRows)
        guard let row = details.first else { return nil }
        return toFilmDetail(row, awards)
    }
}
