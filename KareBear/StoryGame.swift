import AVFoundation
import SwiftUI
import UIKit

enum QuestScreen: String {
    case hub
    case story
    case game
    case rewards
    case prep
    case demos

    static func initial() -> QuestScreen {
        let args = ProcessInfo.processInfo.arguments
        guard let flag = args.firstIndex(of: "--screen") else { return .hub }
        let next = args.index(after: flag)
        guard args.indices.contains(next) else { return .hub }
        return QuestScreen(rawValue: args[next]) ?? .hub
    }
}

struct StoryChoice: Identifiable {
    let id: String
    let label: String
    let isCorrect: Bool
    let symbol: String
}

struct StoryPage: Identifiable {
    let id: String
    let title: String
    let expression: String
    let scene: String
    let speech: String
    let more: String
    let question: String
    let choices: [StoryChoice]
    let reveal: String
    var symbol: String = "heart.fill"
    var tryTitle: String? = nil
    var tryDetail: String? = nil
    var gear: StoryGear? = nil
    var isTalkActivity: Bool = false

    func speaking(as name: String) -> StoryPage {
        let bear = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !bear.isEmpty, bear != "Kare" else { return self }
        func swap(_ text: String) -> String {
            text.replacingOccurrences(of: "Kare", with: bear)
        }
        return StoryPage(
            id: id,
            title: isTalkActivity ? title : swap(title),
            expression: expression,
            scene: swap(scene),
            speech: isTalkActivity ? speech : swap(speech),
            more: isTalkActivity ? more : swap(more),
            question: isTalkActivity ? question : swap(question),
            choices: choices.map {
                StoryChoice(id: $0.id, label: swap($0.label), isCorrect: $0.isCorrect, symbol: $0.symbol)
            },
            reveal: isTalkActivity ? reveal : swap(reveal),
            symbol: symbol,
            tryTitle: tryTitle.map(swap),
            tryDetail: tryDetail.map(swap),
            gear: gear,
            isTalkActivity: isTalkActivity
        )
    }

    /// Keep the choices steady during a page, with less reading for ages five and six.
    func adapted(for ageYears: Int) -> StoryPage {
        guard let correct = choices.first(where: \.isCorrect) else { return self }
        let seed = id.unicodeScalars.reduce(0) { $0 + Int($1.value) }
        let alternatives = choices.filter { !$0.isCorrect }
        var displayed = choices
        if ageYears <= 6, !alternatives.isEmpty {
            displayed = [correct, alternatives[seed % alternatives.count]]
        }
        let offset = seed % displayed.count
        displayed = Array(displayed[offset...]) + Array(displayed[..<offset])
        return StoryPage(
            id: id, title: title, expression: expression, scene: scene,
            speech: speech, more: more, question: question, choices: displayed,
            reveal: reveal, symbol: symbol, tryTitle: tryTitle, tryDetail: tryDetail,
            gear: gear, isTalkActivity: isTalkActivity
        )
    }
}

enum StoryLibrary {
    static let firstMiss = "Let's find a clue together. Read or listen, then try another answer."

    static func pages(for notes: [ParentInstruction], childName: String) -> [StoryPage] {
        guard !notes.isEmpty else {
            return [StoryPage(
                id: "welcome",
                title: "Let’s get ready together",
                expression: "Gentle",
                scene: "Kare sits with a notebook.",
                speech: "Your grown-up can add the steps from your care team. Then we can practise them together.",
                more: "If something hurts or feels wrong, tell a grown-up.",
                question: "What would you like to ask your grown-up about your care?",
                choices: [],
                reveal: "Your grown-up can help you get started with your care steps.",
                isTalkActivity: true
            )]
        }
        return notes.map { note in
            StoryPage(
                id: note.id.uuidString,
                title: note.title,
                expression: "Encouraging",
                scene: "A care step to practise with your grown-up.",
                speech: "Your grown-up’s care step: \(note.detail)",
                more: "Read or listen together. Your grown-up can explain any new words.",
                question: "Show or tell your grown-up: how will you do this step together?",
                choices: [],
                reveal: "Keep this step handy: \(note.detail)",
                isTalkActivity: true
            )
        }
    }

    static let pages: [StoryPage] = [
        StoryPage(
            id: "rest",
            title: "A quiet afternoon",
            expression: "Encouraging",
            scene: "Kare picks something to do while resting.",
            speech: "My grown-up says it is time to rest. I can still have fun with a book or a drawing.",
            more: "Your grown-up can help you choose an activity that fits your care plan.",
            question: "It is rest time. What could Kare choose?",
            choices: [
                StoryChoice(id: "rest-run", label: "A game of tag", isCorrect: false, symbol: "figure.run"),
                StoryChoice(id: "rest-quiet", label: "Drawing on the sofa", isCorrect: true, symbol: "pencil"),
                StoryChoice(id: "rest-shout", label: "A jumping game", isCorrect: false, symbol: "figure.play")
            ],
            reveal: "Drawing lets Kare play while resting. A book or a quiet game could work too."
        ),
        StoryPage(
            id: "medicine",
            title: "A medicine question",
            expression: "Encouraging",
            scene: "Kare checks with a grown-up.",
            speech: "My grown-up checks the medicine and measures it for me. If I have a question, I can ask.",
            more: "Your grown-up follows the care team’s instructions for how much medicine to give and when.",
            question: "Kare wonders if it is medicine time. What comes first?",
            choices: [
                StoryChoice(id: "med-adult", label: "Ask a grown-up to check", isCorrect: true, symbol: "person.fill"),
                StoryChoice(id: "med-alone", label: "Check the colour of the bottle", isCorrect: false, symbol: "pills.fill"),
                StoryChoice(id: "med-guess", label: "Try to remember yesterday’s time", isCorrect: false, symbol: "clock")
            ],
            reveal: "Ask a grown-up to check the plan. The bottle’s colour or a remembered time cannot tell you when to take medicine."
        ),
        StoryPage(
            id: "sips",
            title: "One sip at a time",
            expression: "Encouraging",
            scene: "Kare has a cup nearby.",
            speech: "My care plan says to take small sips of cool water. I can take a little, then pause.",
            more: "Tell a grown-up if drinking hurts or you cannot drink. They can help.",
            question: "Kare is practising small sips. Which way matches?",
            choices: [
                StoryChoice(id: "sip-hot", label: "Finish the cup in one gulp", isCorrect: false, symbol: "mug.fill"),
                StoryChoice(id: "sip-cold", label: "Take a little sip, then pause", isCorrect: true, symbol: "drop.fill"),
                StoryChoice(id: "sip-none", label: "Save all the sips for later", isCorrect: false, symbol: "clock")
            ],
            reveal: "A little sip and a pause match Kare’s plan. Your grown-up helps you follow your own drinking plan."
        ),
        StoryPage(
            id: "treat",
            title: "Snack detective",
            expression: "Encouraging",
            scene: "Kare and a grown-up choose a snack.",
            speech: "My care plan says soft, cool foods today. My grown-up helps me find a snack that fits.",
            more: "Different children have different food plans. Check yours with a grown-up.",
            question: "Which snack is soft and cool?",
            choices: [
                StoryChoice(id: "treat-chips", label: "Crunchy crackers", isCorrect: false, symbol: "fork.knife"),
                StoryChoice(id: "treat-pop", label: "Smooth, chilled yogurt", isCorrect: true, symbol: "snowflake"),
                StoryChoice(id: "treat-toast", label: "Warm, crunchy toast", isCorrect: false, symbol: "fork.knife")
            ],
            reveal: "Smooth, chilled yogurt is soft and cool. A grown-up checks whether it fits your food plan."
        ),
        StoryPage(
            id: "speak",
            title: "Say what you feel",
            expression: "Encouraging",
            scene: "Kare tells a grown-up what is happening.",
            speech: "If something hurts or feels wrong, I tell my grown-up. I do not need special words.",
            more: "If you cannot drink, have bleeding, or have trouble breathing, tell a grown-up right away.",
            question: "Drinking hurts. What could Kare say to get help?",
            choices: [
                StoryChoice(id: "help-wait", label: "“Can we read a book?”", isCorrect: false, symbol: "book.fill"),
                StoryChoice(id: "help-tell", label: "“It hurts when I swallow.”", isCorrect: true, symbol: "bubble.left.fill"),
                StoryChoice(id: "help-extra", label: "“What time is it?”", isCorrect: false, symbol: "clock")
            ],
            reveal: "“It hurts when I swallow” tells a grown-up what is wrong. You can point to where it hurts too."
        )
    ]

    static let tutorialPage = StoryPage(
        id: "tour-practice",
        title: "Let’s try one",
        expression: "Encouraging",
        scene: "Kare is choosing a quiet activity.",
        speech: "Let’s help me choose. You can tap Listen to hear the words. We can work it out together.",
        more: "There is no hurry. You can look at the story again whenever you want.",
        question: "Kare wants a quiet game. Which one fits?",
        choices: [
            StoryChoice(id: "tour-alone", label: "Playing drums", isCorrect: false, symbol: "speaker.wave.3.fill"),
            StoryChoice(id: "tour-adult", label: "Making a puzzle", isCorrect: true, symbol: "puzzlepiece.fill"),
            StoryChoice(id: "tour-none", label: "A running race", isCorrect: false, symbol: "figure.run")
        ],
        reveal: "A puzzle is a quiet way to play. You helped Kare choose!"
    )

