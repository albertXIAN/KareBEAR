import SwiftUI

enum StoryGear: String {
    case breath
    case helper
    case gown
    case measure
    case thermometer
    case stethoscope
    case cuff
    case vitals
    case iv
    case mask
    case ask

    var symbol: String {
        switch self {
        case .breath: "wind"
        case .helper: "person.2.fill"
        case .gown: "tshirt.fill"
        case .measure: "ruler.fill"
        case .thermometer: "thermometer.medium"
        case .stethoscope: "stethoscope"
        case .cuff: "arrow.left.and.right"
        case .vitals: "list.clipboard.fill"
        case .iv: "bag.fill"
        case .mask: "facemask.fill"
        case .ask: "bubble.left.and.heart.fill"
        }
    }

    var label: String {
        switch self {
        case .breath: "Breath circle"
        case .helper: "Helper in scrubs"
        case .gown: "Hospital gown"
        case .measure: "Ruler"
        case .thermometer: "Thermometer"
        case .stethoscope: "Stethoscope"
        case .cuff: "Blood pressure cuff"
        case .vitals: "Vitals list"
        case .iv: "IV bag"
        case .mask: "Sleepy-air mask"
        case .ask: "A question"
        }
    }

    func prompt(bear: String) -> String {
        switch self {
        case .breath: "Tap the circle and breathe with \(bear)."
        case .helper: "Tap the helper so they stand with \(bear)."
        case .gown: "Tap the gown to put it on \(bear)."
        case .measure: "Tap the ruler so \(bear) can stand tall."
        case .thermometer: "Tap the thermometer. Wait for the beep."
        case .stethoscope: "Tap the stethoscope so it can listen."
        case .cuff: "Tap the cuff. It gives \(bear)'s arm a hug, then lets go."
        case .vitals: "Tap the list to count \(bear)'s body checks."
        case .iv: "Tap the bag so it can hang beside \(bear)."
        case .mask: "Tap the mask so \(bear) can practice slow breaths."
        case .ask: "Tap the question. It is always okay to ask."
        }
    }

    func doneLine(bear: String) -> String {
        switch self {
        case .breath: "Nice breathing. You can do that any time."
        case .helper: "A helper in scrubs is here with \(bear)."
        case .gown: "The gown is on. Clothes wait in a bag."
        case .measure: "Feet flat. The numbers are not a test."
        case .thermometer: "Beep. Finished. That checks how warm the body is."
        case .stethoscope: "Thump-thump. That is a heart saying hello."
        case .cuff: "Squeeze, hug, then let go. The cuff is done."
        case .vitals: "Warmth, heart, breathing, blood pressure. Four hellos."
        case .iv: "The bag hangs up high. The straw stays until a helper says so."
        case .mask: "Slow breath in. Slow breath out, like fog on a window."
        case .ask: "“What is that?” and “Can I hold your hand?” are welcome."
        }
    }
}

struct EquipmentStage: View {
    let gear: StoryGear
    let bear: String
    let size: CGFloat
    let applied: Bool
    var onApply: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            EquipmentOnBear(gear: gear, size: size, applied: applied)
            if !applied {
                Button(action: onApply) {
                    HStack(spacing: 10) {
                        Image(systemName: gear.symbol)
                            .font(.system(size: 22, weight: .bold))
                        Text(gear.label)
                            .font(jakarta(16, .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .frame(height: 52)
                    .background(Theme.terra, in: Capsule())
                    .shadow(color: Theme.terra.opacity(0.35), radius: 8, y: 3)
                }
                .buttonStyle(KidButtonStyle())
                .accessibilityLabel(gear.prompt(bear: bear))
                .padding(.bottom, 8)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct EquipmentOnBear: View {
    let gear: StoryGear
    let size: CGFloat
    let applied: Bool
    @State private var hug = false
    @State private var pulse = false

    var body: some View {
        ZStack {
            placedItem
        }
        .frame(width: size, height: size)
        .onChange(of: applied) { _, now in
            guard now else { return }
            withAnimation(.spring(duration: 0.45)) {
                hug = gear == .cuff
                pulse = true
            }
            if gear == .cuff {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) {
                    withAnimation(.spring(duration: 0.4)) { hug = false }
                }
            }
        }
        .onAppear {
            if applied {
                pulse = true
                hug = false
            }
        }
        .accessibilityHidden(true)
    }

    @ViewBuilder
    private var placedItem: some View {
        let mark = Image(systemName: gear.symbol)
            .font(.system(size: size * 0.16, weight: .bold))
            .foregroundStyle(Theme.teal)
            .padding(size * 0.035)
            .background(Theme.tealSoft, in: Circle())
            .overlay(Circle().stroke(Color.white, lineWidth: 2))
            .scaleEffect(applied ? (hug ? 1.18 : 1) : 0.2)
            .opacity(applied ? 1 : 0)
            .animation(.spring(duration: 0.5), value: applied)

        switch gear {
        case .breath:
            Circle()
                .stroke(Theme.teal.opacity(applied ? 0.7 : 0.2), lineWidth: 4)
                .frame(width: size * (pulse ? 0.78 : 0.55))
                .animation(applied ? .easeInOut(duration: 1.4).repeatForever(autoreverses: true) : .default, value: pulse)
        case .gown:
            mark.offset(y: size * 0.18)
        case .cuff:
            Capsule()
                .fill(Theme.terra.opacity(applied ? 0.9 : 0))
                .frame(width: size * (hug ? 0.34 : 0.28), height: size * 0.12)
                .overlay(
                    Image(systemName: "heart.fill")
                        .font(.system(size: size * 0.06, weight: .bold))
                        .foregroundStyle(.white)
                        .opacity(applied ? 1 : 0)
                )
                .offset(x: -size * 0.22, y: size * 0.08)
                .scaleEffect(x: hug ? 1.12 : 1)
        case .stethoscope:
            mark.offset(y: size * 0.12)
        case .thermometer:
            mark.offset(x: size * 0.16, y: -size * 0.18)
        case .mask:
            mark.offset(y: -size * 0.04)
        case .iv:
            mark.offset(x: size * 0.32, y: -size * 0.08)
        case .helper:
            mark.offset(x: size * 0.3, y: size * 0.16)
        case .measure:
            mark.offset(x: -size * 0.3, y: size * 0.04)
        case .vitals:
            mark.offset(x: size * 0.28, y: size * 0.2)
        case .ask:
            mark.offset(x: size * 0.22, y: -size * 0.22)
        }
    }
}
