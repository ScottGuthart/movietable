import Testing
@testable import MovieTableCore

@Test("Package builds and exposes its module")
func moduleSmoke() {
    #expect(MovieTableCore.formatVersion == 1)
}
