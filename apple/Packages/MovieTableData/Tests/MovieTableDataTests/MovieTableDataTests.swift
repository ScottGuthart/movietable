import Foundation
import Testing

@testable import MovieTableData

@Test("the bundled seed snapshot loads offline")
func seedSnapshotLoads() throws {
    let snapshot = try SeedCatalogue.load()
    #expect(snapshot.movies.count == 5_207)
    #expect(snapshot.taste.films.count == 5_207)
    #expect(snapshot.signals.count == 5_207)
    #expect(snapshot.providers.count == 211)
    #expect(snapshot.fetchedAt == Date(timeIntervalSince1970: 1_789_344_000))
}
