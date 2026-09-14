import Foundation
import Testing

@testable import MovieTableCore

private func movie(_ title: String, _ forYou: Int?) -> ScoredMovie {
    var base = try! scoreMovies([normalizeMovie(RawMovie(
        title: title, year: 2000, users_rated: 500, userscore: 80, metascore: 80,
        link: "https://www.metacritic.com/movie/\(title)"
    ))], criticWeight: 0.5)[0]
    base.forYou = forYou
    return base
}

@Suite("For you grouping and sorting")
struct MovieGroupsForYouTests {
    @Test("offers a For you band grouping")
    func options() {
        #expect(GROUP_KEY_OPTIONS.map(\.value).contains(.forYou))
    }

    @Test("bands For you on the same thresholds as Final Score and sends null last")
    func bands() {
        #expect(groupSlotFor(movie("a", 93), .forYou).label == "90+")
        #expect(groupSlotFor(movie("a", 93), .forYou).order == 0)
        #expect(groupSlotFor(movie("b", 80), .forYou).label == "80–89")
        #expect(groupSlotFor(movie("b", 80), .forYou).order == 1)
        #expect(groupSlotFor(movie("c", 12), .forYou).label == "Under 60")
        #expect(groupSlotFor(movie("c", 12), .forYou).order == 4)
        #expect(groupSlotFor(movie("d", nil), .forYou).label == "Not yet ranked")
        #expect(groupSlotFor(movie("d", nil), .forYou).order == 5)
        #expect(groupSlotFor(movie("e", 93), .forYou).id != groupSlotFor(movie("e", 93), .score).id)
    }

    @Test("groups by For you in fixed band order")
    func groups() {
        let groups = groupMovies([movie("low", 61), movie("none", nil), movie("top", 95)], .forYou)
        #expect(groups.map(\.label) == ["90+", "60–69", "Not yet ranked"])
    }

    @Test("sorts by For you with missing values last in both directions")
    func sorting() {
        let rows = [movie("mid", 70), movie("none", nil), movie("top", 96)]
        #expect(sortMovies(rows, [SortRule(id: "forYou", desc: true)]).map(\.title) == ["top", "mid", "none"])
        #expect(sortMovies(rows, [SortRule(id: "forYou", desc: false)]).map(\.title) == ["mid", "top", "none"])
    }
}