    static func prepPages(childName: String) -> [StoryPage] {
        let name = childName.trimmingCharacters(in: .whitespacesAndNewlines)
        let hello = name.isEmpty ? "Hi. I'm Kare." : "Hi, \(name). I'm Kare."
        return [
            StoryPage(
                id: "prep-welcome",
                title: "A tour with Kare",
                expression: "Encouraging",
                scene: "Kare explores the hospital with you.",
                speech: "\(hello) Before an operation, you may meet new people and see new things. Let’s find out about them together.",
                more: "It is OK to feel curious, worried, or both. You can tell a grown-up how you feel.",
                question: "Kare feels worried. What could Kare say?",
                choices: [
                    StoryChoice(id: "prep-welcome-alone", label: "“Where is my coat?”", isCorrect: false, symbol: "tshirt.fill"),
                    StoryChoice(id: "prep-welcome-adult", label: "“I feel worried. Can you help?”", isCorrect: true, symbol: "bubble.left.fill"),
                    StoryChoice(id: "prep-welcome-none", label: "“What time is lunch?”", isCorrect: false, symbol: "clock")
                ],
                reveal: "Saying “I feel worried” helps your grown-up understand. You can ask for a hand to hold.",
                symbol: "heart.fill",
                tryTitle: "Breathe with Kare",
                tryDetail: "Try one slow breath in and one slow breath out. You can stop whenever you want.",
                gear: .breath
            ),
            StoryPage(
                id: "prep-scrubs",
                title: "Meet a helper",
                expression: "Encouraging",
                scene: "Kare meets someone wearing scrubs.",
                speech: "Scrubs are the clothes many hospital helpers wear. Their name badge can tell you who they are.",
                more: "You can ask, “What is your name? What do you do?”",
                question: "Where could Kare look for a helper’s name?",
                choices: [
                    StoryChoice(id: "prep-scrubs-scary", label: "On their shoes", isCorrect: false, symbol: "shoe.fill"),
                    StoryChoice(id: "prep-scrubs-clothes", label: "On their name badge", isCorrect: true, symbol: "person.crop.rectangle"),
                    StoryChoice(id: "prep-scrubs-sleep", label: "On their bag", isCorrect: false, symbol: "bag.fill")
                ],
                reveal: "A name badge helps you find out who someone is. You can ask them to read it to you.",
                symbol: "person.2.fill",
                tryTitle: "Say hello",
                tryDetail: "Try asking your grown-up, “What is your name?” Then tell them yours.",
                gear: .helper
            ),
            StoryPage(
                id: "prep-gown",
                title: "Your hospital clothes",
                expression: "Encouraging",
                scene: "Kare gets a gown and a clothes bag.",
                speech: "A hospital gown is a loose piece of clothing. It helps the care team check your body. Your own clothes wait in a bag.",
                more: "You can ask for help changing, or tell someone if you feel cold.",
                question: "Where do Kare’s own clothes wait during the operation?",
                choices: [
                    StoryChoice(id: "prep-gown-trouble", label: "On the weighing scale", isCorrect: false, symbol: "scalemass.fill"),
                    StoryChoice(id: "prep-gown-care", label: "In a bag with Kare’s name", isCorrect: true, symbol: "bag.fill"),
                    StoryChoice(id: "prep-gown-wrong", label: "On the food tray", isCorrect: false, symbol: "fork.knife")
                ],
                reveal: "A bag with your name keeps your clothes together so they are ready when you need them.",
                symbol: "tshirt.fill",
                tryTitle: "Pack for later",
                tryDetail: "Pretend to fold a shirt and put it in a bag. What would help you find your bag again?",
                gear: .gown
            ),
            StoryPage(
                id: "prep-measure",
                title: "How tall? How much?",
                expression: "Encouraging",
                scene: "Kare meets a ruler and a scale.",
                speech: "A ruler measures how tall I am. A scale checks how much I weigh. These numbers help the team plan my care.",
                more: "Your grown-up or a helper can show you where to stand.",
                question: "The helper wants to know how tall Kare is. Which tool helps?",
                choices: [
                    StoryChoice(id: "prep-measure-contest", label: "A weighing scale", isCorrect: false, symbol: "scalemass.fill"),
                    StoryChoice(id: "prep-measure-size", label: "A height ruler", isCorrect: true, symbol: "ruler.fill"),
                    StoryChoice(id: "prep-measure-home", label: "A thermometer", isCorrect: false, symbol: "thermometer.medium")
                ],
                reveal: "A height ruler measures how tall you are. A scale measures weight, and a thermometer checks temperature.",
                symbol: "ruler.fill",
                tryTitle: "Stand tall",
                tryDetail: "Stand with your feet flat and look ahead. Pretend a helper is measuring your height.",
                gear: .measure
            ),
            StoryPage(
                id: "prep-thermometer",
                title: "A temperature check",
                expression: "Encouraging",
                scene: "Kare meets the thermometer.",
                speech: "A thermometer checks how warm my body is. A helper may put it near my forehead, ear, or under my arm.",
                more: "The helper will show you what to do. Some thermometers beep when they finish.",
                question: "Which tool checks how warm Kare’s body is?",
                choices: [
                    StoryChoice(id: "prep-thermo-shout", label: "A stethoscope", isCorrect: false, symbol: "stethoscope"),
                    StoryChoice(id: "prep-thermo-warm", label: "A thermometer", isCorrect: true, symbol: "thermometer.medium"),
                    StoryChoice(id: "prep-thermo-wrong", label: "A weighing scale", isCorrect: false, symbol: "scalemass.fill")
                ],
                reveal: "A thermometer checks your temperature. That tells the helper how warm your body is.",
                symbol: "thermometer.medium",
                tryTitle: "Be still, then wiggle",
                tryDetail: "Practise holding still for a moment. When your grown-up says “done,” have a wiggle.",
                gear: .thermometer
            ),
            StoryPage(
                id: "prep-stethoscope",
                title: "Listen to a heartbeat",
                expression: "Encouraging",
                scene: "Kare meets the stethoscope.",
                speech: "A stethoscope helps the nurse hear my heart and breathing. Its round end may feel cool on my skin.",
                more: "You can ask the nurse what they are listening for.",
                question: "What does a stethoscope help the nurse check?",
                choices: [
                    StoryChoice(id: "prep-steth-thoughts", label: "Body temperature", isCorrect: false, symbol: "thermometer.medium"),
                    StoryChoice(id: "prep-steth-heart", label: "Heartbeat and breathing", isCorrect: true, symbol: "heart.fill"),
                    StoryChoice(id: "prep-steth-alarm", label: "Body weight", isCorrect: false, symbol: "scalemass.fill")
                ],
                reveal: "A stethoscope carries sounds from inside your body, like your heartbeat and breathing.",
                symbol: "stethoscope",
                tryTitle: "Make a heartbeat",
                tryDetail: "Tap a gentle thump-thump on your knee. That is a rhythm a heartbeat can make.",
                gear: .stethoscope
            ),
            StoryPage(
                id: "prep-cuff",
                title: "A squeeze on your arm",
                expression: "Encouraging",
                scene: "Kare tries a blood pressure cuff.",
                speech: "A cuff wraps around my arm. It fills with air, feels tight, then loosens. It checks my blood pressure.",
                more: "Tell the helper if the squeeze hurts or feels uncomfortable.",
                question: "The cuff has filled with air. What happens next?",
                choices: [
                    StoryChoice(id: "prep-cuff-stay", label: "It checks Kare’s height", isCorrect: false, symbol: "ruler.fill"),
                    StoryChoice(id: "prep-cuff-release", label: "The air comes out and it loosens", isCorrect: true, symbol: "arrow.left.and.right"),
                    StoryChoice(id: "prep-cuff-break", label: "It listens to Kare’s breathing", isCorrect: false, symbol: "stethoscope")
                ],
                reveal: "The cuff loosens as the air comes out. Tell the helper how your arm feels.",
                symbol: "arrow.left.and.right",
                tryTitle: "Squeeze, then relax",
                tryDetail: "Gently squeeze your own hand, then let it relax. You are in charge of this pretend squeeze.",
                gear: .cuff
            ),
            StoryPage(
                id: "prep-vitals",
                title: "Checking your body",
                expression: "Encouraging",
                scene: "The helper writes down Kare’s checks.",
                speech: "Temperature, heartbeat, breathing, and blood pressure are called vital signs. They help the team see how my body is doing.",
                more: "The team may check them again later to see what has changed.",
                question: "Why might a nurse check Kare’s temperature again?",
                choices: [
                    StoryChoice(id: "prep-vitals-punish", label: "To find out how tall Kare is", isCorrect: false, symbol: "ruler.fill"),
                    StoryChoice(id: "prep-vitals-check", label: "To see if it has changed", isCorrect: true, symbol: "thermometer.medium"),
                    StoryChoice(id: "prep-vitals-lose", label: "To find out when Kare last ate", isCorrect: false, symbol: "fork.knife")
                ],
                reveal: "A new check shows whether your temperature has changed. The team uses checks to follow how you are doing.",
                symbol: "list.clipboard.fill",
                tryTitle: "Remember a check",
                tryDetail: "Point to your arm or chest. Tell your grown-up one check you remember.",
                gear: .vitals
            ),
            StoryPage(
                id: "prep-iv",
                title: "Meet the IV",
                expression: "Encouraging",
                scene: "Kare sees a small tube and a bag.",
                speech: "An IV is a small, soft tube that goes into a vein. It can give my body fluid or medicine. Putting it in may pinch or sting.",
                more: "A nurse looks after the IV. Tell them if it hurts or feels uncomfortable. You can ask to hold a hand.",
                question: "What does an IV help the team give Kare?",
                choices: [
                    StoryChoice(id: "prep-iv-allday", label: "A temperature check", isCorrect: false, symbol: "thermometer.medium"),
                    StoryChoice(id: "prep-iv-pinch", label: "Fluid or medicine", isCorrect: true, symbol: "drop.fill"),
                    StoryChoice(id: "prep-iv-pull", label: "A heartbeat check", isCorrect: false, symbol: "heart.fill")
                ],
                reveal: "Fluid or medicine can travel through the little tube into your body. A nurse looks after it.",
                symbol: "bag.fill",
                tryTitle: "Choose some support",
                tryDetail: "Would you like to look away or hold a hand? Practise asking for what would help you.",
                gear: .iv
            ),
            StoryPage(
                id: "prep-mask",
                title: "Meet the mask",
                expression: "Encouraging",
                scene: "Kare learns about medicine for the operation.",
                speech: "Some children get medicine through a mask over their nose and mouth. It helps them sleep during the operation. The care team watches over them.",
                more: "The team will explain how you will get your medicine and who can stay with you.",
                question: "What is the medicine in this mask for?",
                choices: [
                    StoryChoice(id: "prep-mask-play", label: "Checking how tall Kare is", isCorrect: false, symbol: "ruler.fill"),
                    StoryChoice(id: "prep-mask-rest", label: "Helping Kare sleep during the operation", isCorrect: true, symbol: "moon.stars.fill"),
                    StoryChoice(id: "prep-mask-hair", label: "Listening to Kare’s heartbeat", isCorrect: false, symbol: "stethoscope")
                ],
                reveal: "This medicine helps you sleep during the operation. The care team looks after you while it works.",
                symbol: "facemask.fill",
                tryTitle: "Practise a slow breath",
                tryDetail: "Try a slow breath in and out. Ask your grown-up what you would like the team to explain.",
                gear: .mask
            ),
            StoryPage(
                id: "prep-ready",
                title: "Your turn to ask",
                expression: "Encouraging",
                scene: "Kare is ready with a question.",
                speech: "You have met some hospital helpers and tools. You can always ask what something is or what will happen next.",
                more: "You do not need to remember every word. Asking for help is part of learning.",
                question: "Kare sees a new tool. Which question helps Kare learn about it?",
                choices: [
                    StoryChoice(id: "prep-ready-hide", label: "“Where is my bag?”", isCorrect: false, symbol: "bag.fill"),
                    StoryChoice(id: "prep-ready-ask", label: "“What does this do?”", isCorrect: true, symbol: "bubble.left.fill"),
                    StoryChoice(id: "prep-ready-trouble", label: "“What time is lunch?”", isCorrect: false, symbol: "clock")
                ],
                reveal: "“What does this do?” invites the helper to explain. You can also ask them to show you first.",
                symbol: "hands.and.sparkles.fill",
                tryTitle: "Ask your question",
                tryDetail: "Pick one thing from the tour. What would you like to ask about it?",
                gear: .ask
            )
        ]
    }
}

