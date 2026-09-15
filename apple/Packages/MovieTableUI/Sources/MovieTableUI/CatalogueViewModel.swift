import Foundation
import MovieTableCore
import MovieTableData
import Observation
import SwiftUI

public enum CataloguePhase: Equatable, Sendable {
    case loading
    case loaded
    case refreshing
    case offline
}

/// Quick era and popularity chips. The era chip is exclusive because the year
/// filter is one range; popularity is additive.
public enum CatalogueEra: String, CaseIterable, Identifiable, Sendable {
    case modern
    case twoThousands
    case twentyTens
    case twentyTwenties

    public var id: String { rawValue }

    public var label: String {
        switch self {
        case .modern: "2000–2024"
        case .twoThousands: "2000s"
        case .twentyTens: "2010s"
        case .twentyTwenties: "2020s"
        }
    }

    var range: ClosedRange<Int> {
        switch self {
        case .modern: 2000...2024
        case .twoThousands: 2000...2009
        case .twentyTens: 2010...2019
        case .twentyTwenties: 2020...2029
        }
    }
}

enum CatalogueDefaults {
    static let yearRange = 2000...2024
    static let popularityRange: ClosedRange<Double> = 300...100_000
    static let popularFloor = 10_000.0
}

enum CatalogueSort {
    case rank(descending: Bool)
    case column(SortableMovieColumn, desc: Bool)
}

/// Owns the snapshot, the visitor's view of it, and the ranked, sectioned rows
/// derived from that view. All scoring, filtering, and grouping is MovieTableCore.
@MainActor
@Observable
public final class CatalogueViewModel {
    public private(set) var phase: CataloguePhase = .loading
    public private(set) var sections: [CatalogueSection] = []
    public private(set) var totalFilms = 0
    public private(set) var visibleFilms = 0
    public private(set) var fetchedAt: Date?

    public var scoreBias = DEFAULT_CRITIC_WEIGHT
    public var searchText = ""
    public var era: CatalogueEra = .modern
    public var popularOnly = false
    public var sortOrder: [KeyPathComparator<CatalogueRow>] = [
        KeyPathComparator(\CatalogueRow.finalScore, order: .reverse)
    ]

    /// The table presents a detail sheet for this slug when set.
    public var selectedSlug: String?
    public private(set) var ratings: StampedVerdicts = [:]
    public private(set) var hand: [HandCandidate] = []
    public private(set) var handOffset = 0
    private var detailCache: [String: FilmDetail] = [:]

    private var snapshot: CatalogueSnapshot?
    private var sort = CatalogueSort.column(.finalScore, desc: true)
    private let store: CatalogueStore?
    private let config: SupabaseConfig?

    /// The backend configuration, shared with the account controller.
    public var supabaseConfig: SupabaseConfig? { config }

    /// Called after the visitor changes a rating, so the sync actor can push it.
    public var onRatingsChange: (@MainActor (StampedVerdicts) -> Void)?
    private let loadRemote: (@Sendable (SupabaseConfig) async throws -> CatalogueSnapshot)?

    public init(
        store: CatalogueStore? = .applicationSupport(),
        config: SupabaseConfig? = SupabaseConfig(bundle: .main),
        loadRemote: (@Sendable (SupabaseConfig) async throws -> CatalogueSnapshot)? = nil
    ) {
        self.store = store
        self.config = config
        self.loadRemote = loadRemote
    }

    /// Tests install a snapshot directly, as a preview would.
    public func installForTesting(_ newSnapshot: CatalogueSnapshot) {
        install(snapshot: newSnapshot)
    }

    /// Previews and tests start from the bundled seed catalogue.
    public convenience init(snapshot: CatalogueSnapshot) {
        self.init(store: nil, config: nil, loadRemote: nil)
        install(snapshot: snapshot)
        phase = .loaded
    }

    public func start() async {
        ratings = store?.loadGuestRatings() ?? [:]
        if let cached = store?.loadSnapshot() {
            install(snapshot: cached)
            phase = .loaded
        }
        guard let config else {
            if snapshot == nil { phase = .offline }
            return
        }
        do {
            phase = snapshot == nil ? .loading : .refreshing
            let fetched = try await fetchSnapshot(config)
            install(snapshot: fetched)
            phase = .loaded
            try? store?.saveSnapshot(fetched)
            fetchedAt = fetched.fetchedAt
        } catch {
            if snapshot == nil { phase = .offline }
        }
    }

    public func setScoreBias(_ bias: Double) {
        scoreBias = min(1, max(0, bias))
        rebuild()
    }

    public func setSearch(_ text: String) {
        searchText = text
        rebuild()
    }

    public func setEra(_ newEra: CatalogueEra) {
        era = newEra
        rebuild()
    }

    public func setPopularOnly(_ enabled: Bool) {
        popularOnly = enabled
        rebuild()
    }

