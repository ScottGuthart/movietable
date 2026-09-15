import XCTest

final class MovieTableUITests: XCTestCase {
    func testScoreBiasUpdatesTopRow() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-uitest-seed", "-uitest-hide-starter-hand"]
        app.launch()

        let topRow = app.buttons["TopCatalogueRow"].firstMatch
        XCTAssertTrue(topRow.waitForExistence(timeout: 20))
        XCTAssertTrue(topRow.label.contains("The Lord of the Rings: The Return of the King"))

        let slider = app.sliders["ScoreBiasSlider"]
        XCTAssertTrue(slider.waitForExistence(timeout: 10))
        slider.adjust(toNormalizedSliderPosition: 1)

        let predicate = NSPredicate { [weak self] _, _ in
            (self?.topRowLabel(app) ?? "").contains("Boyhood")
        }
        let updated = XCTWaiter().wait(
            for: [XCTNSPredicateExpectation(predicate: predicate, object: nil)],
            timeout: 10
        )
        XCTAssertEqual(updated, .completed, "Expected Boyhood; got \(topRowLabel(app))")
    }

    private func topRowLabel(_ app: XCUIApplication) -> String {
        app.buttons["TopCatalogueRow"].firstMatch.label
    }
}
