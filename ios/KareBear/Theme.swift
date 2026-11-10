import CoreText
import SwiftUI
import UIKit

enum Theme {
    static let bg = Color(hex: 0xFAF6F0)
    static let teal = Color(hex: 0x0E5A54)
    static let tealDark = Color(hex: 0x0B4742)
    static let tealSoft = Color(hex: 0xE6F4F1)
    static let tealBorder = Color(hex: 0xBCE3DC)
    static let terra = Color(hex: 0xE06D38)
    static let terraSoft = Color(hex: 0xFDF0E6)
    static let terraBorder = Color(hex: 0xF4D2BA)
    static let pinkSoft = Color(hex: 0xFAF0F3)
    static let pinkBorder = Color(hex: 0xF4D0DC)
    static let text = Color(hex: 0x163835)
    static let muted = Color(hex: 0x556B68)
    static let subtle = Color(hex: 0x7E908D)
    static let border = Color(hex: 0xE8E2D8)
    static let borderSoft = Color(hex: 0xE2DACF)
    static let cream = Color(hex: 0xF5EADF)
    static let bearFur = Color(hex: 0xC4956A)
    static let bearInner = Color(hex: 0xE7C9A4)
    static let muzzle = Color(hex: 0xF6E6D0)
    static let ink = Color(hex: 0x3E2C24)
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
    if UIFont(name: weight.name, size: size) != nil {
        return .custom(weight.name, size: size)
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
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.92 : 1)
            .animation(.spring(duration: 0.18), value: configuration.isPressed)
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
            .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
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
}
