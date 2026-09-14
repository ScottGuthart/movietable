import Foundation

// MARK: - Query model

public enum FilterCombinator: String, Hashable, Sendable {
    case and
    case or
}

/// A JSON-shaped filter value: number, string, list, or null.
public enum FilterValue: Hashable, Sendable {
    case number(Double)
    case string(String)
    case list([FilterValue])
    case null
}

extension FilterValue: Codable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let list = try? container.decode([FilterValue].self) {
            self = .list(list)
        } else if let number = try? container.decode(Double.self) {
            self = .number(number)
        } else {
            self = .string(try container.decode(String.self))
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null: try container.encodeNil()
        case .string(let string): try container.encode(string)
        case .list(let list): try container.encode(list)
        case .number(let number):
            // Keep integral numbers integral in JSON.
            if number.isFinite && number == number.rounded() && abs(number) < 1e15 {
                try container.encode(Int64(number))
            } else {
                try container.encode(number)
            }
        }
    }
}

public struct FilterRule: Hashable, Sendable {
    public var id: String
    public var path: [String]
    public var `operator`: String
    public var value: FilterValue?
    public var negated: Bool

    public init(id: String, path: [String], operator: String, value: FilterValue? = nil, negated: Bool = false) {
        self.id = id
        self.path = path
        self.operator = `operator`
        self.value = value
        self.negated = negated
    }
}

public enum FilterNode: Hashable, Sendable {
    case group(id: String, combinator: FilterCombinator, rules: [FilterNode])
    case rule(FilterRule)
}

/// A complete filter tree: an and/or group of rules and nested groups.
public struct FilterQuery: Hashable, Sendable {
    public var id: String
    public var combinator: FilterCombinator
    public var rules: [FilterNode]

    public init(id: String = "movie-query", combinator: FilterCombinator = .and, rules: [FilterNode] = []) {
        self.id = id
        self.combinator = combinator
        self.rules = rules
    }
}

extension FilterNode: Codable {
    private enum CodingKeys: String, CodingKey {
        case id, type, combinator, rules, path
        case `operator`
        case value, negated
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let id = try container.decode(String.self, forKey: .id)
        let type = try container.decode(String.self, forKey: .type)
        if type == "group" {
            let combinator = try container.decode(String.self, forKey: .combinator)
            guard let combine = FilterCombinator(rawValue: combinator) else {
                throw DecodingError.dataCorruptedError(forKey: .combinator, in: container, debugDescription: "Unknown combinator")
            }
            let rules = try container.decode([FilterNode].self, forKey: .rules)
            self = .group(id: id, combinator: combine, rules: rules)
        } else if type == "rule" {
            let path = try container.decode([String].self, forKey: .path)
            let `operator` = try container.decode(String.self, forKey: .operator)
            let value = try container.decodeIfPresent(FilterValue.self, forKey: .value)
            let negated = try container.decodeIfPresent(Bool.self, forKey: .negated) ?? false
            guard negated == true || negated == false else {
                throw DecodingError.dataCorruptedError(forKey: .negated, in: container, debugDescription: "negated must be a boolean")
            }
            self = .rule(FilterRule(id: id, path: path, operator: `operator`, value: value, negated: negated))
        } else {
            throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown node type")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .group(let id, let combinator, let rules):
            try container.encode(id, forKey: .id)
            try container.encode("group", forKey: .type)
            try container.encode(combinator.rawValue, forKey: .combinator)
            try container.encode(rules, forKey: .rules)
        case .rule(let rule):
            try container.encode(rule.id, forKey: .id)
            try container.encode("rule", forKey: .type)
            try container.encode(rule.path, forKey: .path)
            try container.encode(rule.operator, forKey: .operator)
            try container.encodeIfPresent(rule.value, forKey: .value)
            if rule.negated { try container.encode(true, forKey: .negated) }
        }
    }
}

// MARK: - Fields and operators

public enum FilterArity: Hashable, Sendable {
    case noValue
    case one
    case range
    case many
}

public struct FilterOperator: Hashable, Sendable {
    public var value: String
    public var label: String
    public var arity: FilterArity
    public var inverse: String?

    public init(value: String, label: String, arity: FilterArity, inverse: String? = nil) {
        self.value = value
        self.label = label
        self.arity = arity
        self.inverse = inverse
    }
}

public enum FilterFieldType: String, Hashable, Sendable {
    case text
    case number
    case select
    case multiselect
}

public struct FilterOption: Hashable, Sendable {
    public var value: String
    public var label: String

