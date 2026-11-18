import CoreText
import SwiftUI
import UIKit

enum AppScene: String, CaseIterable, Identifiable {
    case cozy
    case clinic
    case garden
    case night

    var id: String { rawValue }

    var title: String {
        switch self {
        case .cozy: "Cozy sky"
        case .clinic: "Hospital room"
        case .garden: "Sunny garden"
        case .night: "Starry rest"
        }
    }

    var detail: String {
        switch self {
        case .cozy: "A bright, quiet room."
        case .clinic: "A soft hospital window."
        case .garden: "Grass and a bright sky."
        case .night: "A dark sky with stars."
        }
    }

    var symbol: String {
        switch self {
        case .cozy: "sofa.fill"
        case .clinic: "cross.case.fill"
        case .garden: "leaf.fill"
        case .night: "moon.stars.fill"
        }
    }

    var canvas: Color {
        switch self {
        case .cozy: Theme.liftedBlue
        case .clinic: Theme.liftedMint
        case .garden: Theme.liftedMint
        case .night: Theme.liftedLilac
        }
    }

    var skyTop: Color {
        Theme.swatchBlue
    }

    var onCanvas: Color {
        Theme.textPrimary
    }
}

struct SceneBackdrop: View {
    var scene: AppScene

    var body: some View {
        CozyRoomBackground(variant: RoomVariant(scene: scene))
    }
}

enum Theme {
    /// Sampled from the centre of each swatch in Design/References/palette.png.
    static let swatchLilac = Color(hex: 0xF5CCFF)
    static let swatchMint = Color(hex: 0xC9FDD9)
    static let swatchBlue = Color(hex: 0xABCAFF)
    static let swatchCoral = Color(hex: 0xFFB3B1)
    static let swatchButter = Color(hex: 0xFFE4AE)

    /// Darkened periwinkle so body text stays clear on the light backgrounds.
    static let ink = Color(hex: 0x2B3340)
    /// Softer than ink, still dark enough for descriptions.
    static let mutedInk = Color(hex: 0x3D4960)
    /// Darkened from swatchMint (× 0.32).
    static let mintInk = Color(hex: 0x405145)
    /// Darkened from swatchCoral (× 0.38).
    static let coralInk = Color(hex: 0x614443)
    /// Darkened from swatchButter (× 0.82) for the floor.
    static let floor = Color(hex: 0xD1BB8F)

    /// Same hues as the palette, mixed 58% toward white so large areas stay light behind the text.
    static let liftedLilac = Color(hex: 0xFBEAFF)
    static let liftedMint = Color(hex: 0xE8FEEF)
    static let liftedBlue = Color(hex: 0xDCE9FF)
    static let liftedCoral = Color(hex: 0xFFDFDE)
    static let liftedButter = Color(hex: 0xFFF4DD)

    static let bg = liftedBlue
    static let teal = ink
    static let tealDark = ink
    static let tealSoft = liftedMint
    static let tealBorder = swatchBlue
    static let terra = coralInk
    static let terraSoft = liftedCoral
    static let terraBorder = swatchCoral
    static let pinkSoft = liftedLilac
    static let pinkBorder = swatchLilac
    static let text = ink
    static let muted = mutedInk
    static let subtle = mutedInk
    static let border = swatchBlue
    static let borderSoft = swatchBlue
    static let cream = liftedLilac
    static let bearFur = Color(hex: 0xC4956A)
    static let bearInner = Color(hex: 0xE7C9A4)
    static let muzzle = Color(hex: 0xF6E6D0)

    static let brandPrimary = swatchBlue
    static let brandSecondary = swatchCoral
    static let brandAccent = swatchLilac
    static let wallBackground = liftedBlue
    static let surface = Color.white
    static let surfaceTint = liftedBlue
    static let textPrimary = ink
    static let textSecondary = mutedInk
    static let onPrimary = ink
    static let success = mintInk
    static let warning = coralInk
    static let error = coralInk
}

enum Jakarta {
    case medium, semibold, bold, extraBold

    var name: String {
        switch self {
        case .medium: "PlusJakartaSans-Medium"
        case .semibold: "PlusJakartaSans-SemiBold"
        case .bold: "PlusJakartaSans-Bold"
        case .extraBold: "PlusJakartaSans-ExtraBold"
        }
    }

    var fallback: Font.Weight {
        switch self {
        case .medium: .medium
        case .semibold: .semibold
        case .bold: .bold
        case .extraBold: .heavy
        }
    }
}

func jakarta(_ size: CGFloat, _ weight: Jakarta = .bold) -> Font {
    let style: Font.TextStyle
    switch size {
    case 32...: style = .largeTitle
    case 26..<32: style = .title
    case 21..<26: style = .title2
    case 18..<21: style = .title3
    case 16..<18: style = .body
    case 14..<16: style = .subheadline
    default: style = .caption
    }
    if UIFont(name: weight.name, size: size) != nil {
        return .custom(weight.name, size: size, relativeTo: style)
    }
    return .system(size: size, weight: weight.fallback, design: .rounded)
}

enum FontRegistrar {
    static func register() {
        let names = [
            "PlusJakartaSans-Medium",
            "PlusJakartaSans-SemiBold",
            "PlusJakartaSans-Bold",
            "PlusJakartaSans-ExtraBold"
        ]
        for name in names {
            let url = Bundle.main.url(forResource: name, withExtension: "ttf")
                ?? Bundle.main.url(forResource: name, withExtension: "ttf", subdirectory: "Fonts")
            guard let url else { continue }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}

extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

struct KidButtonStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.97)
            .opacity(configuration.isPressed ? 0.92 : 1)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.14), value: configuration.isPressed)
    }
}

struct CardStyle: ViewModifier {
    var fill: Color = .white
    var border: Color = Theme.border
    var radius: CGFloat = 24
    var lineWidth: CGFloat = 1

    func body(content: Content) -> some View {
        content
            .background(fill, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(border, lineWidth: lineWidth)
            )
            .shadow(color: Theme.ink.opacity(0.08), radius: 12, y: 4)
    }
}

private struct ReadableColumn: ViewModifier {
    var compact: CGFloat
    @Environment(\.horizontalSizeClass) private var sizeClass

    func body(content: Content) -> some View {
        if sizeClass == .regular {
            content
                .frame(maxWidth: .infinity, alignment: .top)
                .padding(.horizontal, 16)
        } else {
            content
                .frame(maxWidth: compact)
                .frame(maxWidth: .infinity)
        }
    }
}

extension View {
    func readableColumn(compact: CGFloat = 480) -> some View {
        modifier(ReadableColumn(compact: compact))
    }

    func card(
        fill: Color = .white,
        border: Color = Theme.border,
        radius: CGFloat = 24,
        lineWidth: CGFloat = 1
    ) -> some View {
        modifier(CardStyle(fill: fill, border: border, radius: radius, lineWidth: lineWidth))
    }

    func kidCanvas() -> some View {
        modifier(KidCanvas())
    }
}

private struct KidCanvas: ViewModifier {
    func body(content: Content) -> some View {
        content
    }
}
