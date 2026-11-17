import SwiftUI

/// These four-part demonstrations match src/utils/storyAnimations.ts.
struct StoryAnimationStep {
    let title: String
    let caption: String
}

struct StoryAnimationScene: Identifiable {
    let id: String
    let title: String
    let steps: [StoryAnimationStep]

    func caption(at step: Int, bearName: String) -> String {
        let name = bearName.trimmingCharacters(in: .whitespacesAndNewlines)
        return steps[step].caption.replacingOccurrences(of: "{bear}", with: name.isEmpty ? "Kare" : name)
    }
}

enum StoryAnimationLibrary {
    static let scenes: [StoryAnimationScene] = [
        StoryAnimationScene(id: "cuff", title: "The blood pressure cuff", steps: [
            StoryAnimationStep(title: "Meet the cuff", caption: "The helper shows {bear} the cuff. The arm rests on a support."),
            StoryAnimationStep(title: "Wrap the upper arm", caption: "The helper wraps it around the upper arm, above the elbow."),
            StoryAnimationStep(title: "A short squeeze", caption: "It fills with air and feels tight. {bear} keeps the arm still."),
            StoryAnimationStep(title: "It loosens", caption: "The air comes out. {bear} can tell the helper how it feels."),
        ]),
        StoryAnimationScene(id: "iv", title: "The IV, tube and pole", steps: [
            StoryAnimationStep(title: "Meet the IV", caption: "This pole holds a bag of fluid or medicine."),
            StoryAnimationStep(title: "The nurse helps", caption: "A nurse places a tiny soft tube in a vein. It may pinch or sting."),
            StoryAnimationStep(title: "Keep it in place", caption: "A clear dressing holds it still. The nurse connects the tubing."),
            StoryAnimationStep(title: "Say how it feels", caption: "Tell the nurse if the IV hurts or feels uncomfortable."),
        ]),
        StoryAnimationScene(id: "mask", title: "Medicine through a mask", steps: [
            StoryAnimationStep(title: "Meet the mask", caption: "Some children get medicine through a mask. The team explains the plan."),
            StoryAnimationStep(title: "Nose and mouth", caption: "The helper holds the mask over {bear}’s nose and mouth."),
            StoryAnimationStep(title: "Breathe gently", caption: "{bear} breathes medicine that helps with sleep during the operation."),
            StoryAnimationStep(title: "The team stays", caption: "The care team watches over {bear} while the medicine works."),
        ]),
        StoryAnimationScene(id: "medicine", title: "Liquid medicine with a grown-up", steps: [
            StoryAnimationStep(title: "Check the plan", caption: "A grown-up checks the medicine plan and bottle label."),
            StoryAnimationStep(title: "Measure with care", caption: "They measure with an oral syringe. This syringe has no needle."),
            StoryAnimationStep(title: "A little at a time", caption: "{bear} sits up. The grown-up gives small amounts inside the cheek."),
            StoryAnimationStep(title: "Pause to swallow", caption: "There is time to swallow. {bear} can ask for help."),
        ]),
        StoryAnimationScene(id: "thermometer", title: "A temperature check", steps: [
            StoryAnimationStep(title: "Meet the thermometer", caption: "The helper shows {bear} a forehead thermometer."),
            StoryAnimationStep(title: "Come close", caption: "The helper brings it near the forehead."),
            StoryAnimationStep(title: "Hold still", caption: "{bear} holds still while the thermometer checks the temperature."),
            StoryAnimationStep(title: "All done", caption: "The helper takes it away. The check is finished."),
        ]),
        StoryAnimationScene(id: "stethoscope", title: "Listen to a heartbeat", steps: [
            StoryAnimationStep(title: "Meet the stethoscope", caption: "The helper puts the listening ends in their ears."),
            StoryAnimationStep(title: "On the chest", caption: "The round end rests on {bear}’s chest. It may feel cool."),
            StoryAnimationStep(title: "Listen together", caption: "The helper listens to the heart and breathing."),
            StoryAnimationStep(title: "Ask a question", caption: "The helper lifts it away. {bear} can ask what they heard."),
        ]),
        StoryAnimationScene(id: "measure", title: "Height and weight", steps: [
            StoryAnimationStep(title: "Meet the scale", caption: "The helper shows {bear} where to stand."),
            StoryAnimationStep(title: "Check weight", caption: "{bear} stands on the scale to check weight."),
            StoryAnimationStep(title: "Check height", caption: "A height ruler shows how tall {bear} is."),
            StoryAnimationStep(title: "Write it down", caption: "The helper writes the numbers down to help plan care."),
        ]),
        StoryAnimationScene(id: "gown", title: "Getting changed", steps: [
            StoryAnimationStep(title: "Meet the gown", caption: "A helper brings a hospital gown."),
            StoryAnimationStep(title: "A private space", caption: "{bear} changes behind a screen, with help if needed."),
            StoryAnimationStep(title: "Ready in a gown", caption: "The gown makes it easier for the care team to help."),
            StoryAnimationStep(title: "Clothes stay together", caption: "The clothes wait in a bag with {bear}’s name."),
        ]),
        StoryAnimationScene(id: "breathing", title: "One calm breath", steps: [
            StoryAnimationStep(title: "Get comfortable", caption: "{bear} sits comfortably. You can try a gentle breath too."),
            StoryAnimationStep(title: "Breathe in", caption: "A slow breath in. The circle grows."),
            StoryAnimationStep(title: "Breathe out", caption: "A slow breath out. The circle gets smaller."),
            StoryAnimationStep(title: "Choose what helps", caption: "You can stop, try again, or ask for a hand to hold."),
        ]),
        StoryAnimationScene(id: "helper", title: "Meet your helper", steps: [
            StoryAnimationStep(title: "Say hello", caption: "A hospital helper comes to meet {bear}."),
            StoryAnimationStep(title: "Look for a badge", caption: "Their badge shows their name."),
            StoryAnimationStep(title: "Ask about their job", caption: "{bear} asks, “What do you do?”"),
            StoryAnimationStep(title: "Listen together", caption: "The helper explains. It is OK to ask more questions."),
        ]),
        StoryAnimationScene(id: "vitals", title: "Putting the checks together", steps: [
            StoryAnimationStep(title: "Temperature", caption: "A thermometer checks how warm the body is."),
            StoryAnimationStep(title: "Heart and breathing", caption: "The helper listens to {bear}’s heart and breathing."),
            StoryAnimationStep(title: "Blood pressure", caption: "The arm cuff checks blood pressure."),
            StoryAnimationStep(title: "Write down the checks", caption: "These checks help the team see how {bear} is doing."),
        ]),
        StoryAnimationScene(id: "ask", title: "Your questions matter", steps: [
            StoryAnimationStep(title: "Something new", caption: "{bear} spots a new piece of equipment."),
            StoryAnimationStep(title: "Ask about it", caption: "“What does this do?” {bear} asks."),
            StoryAnimationStep(title: "See it first", caption: "The helper shows it and explains."),
            StoryAnimationStep(title: "Ask for support", caption: "{bear} can ask for a hand to hold."),
        ]),
        StoryAnimationScene(id: "tell", title: "Tell a grown-up how it feels", steps: [
            StoryAnimationStep(title: "Notice how it feels", caption: "{bear} notices that swallowing hurts."),
            StoryAnimationStep(title: "Say what is wrong", caption: "“It hurts when I swallow,” {bear} tells the grown-up."),
            StoryAnimationStep(title: "Point if it helps", caption: "{bear} can point to the throat to show where it hurts."),
            StoryAnimationStep(title: "Get help together", caption: "The grown-up listens and helps with the next step."),
        ]),
        StoryAnimationScene(id: "rest", title: "A quiet afternoon", steps: [
            StoryAnimationStep(title: "Time to rest", caption: "{bear}’s grown-up helps choose a quiet activity."),
            StoryAnimationStep(title: "Get comfortable", caption: "A pillow makes a cosy place to sit."),
            StoryAnimationStep(title: "Pick something quiet", caption: "{bear} draws while resting on the sofa."),
            StoryAnimationStep(title: "Take a break", caption: "{bear} can pause and rest whenever needed."),
        ]),
        StoryAnimationScene(id: "sip", title: "Little sips", steps: [
            StoryAnimationStep(title: "Check the plan", caption: "A grown-up checks that {bear} can have a drink now."),
            StoryAnimationStep(title: "Lift the cup", caption: "{bear} brings the cup up slowly."),
            StoryAnimationStep(title: "Take a little sip", caption: "A little sip, just as the care plan says."),
            StoryAnimationStep(title: "Pause and tell", caption: "The cup goes down. Tell a grown-up if drinking hurts."),
        ]),
        StoryAnimationScene(id: "snack", title: "Choose a snack together", steps: [
            StoryAnimationStep(title: "Check the food plan", caption: "A grown-up checks which foods {bear} can have."),
            StoryAnimationStep(title: "Find a snack that fits", caption: "This story’s plan says soft, cool food."),
            StoryAnimationStep(title: "A little taste", caption: "{bear} tries a little smooth, chilled yogurt."),
            StoryAnimationStep(title: "Take your time", caption: "{bear} pauses and tells the grown-up how it feels."),
        ]),
    ]