    public init(value: String, label: String) {
        self.value = value
        self.label = label
    }
}

public struct MovieFilterField: Hashable, Sendable {
    public var id: String
    public var label: String
    public var fieldDescription: String?
    public var type: FilterFieldType?
    public var operators: [FilterOperator]
    public var defaultOperator: String?
    public var options: [FilterOption]
    public var placeholder: String?

    public init(
        id: String,
        label: String,
        fieldDescription: String? = nil,
        type: FilterFieldType? = nil,
        operators: [FilterOperator],
        defaultOperator: String? = nil,
        options: [FilterOption] = [],
        placeholder: String? = nil
    ) {
        self.id = id
        self.label = label
        self.fieldDescription = fieldDescription
        self.type = type
        self.operators = operators
        self.defaultOperator = defaultOperator
        self.options = options
        self.placeholder = placeholder
    }
}

/// The catalogue's languages and subgenres, so the pickers list real values.
public struct FilterVocabulary: Hashable, Sendable {
    public var languages: [String]
    public var subgenres: [String]
    /// Metacritic genres, from each film's inline signals.
    public var genres: [String]

    public init(languages: [String] = [], subgenres: [String] = [], genres: [String] = []) {
        self.languages = languages
        self.subgenres = subgenres
        self.genres = genres
    }
}

public let GENRE_FIELD_ID = "genre"

public let MOVIE_OPERATOR_LABELS: [String: String] = [
    "contains": "contains",
    "not_contains": "does not contain",
    "starts_with": "starts with",
    "ends_with": "ends with",
    "is": "is",
    "is_not": "is not",
    "is_any_of": "is any of",
    "is_none_of": "is none of",
    "has_any_of": "has any of",
    "has_all_of": "has all of",
    "has_none_of": "has none of",
    "eq": "equals",
    "neq": "does not equal",
    "gt": "greater than",
    "gte": "at least",
    "lt": "less than",
    "lte": "at most",
    "between": "between",
    "not_between": "not between",
    "is_before": "is before",
    "is_after": "is after",
    "is_on_or_before": "is on or before",
    "is_on_or_after": "is on or after",
    "empty": "is empty",
    "not_empty": "is not empty",
]

func label(for value: String) -> String {
    MOVIE_OPERATOR_LABELS[value] ?? value
}

func textOperators() -> [FilterOperator] {
    [
        .init(value: "contains", label: label(for: "contains"), arity: .one, inverse: "not_contains"),
        .init(value: "not_contains", label: label(for: "not_contains"), arity: .one, inverse: "contains"),
        .init(value: "starts_with", label: label(for: "starts_with"), arity: .one),
        .init(value: "ends_with", label: label(for: "ends_with"), arity: .one),
        .init(value: "is", label: label(for: "is"), arity: .one, inverse: "is_not"),
        .init(value: "is_not", label: label(for: "is_not"), arity: .one, inverse: "is"),
        .init(value: "empty", label: label(for: "empty"), arity: .noValue, inverse: "not_empty"),
        .init(value: "not_empty", label: label(for: "not_empty"), arity: .noValue, inverse: "empty"),
    ]
}

func numberOperators() -> [FilterOperator] {
    [
        .init(value: "eq", label: label(for: "eq"), arity: .one, inverse: "neq"),
        .init(value: "neq", label: label(for: "neq"), arity: .one, inverse: "eq"),
        .init(value: "gt", label: label(for: "gt"), arity: .one, inverse: "lte"),
        .init(value: "gte", label: label(for: "gte"), arity: .one, inverse: "lt"),
        .init(value: "lt", label: label(for: "lt"), arity: .one, inverse: "gte"),
        .init(value: "lte", label: label(for: "lte"), arity: .one, inverse: "gt"),
        .init(value: "between", label: label(for: "between"), arity: .range, inverse: "not_between"),
        .init(value: "not_between", label: label(for: "not_between"), arity: .range, inverse: "between"),
        .init(value: "empty", label: label(for: "empty"), arity: .noValue, inverse: "not_empty"),
        .init(value: "not_empty", label: label(for: "not_empty"), arity: .noValue, inverse: "empty"),
    ]
}

func selectOperators() -> [FilterOperator] {
    [
        .init(value: "is", label: label(for: "is"), arity: .one, inverse: "is_not"),
        .init(value: "is_not", label: label(for: "is_not"), arity: .one, inverse: "is"),
        .init(value: "is_any_of", label: label(for: "is_any_of"), arity: .many, inverse: "is_none_of"),
        .init(value: "is_none_of", label: label(for: "is_none_of"), arity: .many, inverse: "is_any_of"),
        .init(value: "empty", label: label(for: "empty"), arity: .noValue, inverse: "not_empty"),
        .init(value: "not_empty", label: label(for: "not_empty"), arity: .noValue, inverse: "empty"),
    ]
}