    public func applySort(_ comparators: [KeyPathComparator<CatalogueRow>]) {
        sortOrder = comparators
        guard let comparator = comparators.first else { return }
        let descending = comparator.order == .reverse
        sort = switch comparator.keyPath {
        case \CatalogueRow.rank: .rank(descending: descending)
        case \CatalogueRow.title: .column(.title, desc: descending)
        case \CatalogueRow.year: .column(.year, desc: descending)
        case \CatalogueRow.users: .column(.users, desc: descending)
        case \CatalogueRow.critics: .column(.critics, desc: descending)
        case \CatalogueRow.popularity: .column(.popularity, desc: descending)
        case \CatalogueRow.finalScore: .column(.finalScore, desc: descending)
        case \CatalogueRow.forYou: .column(.forYou, desc: descending)
        default: sort
        }
        rebuild()
    }

    // MARK: - Ratings and the starter hand

    /// Stars from half to five; tapping the saved value clears it.
    public func rate(_ slug: String, _ stars: Stars) {
        if case .rated(let current) = ratings[slug]?.verdict, current == stars {
            ratings[slug] = nil
        } else {
            ratings[slug] = StampedVerdict(verdict: .rated(stars), updatedAt: nowMs())
        }
        afterVerdictChange()
    }

    /// The row-side API: nil clears a rating outright.
    public func setRating(_ slug: String, _ stars: Stars?) {
        if let stars {
            rate(slug, stars)
        } else {
            ratings[slug] = nil
            afterVerdictChange()
        }
    }

    public func verdictValue(for slug: String) -> Stars? {
        guard case .rated(let stars) = ratings[slug]?.verdict else { return nil }
        return stars
    }

    public func row(for slug: String) -> CatalogueRow? {
        sections.flatMap(\.rows).first { $0.movie.slug == slug }
    }

    public func skip(_ slug: String) {
        ratings[slug] = StampedVerdict(verdict: .skip, updatedAt: nowMs())
        afterVerdictChange()
    }

    /// The only place ratings are removed in bulk lives with the account menu;
    /// here each rating clears itself.
    public func verdict(for slug: String) -> Verdict? {
        ratings[slug]?.verdict
    }

    public var ratedCount: Int {
        ratings.values.filter { if case .rated = $0.verdict { return true }; return false }.count
    }

    public var hasProfile: Bool {
        hasPositive(verdicts)
    }

    /// Twelve popular films to judge, refreshed on request from the unjudged rest.
    public func dealAnotherHand() {
        guard let snapshot else { return }
        let judged = Set(ratings.keys)
        let popularityBySlug = Dictionary(uniqueKeysWithValues: snapshot.movies.compactMap { raw -> (String, Double?)? in
            guard let slug = raw.slug else { return nil }
            return (slug, raw.users_rated)
        })
        let candidates: [HandCandidate] = snapshot.taste.films.compactMap { film in
            guard !judged.contains(film.slug) else { return nil }
            let signals = snapshot.signals[film.slug]
            return HandCandidate(
                slug: film.slug,
                year: film.year,
                genres: signals?.genres ?? film.genres,
                popularity: popularityBySlug[film.slug] ?? nil
            )
        }
        let dealt = dealHand(candidates, handOffset)
        if dealt.isEmpty, handOffset > 0 {
            handOffset = 0
            hand = dealHand(candidates, 0)
        } else {
            hand = dealt
        }
    }

    public func handMovie(_ slug: String) -> Movie? {
        snapshotMovie(slug)
    }

    public func handSummary(_ slug: String) -> String? {
        snapshot?.taste.films.first { $0.slug == slug }?.summary
    }

    public func dealAnotherHandNext() {
        handOffset += HAND_SIZE
        dealAnotherHand()
    }

    // MARK: - Film detail

    /// A film's detail sheet: the snapshot answers immediately; the network
    /// adds the full synopsis, cast, awards, and offers when it can.
    public func detail(for slug: String) async -> FilmDetail? {
        if let cached = detailCache[slug] { return cached }
        if let config {
            do {
                let client = SupabaseCatalogue(config: config)
                if let detail = try await client.fetchFilmDetail(slug) {
                    detailCache[slug] = detail
                    try? store?.saveFilmDetails(detailCache)
                    return detail
                }
            } catch {
                // Fall through to the snapshot; the sheet still answers.
            }
        }
        guard let synthetic = syntheticDetail(slug) else { return nil }
        detailCache[slug] = synthetic
        return synthetic
    }

    /// Reset view: the default ranking controls, not the visitor's ratings.
    public func resetView() {
        scoreBias = DEFAULT_CRITIC_WEIGHT
        searchText = ""
        era = .modern
        popularOnly = false
        sort = .column(.finalScore, desc: true)
        sortOrder = [KeyPathComparator(\CatalogueRow.finalScore, order: .reverse)]
        rebuild()
    }

    private func install(snapshot newSnapshot: CatalogueSnapshot) {
        snapshot = newSnapshot
        fetchedAt = newSnapshot.fetchedAt
        detailCache = store?.loadFilmDetails() ?? [:]
        rebuild()
        dealAnotherHand()
    }

    private func nowMs() -> Int {
        Int((Date().timeIntervalSince1970 * 1000).rounded())
    }