    static func scene(_ id: String) -> StoryAnimationScene? { scenes.first { $0.id == id } }

    // Authored page IDs only. Parent instructions never select a demo by keyword.
    static func scene(forPageID id: String) -> StoryAnimationScene? {
        let mapping = [
            "prep-welcome": "breathing", "prep-scrubs": "helper", "prep-gown": "gown",
            "prep-measure": "measure", "prep-thermometer": "thermometer",
            "prep-stethoscope": "stethoscope", "prep-cuff": "cuff", "prep-vitals": "vitals",
            "prep-iv": "iv", "prep-mask": "mask", "prep-ready": "ask",
            "rest": "rest", "medicine": "medicine", "sips": "sip", "treat": "snack",
            "speak": "tell", "tour-practice": "rest"
        ]
        return mapping[id].flatMap { scene($0) }
    }
}

struct StoryAnimationPlayer: View {
    let scene: StoryAnimationScene
    let bearName: String
    var pauseToken = 0
    var narrate: (String) -> Void
    var stopNarration: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var step = 0
    @State private var elapsed: TimeInterval = 0
    @State private var startedAt: Date?
    @State private var playing = false
    @State private var soundOn = false
    @State private var playbackTask: Task<Void, Never>?
    private let stepDuration: TimeInterval = 6

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Watch with \(bearName)")
                    .font(jakarta(18, .extraBold))
                    .foregroundStyle(Theme.teal)
                Spacer()
                Text("\(step + 1) / \(scene.steps.count)")
                    .font(jakarta(14, .bold))
                    .foregroundStyle(Theme.muted)
            }
            TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: !playing || reduceMotion)) { timeline in
                let progress = reduceMotion ? 1 : min(1, currentElapsed(at: timeline.date) / stepDuration)
                CareStoryIllustration(kind: scene.id, step: step, progress: progress, bearName: bearName)
            }
            .aspectRatio(560.0 / 360.0, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("\(scene.steps[step].title). \(scene.caption(at: step, bearName: bearName))")

            VStack(alignment: .leading, spacing: 5) {
                Text(scene.steps[step].title)
                    .font(jakarta(22, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text(scene.caption(at: step, bearName: bearName))
                    .font(jakarta(20, .semibold))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .accessibilityElement(children: .combine)

            HStack(spacing: 8) {
                control("Previous", symbol: "backward.end.fill", disabled: step == 0) { move(to: step - 1) }
                if reduceMotion {
                    Text("Use the arrows")
                        .font(jakarta(14, .bold))
                        .foregroundStyle(Theme.muted)
                        .frame(maxWidth: .infinity)
                } else {
                    control(playing ? "Pause" : (step == scene.steps.count - 1 && elapsed >= stepDuration ? "Replay" : "Play"), symbol: playing ? "pause.fill" : "play.fill", prominent: true) {
                        playing ? pause() : play()
                    }
                }
                control("Next", symbol: "forward.end.fill", disabled: step == scene.steps.count - 1) { move(to: step + 1) }
            }
            HStack(spacing: 12) {
                Button {
                    pause()
                    soundOn.toggle()
                    if soundOn { speakStep() }
                } label: {
                    Label(soundOn ? "Sound off" : "Listen", systemImage: soundOn ? "speaker.slash.fill" : "speaker.wave.2.fill")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(minHeight: 44)
                }
                .buttonStyle(KidButtonStyle())
                Spacer()
                Button {
                    move(to: 0)
                    if !reduceMotion { play() }
                } label: {
                    Label("Replay", systemImage: "arrow.counterclockwise")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(minHeight: 44)
                }
                .buttonStyle(KidButtonStyle())
            }
        }
        .padding(16)
        .card(fill: .white, border: Theme.tealBorder)
        .onChange(of: pauseToken) { _, _ in
            soundOn = false
            pause(stopSound: false)
        }
        .onChange(of: reduceMotion) { _, _ in pause() }
        .onChange(of: scenePhase) { _, state in if state != .active { pause() } }
        .onDisappear { pause() }
    }

    private func control(_ title: String, symbol: String, disabled: Bool = false, prominent: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: symbol).font(.system(size: 18, weight: .bold))
                Text(title).font(jakarta(13, .bold))
            }
            .foregroundStyle(prominent ? .white : Theme.teal)
            .frame(maxWidth: .infinity, minHeight: 60)
            .background(prominent ? Theme.teal : Theme.tealSoft, in: RoundedRectangle(cornerRadius: 14))
            .opacity(disabled ? 0.4 : 1)
        }
        .buttonStyle(KidButtonStyle())
        .disabled(disabled)
        .accessibilityLabel(title)
    }

    private func currentElapsed(at date: Date = Date()) -> TimeInterval {
        elapsed + (startedAt.map { max(0, date.timeIntervalSince($0)) } ?? 0)
    }

    private func pause(stopSound: Bool = true) {
        elapsed = min(stepDuration, currentElapsed())
        startedAt = nil
        playing = false
        playbackTask?.cancel()
        playbackTask = nil
        if stopSound { stopNarration() }
    }

    private func move(to next: Int) {
        pause()
        step = min(max(0, next), scene.steps.count - 1)
        elapsed = stepDuration
        if soundOn { speakStep() }
    }

    private func speakStep() {
        narrate("\(scene.steps[step].title). \(scene.caption(at: step, bearName: bearName))")
    }

    private func play() {
        guard !reduceMotion else { return }
        playbackTask?.cancel()
        stopNarration()
        soundOn = false
        if elapsed >= stepDuration {
            if step == scene.steps.count - 1 { step = 0 }
            elapsed = 0
        }
        playing = true
        startedAt = Date()
        playbackTask = Task { @MainActor in
            while !Task.isCancelled && playing {
                let remaining = max(0.01, stepDuration - currentElapsed())
                try? await Task.sleep(nanoseconds: UInt64(remaining * 1_000_000_000))
                guard !Task.isCancelled && playing else { return }
                if step + 1 < scene.steps.count {
                    step += 1
                    elapsed = 0
                    startedAt = Date()
                } else {
                    elapsed = stepDuration
                    startedAt = nil
                    playing = false
                    playbackTask = nil
                    return
                }
            }
        }
    }
}

