import XCTest

import MovieTableCore
import MovieTableData

final class CataloguePerformanceTests: XCTestCase {
    private var movies: [Movie]!
    private var taste: TasteCatalogue!

    override func setUpWithError() throws {
        let snapshot = try SeedCatalogue.load()
        XCTAssertEqual(snapshot.movies.count, 5_207)
        movies = snapshot.movies.map(normalizeMovie)
        taste = snapshot.taste
    }

    func testRescoreAndResortCatalogue() {
        measure {
            let scored = (try? scoreMovies(movies, criticWeight: 0.5)) ?? []
            let ranked = rankMovies(scored, taste, [:])
            let sorted = ranked.sorted { lhs, rhs in
                let lhsScore = lhs.finalScore ?? Int.min
                let rhsScore = rhs.finalScore ?? Int.min
                if lhsScore != rhsScore { return lhsScore > rhsScore }
                return lhs.title.localizedStandardCompare(rhs.title) == .orderedAscending
            }
            XCTAssertEqual(sorted.count, 5_207)
        }
    }
}