func multiselectOperators() -> [FilterOperator] {
    [
        .init(value: "has_any_of", label: label(for: "has_any_of"), arity: .many, inverse: "has_none_of"),
        .init(value: "has_all_of", label: label(for: "has_all_of"), arity: .many),
        .init(value: "has_none_of", label: label(for: "has_none_of"), arity: .many, inverse: "has_any_of"),
        .init(value: "empty", label: label(for: "empty"), arity: .noValue, inverse: "not_empty"),
        .init(value: "not_empty", label: label(for: "not_empty"), arity: .noValue, inverse: "empty"),
    ]
}

func catalog(for type: FilterFieldType?) -> [FilterOperator] {
    switch type {
    case .text: textOperators()
    case .number: numberOperators()
    case .select: selectOperators()
    case .multiselect: multiselectOperators()
    case nil: numberOperators()
    }
}

func numberField(id: String, label: String, fieldDescription: String, defaultOperator: String) -> MovieFilterField {
    MovieFilterField(
        id: id,
        label: label,
        fieldDescription: fieldDescription,
        type: .number,
        operators: numberOperators(),
        defaultOperator: defaultOperator
    )
}

/// Filter fields, with option lists filled from the catalogue when a vocabulary is given.
public func createMovieFields(_ vocabulary: FilterVocabulary = FilterVocabulary()) -> [MovieFilterField] {
    [
        MovieFilterField(
            id: "title",
            label: "Title",
            type: .text,
            operators: textOperators(),
            defaultOperator: "contains",
            placeholder: "Search a movie title…"
        ),
        MovieFilterField(
            id: GENRE_FIELD_ID,
            label: "Genre",
            fieldDescription: "Metacritic genres",
            type: .multiselect,
            operators: multiselectOperators(),
            defaultOperator: "has_any_of",
            options: vocabulary.genres.map { FilterOption(value: $0, label: $0) },
            placeholder: "Search genres…"
        ),
        numberField(id: "year", label: "Year", fieldDescription: "Release year", defaultOperator: "between"),
        numberField(id: "popularity", label: "Popularity", fieldDescription: "Number of audience ratings", defaultOperator: "between"),
        numberField(id: "users", label: "Users", fieldDescription: "Audience score, out of 100", defaultOperator: "gte"),
        numberField(id: "critics", label: "Critics", fieldDescription: "Metascore, out of 100", defaultOperator: "gte"),
        numberField(id: "finalScore", label: "Final Score", fieldDescription: "Your weighted score, out of 100", defaultOperator: "gte"),
        MovieFilterField(
            id: "language",
            label: "Language",
            fieldDescription: "Original language, when IMDb lists one",
            type: .select,
            operators: selectOperators(),
            defaultOperator: "is",
            options: vocabulary.languages.map { FilterOption(value: $0, label: $0) },
            placeholder: "Search languages…"
        ),
        MovieFilterField(
            id: "subgenres",
            label: "Subgenre",
            fieldDescription: "Wikidata film genres, finer than Metacritic's",
            type: .multiselect,
            operators: multiselectOperators(),
            defaultOperator: "has_any_of",
            options: vocabulary.subgenres.map { FilterOption(value: $0, label: $0) },
            placeholder: "Search subgenres…"
        ),
        numberField(
            id: "oscarWins",
            label: "Oscar wins",
            fieldDescription: "Academy Award wins from Wikidata; indicative, not complete",
            defaultOperator: "gte"
        ),
        numberField(
            id: "oscarNominations",
            label: "Oscar nominations",
            fieldDescription: "Academy Award nominations from Wikidata; indicative, not complete",
            defaultOperator: "gte"
        ),
    ]
}

public let MOVIE_FIELDS: [MovieFilterField] = createMovieFields()

/// Nothing is filtered on arrival: the visitor meets the whole catalogue and
/// narrows it themselves.
public let DEFAULT_QUERY = FilterQuery()

public func emptyQuery() -> FilterQuery {
    FilterQuery()
}

func fieldForRule(_ rule: FilterRule) -> MovieFilterField? {
    guard rule.path.count == 1 else { return nil }
    return MOVIE_FIELDS.first { $0.id == rule.path[0] }
}