struct StoryDemoGallery: View {
    var onHome: () -> Void
    @Environment(CareStore.self) private var store
    @Environment(\.scenePhase) private var scenePhase
    @State private var selected = "cuff"
    @State private var speaker = StorySpeaker()
    private let demos = ["cuff", "iv", "mask", "medicine"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Button {
                    speaker.stop()
                    onHome()
                } label: {
                    Label("Back to Play", systemImage: "chevron.left")
                        .font(jakarta(17, .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(minHeight: 48)
                }
                .buttonStyle(KidButtonStyle())
                Text("Watch with \(store.companionName)")
                    .font(jakarta(30, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text("Choose a little story to watch with your grown-up. Pause or replay whenever you like.")
                    .font(jakarta(18, .medium))
                    .foregroundStyle(Theme.muted)
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ForEach(demos, id: \.self) { id in
                        if let scene = StoryAnimationLibrary.scene(id) {
                            demoButton(scene)
                        }
                    }
                }
                if let scene = StoryAnimationLibrary.scene(selected) {
                    StoryAnimationPlayer(scene: scene, bearName: store.companionName) { caption in
                        speaker.stop()
                        speaker.speak(caption, ageYears: store.childAgeYears, force: true)
                    } stopNarration: {
                        speaker.stop()
                    }
                    .id(selected)
                }
                DisclosureGroup("More stories to explore") {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ForEach(StoryAnimationLibrary.scenes.filter { !demos.contains($0.id) }) { scene in
                            demoButton(scene)
                        }
                    }
                    .padding(.top, 12)
                }
                .font(jakarta(18, .bold))
                .foregroundStyle(Theme.teal)
            }
            .padding(20)
            .readableColumn(compact: 620)
        }
        .kidCanvas()
        .onDisappear { speaker.stop() }
        .onChange(of: scenePhase) { _, phase in if phase != .active { speaker.stop() } }
    }

    private func demoButton(_ scene: StoryAnimationScene) -> some View {
        Button {
            speaker.stop()
            selected = scene.id
        } label: {
            Text(scene.title)
                .font(jakarta(17, .bold))
                .multilineTextAlignment(.leading)
                .foregroundStyle(selected == scene.id ? .white : Theme.teal)
                .padding(14)
                .frame(maxWidth: .infinity, minHeight: 82, alignment: .leading)
                .background(selected == scene.id ? Theme.teal : .white, in: RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.tealBorder))
        }
        .buttonStyle(KidButtonStyle())
        .accessibilityAddTraits(selected == scene.id ? .isSelected : [])
    }

}

struct QuestHomeView: View {
    @Environment(CareStore.self) private var store
    @Environment(\.appActions) private var actions
    @State private var screen: QuestScreen
    @State private var tab: ChildTab
    @State private var lockNote = ""
    @State private var password = ""
    @State private var showPassword = ProcessInfo.processInfo.arguments.contains("--password")

    private enum ChildTab: String, CaseIterable, Identifiable {
        case play
        case rewards

        var id: String { rawValue }

        var title: String {
            switch self {
            case .play: "Play"
            case .rewards: "Rewards"
            }
        }

        var symbol: String {
            switch self {
            case .play: "sparkles"
            case .rewards: "star.fill"
            }
        }
    }

    init() {
        let start = QuestScreen.initial()
        _screen = State(initialValue: start)
        _tab = State(initialValue: start == .rewards ? .rewards : .play)
    }

    private var childName: String {
        store.childName.isEmpty ? "friend" : store.childName
    }

    var body: some View {
        switch screen {
        case .story:
            StoryGameView(onHome: { screen = .hub }, onGame: { screen = .game })
        case .game:
            RememberGameView(onHome: { screen = .hub })
        case .demos:
            StoryDemoGallery(onHome: { screen = .hub })
        case .prep:
            PracticeStoryView(
                pages: StoryLibrary.prepPages(childName: store.childName).map { $0.speaking(as: store.companionName) },
                heading: "Preparing for my operation",
                recordsProgress: true,
                doneTitle: "You know these helpers",
                doneDetail: "You met the clothes, the body checks, the cuff, the IV pole, and the sleepy-air mask. You can ask questions, hold a hand, and play this tour again.",
                doneButton: "Back to home",
                onLeave: { screen = .hub },
                onDone: { screen = .hub }
            )
        case .hub, .rewards:
            childTabs
        }
    }

