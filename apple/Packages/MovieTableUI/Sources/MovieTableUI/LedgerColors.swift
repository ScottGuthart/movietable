import SwiftUI

/// The Critics' Ledger colour roles, loaded from the package asset catalog so
/// package views and app views share one set of light/dark definitions.
public enum LedgerColors {
    public static let marqueeCrimson = Color("Marquee Crimson", bundle: .module)
    public static let litCrimson = Color("Lit Crimson", bundle: .module)
    public static let blushWhite = Color("Blush White", bundle: .module)
    public static let ink = Color("Ink", bundle: .module)
    public static let headerInk = Color("Header Ink", bundle: .module)
    public static let fadedInk = Color("Faded Ink", bundle: .module)
    public static let pencilGray = Color("Pencil Gray", bundle: .module)
    public static let hairline = Color("Hairline", bundle: .module)
    public static let secondaryPaper = Color("Secondary Paper", bundle: .module)
    public static let paperTint = Color("Paper Tint", bundle: .module)
    public static let paper = Color("Paper", bundle: .module)
    public static let chalk = Color("Chalk", bundle: .module)
    public static let charcoal = Color("Charcoal", bundle: .module)
    public static let graphite = Color("Graphite", bundle: .module)
    public static let chalkHairline = Color("Chalk Hairline", bundle: .module)
}

public enum LedgerFont {
    /// Playfair Display is the app's only face; it is registered by the app's
    /// Info.plist. The system serif is the fallback for package-only previews.
    public static func custom(_ size: CGFloat, weight: Font.Weight = .regular, relativeTo style: Font.TextStyle = .body) -> Font {
        .custom("Playfair Display", size: size, relativeTo: style).weight(weight)
    }
}

/// The em dash every missing value renders as, never zero and never imputed.
public let missingValue = "—"
