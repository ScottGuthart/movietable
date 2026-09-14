import Foundation
import Testing

@testable import MovieTable

@Test("Hosted app bundle loads")
func appBundleLoads() {
    #expect(Bundle.main.bundleIdentifier != nil)
}