    private var childTabs: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Hi, \(childName)")
                    .font(jakarta(22, .extraBold))
                    .foregroundStyle(Theme.teal)
                Spacer(minLength: 8)
                Button {
                    password = ""
                    lockNote = ""
                    showPassword = true
                } label: {
                    Label("Grown-up", systemImage: "lock.fill")
                        .font(jakarta(13, .bold))
                        .foregroundStyle(Theme.teal)
                        .padding(.horizontal, 12)
                        .frame(height: 36)
                        .background(Color.white, in: Capsule())
                        .overlay(Capsule().stroke(Theme.border, lineWidth: 1))
                }
                .buttonStyle(KidButtonStyle())
                .accessibilityLabel("Grown-up password")
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 4)

            Group {
                if tab == .play {
                    QuestHubView(
                        openStory: { screen = .story },
                        openGame: { screen = .game },
                        openPrep: { screen = .prep },
                        openDemos: { screen = .demos }
                    )
                } else {
                    RewardsBearView(showsParentTools: false)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .kidCanvas()
        .safeAreaInset(edge: .bottom, spacing: 0) {
            childTabBar
        }
        .sheet(isPresented: $showPassword) {
            parentPasswordSheet
        }
    }

    private var childTabBar: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(Theme.border)
                .frame(height: 1)
            HStack(spacing: 0) {
                ForEach(ChildTab.allCases) { item in
                    let selected = tab == item
                    Button {
                        tab = item
                        screen = item == .rewards ? .rewards : .hub
                    }                     label: {
                        LabeledTabItem(title: item.title, systemImage: item.symbol, isSelected: selected)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(item.title)
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
        }
        .background(Theme.bg)
    }

    private var parentPasswordSheet: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Grown-up password")
                .font(jakarta(24, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("Type the account password to open the parent view.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            SecureField("Password", text: $password)
                .font(jakarta(16, .medium))
                .padding(14)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Theme.border, lineWidth: 1)
                )
                .textContentType(.password)
            if !lockNote.isEmpty {
                Text(lockNote)
                    .font(jakarta(13, .semibold))
                    .foregroundStyle(Theme.terra)
            }
            Button(action: submitPassword) {
                Text("Open parent view")
                    .font(jakarta(16, .bold))
                    .foregroundStyle(Theme.onPrimary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Theme.brandPrimary, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(KidButtonStyle())
            Button {
                showPassword = false
                password = ""
                lockNote = ""
            } label: {
                Text("Stay here")
                    .font(jakarta(16, .bold))
                    .foregroundStyle(Theme.teal)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
            }
            .buttonStyle(KidButtonStyle())
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(Theme.bg)
        .presentationDetents([.medium])
        .presentationBackground(Theme.bg)
    }

    private func submitPassword() {
        guard store.hasPassword else {
            lockNote = "Save the account password from the parent profile first."
            return
        }
        guard store.passwordMatches(password) else {
            lockNote = "That password does not match."
            password = ""
            return
        }
        password = ""
        lockNote = ""
        showPassword = false
        actions.leaveChild()
    }
}

struct QuestHubView: View {
    @Environment(CareStore.self) private var store
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Environment(\.dynamicTypeSize) private var typeSize
    var openStory: () -> Void
    var openGame: () -> Void
    var openPrep: () -> Void
    var openDemos: () -> Void

    private var showPrepGame: Bool {
        store.prepGameEnabled || ProcessInfo.processInfo.arguments.contains("--prep-game")
    }

    var body: some View {
        Group {
            if sizeClass == .regular {
                padHub
            } else {
                phoneHub
            }
        }
        .kidCanvas()
    }

    private var leadsWithPrep: Bool { showPrepGame }

    private var primaryTitle: String {
        leadsWithPrep ? "Let's get ready" : "Let's read together"
    }

    private var primaryAction: () -> Void {
        leadsWithPrep ? openPrep : openStory
    }

    private var activityColumns: [GridItem] {
        if typeSize.isAccessibilitySize {
            return [GridItem(.flexible())]
        }
        return [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    }

    private var phoneHub: some View {
        GeometryReader { geo in
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    homeStage(bear: min(geo.size.height * 0.42, 320))
                    activityGrid
                    todoList
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
                .readableColumn()
            }
            .scrollIndicators(.hidden)
        }
    }

    private var padHub: some View {
        GeometryReader { geo in
            let bear = min(geo.size.height * 0.5, 360)
            HStack(alignment: .center, spacing: 28) {
                homeStage(bear: bear)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        activityGrid
                        todoList
                    }
                    .padding(.bottom, 8)
                }
                .scrollIndicators(.hidden)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(.horizontal, 28)
            .padding(.vertical, 8)
        }
    }

    private func homeStage(bear: CGFloat) -> some View {
        VStack(spacing: 12) {
            BearSpeechBubble(
                speaker: store.companionName,
                text: "Hi! Ready to play and learn?",
                compact: true
            )
            .frame(maxWidth: bear * 1.05)
            BearStage(size: bear, mood: store.bearMood, showsStatus: true)
            VStack(spacing: 4) {
                Text(store.bearMood.title(called: store.companionName))
                    .font(AppType.section)
                    .foregroundStyle(Theme.textPrimary)
                    .multilineTextAlignment(.center)
                Text(store.bearMood.detail(called: store.companionName))
                    .font(AppType.supporting)
                    .foregroundStyle(Theme.textPrimary)
                    .multilineTextAlignment(.center)
            }
            .fixedSize(horizontal: false, vertical: true)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .frame(maxWidth: bear * 1.2)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Theme.brandPrimary.opacity(0.35), lineWidth: 1)
            )
            NameBearButton()
            PrimaryButton(title: primaryTitle, systemImage: "sparkles", action: primaryAction)
        }
        .frame(maxWidth: .infinity)
    }

    private var activityGrid: some View {
        let prepPages = StoryLibrary.prepPages(childName: store.childName).map { $0.speaking(as: store.companionName) }
        let prepDone = prepPages.filter { store.isStoryCleared($0.id) }.count
        return LazyVGrid(columns: activityColumns, spacing: 12) {
            ActivityCard(
                symbol: "play.rectangle.fill",
                title: "Watch care demos",
                detail: "See the cuff, IV, mask, and liquid medicine with a grown-up.",
                meta: "4 little stories",
                tint: Theme.brandAccent,
                action: openDemos
            )
            if showPrepGame && !leadsWithPrep {
                ActivityCard(
                    symbol: "cross.case.fill",
                    title: "Preparing for my operation",
                    detail: "Meet scrubs, vitals, the cuff, the IV, and the mask.",
                    meta: prepDone == prepPages.count ? "Finished" : "\(prepPages.count) pages",
                    tint: Theme.brandSecondary,
                    action: openPrep
                )
            }
            if leadsWithPrep {
                ActivityCard(
                    symbol: "book.fill",
                    title: "\(store.companionName)'s story",
                    detail: store.parentInstructions.isEmpty
                        ? "A short hello while care steps are on the way."
                        : "A question on every page.",
                    meta: store.storyFinished ? "Finished" : "\(store.storyPages.count) pages",
                    tint: Theme.brandPrimary,
                    action: openStory
                )
            }
            ActivityCard(
                symbol: "gamecontroller.fill",
                title: "Remember game",
                detail: "Listen, then tap the care step.",
                meta: store.parentInstructions.isEmpty ? "Waiting" : "\(store.parentInstructions.count) steps",
                tint: Theme.brandSecondary,
                action: openGame
            )
        }
    }

    private var todoList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("To-dos")
                .font(jakarta(18, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("Each finished to-do adds 2 stars toward badges.")
                .font(jakarta(13, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            if store.doses.isEmpty {
                Text("A grown-up has not added care steps yet.")
                    .font(jakarta(14, .medium))
                    .foregroundStyle(Theme.muted)
            } else {
                ForEach(store.doses) { dose in
                    todoRow(dose)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private func todoRow(_ dose: Dose) -> some View {
        let done = dose.status == .done
        return Button {
            store.completeCareStep(id: dose.id)
        } label: {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: done ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(done ? Theme.teal : Theme.subtle)
                VStack(alignment: .leading, spacing: 2) {
                    Text(dose.name)
                        .font(jakarta(16, .bold))
                        .foregroundStyle(done ? Theme.muted : Theme.teal)
                        .strikethrough(done)
                    if !dose.detail.isEmpty {
                        Text(dose.detail)
                            .font(jakarta(13, .medium))
                            .foregroundStyle(Theme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, 6)
        }
        .buttonStyle(KidButtonStyle())
        .disabled(done)
        .accessibilityLabel(done ? "\(dose.name), done" : "\(dose.name), to do")
    }

    private func hubCard(symbol: String, title: String, detail: String, meta: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: symbol)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(Theme.onPrimary)
                    .frame(width: 48, height: 48)
                    .background(Theme.brandPrimary, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(jakarta(17, .extraBold))
                        .foregroundStyle(Theme.teal)
                    Text(detail)
                        .font(jakarta(13, .medium))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(meta)
                        .font(jakarta(12, .bold))
                        .foregroundStyle(Theme.subtle)
                }
                Spacer(minLength: 4)
                Image(systemName: "arrow.right")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.teal)
                    .frame(width: 36, height: 36)
                    .background(Theme.tealSoft, in: Circle())
            }
            .padding(14)
            .card(border: Theme.teal.opacity(0.35), lineWidth: 1.5)
        }
        .buttonStyle(KidButtonStyle())
    }
}

private enum StoryPhase {
    case reading
    case trying
    case question
    case tryAgain
    case correct
    case revealed
    case done

    var savedName: String {
        switch self {
        case .reading: "reading"
        case .trying: "trying"
        case .question: "question"
        case .tryAgain: "tryAgain"
        case .correct: "correct"
        case .revealed: "revealed"
        case .done: "done"
        }
    }

    init?(savedName: String) {
        switch savedName {
        case "reading": self = .reading
        case "trying": self = .trying
        case "question": self = .question
        case "tryAgain": self = .tryAgain
        case "correct": self = .correct
        case "revealed": self = .revealed
        case "done": self = .done
        default: return nil
        }
    }
}

private func restoredStoryPlace(pages: [StoryPage], pageID: String, phaseName: String, isCleared: (String) -> Bool) -> (index: Int, phase: StoryPhase) {
    guard !pages.isEmpty else { return (0, .reading) }
    let last = pages.count - 1
    if phaseName == StoryPhase.done.savedName, pages.allSatisfy({ isCleared($0.id) }) {
        return (last, .done)
    }
    if let found = pages.firstIndex(where: { $0.id == pageID }),
       let restored = StoryPhase(savedName: phaseName),
       restored != .done {
        return (found, restored)
    }
    if let next = pages.firstIndex(where: { !isCleared($0.id) }) {
        return (next, .reading)
    }
    return (last, .done)
}

/// Gives the story text its own height and the leftover space to the bear.
private struct StoryBookLayout: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        proposal.replacingUnspecifiedDimensions()
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard subviews.count == 2 else { return }
        let width = bounds.width
        let ideal = subviews[1].sizeThatFits(ProposedViewSize(width: width, height: nil)).height
        let textHeight = min(max(ideal, 0), bounds.height * 0.62)
        let stage = max(bounds.height - textHeight, 0)
        subviews[0].place(
            at: CGPoint(x: bounds.minX, y: bounds.minY),
            anchor: .topLeading,
            proposal: ProposedViewSize(width: width, height: stage)
        )
        subviews[1].place(
            at: CGPoint(x: bounds.minX, y: bounds.minY + stage),
            anchor: .topLeading,
            proposal: ProposedViewSize(width: width, height: textHeight)
        )
    }
}

private struct StoryBookStage<Bear: View, Words: View>: View {
    @ViewBuilder var bear: (CGFloat) -> Bear
    @ViewBuilder var words: () -> Words

    var body: some View {
        StoryBookLayout {
            GeometryReader { proxy in
                bear(proxy.size.height)
                    .frame(width: proxy.size.width, height: proxy.size.height)
            }
            ViewThatFits(in: .vertical) {
                wordBlock
                ScrollView {
                    wordBlock
                }
                .scrollIndicators(.hidden)
            }
        }
    }

    private var wordBlock: some View {
        words()
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 10)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .top)
    }
}

struct StoryGameView: View {
    var onHome: () -> Void
    var onGame: () -> Void

    @Environment(CareStore.self) private var store
    @Environment(\.scenePhase) private var scenePhase
    @State private var index = 0
    @State private var phase: StoryPhase = .reading
    @State private var selectedID: String?
    @State private var didStart = false
    @State private var speaker = StorySpeaker()
    @State private var speakTask: Task<Void, Never>?
    @State private var animationPauseToken = 0

    private var pages: [StoryPage] {
        store.storyPages.map { $0.adapted(for: store.childAgeYears) }
    }

