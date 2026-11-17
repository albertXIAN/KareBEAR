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
        case .mask: "Anaesthesia mask"
        case .ask: "A question"
        }
    }

    func needQuestion(bear: String) -> String {
        switch self {
        case .breath: "\(bear) wants to practice calm breaths. What does \(bear) need?"
        case .helper: "\(bear) wants a helper to stand close. What does \(bear) need?"
        case .gown: "\(bear) is changing for care. What does \(bear) need?"
        case .measure: "Helpers want to check how tall \(bear) is. What does \(bear) need?"
        case .thermometer: "Helpers want to check how warm \(bear) is. What does \(bear) need?"
        case .stethoscope: "A helper wants to hear \(bear)'s heart. What does \(bear) need?"
        case .cuff: "A helper wants to check \(bear)'s blood pressure. What does \(bear) need?"
        case .vitals: "Helpers want to write down \(bear)'s body checks. What does \(bear) need?"
        case .iv: "\(bear) needs fluid or medicine through an IV. What does \(bear) need?"
        case .mask: "\(bear) will breathe medicine through a mask. What does \(bear) need?"
        case .ask: "Something looks new. What does \(bear) need?"
        }
    }

    var needChoices: [GearNeedChoice] {
        switch self {
        case .breath: options([.cuff, .breath, .iv])
        case .helper: options([.helper, .measure, .mask])
        case .gown: options([.thermometer, .stethoscope, .gown])
        case .measure: options([.mask, .measure, .thermometer])
        case .thermometer: options([.gown, .thermometer, .measure])
        case .stethoscope: options([.stethoscope, .vitals, .cuff])
        case .cuff: options([.gown, .mask, .cuff])
        case .vitals: options([.measure, .vitals, .mask])
        case .iv: options([.breath, .stethoscope, .iv])
        case .mask: options([.vitals, .measure, .mask])
        case .ask: options([.cuff, .ask, .iv])
        }
    }

    func doneLine(bear: String) -> String {
        switch self {
        case .breath: "Nice breathing. You can do that any time."
        case .helper: "A helper in scrubs is here with \(bear)."
        case .gown: "The gown is on. Clothes wait in a bag."
        case .measure: "Feet flat. The numbers are not a test."
        case .thermometer: "Beep. Finished. That checks how warm the body is."
        case .stethoscope: "Thump-thump. A stethoscope helps a nurse hear a heartbeat."
        case .cuff: "The cuff fills with air, then loosens. Tell the helper how it feels."
        case .vitals: "Temperature, heartbeat, breathing, and blood pressure help the team check your body."
        case .iv: "A nurse looks after the IV. Tell them if it hurts or feels uncomfortable."
        case .mask: "You practised a slow breath. The care team will explain how you get your medicine."
        case .ask: "“What is that?” and “Can I hold your hand?” are welcome."
        }
    }

    private func options(_ gears: [StoryGear]) -> [GearNeedChoice] {
        gears.map { item in
            GearNeedChoice(
                id: "\(rawValue)-\(item.rawValue)",
                label: item.label,
                symbol: item.symbol,
                isCorrect: item == self
            )
        }
    }
}

struct GearNeedChoice: Identifiable {
    let id: String
    let label: String
    let symbol: String
    let isCorrect: Bool
}

struct EquipmentStage: View {
    let gear: StoryGear
    let size: CGFloat
    let applied: Bool

    var body: some View {
        EquipmentOnBear(gear: gear, size: size, applied: applied)
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
