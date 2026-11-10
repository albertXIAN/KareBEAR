import SwiftUI

enum BearMood: Int {
    case sick = 0
    case tired = 1
    case steady = 2
    case bright = 3

    func title(called name: String) -> String {
        switch self {
        case .bright: "\(name) feels bright"
        case .steady: "\(name) feels steady"
        case .tired: "\(name) is getting tired"
        case .sick: "\(name) is feeling sick"
        }
    }

    func detail(called name: String) -> String {
        switch self {
        case .bright: "Care steps are helping. \(name) can bounce."
        case .steady: "\(name) is okay. The next care step keeps it that way."
        case .tired: "A care step is waiting. \(name) needs help soon."
        case .sick: "A missed care step took stars away. Help \(name) feel better."
        }
    }

    var color: Color {
        switch self {
        case .bright: Color(hex: 0x1B8A4A)
        case .steady: Theme.teal
        case .tired: Color(hex: 0xC47B12)
        case .sick: Color(hex: 0xC4483A)
        }
    }

    var soft: Color {
        switch self {
        case .bright: Color(hex: 0xE7F6EC)
        case .steady: Theme.tealSoft
        case .tired: Color(hex: 0xFBF3E0)
        case .sick: Color(hex: 0xFDECEA)
        }
    }
}

struct BearBadge: View {
    var size: CGFloat = 112
    var mood: BearMood = .bright
    var showsStatus: Bool = false
    var speaking: Bool = false
    /// Time of the latest spoken word, used to open the mouth on each word.
    var speechMark: TimeInterval = 0
    @Environment(CareStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            Circle().fill(showsStatus ? mood.soft : Theme.cream)
            TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: reduceMotion && !speaking)) { context in
                bearImage(time: context.date.timeIntervalSinceReferenceDate)
            }
        }
        .frame(width: size, height: size)
        .overlay(Circle().stroke(showsStatus ? mood.color : Color.white, lineWidth: max(3, size * 0.045)))
        .shadow(color: showsStatus ? mood.color.opacity(0.18) : .black.opacity(0.05), radius: 6, y: 2)
        .accessibilityLabel(speaking ? "\(mood.title(called: store.companionName)). \(store.companionName) is speaking." : mood.title(called: store.companionName))
    }

    private func bearImage(time: TimeInterval) -> some View {
        let wave = sin(time * (mood == .sick ? 9 : (mood == .bright ? 2.6 : 1.4)))
        let bob: CGFloat = mood == .bright ? CGFloat(abs(sin(time * 2.6))) : 0
        let breathe = CGFloat(sin(time * 1.8))
        let tilt: Double = switch mood {
        case .bright: wave * 3
        case .steady: wave * 2
        case .tired: 7
        case .sick: wave * 2.4
        }
        let drop: CGFloat = mood == .tired ? size * 0.035 : 0
        let side = size * 0.84
        let sinceWord = max(0, time - speechMark)
        let pop = speaking ? max(0, 1 - sinceWord / 0.2) : 0
        let chatter = speaking ? abs(sin(time * (reduceMotion ? 5.5 : 13))) : 0
        let open = min(1, chatter * (reduceMotion ? 0.45 : 0.82) + pop * 0.65)

        return ZStack {
            Image("KareSit")
                .resizable()
                .scaledToFit()
                .frame(width: side, height: side)
            if speaking {
                TalkingMouth(side: side, open: open)
                    .offset(x: side * 0.020, y: side * -0.056)
            }
        }
        .frame(width: side, height: side)
        .scaleEffect(x: 1 + breathe * 0.02, y: 1 + breathe * 0.03 + bob * 0.04)
        .offset(y: drop - bob * size * 0.045)
        .rotationEffect(.degrees(tilt))
    }
}

/// Covers the drawn mouth and opens a lip shape while Kare is speaking.
private struct TalkingMouth: View {
    var side: CGFloat
    var open: CGFloat

    private var cream: Color { Color(red: 240 / 255, green: 189 / 255, blue: 135 / 255) }
    private var lip: Color { Color(red: 0.36, green: 0.16, blue: 0.05) }
    private var inside: Color { Color(red: 0.62, green: 0.24, blue: 0.24) }
    private var tongue: Color { Color(red: 0.95, green: 0.55, blue: 0.58) }

    var body: some View {
        let width = side * 0.17
        let height = side * (0.045 + 0.085 * open)
        ZStack {
            Ellipse()
                .fill(cream)
                .frame(width: width * 1.35, height: side * 0.062)
            BearMouth(open: open)
                .fill(inside)
                .frame(width: width, height: height)
            Ellipse()
                .fill(tongue)
                .frame(width: width * 0.38, height: height * 0.34)
                .offset(y: height * 0.22)
                .opacity(open > 0.42 ? 1 : 0)
            BearMouth(open: open)
                .stroke(lip, style: StrokeStyle(lineWidth: max(1.4, side * 0.014), lineCap: .round, lineJoin: .round))
                .frame(width: width, height: height)
        }
        .frame(width: width * 1.4, height: side * 0.16)
        .accessibilityHidden(true)
    }
}

private struct BearMouth: Shape {
    var open: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let smile = rect.height * (0.08 + 0.15 * open)
        let drop = rect.height * (0.28 + 0.72 * open)
        path.move(to: CGPoint(x: rect.minX + rect.width * 0.06, y: rect.midY))
        path.addQuadCurve(
            to: CGPoint(x: rect.maxX - rect.width * 0.06, y: rect.midY),
            control: CGPoint(x: rect.midX, y: rect.midY - smile)
        )
        path.addQuadCurve(
            to: CGPoint(x: rect.minX + rect.width * 0.06, y: rect.midY),
            control: CGPoint(x: rect.midX, y: rect.midY + drop)
        )
        path.closeSubpath()
        return path
    }
}

struct EmmaAvatar: View {
    var size: CGFloat = 36

    var body: some View {
        ZStack {
            Circle().fill(Color(hex: 0xE7B89A))
            Circle()
                .fill(Color(hex: 0x6B4226))
                .frame(width: size * 0.96, height: size * 0.96)
                .offset(y: -size * 0.06)
            Circle()
                .fill(Color(hex: 0xF6D3C2))
                .frame(width: size * 0.7, height: size * 0.6)
                .offset(y: size * 0.08)
            Capsule()
                .fill(Theme.teal)
                .frame(width: size * 0.9, height: size * 0.34)
                .offset(y: size * 0.4)
            HStack(spacing: size * 0.16) {
                Circle().frame(width: size * 0.08, height: size * 0.09)
                Circle().frame(width: size * 0.08, height: size * 0.09)
            }
            .foregroundStyle(Theme.ink)
            .offset(y: size * 0.02)
            Capsule()
                .fill(Color(hex: 0xE07A7A))
                .frame(width: size * 0.12, height: size * 0.05)
                .offset(y: size * 0.16)
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(Circle().stroke(Theme.borderSoft, lineWidth: 2))
        .accessibilityLabel("Profile photo")
    }
}
