import Testing
@testable import MovieTableUI

@Test("Package builds and exposes its module")
func moduleSmoke() {
    #expect(MovieTableUI.formatVersion == 1)
}