    private var verdicts: Verdicts {
        ratings.mapValues(\.verdict)
    }

    /// Ratings replaced by account sync or a cleared device.
    public func applyRatings(_ newRatings: StampedVerdicts) {
        ratings = newRatings
        rebuild()
        dealAnotherHand()
    }

    private func afterVerdictChange() {
        let becameActive = hasProfile
        try? store?.saveGuestRatings(ratings)
        onRatingsChange?(ratings)
        rebuild()
        if becameActive, sortOrder.first?.keyPath != \CatalogueRow.forYou {
            // A favourite brings the For you column to the front, built from
            // your ratings.
            applySort([KeyPathComparator(\CatalogueRow.forYou, order: .reverse)])
        }
        dealAnotherHand()
    }

    private func snapshotMovie(_ slug: String) -> Movie? {
        guard let raw = snapshot?.movies.first(where: { $0.slug == slug }) else { return nil }
        var movie = normalizeMovie(raw)
        movie.signals = snapshot?.signals[slug]
        return movie
    }

    private func syntheticDetail(_ slug: String) -> FilmDetail? {
        guard let snapshot, let movie = snapshotMovie(slug) else { return nil }
        let tasteFilm = snapshot.taste.films.first { $0.slug == slug }
        return FilmDetail(
            slug: slug,
            summary: tasteFilm?.summary,
            justwatchUrl: nil,
            imdbUrl: nil,
            genres: movie.signals?.genres ?? [],
            directors: movie.signals?.directors ?? [],
            writers: movie.signals?.writers ?? [],
            cast: [],
            castTotal: 0,
            offers: [],
            awards: AwardSummary()
        )
    }

    private func fetchSnapshot(_ config: SupabaseConfig) async throws -> CatalogueSnapshot {
        if let loadRemote { return try await loadRemote(config) }
        let client = SupabaseCatalogue(config: config)
        async let movies = client.fetchCatalogue()
        async let taste = client.fetchTasteData()
        async let signals = client.fetchSignals()
        async let providers = client.fetchProviders()
        return CatalogueSnapshot(
            movies: try await movies,
            signals: try await signals,
            taste: try await taste,
            providers: try await providers,
            fetchedAt: Date()
        )
    }

    private var movies: [Movie] {
        guard let snapshot else { return [] }
        return snapshot.movies.map { raw in
            var movie = normalizeMovie(raw)
            movie.signals = snapshot.signals[movie.slug]
            return movie
        }
    }

    private var query: FilterQuery {
        var rules: [FilterNode] = [
            .rule(FilterRule(
                id: "quick-year",
                path: ["year"],
                operator: "between",
                value: .list([.number(Double(era.range.lowerBound)), .number(Double(era.range.upperBound))])
            )),
            .rule(FilterRule(
                id: "quick-popularity",
                path: ["popularity"],
                operator: "between",
                value: .list([.number(CatalogueDefaults.popularityRange.lowerBound), .number(CatalogueDefaults.popularityRange.upperBound)])
            )),
        ]
        if popularOnly {
            rules.append(.rule(FilterRule(
                id: "quick-popular",
                path: ["popularity"],
                operator: "gte",
                value: .number(CatalogueDefaults.popularFloor)
            )))
        }
        return FilterQuery(id: "catalogue-view", combinator: .and, rules: rules)
    }

    private func rebuild() {
        guard let snapshot else {
            sections = []
            totalFilms = 0
            visibleFilms = 0
            return
        }
        totalFilms = snapshot.movies.count
        let base = (try? scoreMovies(movies, criticWeight: scoreBias)) ?? []
        let ranked = rankMovies(base, snapshot.taste, verdicts)
        let filtered = ranked.filter { movie in
            matchesSearch(movie, searchText) && matchesQuery(movie, query)
        }
        let sorted: [ScoredMovie]
        switch sort {
        case .rank(let descending):
            let rule = underlyingRule
            let inRankOrder = sortMovies(filtered, [rule])
            sorted = descending ? inRankOrder.reversed() : inRankOrder
        case .column(let column, let desc):
            sorted = sortMovies(filtered, [SortRule(id: column.rawValue, desc: desc)])
        }
        let rows = sorted.enumerated().map { index, movie in
            CatalogueRow(rank: index + 1, movie: movie)
        }
        let bySlug = Dictionary(uniqueKeysWithValues: rows.map { ($0.movie.slug, $0) })
        sections = groupMovies(sorted, .score).map { group in
            CatalogueSection(
                id: group.id,
                label: group.label,
                count: group.movies.count,
                averageFinalScore: group.averageFinalScore,
                rows: group.movies.compactMap { bySlug[$0.slug] }
            )
        }
        visibleFilms = rows.count
    }

    private var underlyingRule: SortRule {
        switch sort {
        case .rank: return SortRule(id: SortableMovieColumn.finalScore.rawValue, desc: true)
        case .column(let column, let desc): return SortRule(id: column.rawValue, desc: desc)
        }
    }
}