/// All stage artwork is drawn as separate body and equipment parts, so the action
/// moves the helper, arm, mask, cuff, tubing and syringe instead of wobbling a sticker.
struct CareStoryIllustration: View {
    let kind: String
    let step: Int
    let progress: Double
    let bearName: String

    var body: some View {
        Canvas { context, size in
            var scaled = context
            scaled.scaleBy(x: size.width / 560, y: size.height / 360)
            var painter = CareScenePainter(context: scaled, kind: kind, step: step, progress: progress, bearName: bearName)
            painter.draw()
        }
    }
}

private struct CareScenePainter {
    var context: GraphicsContext
    let kind: String
    let step: Int
    let progress: Double
    let bearName: String
    private let fur = Color(hex: 0xB9773E)
    private let furLight = Color(hex: 0xCE9355)
    private let muzzle = Color(hex: 0xF4D29D)
    private let ink = Color(hex: 0x754A2D)
    private let teal = Color(hex: 0x187F78)
    private let skin = Color(hex: 0xDFA87B)
    private let pale = Color(hex: 0xE2F3EF)
    private var p: Double { progress * progress * (3 - 2 * progress) }

    mutating func draw() {
        rounded(0, 0, 560, 360, 0, Color(hex: 0xF4F5E9))
        rounded(18, 18, 524, 282, 24, Color(hex: 0xE8F4EF))
        rounded(40, 40, 102, 75, 15, Color.white.opacity(0.7))
        line([CGPoint(x: 91, y: 42), CGPoint(x: 91, y: 113)], color: pale, width: 5)
        line([CGPoint(x: 42, y: 78), CGPoint(x: 140, y: 78)], color: pale, width: 5)
        ellipse(145, 310, 286, 28, Color(hex: 0xD7DED0))
        // A visible seat and arm support keep the bear upright and the cuff arm resting.
        if kind != "measure" {
            rounded(196, 255, 190, 62, 22, Color(hex: 0xC6DDD5))
            rounded(175, 260, 70, 16, 8, Color(hex: 0xA8C7BC))
            line([CGPoint(x: 218, y: 308), CGPoint(x: 210, y: 330)], color: teal, width: 9)
            line([CGPoint(x: 365, y: 308), CGPoint(x: 372, y: 330)], color: teal, width: 9)
        }

        if kind == "iv" { ivPole() }
        if kind == "measure" { measuringTools() }
        if kind == "rest" { rounded(188, 221, 194, 69, 20, Color(hex: 0xE5BD82)) }
        if kind == "breathing" {
            let expansion = step == 1 ? p : (step == 2 ? 1 - p : 0)
            let radius = 100 + expansion * 28
            ellipse(290 - radius, 196 - radius, radius * 2, radius * 2, Color(hex: 0xBCE3DC).opacity(0.35))
        }
        bear()
        switch kind {
        case "cuff": cuff()
        case "iv": ivConnection()
        case "mask": mask()
        case "medicine": medicine()
        case "thermometer": thermometer()
        case "stethoscope": stethoscope()
        case "gown": gown()
        case "measure": if step == 3 { clipboard(x: 90, y: 188) }
        case "helper", "ask": meetHelper()
        case "tell": tellGrownUp()
        case "vitals":
            if step == 0 { thermometer() }
            else if step == 1 { stethoscope(forceContact: true) }
            else if step == 2 { cuff(forceWrapped: true) }
            else { clipboard(x: 95, y: 196); helperHand(x: 130, y: 227) }
        case "rest": quietActivity()
        case "sip": sip()
        case "snack": snack()
        default: if step == 3 { helperHand(x: 206, y: 268) }
        }
    }

