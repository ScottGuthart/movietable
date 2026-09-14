import Foundation
import Testing

@testable import MovieTableCore

private func parse(_ json: String) -> FilterQuery? {
    parseFilterQuery(Data(json.utf8))
}

private func node(_ query: FilterQuery) -> FilterNode {
    .group(id: query.id, combinator: query.combinator, rules: query.rules)
}

private func query(_ id: String = "movie-query", _ combinator: FilterCombinator = .and, _ rules: [FilterNode] = []) -> FilterQuery {
    FilterQuery(id: id, combinator: combinator, rules: rules)
}

@Suite("parseFilterQuery")
struct MovieFiltersParseTests {
    @Test("accepts the default query and nested groups")
    func accepts() throws {
        let defaultData = try JSONEncoder().encode(node(DEFAULT_QUERY))
        #expect(parseFilterQuery(defaultData) == DEFAULT_QUERY)

        let nestedJSON = """
        {"id":"root","type":"group","combinator":"or","rules":[{"id":"g","type":"group","combinator":"and","rules":[{"id":"r","type":"rule","path":["year"],"operator":"gte","value":2000,"negated":true}]}]}
        """
        let expected = query("root", .or, [
            .group(id: "g", combinator: .and, rules: [
                .rule(FilterRule(id: "r", path: ["year"], operator: "gte", value: .n(2000), negated: true)),
            ]),
        ])
        #expect(parse(nestedJSON) == expected)
    }

    @Test("rejects shapes a link could carry by mistake", arguments: [
        "null",
        "[]",
        "{\"id\":\"r\",\"type\":\"rule\",\"path\":[\"year\"],\"operator\":\"eq\",\"value\":1}",
        "{\"id\":\"root\",\"type\":\"group\",\"combinator\":\"xor\",\"rules\":[]}",
        "{\"id\":\"root\",\"type\":\"group\",\"combinator\":\"and\",\"rules\":[{\"id\":\"r\",\"type\":\"rule\",\"path\":\"year\",\"operator\":\"eq\"}]}",
        "{\"id\":\"root\",\"type\":\"group\",\"combinator\":\"and\",\"rules\":[{\"type\":\"rule\",\"path\":[\"year\"],\"operator\":\"eq\"}]}",
    ])
    func rejects(json: String) {
        #expect(parse(json) == nil)
    }

    @Test("drops unknown keys and keeps rule values untouched")
    func dropsUnknownKeys() {
        let json = """
        {"id":"root","type":"group","combinator":"and","rules":[{"id":"r","type":"rule","path":["genre"],"operator":"has_any_of","value":["Drama"],"extra":1}],"extra":true}
        """
        let expected = query("root", .and, [
            .rule(FilterRule(id: "r", path: ["genre"], operator: "has_any_of", value: .l([.s("Drama")]))),
        ])
        #expect(parse(json) == expected)
    }
}
