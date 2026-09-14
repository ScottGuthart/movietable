import Foundation
import MovieTableCore
import MovieTableData
import Testing

@testable import MovieTableUI

@MainActor
@Suite("catalogue view model")
struct CatalogueViewModelTests {
    private func snapshot() -> CatalogueSnapshot {
        func raw(
            _ slug: String, _ title: String, year: Int, popularity: Double?,
            users: Double?, critics: Double?
        ) -> RawMovie {
            RawMovie(
                slug: slug, title: title, year: year, users_rated: popularity,
                userscore: users, metascore: critics,
                link: "https://www.metacritic.com/movie/\(slug)/"
            )
        }
        let movies = [
            raw("critic-pick", "Critic Pick", year: 2015, popularity: 20_000, users: 70, critics: 95),
            raw("crowd-pick", "Crowd Pick", year: 2005, popularity: 40_000, users: 90, critics: 70),
            raw("balanced", "Balanced", year: 2019, popularity: 1_000, users: 80, critics: 85),
            raw("old-film", "Old Film", year: 1999, popularity: 1_000, users: 90, critics: 90),
            raw("obscure-film", "Obscure Film", year: 2010, popularity: 100, users: 85, critics: 85),
        ]
        return CatalogueSnapshot(
            movies: movies,
            signals: [
                "critic-pick": FilmSignals(directors: [Person(slug: "nolan", name: "Christopher Nolan")]),
                "crowd-pick": FilmSignals(directors: [Person(slug: "kubrick", name: "Stanley Kubrick")]),
            ],
            taste: TasteCatalogue(films: movies.map { TasteFilm(slug: $0.slug ?? "", year: $0.year) }, people: []),
            providers: [],
            fetchedAt: Date(timeIntervalSince1970: 1_789_344_000)
        )
    }

    private func rows(_ model: CatalogueViewModel) -> [CatalogueRow] {
        model.sections.flatMap(\.rows)
    }

    @Test("defaults rank the default era and popularity range by Final Score")
    func defaults() {
        let model = CatalogueViewModel(snapshot: snapshot())
        let visible = rows(model)
        #expect(model.phase == .loaded)
        #expect(model.totalFilms == 5)
        #expect(visible.count == 3)
        #expect(visible.map(\.movie.slug) == ["critic-pick", "balanced", "crowd-pick"])
        #expect(visible.map(\.rank) == [1, 2, 3])
        #expect(visible.allSatisfy { (2000...2024).contains($0.year) })
        #expect(visible.allSatisfy { ($0.movie.popularity ?? 0) >= 300 && ($0.movie.popularity ?? 0) <= 100_000 })
    }

    @Test("score bias re-ranks on release")
    func scoreBiasReRanks() {
        let model = CatalogueViewModel(snapshot: snapshot())
        #expect(rows(model).first?.movie.slug == "critic-pick")
        model.setScoreBias(0)
        #expect(rows(model).first?.movie.slug == "crowd-pick")
        #expect(rows(model).first?.movie.finalScore == 90)
        model.setScoreBias(1)
        #expect(rows(model).first?.movie.slug == "critic-pick")
        #expect(rows(model).first?.movie.finalScore == 95)
    }

    @Test("rows are sectioned by score band with counts and averages")
    func sections() {
        let model = CatalogueViewModel(snapshot: snapshot())
        #expect(model.sections.map(\.label) == ["80–89"])
        #expect(model.sections.first?.count == 3)
        #expect(model.sections.first?.averageFinalScore == 81)
    }

    @Test("search matches titles and directors")
    func search() {
        let model = CatalogueViewModel(snapshot: snapshot())
        model.setSearch("Nolan")
        #expect(rows(model).map(\.movie.slug) == ["critic-pick"])
        model.setSearch("crowd")
        #expect(rows(model).map(\.movie.slug) == ["crowd-pick"])
        model.setSearch("")
        #expect(rows(model).count == 3)
    }

    @Test("quick era and popularity chips narrow the view")
    func quickFilters() {
        let model = CatalogueViewModel(snapshot: snapshot())
        model.setEra(.twentyTens)
        #expect(rows(model).map(\.movie.slug) == ["critic-pick", "balanced"])
        model.setPopularOnly(true)
        #expect(rows(model).map(\.movie.slug) == ["critic-pick"])
        model.setPopularOnly(false)
        model.setEra(.modern)
        #expect(rows(model).count == 3)
    }

    @Test("reset view restores the default ranking controls")
    func reset() {
        let model = CatalogueViewModel(snapshot: snapshot())
        model.setScoreBias(0)
        model.setSearch("pick")
        model.setEra(.twentyTwenties)
        model.setPopularOnly(true)
        model.resetView()
        #expect(model.scoreBias == 0.5)
        #expect(model.searchText.isEmpty)
        #expect(model.era == .modern)
        #expect(!model.popularOnly)
        #expect(rows(model).map(\.movie.slug) == ["critic-pick", "balanced", "crowd-pick"])
    }

    @Test("missing values stay missing and For you stays unavailable without ratings")
    func missingValues() {
        let model = CatalogueViewModel(snapshot: snapshot())
        #expect(rows(model).allSatisfy { $0.movie.forYou == nil })
        #expect(!(OptionalSortValue(nil) < OptionalSortValue(1)))
        #expect(OptionalSortValue(1) < OptionalSortValue(nil))
    }

    @Test("no cache and a failed fetch shows the designed offline state")
    func offline() async {
        let config = SupabaseConfig(url: URL(string: "https://api.movietable.ai")!, anonKey: "test-key")
        let model = CatalogueViewModel(
            store: nil,
            config: config,
            loadRemote: { _ in throw CatalogueError("offline") }
        )
        await model.start()
        #expect(model.phase == .offline)
        #expect(model.sections.isEmpty)
    }

    @Test("a successful refresh replaces the snapshot and saves it")
    func refresh() async {
        let store = CatalogueStore(directory: FileManager.default.temporaryDirectory
            .appending(path: "MovieTableUIRefresh-\(UUID().uuidString)"))
        defer { try? FileManager.default.removeItem(at: store.directory) }
        let seed = snapshot()
        let config = SupabaseConfig(url: URL(string: "https://api.movietable.ai")!, anonKey: "test-key")
        let model = CatalogueViewModel(store: store, config: config, loadRemote: { _ in seed })
        await model.start()
        #expect(model.phase == .loaded)
        #expect(model.totalFilms == 5)
        #expect(store.loadSnapshot()?.movies.count == 5)
    }
}
