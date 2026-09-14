import Testing
@testable import MovieTableData

@Test("Package builds and exposes its module")
func moduleSmoke() {
    #expect(MovieTableData.formatVersion == 1)
}