public func numericValue(_ value: FilterValue?) -> Double? {
    switch value {
    case .number(let number): return number.isFinite ? number : nil
    case .string(let string):
        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let number = Double(trimmed), number.isFinite else { return nil }
        return number
    default: return nil
    }
}

func chosenValues(_ value: FilterValue?) -> [String] {
    switch value {
    case .list(let values):
        return values.compactMap { entry in
            if case .string(let string) = entry, !string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return string
            }
            return nil
        }
    case .string(let string):
        return string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? [] : [string]
    default:
        return []
    }
}

public func isCompleteRule(_ rule: FilterRule) -> Bool {
    guard let field = fieldForRule(rule) else { return false }
    guard let selectedOperator = catalog(for: field.type).first(where: { $0.value == rule.operator }) else {
        return false
    }
    if selectedOperator.arity == .noValue { return true }
    if field.type == .select || field.type == .multiselect {
        return !chosenValues(rule.value).isEmpty
    }
    if field.type == .text {
        if case .string(let string) = rule.value {
            return !string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
        return false
    }
    if selectedOperator.arity == .range {
        guard case .list(let values) = rule.value, values.count == 2,
              let min = numericValue(values[0]), let max = numericValue(values[1]) else {
            return false
        }
        return min <= max
    }
    return numericValue(rule.value) != nil
}

// MARK: - Evaluation

enum ActualValue {
    case text(String)
    case number(Double)
    case list([String])
}

func actualValue(for movie: ScoredMovie, fieldId: String) -> ActualValue? {
    switch fieldId {
    case "title": return .text(movie.title)
    case "genre": return .list(movie.signals?.genres ?? [])
    case "year": return .number(Double(movie.year))
    case "popularity": return movie.popularity.map(ActualValue.number)
    case "users": return movie.users.map(ActualValue.number)
    case "critics": return movie.critics.map(ActualValue.number)
    case "finalScore": return movie.finalScore.map { .number(Double($0)) }
    case "language": return movie.language.map(ActualValue.text)
    case "subgenres": return .list(movie.subgenres)
    case "oscarWins": return movie.oscarWins.map { .number(Double($0)) }
    case "oscarNominations": return movie.oscarNominations.map { .number(Double($0)) }
    default: return nil
    }
}

func isMissing(_ value: ActualValue?) -> Bool {
    switch value {
    case nil: return true
    case .text(let string): return string.isEmpty
    case .number: return false
    case .list(let list): return list.isEmpty
    }
}

func evaluateMembership(_ actual: ActualValue, _ operatorValue: String, _ chosen: [String]) -> Bool {
    let own: Set<String>
    switch actual {
    case .list(let list): own = Set(list)
    case .text(let string): own = [string]
    case .number(let number): own = [decimalString(number)]
    }
    switch operatorValue {
    case "is": return chosen.count == 1 && own.contains(chosen[0])
    case "is_not": return !(chosen.count == 1 && own.contains(chosen[0]))
    case "is_any_of", "has_any_of": return chosen.contains { own.contains($0) }
    case "is_none_of", "has_none_of": return !chosen.contains { own.contains($0) }
    case "has_all_of": return chosen.allSatisfy { own.contains($0) }
    default: return false
    }
}

func evaluateRule(_ movie: ScoredMovie, _ rule: FilterRule) -> Bool? {
    guard isCompleteRule(rule) else { return nil }
    let field = fieldForRule(rule)
    let actual = actualValue(for: movie, fieldId: rule.path.first ?? "")
    let missing = isMissing(actual)
    var result = false
    if rule.operator == "empty" {
        result = missing
    } else if rule.operator == "not_empty" {
        result = !missing
    } else if !missing, field?.type == .select || field?.type == .multiselect, let actual {
        result = evaluateMembership(actual, rule.operator, chosenValues(rule.value))
    } else if !missing, rule.path.first == "title", let actual, case .text(let text) = actual {
        let lowercased = text.lowercased()
        let term = valueText(rule.value).trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        switch rule.operator {
        case "contains": result = lowercased.contains(term)
        case "not_contains": result = !lowercased.contains(term)
        case "starts_with": result = lowercased.hasPrefix(term)
        case "ends_with": result = lowercased.hasSuffix(term)
        case "is": result = lowercased == term
        case "is_not": result = lowercased != term
        default: break
        }
    } else if !missing, let actual, case .number(let number) = actual {
        let value = numericValue(rule.value)
        switch rule.operator {
        case "eq": result = number == value
        case "neq": result = number != value
        case "gt": result = number > (value ?? .nan)
        case "gte": result = number >= (value ?? .nan)
        case "lt": result = number < (value ?? .nan)
        case "lte": result = number <= (value ?? .nan)
        case "between", "not_between":
            if case .list(let values) = rule.value, values.count == 2,
               let min = numericValue(values[0]), let max = numericValue(values[1]) {
                let inside = number >= min && number <= max
                result = rule.operator == "between" ? inside : !inside
            }
        default: break
        }
    }
    return rule.negated ? !result : result
}

func evaluateNode(_ movie: ScoredMovie, _ node: FilterNode) -> Bool? {
    switch node {
    case .rule(let rule):
        return evaluateRule(movie, rule)
    case .group(_, let combinator, let rules):
        // Unfinished rules are absent predicates, not true leaves that make an OR match everything.
        let results = rules.compactMap { evaluateNode(movie, $0) }
        if results.isEmpty { return nil }
        return combinator == .and ? results.allSatisfy { $0 } : results.contains { $0 }
    }
}

public func matchesQuery(_ movie: ScoredMovie, _ query: FilterQuery) -> Bool {
    evaluateNode(movie, .group(id: query.id, combinator: query.combinator, rules: query.rules)) ?? true
}

// MARK: - Parsing and description

/// A query tree from untrusted JSON (a URL, storage); nil when the shape is
/// wrong, so a bad link falls back to the default view.
public func parseFilterQuery(_ data: Data) -> FilterQuery? {
    guard let node = try? JSONDecoder().decode(FilterNode.self, from: data),
          case .group(let id, let combinator, let rules) = node else {
        return nil
    }
    return FilterQuery(id: id, combinator: combinator, rules: rules)
}

/// A query tree from an already-decoded JSON object; nil when the shape is wrong.
public func parseFilterQuery(_ value: Any) -> FilterQuery? {
    guard JSONSerialization.isValidJSONObject(value),
          let data = try? JSONSerialization.data(withJSONObject: value) else {
        return nil
    }
    return parseFilterQuery(data)
}

func valueText(_ value: FilterValue?) -> String {
    switch value {
    case .none, .some(.null): return ""
    case .number(let number): return decimalString(number)
    case .string(let string): return string
    case .list(let values): return values.map(valueText).joined(separator: ",")
    }
}

/// Renders a query the way the web app describes it, with parenthesized groups and negation.
public func describeQuery(_ node: FilterNode, depth: Int = 0) -> String {
    switch node {
    case .group(_, let combinator, let rules):
        let parts = rules.map { describeQuery($0, depth: depth + 1) }.filter { !$0.isEmpty }
        if parts.isEmpty { return depth == 0 ? "All movies" : "" }
        let text = parts.joined(separator: " \(combinator.rawValue.uppercased()) ")
        return depth == 0 ? text : "(\(text))"
    case .rule(let rule):
        let field = fieldForRule(rule)
        let label = field?.label ?? rule.path.joined(separator: ".")
        if !isCompleteRule(rule) {
            return "\(label.isEmpty ? "Condition" : label) [incomplete — ignored]"
        }
        let operatorLabel = MOVIE_OPERATOR_LABELS[rule.operator] ?? rule.operator
        var text = "\(label) \(operatorLabel)"
        if rule.operator != "empty" && rule.operator != "not_empty" {
            let values: [FilterValue]
            if case .list(let list) = rule.value {
                values = list
            } else if let single = rule.value, single != .null {
                values = [single]
            } else {
                values = []
            }
            let separator = field?.type == .multiselect || field?.type == .select ? ", " : " and "
            let rendered = values.map { value in
                if case .string(let string) = value, field?.type == .text {
                    return "\"\(string)\""
                }
                return valueText(value)
            }
            if !rendered.isEmpty {
                text += " " + rendered.joined(separator: separator)
            }
        }
        return rule.negated ? "NOT (\(text))" : text
    }
}

/// Distinct languages and subgenres present in the catalogue, alphabetical.
public func filterVocabulary(_ movies: [ScoredMovie]) -> FilterVocabulary {
    var languages = Set<String>()
    var subgenres = Set<String>()
    var genres = Set<String>()
    for movie in movies {
        if let language = movie.language, !language.isEmpty { languages.insert(language) }
        for subgenre in movie.subgenres { subgenres.insert(subgenre) }
        for genre in movie.signals?.genres ?? [] { genres.insert(genre) }
    }
    return FilterVocabulary(
        languages: languages.sorted(),
        subgenres: subgenres.sorted(),
        genres: genres.sorted()
    )
}
