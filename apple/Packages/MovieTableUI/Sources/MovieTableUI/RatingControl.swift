import SwiftUI
import MovieTableCore

/// Five stars in half-star steps. The left half of a star gives the half
/// step, arrow keys step by half a star, and tapping the saved rating again
/// clears it. Haptics ride on the rating value.
public struct RatingControl: View {
    public enum Size {
        case row
        case sheet
        case touch
    }

    let stars: Stars?
    let size: Size
    let action: (Stars?) -> Void

    @FocusState private var focused: Bool

    public init(stars: Stars?, size: Size = .row, action: @escaping (Stars?) -> Void) {
        self.stars = stars
        self.size = size
        self.action = action
    }

    private var starSize: CGFloat {
        switch size {
        case .row: 16
        case .sheet: 20
        case .touch: 24
        }
    }

    private var gap: CGFloat {
        switch size {
        case .row: 2
        case .sheet: 6
        case .touch: 4
        }
    }

    private var width: CGFloat { starSize * 5 + gap * 4 }

    public var body: some View {
        HStack(spacing: gap) {
            ForEach(0..<5, id: \.self) { index in
                star(at: index)
            }
        }
        .frame(width: width, height: starSize)
        .contentShape(Rectangle())
        .onTapGesture { location in
            guard location.x >= 0, location.x <= width else { return }
            let step = starSize + gap
            let index = min(4, Int(location.x / step))
            let within = location.x - CGFloat(index) * step
            let value = Double(index) + (within < starSize / 2 ? 0.5 : 1.0)
            action(stars == value ? nil : value)
        }
        .focusable()
        .focused($focused)
        .onKeyPress(.rightArrow) {
            step(+0.5)
            return .handled
        }
        .onKeyPress(.upArrow) {
            step(+0.5)
            return .handled
        }
        .onKeyPress(.leftArrow) {
            step(-0.5)
            return .handled
        }
        .onKeyPress(.downArrow) {
            step(-0.5)
            return .handled
        }
        .sensoryFeedback(.impact(weight: .light), trigger: stars)
        .accessibilityElement()
        .accessibilityLabel(stars.map { "\($0) of 5 stars" } ?? "Not rated")
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: step(+0.5)
            case .decrement: step(-0.5)
            default: break
            }
        }
    }

    private func star(at index: Int) -> some View {
        let value = Double(index) + 1.0
        let fill = stars ?? 0
        let whole = fill >= value
        let half = !whole && fill >= value - 0.5
        return ZStack(alignment: .leading) {
            Image(systemName: "star")
                .foregroundStyle(LedgerColors.fadedInk.opacity(0.6))
            if whole || half {
                Image(systemName: "star.fill")
                    .foregroundStyle(LedgerColors.marqueeCrimson)
                    .mask(alignment: .leading) {
                        Rectangle().frame(width: half ? starSize / 2 : starSize)
                    }
            }
        }
        .font(.system(size: starSize - 2))
        .frame(width: starSize, height: starSize)
    }

    private func step(_ delta: Double) {
        let base = stars ?? 0
        action(min(5, max(0.5, base + delta)))
    }
}