    private mutating func bear() {
        let breath = kind == "mask" && step >= 2 ? sin(progress * .pi * 2) * 2 : 0
        // Bent legs, paw pads and independently drawn upper/lower arms.
        if kind == "measure" {
            rounded(247, 274, 34, 44, 14, fur, outline: ink)
            rounded(302, 274, 34, 44, 14, fur, outline: ink)
            ellipse(238, 300, 48, 20, fur, outline: ink)
            ellipse(299, 300, 48, 20, fur, outline: ink)
        } else {
            ellipse(215, 274, 68, 48, fur, outline: ink)
            ellipse(302, 274, 68, 48, fur, outline: ink)
            ellipse(227, 287, 42, 28, muzzle)
            ellipse(314, 287, 42, 28, muzzle)
            for x in [230.0, 245, 260, 317, 332, 347] { ellipse(x, 280, 8, 9, muzzle) }
        }
        ellipse(227 - breath / 2, 185, 126 + breath, 116, fur, outline: ink)
        rounded(244, 217, 92, 80, 24, teal)
        line([CGPoint(x: 249, y: 204), CGPoint(x: 252, y: 242)], color: teal, width: 15)
        line([CGPoint(x: 326, y: 204), CGPoint(x: 328, y: 242)], color: teal, width: 15)
        ellipse(247, 227, 10, 10, Color(hex: 0xF2D17E))
        ellipse(323, 227, 10, 10, Color(hex: 0xF2D17E))
        rounded(272, 247, 37, 27, 7, Color(hex: 0x146A65))
        heart(x: 291, y: 253, scale: 0.6)
        limb(from: CGPoint(x: 238, y: 211), joint: CGPoint(x: 215, y: 243), to: CGPoint(x: 205, y: 265))
        limb(from: CGPoint(x: 344, y: 211), joint: CGPoint(x: 362, y: 243), to: CGPoint(x: 366, y: 267))
        // Round ears, a soft forehead tuft, and a tan muzzle echo KareSit.
        ellipse(222, 66, 46, 48, fur, outline: ink)
        ellipse(318, 66, 46, 48, fur, outline: ink)
        ellipse(232, 77, 26, 27, muzzle)
        ellipse(328, 77, 26, 27, muzzle)
        ellipse(221, 76, 142, 137, furLight, outline: ink)
        var tuft = Path()
        tuft.move(to: CGPoint(x: 263, y: 86)); tuft.addLine(to: CGPoint(x: 270, y: 73))
        tuft.addLine(to: CGPoint(x: 281, y: 82)); tuft.addLine(to: CGPoint(x: 289, y: 69))
        tuft.addLine(to: CGPoint(x: 299, y: 81)); tuft.addLine(to: CGPoint(x: 309, y: 77))
        context.stroke(tuft, with: .color(ink), style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
        ellipse(254, 141, 73, 52, muzzle)
        if kind == "mask" && step >= 2 {
            curve(from: CGPoint(x: 258, y: 132), control: CGPoint(x: 265, y: 138), to: CGPoint(x: 272, y: 132), color: ink, width: 4)
            curve(from: CGPoint(x: 308, y: 132), control: CGPoint(x: 315, y: 138), to: CGPoint(x: 322, y: 132), color: ink, width: 4)
        } else {
            ellipse(259, 124, 12, 17, ink)
            ellipse(310, 124, 12, 17, ink)
            ellipse(261, 126, 4, 5, .white)
            ellipse(312, 126, 4, 5, .white)
        }
        ellipse(279, 151, 23, 14, ink)
        line([CGPoint(x: 291, y: 163), CGPoint(x: 291, y: 172)], color: ink, width: 3)
        if (kind == "medicine" || kind == "sip" || kind == "snack") && step == 2 {
            ellipse(280, 172, 20, 11, ink)
        } else {
            curve(from: CGPoint(x: 278, y: 172), control: CGPoint(x: 290, y: 186), to: CGPoint(x: 303, y: 172), color: ink, width: 3)
        }
        ellipse(241, 151, 18, 11, Color(hex: 0xD98367).opacity(0.55))
        ellipse(325, 151, 18, 11, Color(hex: 0xD98367).opacity(0.55))
    }

    private mutating func limb(from: CGPoint, joint: CGPoint, to: CGPoint) {
        line([from, joint, to], color: ink, width: 32)
        line([from, joint, to], color: fur, width: 27)
        ellipse(to.x - 18, to.y - 15, 36, 32, fur, outline: ink)
        line([CGPoint(x: joint.x - 8, y: joint.y), CGPoint(x: joint.x + 6, y: joint.y + 5)], color: ink.opacity(0.4), width: 2)
    }

    private mutating func cuff(forceWrapped: Bool = false) {
        let t = forceWrapped ? 1 : (step == 0 ? 0 : (step == 1 ? min(1, p / 0.4) : 1))
        let wrap = forceWrapped ? 1 : (step == 0 ? 0 : (step == 1 ? max(0, (p - 0.4) / 0.6) : 1))
        let x = mix(113, 232, t), y = mix(218, 219, t)
        let inflate = forceWrapped ? p : (step == 2 ? p : (step == 3 ? 1 - p : 0))
        helperHand(x: x - 35, y: y + 24)
        var band = context
        band.translateBy(x: x, y: y)
        band.rotate(by: .degrees(31 * t))
        let width = 40 + inflate * 6
        let rect = CGRect(x: -width / 2, y: -13, width: width, height: 26)
        let back = Path(roundedRect: rect, cornerSize: CGSize(width: 6, height: 6))
        band.fill(back, with: .color(Color(hex: 0x0F6660)))
        band.stroke(back, with: .color(Color(hex: 0x0D5E59)), lineWidth: 2)
        if t > 0.95 && wrap < 1 {
            // Arm in front of the rear half, before the front strap closes across it.
            band.fill(Path(roundedRect: CGRect(x: -12, y: -17, width: 24, height: 34), cornerSize: CGSize(width: 7, height: 7)), with: .color(fur))
        }
        var flap = Path()
        flap.move(to: CGPoint(x: -width / 2, y: -13))
        flap.addLine(to: CGPoint(x: mix(-78, width / 2, wrap), y: mix(-24, -13, wrap)))
        flap.addLine(to: CGPoint(x: mix(-78, width / 2, wrap), y: mix(3, 13, wrap)))
        flap.addLine(to: CGPoint(x: -width / 2, y: 13))
        flap.closeSubpath()
        band.fill(flap, with: .color(teal))
        band.stroke(flap, with: .color(Color(hex: 0x0D5E59)), lineWidth: 2)
        if wrap > 0.85 {
            band.stroke(Path { path in path.move(to: CGPoint(x: width / 2 - 8, y: -10)); path.addLine(to: CGPoint(x: width / 2 - 8, y: 10)) }, with: .color(.white.opacity(0.6)), lineWidth: 3)
        }
        var hose = Path()
        hose.move(to: CGPoint(x: x - 15, y: y + 17))
        hose.addCurve(to: CGPoint(x: 128, y: 291), control1: CGPoint(x: 149, y: 253), control2: CGPoint(x: 160, y: 292))
        context.stroke(hose, with: .color(teal), style: StrokeStyle(lineWidth: 5, lineCap: .round))
        rounded(64, 281, 95, 49, 10, .white, outline: Color(hex: 0xA5C8C0))
        rounded(74, 289, 58, 29, 5, pale)
        line([CGPoint(x: 80, y: 306), CGPoint(x: 91, y: 306), CGPoint(x: 97, y: 296), CGPoint(x: 104, y: 313), CGPoint(x: 111, y: 303), CGPoint(x: 125, y: 303)], color: teal, width: 2)
        ellipse(140, 298, 9, 9, teal)
    }

    private mutating func ivPole() {
        line([CGPoint(x: 90, y: 56), CGPoint(x: 90, y: 309)], color: Color(hex: 0x739891), width: 7)
        line([CGPoint(x: 64, y: 60), CGPoint(x: 115, y: 60)], color: Color(hex: 0x739891), width: 6)
        line([CGPoint(x: 90, y: 307), CGPoint(x: 51, y: 325)], color: Color(hex: 0x739891), width: 6)
        line([CGPoint(x: 90, y: 307), CGPoint(x: 130, y: 325)], color: Color(hex: 0x739891), width: 6)
        ellipse(45, 322, 14, 12, ink); ellipse(124, 322, 14, 12, ink)
        line([CGPoint(x: 91, y: 60), CGPoint(x: 91, y: 83)], color: teal, width: 3)
        rounded(66, 82, 51, 76, 12, Color.white.opacity(0.85), outline: teal)
        rounded(72, 111, 39, 40, 7, Color(hex: 0xA4DCD5))
        rounded(78, 91, 27, 16, 3, .white)
        line([CGPoint(x: 84, y: 98), CGPoint(x: 101, y: 98)], color: teal, width: 2)
        rounded(85, 157, 12, 19, 4, .white, outline: teal)
    }

    private mutating func ivConnection() {
        if step == 1 { helperHand(x: 204, y: 252) }
        if step >= 1 {
            // The cannula is already in place beneath a dressing: no needle or insertion close-up.
            rounded(188, 250, 35, 26, 6, Color.white.opacity(0.8), outline: Color(hex: 0x96BBB2))
            rounded(200, 254, 9, 18, 3, Color(hex: 0x88CABF))
        }
        if step >= 2 {
            var tube = Path()
            tube.move(to: CGPoint(x: 91, y: 175))
            tube.addCurve(to: CGPoint(x: 204, y: 270), control1: CGPoint(x: 81, y: 264), control2: CGPoint(x: 141, y: 305))
            context.stroke(tube, with: .color(.white), style: StrokeStyle(lineWidth: 7, lineCap: .round))
            context.stroke(tube, with: .color(Color(hex: 0x66B6AF)), style: StrokeStyle(lineWidth: 3, lineCap: .round))
            let dropY = 159 + progress * 12
            ellipse(88, dropY, 6, 7, teal)
        }
        if step == 3 { helperHand(x: 161, y: 246); speechBubble("Tell the nurse", x: 344, y: 48) }
    }

    private mutating func mask() {
        let t = step == 0 ? p * 0.1 : (step == 1 ? p : 1)
        let x = mix(135, 291, t), y = mix(225, 163, t)
        helperHand(x: x - 33, y: y + 25)
        // The breathing hose stays connected to the care team's equipment.
        rounded(462, 244, 70, 82, 12, .white, outline: Color(hex: 0x8FAFA7))
        rounded(473, 255, 48, 28, 6, pale)
        line([CGPoint(x: 478, y: 271), CGPoint(x: 486, y: 271), CGPoint(x: 491, y: 262), CGPoint(x: 498, y: 275), CGPoint(x: 504, y: 268), CGPoint(x: 516, y: 268)], color: teal, width: 2)
        rounded(482, 296, 30, 6, 3, Color(hex: 0xBBD3CC))
        line([CGPoint(x: 476, y: 326), CGPoint(x: 476, y: 334)], color: Color(hex: 0x8FAFA7), width: 5)
        line([CGPoint(x: 520, y: 326), CGPoint(x: 520, y: 334)], color: Color(hex: 0x8FAFA7), width: 5)
        var hose = Path()
        hose.move(to: CGPoint(x: x + 27, y: y + 11))
        hose.addCurve(to: CGPoint(x: 462, y: 299), control1: CGPoint(x: x + 88, y: y + 32), control2: CGPoint(x: 417, y: 316))
        context.stroke(hose, with: .color(Color(hex: 0x6BA7A1)), style: StrokeStyle(lineWidth: 13, lineCap: .round))
        context.stroke(hose, with: .color(Color(hex: 0xC9E8E2)), style: StrokeStyle(lineWidth: 7, lineCap: .round))
        rounded(455, 291, 14, 16, 5, Color(hex: 0x99C8C3), outline: teal)
        let breathe = step >= 2 ? sin(progress * .pi * 2) * 1.5 : 0
        ellipse(x - 36 - breathe, y - 28 - breathe, 72 + breathe * 2, 57 + breathe * 2, Color(hex: 0xC3E7E4).opacity(0.72), outline: teal)
        ellipse(x - 27, y - 20, 54, 42, .white.opacity(0.25))
        rounded(x + 27, y + 2, 17, 16, 5, Color(hex: 0x99C8C3), outline: teal)
        if step == 3 { helperFace(x: 469, y: 128, small: true) }
    }

    private mutating func medicine() {
        bottle(x: 422, y: 264)
        if step == 0 {
            clipboard(x: 108, y: 182)
            helperHand(x: 145, y: 223)
        } else {
            let approach = step == 1 ? 0 : (step == 2 ? p : 1 - p)
            let x = mix(170, 285, approach), y = mix(233, 176, approach)
            helperHand(x: x - 57, y: y + 21)
            oralSyringe(tipX: x, y: y, fill: step == 1 ? mix(0.15, 0.65, p) : (step == 2 ? mix(0.65, 0.4, p) : 0.4))
            if step == 3 {
                let swell = sin(p * .pi)
                curve(from: CGPoint(x: 281, y: 201), control: CGPoint(x: 291, y: 205 + swell * 5), to: CGPoint(x: 301, y: 201), color: ink.opacity(0.6), width: 3)
            }
        }
    }

    private mutating func oralSyringe(tipX x: Double, y: Double, fill: Double) {
        // Rounded oral tip and a wide barrel. Deliberately no needle or dose numbers.
        rounded(x - 80, y - 10, 57, 20, 5, .white, outline: teal)
        let pistonX = x - 27 - 49 * fill
        rounded(pistonX, y - 6, 49 * fill, 12, 3, Color(hex: 0xE8B867))
        line([CGPoint(x: pistonX, y: y - 8), CGPoint(x: pistonX, y: y + 8)], color: teal, width: 3)
        rounded(x - 23, y - 4, 20, 8, 4, Color(hex: 0xE1F1ED), outline: teal)
        line([CGPoint(x: pistonX - 45, y: y), CGPoint(x: pistonX, y: y)], color: teal, width: 4)
        line([CGPoint(x: pistonX - 45, y: y - 13), CGPoint(x: pistonX - 45, y: y + 13)], color: teal, width: 5)
        line([CGPoint(x: x - 81, y: y - 15), CGPoint(x: x - 81, y: y + 15)], color: teal, width: 4)
        for dx in [35.0, 46, 57] { line([CGPoint(x: x - dx, y: y - 9), CGPoint(x: x - dx, y: y - 3)], color: teal, width: 2) }
    }

    private mutating func bottle(x: Double, y: Double) {
        rounded(x, y, 46, 58, 10, Color(hex: 0xD9AE78), outline: ink)
        rounded(x - 1, y - 9, 48, 15, 4, .white, outline: teal)
        rounded(x + 5, y + 15, 36, 25, 4, .white)
        line([CGPoint(x: x + 12, y: y + 23), CGPoint(x: x + 34, y: y + 23)], color: teal, width: 3)
        line([CGPoint(x: x + 12, y: y + 31), CGPoint(x: x + 29, y: y + 31)], color: teal, width: 3)
    }

    private mutating func thermometer() {
        let t = kind == "vitals" ? 1 : (step == 0 ? 0 : (step == 1 ? p : (step == 3 ? 1 - p : 1)))
        let x = mix(137, 263, t), y = mix(204, 103, t)
        helperHand(x: x - 20, y: y + 33)
        rounded(x - 29, y - 9, 52, 25, 8, .white, outline: teal)
        rounded(x - 24, y + 7, 21, 40, 8, .white, outline: teal)
        rounded(x - 22, y - 3, 22, 10, 3, pale)
        rounded(x + 18, y - 6, 10, 18, 4, teal)
        if step == 2 || kind == "vitals" {
            for n in 0..<3 { line([CGPoint(x: x + 31 + Double(n) * 6, y: y - 6), CGPoint(x: x + 33 + Double(n) * 6, y: y + 9)], color: teal.opacity(0.4), width: 2) }
        }
    }

    private mutating func stethoscope(forceContact: Bool = false) {
        helperFace(x: 89, y: 160, small: false)
        let t = forceContact ? 1 : (step == 0 ? 0 : (step == 1 ? p : (step == 3 ? 1 - p : 1)))
        let x = mix(157, 291, t), y = mix(228, 224, t)
        var tube = Path()
        tube.move(to: CGPoint(x: 69, y: 177))
        tube.addCurve(to: CGPoint(x: 113, y: 226), control1: CGPoint(x: 64, y: 221), control2: CGPoint(x: 92, y: 232))
        tube.addCurve(to: CGPoint(x: x, y: y), control1: CGPoint(x: 178, y: 295), control2: CGPoint(x: 211, y: 269))
        context.stroke(tube, with: .color(teal), style: StrokeStyle(lineWidth: 6, lineCap: .round))
        line([CGPoint(x: 109, y: 177), CGPoint(x: 113, y: 226)], color: teal, width: 5)
        helperHand(x: x - 23, y: y + 16)
        ellipse(x - 16, y - 16, 32, 32, Color(hex: 0xDDEAE7), outline: teal)
        ellipse(x - 9, y - 9, 18, 18, .white)
        if (step == 2 || forceContact) && progress < 0.75 {
            let size = 37 + progress * 14
            context.stroke(Path(ellipseIn: CGRect(x: x - size / 2, y: y - size / 2, width: size, height: size)), with: .color(teal.opacity(0.4)), lineWidth: 2)
        }
    }

    private mutating func measuringTools() {
        rounded(383, 70, 25, 238, 5, Color(hex: 0xE5C78F), outline: ink)
        for y in stride(from: 82.0, through: 296, by: 14) { line([CGPoint(x: 385, y: y), CGPoint(x: 397, y: y)], color: ink, width: 2) }
        if step >= 2 { line([CGPoint(x: 280, y: 79), CGPoint(x: 405, y: 79)], color: teal, width: 7) }
        rounded(218, 313, 156, 23, 8, .white, outline: teal)
        rounded(281, 317, 31, 11, 4, pale)
    }

    private mutating func gown() {
        if step == 0 {
            var cloth = Path()
            cloth.move(to: CGPoint(x: 100, y: 178)); cloth.addLine(to: CGPoint(x: 122, y: 169))
            cloth.addLine(to: CGPoint(x: 143, y: 178)); cloth.addLine(to: CGPoint(x: 161, y: 209))
            cloth.addLine(to: CGPoint(x: 144, y: 220)); cloth.addLine(to: CGPoint(x: 146, y: 269))
            cloth.addLine(to: CGPoint(x: 98, y: 269)); cloth.addLine(to: CGPoint(x: 100, y: 220))
            cloth.addLine(to: CGPoint(x: 82, y: 209)); cloth.closeSubpath()
            context.fill(cloth, with: .color(Color(hex: 0xB9DEDD)))
            context.stroke(cloth, with: .color(teal), lineWidth: 3)
            helperHand(x: 85, y: 179)
        } else if step == 1 {
            // A privacy screen covers the entire bear while changing.
            for x in [187.0, 264, 341] { rounded(x, 65, 78, 249, 8, Color(hex: 0xC1DCDD), outline: teal) }
            line([CGPoint(x: 190, y: 313), CGPoint(x: 190, y: 332)], color: teal, width: 5)
            line([CGPoint(x: 415, y: 313), CGPoint(x: 415, y: 332)], color: teal, width: 5)
        } else {
            rounded(237, 209, 106, 88, 16, Color(hex: 0xB9DEDD), outline: teal)
            for y in [224.0, 246, 268] { ellipse(286, y, 5, 5, teal.opacity(0.5)) }
            if step == 3 {
                rounded(404, 222, 93, 86, 10, Color(hex: 0xE8CCA6), outline: ink)
                curve(from: CGPoint(x: 422, y: 223), control: CGPoint(x: 450, y: 188), to: CGPoint(x: 478, y: 223), color: ink, width: 4)
                label(bearName, x: 450, y: 267, size: 15)
            }
        }
    }

    private mutating func meetHelper() {
        helperFace(x: 113, y: 165, small: false)
        rounded(63, 204, 98, 106, 22, teal)
        rounded(116, 218, 35, 30, 5, .white, outline: Color(hex: 0xB5D8CE))
        label("HELLO", x: 133, y: 228, size: 7)
        line([CGPoint(x: 121, y: 238), CGPoint(x: 145, y: 238)], color: teal, width: 2)
        if step >= 2 { speechBubble(kind == "ask" ? "What does this do?" : "What do you do?", x: 324, y: 45) }
        if step == 3 { helperHand(x: 204, y: 265) }
    }

    private mutating func tellGrownUp() {
        helperFace(x: 112, y: 170, small: false)
        rounded(63, 209, 98, 100, 22, teal)
        if step == 1 { speechBubble("It hurts when I swallow", x: 326, y: 46) }
        if step == 2 {
            let hand = CGPoint(x: mix(204, 276, p), y: mix(265, 198, p))
            line([CGPoint(x: 237, y: 215), hand], color: ink, width: 29)
            line([CGPoint(x: 237, y: 215), hand], color: fur, width: 25)
            ellipse(hand.x - 14, hand.y - 12, 28, 25, furLight, outline: ink)
        }
        if step == 3 { helperHand(x: 207, y: 263); speechBubble("I am here to help", x: 123, y: 97) }
    }

    private mutating func quietActivity() {
        if step >= 2 {
            rounded(243, 257, 100, 57, 7, .white, outline: Color(hex: 0xC4D5CE))
            var drawing = Path(); drawing.move(to: CGPoint(x: 262, y: 294))
            drawing.addLine(to: CGPoint(x: 281, y: 274)); drawing.addLine(to: CGPoint(x: 304, y: 294)); drawing.closeSubpath()
            context.stroke(drawing, with: .color(Color(hex: 0xDA9174)), style: StrokeStyle(lineWidth: 3, lineJoin: .round))
            let x = step == 2 ? mix(268, 314, p) : 318
            line([CGPoint(x: x, y: 277), CGPoint(x: x + 20, y: 249)], color: Color(hex: 0xE3BA62), width: 7)
        }
        if step == 3 { speechBubble("A little break", x: 344, y: 47) }
    }

    private mutating func sip() {
        if step == 0 { clipboard(x: 112, y: 206); helperHand(x: 145, y: 246) }
        let t = step == 0 ? 0 : (step == 1 ? p : (step == 2 ? 1 : 1 - p))
        let x = mix(371, 317, t), y = mix(272, 186, t)
        line([CGPoint(x: 350, y: 225), CGPoint(x: x + 10, y: y + 11)], color: ink, width: 29)
        line([CGPoint(x: 350, y: 225), CGPoint(x: x + 10, y: y + 11)], color: fur, width: 24)
        ellipse(x + 4, y + 1, 31, 26, fur, outline: ink)
        rounded(x - 18, y - 15, 38, 43, 8, .white, outline: teal)
        rounded(x - 13, y + 1, 28, 21, 4, Color(hex: 0x9DD8D3))
        ellipse(x - 18, y - 18, 38, 10, pale, outline: teal)
    }

    private mutating func snack() {
        if step == 0 { clipboard(x: 108, y: 206) }
        rounded(351, 276, 52, 43, 10, .white, outline: teal)
        ellipse(351, 270, 52, 16, Color(hex: 0xEBDDD3), outline: teal)
        let t = step < 2 ? 0 : (step == 2 ? p : 1 - p)
        let x = mix(376, 290, t), y = mix(271, 177, t)
        helperHand(x: x + 38, y: y + 23, fromRight: true)
        line([CGPoint(x: x + 8, y: y + 3), CGPoint(x: x + 53, y: y + 24)], color: Color(hex: 0x849D97), width: 6)
        ellipse(x - 10, y - 5, 25, 12, Color(hex: 0xCCDCD7), outline: Color(hex: 0x849D97))
        ellipse(x - 5, y - 4, 16, 7, Color(hex: 0xF3E6DA))
    }

    private mutating func helperFace(x: Double, y: Double, small: Bool) {
        let r: Double = small ? 27 : 32
        ellipse(x - r, y - r, r * 2, r * 2, skin, outline: ink)
        curve(from: CGPoint(x: x - r, y: y - 9), control: CGPoint(x: x, y: y - r - 24), to: CGPoint(x: x + r, y: y - 9), color: ink, width: 13)
        ellipse(x - 13, y - 5, 5, 7, ink); ellipse(x + 8, y - 5, 5, 7, ink)
        curve(from: CGPoint(x: x - 9, y: y + 12), control: CGPoint(x: x, y: y + 19), to: CGPoint(x: x + 9, y: y + 12), color: ink, width: 2)
        if small { rounded(x - 30, y + 26, 60, 66, 18, teal) }
    }

    private mutating func helperHand(x: Double, y: Double, fromRight: Bool = false) {
        let edge = fromRight ? 560.0 : 0.0
        let elbowX = fromRight ? x + 64 : x - 64
        line([CGPoint(x: edge, y: y + 61), CGPoint(x: elbowX, y: y + 34)], color: Color(hex: 0xC8E3DF), width: 39)
        line([CGPoint(x: elbowX, y: y + 34), CGPoint(x: x, y: y)], color: skin, width: 26)
        ellipse(x - 18, y - 14, 37, 29, skin, outline: Color(hex: 0xBF8B65))
        line([CGPoint(x: x + 1, y: y - 6), CGPoint(x: x + 16, y: y - 19)], color: skin, width: 11)
        for dy in [-4.0, 2, 8] { line([CGPoint(x: x - 9, y: y + dy), CGPoint(x: x + 8, y: y + dy)], color: Color(hex: 0xBE875F).opacity(0.4), width: 1) }
    }

    private mutating func clipboard(x: Double, y: Double) {
        rounded(x - 36, y - 52, 74, 101, 9, Color(hex: 0xD8B383), outline: ink)
        rounded(x - 29, y - 44, 60, 85, 5, .white)
        rounded(x - 17, y - 57, 34, 15, 4, teal)
        for dy in [-21.0, -3, 15] {
            line([CGPoint(x: x - 18, y: y + dy), CGPoint(x: x - 12, y: y + dy + 5), CGPoint(x: x - 5, y: y + dy - 5)], color: teal, width: 3)
            line([CGPoint(x: x + 2, y: y + dy), CGPoint(x: x + 21, y: y + dy)], color: Color(hex: 0x91AAA2), width: 3)
        }
    }

    private mutating func speechBubble(_ text: String, x: Double, y: Double) {
        rounded(x - 84, y - 21, 168, 42, 16, .white, outline: Color(hex: 0xA4C7BD))
        label(text, x: x, y: y, size: 13)
    }

    private mutating func heart(x: Double, y: Double, scale: Double) {
        var shape = Path()
        shape.move(to: CGPoint(x: x, y: y + 16 * scale))
        shape.addCurve(to: CGPoint(x: x, y: y - 7 * scale), control1: CGPoint(x: x - 32 * scale, y: y - 3 * scale), control2: CGPoint(x: x - 17 * scale, y: y - 23 * scale))
        shape.addCurve(to: CGPoint(x: x, y: y + 16 * scale), control1: CGPoint(x: x + 17 * scale, y: y - 23 * scale), control2: CGPoint(x: x + 32 * scale, y: y - 3 * scale))
        context.fill(shape, with: .color(Color(hex: 0xD5785F)))
    }

    private mutating func label(_ text: String, x: Double, y: Double, size: Double) {
        context.draw(Text(text).font(.system(size: size, weight: .bold, design: .rounded)).foregroundStyle(teal), at: CGPoint(x: x, y: y))
    }

    private mutating func rounded(_ x: Double, _ y: Double, _ width: Double, _ height: Double, _ radius: Double, _ fill: Color, outline: Color? = nil) {
        let path = Path(roundedRect: CGRect(x: x, y: y, width: width, height: height), cornerSize: CGSize(width: radius, height: radius))
        context.fill(path, with: .color(fill))
        if let outline { context.stroke(path, with: .color(outline), lineWidth: 2.5) }
    }

    private mutating func ellipse(_ x: Double, _ y: Double, _ width: Double, _ height: Double, _ fill: Color, outline: Color? = nil) {
        let path = Path(ellipseIn: CGRect(x: x, y: y, width: width, height: height))
        context.fill(path, with: .color(fill))
        if let outline { context.stroke(path, with: .color(outline), lineWidth: 2.5) }
    }

    private mutating func line(_ points: [CGPoint], color: Color, width: Double) {
        guard let first = points.first else { return }
        var path = Path(); path.move(to: first)
        points.dropFirst().forEach { path.addLine(to: $0) }
        context.stroke(path, with: .color(color), style: StrokeStyle(lineWidth: width, lineCap: .round, lineJoin: .round))
    }

    private mutating func curve(from: CGPoint, control: CGPoint, to: CGPoint, color: Color, width: Double) {
        var path = Path(); path.move(to: from); path.addQuadCurve(to: to, control: control)
        context.stroke(path, with: .color(color), style: StrokeStyle(lineWidth: width, lineCap: .round))
    }

    private func mix(_ a: Double, _ b: Double, _ t: Double) -> Double { a + (b - a) * t }

    private func cubic(_ a: CGPoint, _ b: CGPoint, _ c: CGPoint, _ d: CGPoint, _ t: Double) -> CGPoint {
        let u = 1 - t
        return CGPoint(x: u*u*u*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t*t*t*d.x,
                       y: u*u*u*a.y + 3*u*u*t*b.y + 3*u*t*t*c.y + t*t*t*d.y)
    }
}