    private var page: StoryPage {
        pages[index]
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            if phase == .done {
                doneScroll
            } else {
                storyScroll
            }
            pageControls
        }
        .kidCanvas()
        .onAppear {
            startIfNeeded()
            scheduleSpeech()
        }
        .onDisappear {
            rememberPlace()
            speakTask?.cancel()
            speaker.stop()
        }
        .onChange(of: narrationKey) { _, _ in
            rememberPlace()
            scheduleSpeech()
        }
        .onChange(of: scenePhase) { _, phase in
            if phase != .active {
                rememberPlace()
                speakTask?.cancel()
                speaker.stop()
            }
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            HStack(spacing: 0) {
                Text("Kare")
                Text("BEAR")
                    .foregroundStyle(Theme.terra)
            }
            .font(jakarta(20, .extraBold))
            .foregroundStyle(Theme.teal)
            Button(action: goHome) {
                Label("Home", systemImage: "house.fill")
                    .font(jakarta(12, .bold))
                    .foregroundStyle(Theme.teal)
                    .padding(.horizontal, 10)
                    .frame(height: 34)
                    .background(Color.white, in: Capsule())
                    .overlay(Capsule().stroke(Theme.teal.opacity(0.35), lineWidth: 1))
            }
            .buttonStyle(KidButtonStyle())
            Spacer(minLength: 4)
            Text(phase == .done ? "Done" : "Page \(index + 1) of \(pages.count)")
                .font(jakarta(12, .bold))
                .foregroundStyle(Theme.muted)
                .lineLimit(1)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Theme.bg)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }

    @ViewBuilder
    private var storyScroll: some View {
        if let animation = StoryAnimationLibrary.scene(forPageID: page.id), phase == .reading || phase == .tryAgain {
            ScrollView {
                VStack(spacing: 20) {
                    animationPlayer(animation)
                    storyWords
                }
                .padding(16)
                .readableColumn(compact: 620)
            }
        } else {
            StoryBookStage { stage in
                storyBear(size: stage)
            } words: {
                storyWords.readableColumn()
            }
        }
    }

    private func animationPlayer(_ scene: StoryAnimationScene) -> some View {
        StoryAnimationPlayer(scene: scene, bearName: store.companionName, pauseToken: animationPauseToken) { caption in
            speakTask?.cancel()
            speaker.stop()
            speaker.speak(caption, ageYears: store.childAgeYears, force: true)
        } stopNarration: {
            speakTask?.cancel()
            speaker.stop()
        }
        .id("\(page.id)-\(phase.savedName)")
    }

    private func storyBear(size: CGFloat) -> some View {
        BearBadge(
            size: max(size - 6, 120),
            speaking: speaker.isSpeaking,
            speechMark: speaker.speechMark
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var storyWords: some View {
        VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(store.companionName)'s story · Page \(index + 1) of \(pages.count)")
                            .font(jakarta(20, .bold))
                            .foregroundStyle(Theme.teal)
                        Text(page.title)
                            .font(jakarta(36, .extraBold))
                            .foregroundStyle(Theme.teal)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 8)
                    Button {
                        if speaker.isSpeaking {
                            speakTask?.cancel()
                            speaker.stop()
                        } else {
                            scheduleSpeech(force: true)
                        }
                    } label: {
                        Label(speaker.isSpeaking ? "Stop" : "Listen", systemImage: speaker.isSpeaking ? "stop.fill" : "speaker.wave.2.fill")
                            .font(jakarta(20, .bold))
                            .foregroundStyle(Theme.teal)
                            .padding(.horizontal, 16)
                            .frame(height: 48)
                            .background(Color.white, in: Capsule())
                            .overlay(Capsule().stroke(Theme.teal.opacity(0.35), lineWidth: 1.5))
                    }
                    .buttonStyle(KidButtonStyle())
                }

                if phase == .reading || phase == .tryAgain {
                    speechCard
                    if phase == .tryAgain {
                        feedback(StoryLibrary.firstMiss, tone: .retry)
                    }
                } else {
                    questionBlock
                }
        }
    }

    private var speechCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(store.companionName) says:")
                .font(jakarta(22, .bold))
                .foregroundStyle(Theme.teal)
            Text("“\(page.speech)”")
                .font(jakarta(28, .semibold))
                .foregroundStyle(Theme.text)
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)
            Text(page.more)
                .font(jakarta(20, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(Theme.teal.opacity(0.45), lineWidth: 1.5)
        )
    }

    private var questionBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your turn")
                .font(jakarta(22, .bold))
                .foregroundStyle(Theme.teal)
            Text(page.question)
                .font(jakarta(32, .extraBold))
                .foregroundStyle(Theme.text)
                .fixedSize(horizontal: false, vertical: true)
            if page.isTalkActivity {
                talkActivity(page) {
                    store.clearStory(page.id, needsTalk: false)
                    phase = .correct
                }
            } else {
                Text("Tap one answer. You can listen again any time.")
                    .font(jakarta(16, .medium))
                    .foregroundStyle(Theme.muted)
                ForEach(page.choices) { choice in
                    choiceButton(choice)
                }
            }
            if phase == .correct {
                feedback("\(page.isTalkActivity ? "You practised together!" : "You got it!") \(page.reveal)", tone: .good)
            } else if phase == .revealed {
                feedback(page.reveal, tone: .talk)
            }
        }
    }

    private func talkActivity(_ page: StoryPage, onPracticed: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Practise with your grown-up", systemImage: "bubble.left.and.bubble.right.fill")
                .font(jakarta(18, .bold))
                .foregroundStyle(Theme.teal)
            Text("You can talk, point, or show. Ask for help with any words you do not know.")
                .font(jakarta(20, .medium))
                .foregroundStyle(Theme.text)
            if phase == .question {
                Button(action: onPracticed) {
                    Label("We talked it through", systemImage: "checkmark.circle.fill")
                        .font(jakarta(22, .bold))
                        .foregroundStyle(.white)
                        .padding(16)
                        .frame(maxWidth: .infinity, minHeight: 64)
                        .background(Theme.teal, in: RoundedRectangle(cornerRadius: 18))
                }
                .buttonStyle(KidButtonStyle())
            }
        }
        .padding(16)
        .card(fill: Theme.tealSoft, border: Theme.tealBorder)
    }

    private func choiceButton(_ choice: StoryChoice) -> some View {
        let locked = phase == .correct || phase == .revealed
        let selected = selectedID == choice.id
        let showCorrect = locked && choice.isCorrect
        return Button {
            answer(choice)
        } label: {
            HStack(spacing: 12) {
                Image(systemName: choice.symbol)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(showCorrect ? Theme.onPrimary : Theme.teal)
                    .frame(width: 44, height: 44)
                    .background(showCorrect ? Theme.brandPrimary : Theme.tealSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                Text(choice.label)
                    .font(jakarta(26, .bold))
                    .foregroundStyle(Theme.text)
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 4)
                if showCorrect {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Theme.teal)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, minHeight: 84, alignment: .leading)
            .card(
                fill: showCorrect ? Theme.tealSoft : .white,
                border: showCorrect ? Theme.teal : (selected ? Theme.terra : Theme.border),
                radius: 18,
                lineWidth: showCorrect || selected ? 2 : 1
            )
        }
        .buttonStyle(KidButtonStyle())
        .disabled(locked)
        .accessibilityLabel(choice.label)
    }

    private func feedback(_ text: String, tone: FeedbackTone) -> some View {
        Text(text)
            .font(jakarta(26, .bold))
            .foregroundStyle(tone == .good ? Theme.teal : Theme.text)
            .lineSpacing(4)
            .fixedSize(horizontal: false, vertical: true)
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tone == .retry ? Theme.terraSoft : Theme.tealSoft, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var pageControls: some View {
        HStack(spacing: 10) {
            Button(action: goBack) {
                Text("Back")
                    .font(jakarta(16, .bold))
                    .foregroundStyle(canGoBack ? Theme.brandPrimary : Theme.brandPrimary.opacity(0.35))
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }
            .buttonStyle(KidButtonStyle())
            .disabled(!canGoBack)
            .accessibilityLabel(phase == .done ? "Back to the last page" : "Back")
            if phase != .done {
                Button(action: goForward) {
                    Text(forwardTitle)
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.onPrimary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(canGoForward ? Theme.brandPrimary : Theme.brandPrimary.opacity(0.35), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(KidButtonStyle())
                .disabled(!canGoForward)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Theme.bg)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }

    private var canGoBack: Bool {
        switch phase {
        case .reading:
            index > 0
        case .done:
            !pages.isEmpty
        default:
            true
        }
    }

    private var forwardTitle: String {
        switch phase {
        case .reading:
            return store.isStoryCleared(page.id) ? "Next page" : (page.isTalkActivity ? "Try it together" : "Your turn")
        case .tryAgain:
            return "Try another answer"
        case .question:
            return "Choose one"
        case .correct, .revealed:
            return index + 1 < pages.count ? "Next" : "Finish"
        case .done:
            return "Done"
        case .trying:
            return "Choose one"
        }
    }

    private var canGoForward: Bool {
        switch phase {
        case .question:
            false
        default:
            true
        }
    }

    private var doneScroll: some View {
        ScrollView {
            VStack(spacing: 14) {
                BearBadge(
                    size: 140,
                    mood: store.bearMood,
                    showsStatus: true,
                    speaking: speaker.isSpeaking,
                    speechMark: speaker.speechMark
                )
                if !store.parentInstructions.isEmpty {
                    TranscriptGroundingNote(compact: true)
                }
                Text("You finished \(store.companionName)'s story")
                    .font(jakarta(26, .extraBold))
                    .foregroundStyle(Theme.teal)
                    .multilineTextAlignment(.center)
                Text(store.parentInstructions.isEmpty
                     ? "When a grown-up adds care steps, \(store.companionName) will teach those next."
                     : "You learned the care steps. The Rewards tab is where you help \(store.companionName) follow them.")
                    .font(jakarta(15, .medium))
                    .foregroundStyle(Theme.muted)
                    .multilineTextAlignment(.center)
                if !store.storyTalk.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Talk about these with a grown-up")
                            .font(jakarta(16, .extraBold))
                            .foregroundStyle(Theme.teal)
                        ForEach(store.storyTalk, id: \.self) { id in
                            if let match = pages.first(where: { $0.id == id }) {
                                Text(match.title)
                                    .font(jakarta(15, .semibold))
                                    .foregroundStyle(Theme.text)
                            }
                        }
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .card(fill: Theme.terraSoft, border: Theme.terraBorder)
                }
                Button(action: onGame) {
                    Text("Play the remember game")
                        .font(jakarta(17, .bold))
                        .foregroundStyle(Theme.onPrimary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(Theme.brandPrimary, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(KidButtonStyle())
                Button(action: goHome) {
                    Text("Back to home")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                }
                .buttonStyle(KidButtonStyle())
            }
            .padding(20)
            .readableColumn()
        }
        .scrollIndicators(.hidden)
    }

    private var narrationKey: String {
        phase == .done ? "done" : "\(index)-\(phase)"
    }

    private func startIfNeeded() {
        guard !didStart else { return }
        didStart = true
        let place = restoredStoryPlace(
            pages: pages,
            pageID: store.storySpotPageID,
            phaseName: store.storySpotPhase,
            isCleared: store.isStoryCleared
        )
        index = place.index
        phase = place.phase
    }

    private func rememberPlace() {
        guard didStart, pages.indices.contains(index) else { return }
        let pageID = phase == .done ? "" : pages[index].id
        store.rememberStorySpot(pageID: pageID, phase: phase.savedName)
    }

    private func scheduleSpeech(force: Bool = false) {
        speakTask?.cancel()
        if force {
            animationPauseToken += 1
            speakTask = nil
            speakCurrent(force: true)
            return
        }
        speakTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 280_000_000)
            guard !Task.isCancelled else { return }
            speakCurrent(force: false)
        }
    }

    private func speakCurrent(force: Bool) {
        guard !pages.isEmpty else { return }
        if !force, UIAccessibility.isVoiceOverRunning { return }
        let line = phase == .done
            ? "You finished the story. You can come back and practice any time."
            : StoryVoice.script(page: page, phase: phase)
        speaker.speak(line, ageYears: store.childAgeYears, force: force)
    }

    private func goHome() {
        rememberPlace()
        speakTask?.cancel()
        speaker.stop()
        onHome()
    }

    private func goBack() {
        speaker.stop()
        switch phase {
        case .question, .tryAgain, .correct, .revealed:
            phase = .reading
            selectedID = nil
        case .reading:
            guard index > 0 else { return }
            index -= 1
            selectedID = nil
            phase = .reading
        case .done:
            guard !pages.isEmpty else { return }
            phase = .reading
            index = pages.count - 1
            selectedID = nil
        case .trying:
            break
        }
    }

    private func goForward() {
        speaker.stop()
        switch phase {
        case .reading:
            if store.isStoryCleared(page.id) {
                advancePage()
            } else {
                phase = .question
                selectedID = nil
            }
        case .tryAgain:
            phase = .question
            selectedID = nil
        case .correct, .revealed:
            advancePage()
        case .question, .done:
            break
        case .trying:
            break
        }
    }

    private func advancePage() {
        selectedID = nil
        if index + 1 < pages.count {
            index += 1
            phase = .reading
        } else {
            phase = .done
        }
    }

    private func answer(_ choice: StoryChoice) {
        guard phase == .question else { return }
        selectedID = choice.id
        if choice.isCorrect {
            store.clearStory(page.id, needsTalk: false)
            phase = .correct
            return
        }
        let misses = store.storyMissCount(page.id) + 1
        store.noteStoryMiss(page.id)
        if misses >= 2 {
            store.clearStory(page.id, needsTalk: true)
            phase = .revealed
        } else {
            phase = .tryAgain
        }
    }
}

struct PracticeStoryView: View {
    let pages: [StoryPage]
    var heading: String
    var recordsProgress: Bool
    var doneTitle: String
    var doneDetail: String
    var doneButton: String
    var onLeave: () -> Void
    var onDone: () -> Void

    @Environment(CareStore.self) private var store
    @Environment(\.scenePhase) private var scenePhase
    @State private var index = 0
    @State private var phase: StoryPhase = .reading
    @State private var localMisses: [String: Int] = [:]
    @State private var selectedID: String?
    @State private var triedPages: Set<String> = []
    @State private var didStart = false
    @State private var speaker = StorySpeaker()
    @State private var speakTask: Task<Void, Never>?
    @State private var animationPauseToken = 0

    private var page: StoryPage? {
        pages.indices.contains(index) ? pages[index].adapted(for: store.childAgeYears) : nil
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            if pages.isEmpty {
                Text("This game has no pages yet.")
                    .font(jakarta(16, .medium))
                    .foregroundStyle(Theme.muted)
                    .padding(24)
                Spacer()
            } else if phase == .done {
                doneScroll
            } else if let page {
                storyScroll(page)
            }
            if !pages.isEmpty {
                pageControls
            }
        }
        .kidCanvas()
        .onAppear {
            startIfNeeded()
            scheduleSpeech()
        }
        .onDisappear {
            rememberPlace()
            speakTask?.cancel()
            speaker.stop()
        }
        .onChange(of: narrationKey) { _, _ in
            rememberPlace()
            scheduleSpeech()
        }
        .onChange(of: scenePhase) { _, phase in
            if phase != .active {
                rememberPlace()
                speakTask?.cancel()
                speaker.stop()
            }
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            Button(action: leave) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.teal)
                    .frame(width: 40, height: 40)
                    .background(Color.white, in: Circle())
                    .overlay(Circle().stroke(Theme.border, lineWidth: 1))
            }
            .buttonStyle(KidButtonStyle())
            .accessibilityLabel("Back")
            Text(heading)
                .font(jakarta(16, .extraBold))
                .foregroundStyle(Theme.teal)
                .lineLimit(1)
            Spacer(minLength: 4)
            Text(phase == .done ? "Done" : "Page \(index + 1) of \(max(pages.count, 1))")
                .font(jakarta(12, .bold))
                .foregroundStyle(Theme.muted)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Theme.bg)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }

    @ViewBuilder
    private func storyScroll(_ page: StoryPage) -> some View {
        if let animation = StoryAnimationLibrary.scene(forPageID: page.id), phase == .reading || phase == .trying || phase == .tryAgain {
            ScrollView {
                VStack(spacing: 20) {
                    StoryAnimationPlayer(scene: animation, bearName: store.companionName, pauseToken: animationPauseToken) { caption in
                        speakTask?.cancel()
                        speaker.stop()
                        speaker.speak(caption, ageYears: store.childAgeYears, force: true)
                    } stopNarration: {
                        speakTask?.cancel()
                        speaker.stop()
                    }
                    .id("\(page.id)-\(phase.savedName)")
                    prepWords(page)
                }
                .padding(16)
                .readableColumn(compact: 620)
            }
        } else {
            StoryBookStage { stage in
                BearBadge(size: max(stage - 6, 120), speaking: speaker.isSpeaking, speechMark: speaker.speechMark)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } words: {
                prepWords(page).readableColumn(compact: 520)
            }
        }
    }

    private func prepWords(_ page: StoryPage) -> some View {
        VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    Text(page.title)
                        .font(jakarta(36, .extraBold))
                        .foregroundStyle(Theme.teal)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 8)
                    Button {
                        if speaker.isSpeaking {
                            speakTask?.cancel()
                            speaker.stop()
                        } else {
                            scheduleSpeech(force: true)
                        }
                    } label: {
                        Label(speaker.isSpeaking ? "Stop" : "Listen", systemImage: speaker.isSpeaking ? "stop.fill" : "speaker.wave.2.fill")
                            .font(jakarta(20, .bold))
                            .foregroundStyle(Theme.teal)
                            .padding(.horizontal, 12)
                            .frame(height: 48)
                            .background(Color.white, in: Capsule())
                            .overlay(Capsule().stroke(Theme.teal.opacity(0.35), lineWidth: 1.5))
                    }
                    .buttonStyle(KidButtonStyle())
                }

                if phase == .reading || phase == .tryAgain {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(store.companionName) says:")
                            .font(jakarta(22, .bold))
                            .foregroundStyle(Theme.teal)
                        Text("“\(page.speech)”")
                            .font(jakarta(28, .semibold))
                            .foregroundStyle(Theme.text)
                            .lineSpacing(5)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(page.more)
                            .font(jakarta(20, .medium))
                            .foregroundStyle(Theme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(Theme.teal.opacity(0.45), lineWidth: 1.5)
                    )
                    if phase == .tryAgain {
                        feedback(StoryLibrary.firstMiss, tone: .retry)
                    }
                } else if phase == .trying, let gear = page.gear {
                    let tried = triedPages.contains(page.id)
                    VStack(alignment: .leading, spacing: 12) {
                        Label(page.tryTitle ?? "Try it together", systemImage: page.symbol)
                            .font(jakarta(28, .extraBold))
                            .foregroundStyle(Theme.teal)
                        Text(page.tryDetail ?? "Explore this together with your grown-up.")
                            .font(jakarta(24, .semibold))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                        if tried {
                            feedback(gear.doneLine(bear: store.companionName), tone: .good)
                        } else {
                            Button { applyGear(page) } label: {
                                Label("We tried it", systemImage: "sparkles")
                                    .font(jakarta(24, .bold))
                                    .foregroundStyle(.white)
                                    .padding(18)
                                    .frame(maxWidth: .infinity, minHeight: 68)
                                    .background(Theme.teal, in: RoundedRectangle(cornerRadius: 18))
                            }
                            .buttonStyle(KidButtonStyle())
                            Button("Go to the question") {
                                speaker.stop()
                                selectedID = nil
                                phase = .question
                            }
                            .font(jakarta(18, .bold))
                            .foregroundStyle(Theme.teal)
                            .frame(minHeight: 48)
                        }
                    }
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Your turn")
                            .font(jakarta(22, .bold))
                            .foregroundStyle(Theme.teal)
                        Text(page.question)
                            .font(jakarta(32, .extraBold))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                        if page.isTalkActivity {
                            talkActivity(page) {
                                if recordsProgress { store.clearStory(page.id, needsTalk: false) }
                                phase = .correct
                            }
                        } else {
                            Text("Tap one answer. You can listen again any time.")
                                .font(jakarta(16, .medium))
                                .foregroundStyle(Theme.muted)
                            ForEach(page.choices) { choice in
                                choiceButton(choice, page: page)
                            }
                        }
                        if phase == .correct {
                            feedback("\(page.isTalkActivity ? "You practised together!" : "You got it!") \(page.reveal)", tone: .good)
                        } else if phase == .revealed {
                            feedback(page.reveal, tone: .talk)
                        }
                    }
                }
        }
    }

    private var doneScroll: some View {
        ScrollView {
            VStack(spacing: 14) {
                BearBadge(
                    size: 140,
                    mood: .bright,
                    speaking: speaker.isSpeaking,
                    speechMark: speaker.speechMark
                )
                Text(doneTitle)
                    .font(jakarta(26, .extraBold))
                    .foregroundStyle(Theme.teal)
                    .multilineTextAlignment(.center)
                Text(doneDetail)
                    .font(jakarta(15, .medium))
                    .foregroundStyle(Theme.muted)
                    .multilineTextAlignment(.center)
                Button(action: replayChecks) {
                    Text("Explore again")
                        .font(jakarta(17, .bold))
                        .foregroundStyle(Theme.onPrimary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(Theme.brandPrimary, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(KidButtonStyle())
                Button(action: onDone) {
                    Text(doneButton)
                        .font(jakarta(17, .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                }
                .buttonStyle(KidButtonStyle())
            }
            .padding(20)
            .readableColumn(compact: 520)
        }
        .scrollIndicators(.hidden)
    }

    private func talkActivity(_ page: StoryPage, onPracticed: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Practise with your grown-up", systemImage: "bubble.left.and.bubble.right.fill")
                .font(jakarta(18, .bold))
                .foregroundStyle(Theme.teal)
            Text("You can talk, point, or show. Ask for help with any words you do not know.")
                .font(jakarta(20, .medium))
                .foregroundStyle(Theme.text)
            if phase == .question {
                Button(action: onPracticed) {
                    Label("We talked it through", systemImage: "checkmark.circle.fill")
                        .font(jakarta(22, .bold))
                        .foregroundStyle(.white)
                        .padding(16)
                        .frame(maxWidth: .infinity, minHeight: 64)
                        .background(Theme.teal, in: RoundedRectangle(cornerRadius: 18))
                }
                .buttonStyle(KidButtonStyle())
            }
        }
        .padding(16)
        .card(fill: Theme.tealSoft, border: Theme.tealBorder)
    }

    private func choiceButton(_ choice: StoryChoice, page: StoryPage) -> some View {
        let locked = phase == .correct || phase == .revealed
        let selected = selectedID == choice.id
        let showCorrect = locked && choice.isCorrect
        return Button {
            answer(choice, page: page)
        } label: {
            HStack(spacing: 12) {
                Image(systemName: choice.symbol)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(showCorrect ? Theme.onPrimary : Theme.teal)
                    .frame(width: 44, height: 44)
                    .background(showCorrect ? Theme.brandPrimary : Theme.tealSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                Text(choice.label)
                    .font(jakarta(26, .bold))
                    .foregroundStyle(Theme.text)
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 4)
                if showCorrect {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Theme.teal)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, minHeight: 84, alignment: .leading)
            .card(
                fill: showCorrect ? Theme.tealSoft : .white,
                border: showCorrect ? Theme.teal : (selected ? Theme.terra : Theme.border),
                radius: 18,
                lineWidth: showCorrect || selected ? 2 : 1
            )
        }
        .buttonStyle(KidButtonStyle())
        .disabled(locked)
    }

    private func feedback(_ text: String, tone: FeedbackTone) -> some View {
        Text(text)
            .font(jakarta(26, .bold))
            .foregroundStyle(tone == .good ? Theme.teal : Theme.text)
            .lineSpacing(4)
            .fixedSize(horizontal: false, vertical: true)
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tone == .retry ? Theme.terraSoft : Theme.tealSoft, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var forwardTitle: String {
        switch phase {
        case .reading:
            page?.isTalkActivity == true ? "Try it together" : (page?.gear == nil ? "Your turn" : "Try it")
        case .trying:
            "Your turn"
        case .tryAgain:
            "Try another answer"
        case .correct, .revealed:
            index + 1 < pages.count ? "Next" : "Finish"
        default:
            "Choose one"
        }
    }

    private var pageControls: some View {
        HStack(spacing: 10) {
            Button(action: goBack) {
                Text("Back")
                    .font(jakarta(16, .bold))
                    .foregroundStyle(canGoBack ? Theme.brandPrimary : Theme.brandPrimary.opacity(0.35))
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }
            .buttonStyle(KidButtonStyle())
            .disabled(!canGoBack)
            .accessibilityLabel(phase == .done ? "Back to the last page" : "Back")
            if phase != .done {
                Button(action: goForward) {
                    Text(forwardTitle)
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.onPrimary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(canGoForward ? Theme.brandPrimary : Theme.brandPrimary.opacity(0.35), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(KidButtonStyle())
                .disabled(!canGoForward)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Theme.bg)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }

    private var canGoBack: Bool {
        switch phase {
        case .reading:
            index > 0
        case .done:
            !pages.isEmpty
        default:
            true
        }
    }

    private var canGoForward: Bool {
        switch phase {
        case .question:
            return false
        case .trying:
            if let page { return triedPages.contains(page.id) }
            return false
        default:
            return true
        }
    }

    private var narrationKey: String {
        phase == .done ? "done" : "\(index)-\(phase)"
    }

    private func startIfNeeded() {
        guard !didStart else { return }
        didStart = true
        guard recordsProgress, !pages.isEmpty else { return }
        let place = restoredStoryPlace(
            pages: pages,
            pageID: store.prepSpotPageID,
            phaseName: store.prepSpotPhase,
            isCleared: store.isStoryCleared
        )
        index = place.index
        phase = place.phase
    }

    private func rememberPlace() {
        guard recordsProgress, didStart, pages.indices.contains(index) else { return }
        let pageID = phase == .done ? "" : pages[index].id
        store.rememberPrepSpot(pageID: pageID, phase: phase.savedName)
    }

    private func scheduleSpeech(force: Bool = false) {
        speakTask?.cancel()
        guard !pages.isEmpty else { return }
        if force {
            animationPauseToken += 1
            speakTask = nil
            speakCurrent(force: true)
            return
        }
        speakTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 280_000_000)
            guard !Task.isCancelled else { return }
            speakCurrent(force: false)
        }
    }

    private func speakCurrent(force: Bool) {
        guard !pages.isEmpty else { return }
        if !force, UIAccessibility.isVoiceOverRunning { return }
        if phase == .done {
            speaker.speak("\(doneTitle). You can come back and practice any time.", ageYears: store.childAgeYears, force: force)
            return
        }
        guard let page else { return }
        speaker.speak(StoryVoice.script(page: page, phase: phase), ageYears: store.childAgeYears, force: force)
    }

    private func applyGear(_ page: StoryPage) {
        guard page.gear != nil, !triedPages.contains(page.id) else { return }
        triedPages.insert(page.id)
        speaker.stop()
        speaker.speak(page.gear?.doneLine(bear: store.companionName) ?? "", ageYears: store.childAgeYears)
    }

    private func leave() {
        rememberPlace()
        speakTask?.cancel()
        speaker.stop()
        onLeave()
    }

    private func goBack() {
        speaker.stop()
        switch phase {
        case .question, .tryAgain, .correct, .revealed, .trying:
            phase = .reading
            selectedID = nil
        case .reading:
            guard index > 0 else { return }
            index -= 1
            selectedID = nil
            phase = .reading
        case .done:
            guard !pages.isEmpty else { return }
            phase = .reading
            index = pages.count - 1
            selectedID = nil
        }
    }

    private func goForward() {
        speaker.stop()
        guard pages.indices.contains(index) else { return }
        switch phase {
        case .reading:
            if pages[index].gear != nil, !triedPages.contains(pages[index].id) {
                selectedID = nil
                phase = .trying
            } else {
                phase = .question
                selectedID = nil
            }
        case .trying:
            guard triedPages.contains(pages[index].id) else { return }
            phase = .question
            selectedID = nil
        case .tryAgain:
            phase = .question
            selectedID = nil
        case .correct, .revealed:
            advance()
        case .question, .done:
            break
        }
    }

    private func replayChecks() {
        speaker.stop()
        guard !pages.isEmpty else { return }
        index = 0
        phase = .reading
        selectedID = nil
        triedPages = []
    }

    private func advance() {
        selectedID = nil
        if index + 1 < pages.count {
            index += 1
            phase = .reading
        } else {
            phase = .done
        }
    }

    private func answer(_ choice: StoryChoice, page: StoryPage) {
        guard phase == .question else { return }
        selectedID = choice.id
        if choice.isCorrect {
            if recordsProgress { store.clearStory(page.id, needsTalk: false) }
            phase = .correct
            return
        }
        let count = (recordsProgress ? store.storyMissCount(page.id) : (localMisses[page.id] ?? 0)) + 1
        if recordsProgress {
            store.noteStoryMiss(page.id)
        } else {
            localMisses[page.id] = count
        }
        if count >= 2 {
            if recordsProgress { store.clearStory(page.id, needsTalk: true) }
            phase = .revealed
        } else {
            phase = .tryAgain
        }
    }
}

struct RememberGameView: View {
    var onHome: () -> Void
    @Environment(CareStore.self) private var store
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var index = 0
    @State private var selectedID: String?
    @State private var answered = false
    @State private var solved: Set<String> = []
    @State private var speaker = StorySpeaker()

    private var note: ParentInstruction? {
        store.parentInstructions.indices.contains(index) ? store.parentInstructions[index] : nil
    }

    private var choices: [StoryChoice] {
        guard let note else { return [] }
        func key(_ text: String) -> String {
            text.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        }
        var titles: Set<String> = [key(note.title)]
        var result = [StoryChoice(id: note.id.uuidString, label: note.title, isCorrect: true, symbol: "list.clipboard.fill")]
        for other in store.parentInstructions where other.id != note.id {
            guard key(other.detail) != key(note.detail), titles.insert(key(other.title)).inserted else { continue }
            result.append(StoryChoice(id: other.id.uuidString, label: other.title, isCorrect: false, symbol: "list.clipboard.fill"))
            if result.count == (store.childAgeYears <= 6 ? 2 : 3) { break }
        }
        let offset = index % result.count
        return Array(result[offset...]) + Array(result[..<offset])
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button {
                    speaker.stop()
                    onHome()
                } label: {
                    Label("Back", systemImage: "chevron.left")
                        .font(jakarta(14, .bold))
                        .foregroundStyle(Theme.teal)
                        .padding(.horizontal, 12)
                        .frame(height: 44)
                        .background(Color.white, in: Capsule())
                }
                .buttonStyle(KidButtonStyle())
                Spacer()
                Text("Remember game")
                    .font(jakarta(14, .bold))
                    .foregroundStyle(Theme.muted)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            GeometryReader { geo in
                let stage = min(geo.size.height * 0.35, sizeClass == .regular ? 400 : 240)
                VStack(spacing: 0) {
                    BearBadge(size: stage * 0.86, mood: store.bearMood, showsStatus: true)
                        .frame(maxWidth: .infinity)
                        .frame(height: stage)
                    ScrollView {
                        rememberWords
                            .padding(.horizontal, 16)
                            .padding(.bottom, 24)
                            .readableColumn(compact: 520)
                    }
                    .scrollIndicators(.hidden)
                }
            }
        }
        .kidCanvas()
        .onDisappear { speaker.stop() }
    }

    private var rememberWords: some View {
        VStack(alignment: .leading, spacing: 16) {
            if store.parentInstructions.isEmpty {
                Text("No care steps yet")
                    .font(jakarta(26, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text("A grown-up can add your care steps. Then you can practise together.")
                    .font(jakarta(18, .medium))
                    .foregroundStyle(Theme.muted)
            } else if let note {
                let guided = choices.count < 2
                HStack {
                    Text("Step \(index + 1) of \(store.parentInstructions.count)")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.muted)
                    Spacer()
                    Button {
                        if speaker.isSpeaking {
                            speaker.stop()
                        } else {
                            let prompt = guided ? "Practise this step with your grown-up." : "Which care step matches this reminder?"
                            let answers = choices.map(\.label).joined(separator: ". ")
                            speaker.speak(answered ? "You practised this step. \(note.detail)" : "\(prompt) \(note.detail) \(guided ? "You can tell, point, or show." : answers)", ageYears: store.childAgeYears, force: true)
                        }
                    } label: {
                        Label(speaker.isSpeaking ? "Stop" : "Listen", systemImage: speaker.isSpeaking ? "stop.fill" : "speaker.wave.2.fill")
                            .font(jakarta(16, .bold))
                            .foregroundStyle(Theme.teal)
                            .padding(.horizontal, 12)
                            .frame(height: 44)
                            .background(Color.white, in: Capsule())
                    }
                    .buttonStyle(KidButtonStyle())
                }
                Text(guided ? "Practise this step together" : "Which care step matches?")
                    .font(jakarta(28, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text(note.detail)
                    .font(jakarta(22, .semibold))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(16)
                    .card(fill: Theme.tealSoft, border: Theme.tealBorder)
                if guided {
                    Text("Show or tell your grown-up how you will do this step together. Ask about any part you are unsure of.")
                        .font(jakarta(18, .medium))
                        .foregroundStyle(Theme.muted)
                    if !answered {
                        Button { finishRound(note.id.uuidString) } label: {
                            Label("We practised this step", systemImage: "checkmark.circle.fill")
                                .font(jakarta(20, .bold))
                                .foregroundStyle(Theme.teal)
                                .padding(18)
                                .frame(maxWidth: .infinity, minHeight: 64)
                                .card(border: Theme.tealBorder)
                        }
                        .buttonStyle(KidButtonStyle())
                    }
                } else {
                    Text("Tap the matching step.")
                        .font(jakarta(18, .medium))
                        .foregroundStyle(Theme.muted)
                    ForEach(choices) { option in
                        rememberChoice(option, noteID: note.id.uuidString)
                    }
                }
                if answered {
                    Label(guided ? "You practised together!" : "You found the matching step!", systemImage: "checkmark.circle.fill")
                        .font(jakarta(20, .bold))
                        .foregroundStyle(Theme.teal)
                    Button {
                        speaker.stop()
                        index += 1
                        selectedID = nil
                        answered = false
                    } label: {
                        Label(index + 1 < store.parentInstructions.count ? "Next step" : "Finish", systemImage: "arrow.right")
                            .font(jakarta(20, .bold))
                            .foregroundStyle(.white)
                            .padding(18)
                            .frame(maxWidth: .infinity, minHeight: 64)
                            .background(Theme.teal, in: RoundedRectangle(cornerRadius: 18))
                    }
                    .buttonStyle(KidButtonStyle())
                } else if selectedID != nil {
                    Text("Look for the step that matches these words. You can listen again or ask your grown-up.")
                        .font(jakarta(18, .medium))
                        .foregroundStyle(Theme.text)
                        .padding(16)
                        .card(fill: Theme.terraSoft, border: Theme.terraBorder)
                }
            } else {
                Text("You practised every step!")
                    .font(jakarta(28, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text("Ask your grown-up about any step you want to try again.")
                    .font(jakarta(18, .medium))
                    .foregroundStyle(Theme.muted)
                Button("Back to Play", action: onHome)
                    .font(jakarta(20, .bold))
                    .foregroundStyle(Theme.teal)
                    .frame(minHeight: 48)
                Button("Practise again") {
                    index = 0
                    selectedID = nil
                    answered = false
                }
                .font(jakarta(18, .bold))
                .foregroundStyle(Theme.teal)
                .frame(minHeight: 48)
            }
        }
    }

    private func finishRound(_ id: String) {
        speaker.stop()
        answered = true
        if solved.insert(id).inserted { store.awardRemembered() }
    }

    private func rememberChoice(_ option: StoryChoice, noteID: String) -> some View {
        let correct = answered && option.isCorrect
        return Button {
            speaker.stop()
            selectedID = option.id
            if option.isCorrect { finishRound(noteID) }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: correct ? "checkmark.circle.fill" : "list.clipboard.fill")
                    .font(.system(size: 22, weight: .bold))
                    .accessibilityHidden(true)
                Text(option.label)
                    .font(jakarta(22, .bold))
                    .multilineTextAlignment(.leading)
            }
            .foregroundStyle(Theme.teal)
            .padding(18)
            .frame(maxWidth: .infinity, minHeight: 72, alignment: .leading)
            .card(fill: correct ? Theme.tealSoft : .white, border: correct ? Theme.teal : Theme.tealBorder)
        }
        .buttonStyle(KidButtonStyle())
        .disabled(answered || selectedID == option.id)
        .accessibilityLabel(option.label)
    }
}

private enum FeedbackTone {
    case good
    case retry
    case talk
}

private enum StoryVoice {
    static func script(page: StoryPage, phase: StoryPhase) -> String {
        switch phase {
        case .reading:
            return "\(page.speech) \(page.more)"
        case .trying:
            return "\(page.tryTitle ?? "Try it together"). \(page.tryDetail ?? "Explore this together with your grown-up.") You can try it or go to the question."
        case .tryAgain:
            return "\(StoryLibrary.firstMiss) \(page.speech) \(page.more)"
        case .question:
            if page.isTalkActivity {
                return "\(page.question) You can talk, point, or show. Then tap: We talked it through."
            }
            return "\(page.question) Choose one: \(choiceList(page.choices.map(\.label)))."
        case .correct:
            return "\(page.isTalkActivity ? "You practised together!" : "You got it!") \(page.reveal)"
        case .revealed:
            return "Let's work it out together. \(page.reveal)"
        case .done:
            return "You finished the story. You can come back and practice any time."
        }
    }

    private static func choiceList(_ labels: [String]) -> String {
        switch labels.count {
        case 0:
            return "the choice you remember"
        case 1:
            return labels[0]
        case 2:
            return "\(labels[0]), or \(labels[1])"
        default:
            return "\(labels.dropLast().joined(separator: ", ")), or \(labels[labels.count - 1])"
        }
    }
}

private enum VoiceBand {
    case little
    case middle
    case older

    init(ageYears: Int) {
        switch ageYears {
        case ...6: self = .little
        case 7...9: self = .middle
        default: self = .older
        }
    }

    var azureVoice: String {
        switch self {
        case .little, .middle: "en-US-JennyNeural"
        case .older: "en-US-AriaNeural"
        }
    }

    var azureStyle: String {
        self == .older ? "friendly" : "cheerful"
    }

    var styleDegree: String {
        switch self {
        case .little: "2"
        case .middle: "1.8"
        case .older: "1.2"
        }
    }

    var azureRate: String {
        switch self {
        case .little: "0.92"
        case .middle: "1.02"
        case .older: "0.98"
        }
    }

    var azurePitch: String {
        switch self {
        case .little: "+16%"
        case .middle: "+8%"
        case .older: "+2%"
        }
    }

    var localPitch: Float {
        switch self {
        case .little: 1.18
        case .middle: 1.08
        case .older: 1.02
        }
    }

    var localRate: Float {
        switch self {
        case .little: AVSpeechUtteranceDefaultSpeechRate * 0.92
        case .middle: AVSpeechUtteranceDefaultSpeechRate * 1.05
        case .older: AVSpeechUtteranceDefaultSpeechRate * 0.98
        }
    }
}

@MainActor
@Observable
private final class StorySpeaker: NSObject, AVSpeechSynthesizerDelegate, AVAudioPlayerDelegate {
    var isSpeaking = false
    var speechMark: TimeInterval = 0

    private let synth = AVSpeechSynthesizer()
    private let voice: AVSpeechSynthesisVoice?
    private let pitch: Float
    private let rate: Float
    private var player: AVAudioPlayer?
    private var requestID = UUID()
    private var mouthTimer: Timer?

    override init() {
        let picked = Self.friendlyVoice()
        voice = picked.voice
        pitch = picked.pitch
        rate = picked.rate
        super.init()
        synth.delegate = self
    }

    func speak(_ text: String, ageYears: Int = 7, force: Bool = false) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        prepareAudio()
        let id = UUID()
        requestID = id
        haltAudio()
        isSpeaking = true
        speechMark = Date().timeIntervalSinceReferenceDate
        let band = VoiceBand(ageYears: ageYears)
        Task { @MainActor in
            do {
                let data = try await azureAudio(for: trimmed, band: band)
                guard requestID == id else { return }
                let player = try AVAudioPlayer(data: data)
                player.delegate = self
                player.prepareToPlay()
                self.player = player
                player.play()
                isSpeaking = true
                startMouthTicks()
            } catch {
                guard requestID == id else { return }
                speakLocally(trimmed, band: band)
            }
        }
        _ = force
    }

    func stop() {
        requestID = UUID()
        haltAudio()
        isSpeaking = false
    }

    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            guard self.player === player else { return }
            mouthTimer?.invalidate()
            mouthTimer = nil
            isSpeaking = false
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        Task { @MainActor in
            guard player?.isPlaying != true else { return }
            isSpeaking = synthesizer.isSpeaking
            speechMark = Date().timeIntervalSinceReferenceDate
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            guard player?.isPlaying != true else { return }
            isSpeaking = synthesizer.isSpeaking
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in
            guard player?.isPlaying != true else { return }
            isSpeaking = synthesizer.isSpeaking
        }
    }

    private func speakLocally(_ text: String, band: VoiceBand) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = voice ?? AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = band.localRate
        utterance.pitchMultiplier = band.localPitch
        utterance.prefersAssistiveTechnologySettings = false
        utterance.volume = 1
        utterance.preUtteranceDelay = 0.05
        speechMark = Date().timeIntervalSinceReferenceDate
        isSpeaking = true
        synth.speak(utterance)
    }

    private func haltAudio() {
        mouthTimer?.invalidate()
        mouthTimer = nil
        player?.stop()
        player = nil
        if synth.isSpeaking {
            synth.stopSpeaking(at: .immediate)
        }
    }

    private func startMouthTicks() {
        mouthTimer?.invalidate()
        mouthTimer = Timer.scheduledTimer(withTimeInterval: 0.22, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self, self.player?.isPlaying == true else { return }
                self.speechMark = Date().timeIntervalSinceReferenceDate
            }
        }
    }

    private func azureAudio(for text: String, band: VoiceBand) async throws -> Data {
        let escaped = text
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
        let cartoon = speechSSML(escaped, band: band, styled: true)
        if let data = try? await requestSpeech(cartoon), !data.isEmpty {
            return data
        }
        return try await requestSpeech(speechSSML(escaped, band: band, styled: false))
    }

    /// Age band changes pitch, pace, and Azure voice so younger kids hear a gentler bear.
    private func speechSSML(_ text: String, band: VoiceBand, styled: Bool) -> String {
        let spoken: String
        if styled {
            spoken = "<mstts:express-as style='\(band.azureStyle)' styledegree='\(band.styleDegree)'><prosody rate='\(band.azureRate)' pitch='\(band.azurePitch)'>\(text)</prosody></mstts:express-as>"
        } else {
            spoken = "<prosody rate='\(band.azureRate)' pitch='\(band.azurePitch)'>\(text)</prosody>"
        }
        return """
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-US'><voice name='\(band.azureVoice)'>\(spoken)</voice></speak>
        """
    }

    private func requestSpeech(_ ssml: String) async throws -> Data {
        guard let url = URL(string: "https://\(SpeechSecrets.region).tts.speech.microsoft.com/cognitiveservices/v1") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = Data(ssml.utf8)
        request.timeoutInterval = 20
        request.setValue(SpeechSecrets.key, forHTTPHeaderField: "Ocp-Apim-Subscription-Key")
        request.setValue("application/ssml+xml", forHTTPHeaderField: "Content-Type")
        request.setValue("audio-16khz-128kbitrate-mono-mp3", forHTTPHeaderField: "X-Microsoft-OutputFormat")
        request.setValue("KareBear", forHTTPHeaderField: "User-Agent")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200, !data.isEmpty else {
            throw URLError(.badServerResponse)
        }
        return data
    }

    nonisolated func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        willSpeakRangeOfSpeechString characterRange: NSRange,
        utterance: AVSpeechUtterance
    ) {
        Task { @MainActor in
            guard player?.isPlaying != true, synthesizer.isSpeaking else { return }
            speechMark = Date().timeIntervalSinceReferenceDate
        }
    }

    private func prepareAudio() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try? session.setActive(true)
    }

    private static func friendlyVoice() -> (voice: AVSpeechSynthesisVoice?, pitch: Float, rate: Float) {
        let clear = AVSpeechSynthesisVoice.speechVoices().filter { voice in
            let language = voice.language.replacingOccurrences(of: "_", with: "-")
            guard language == "en-US" else { return false }
            let label = "\(voice.name) \(voice.identifier)".lowercased()
            return !noveltyVoices.contains { label.contains($0) }
        }
        let preferred = ["samantha", "ava", "allison", "susan"]
        for name in preferred {
            let matches = clear.filter {
                $0.name.lowercased().contains(name) || $0.identifier.lowercased().contains(name)
            }
            if let best = matches.max(by: { qualityRank($0) < qualityRank($1) }) {
                return cartoonVoice(best)
            }
        }
        if let best = clear.max(by: { qualityRank($0) < qualityRank($1) }) {
            return cartoonVoice(best)
        }
        return (AVSpeechSynthesisVoice(language: "en-US"), 1.08, AVSpeechUtteranceDefaultSpeechRate * 1.05)
    }

    /// A small lift keeps the backup voice bright and cartoonish without turning it into a little kid.
    private static func cartoonVoice(_ voice: AVSpeechSynthesisVoice) -> (voice: AVSpeechSynthesisVoice?, pitch: Float, rate: Float) {
        let pitch: Float = switch voice.quality {
        case .premium, .enhanced: 1.06
        default: 1.1
        }
        return (voice, pitch, AVSpeechUtteranceDefaultSpeechRate * 1.05)
    }

    private static func qualityRank(_ voice: AVSpeechSynthesisVoice) -> Int {
        switch voice.quality {
        case .premium: 3
        case .enhanced: 2
        default: 1
        }
    }

    /// Cartoon effects. Bubbles is the muffled, underwater one.
    private static let noveltyVoices = [
        "bubbles", "superstar", "boing", "zarvox", "trinoids", "bells", "cellos",
        "bahh", "jester", "wobble", "organ", "whisper", "good news", "bad news",
        "ralph", "fred", "albert", "junior", "kathy", "princess", "grandma", "grandpa"
    ]
}
