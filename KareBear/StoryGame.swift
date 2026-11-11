import AVFoundation
import SwiftUI
import UIKit

enum QuestScreen: String {
    case hub
    case story
    case game
    case rewards
    case prep

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

    func speaking(as name: String) -> StoryPage {
        let bear = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !bear.isEmpty, bear != "Kare" else { return self }
        func swap(_ text: String) -> String {
            text.replacingOccurrences(of: "Kare", with: bear)
        }
        return StoryPage(
            id: id,
            title: swap(title),
            expression: expression,
            scene: swap(scene),
            speech: swap(speech),
            more: swap(more),
            question: swap(question),
            choices: choices.map {
                StoryChoice(id: $0.id, label: swap($0.label), isCorrect: $0.isCorrect, symbol: $0.symbol)
            },
            reveal: swap(reveal),
            symbol: symbol,
            tryTitle: tryTitle.map(swap),
            tryDetail: tryDetail.map(swap)
        )
    }
}

enum StoryLibrary {
    static func correctFeedback(bear: String) -> String {
        "Yes! You remembered. \(bear) is proud of you."
    }
    static let firstMiss = "Not quite, and that's OK! Let's look at that part again."

    static func pages(for notes: [ParentInstruction], childName: String) -> [StoryPage] {
        let name = childName.isEmpty ? "you" : childName
        guard !notes.isEmpty else {
            return [
                StoryPage(
                    id: "welcome",
                    title: "Waiting for care steps",
                    expression: "Calm",
                    scene: "Kare is ready to learn.",
                    speech: "Hi, I'm Kare. A grown-up can add \(name)'s care steps. Then I will teach them, one page at a time.",
                    more: "Until those steps are here, tell a grown-up if something feels wrong.",
                    question: "Who adds the care steps?",
                    choices: [
                        StoryChoice(id: "welcome-child", label: "A child, all alone", isCorrect: false, symbol: "person.fill"),
                        StoryChoice(id: "welcome-adult", label: "A grown-up", isCorrect: true, symbol: "heart.fill"),
                        StoryChoice(id: "welcome-skip", label: "Nobody", isCorrect: false, symbol: "nosign")
                    ],
                    reveal: "Here's the answer: a grown-up adds the care steps. Let's talk about it together."
                )
            ]
        }
        return notes.map { note in
            let correct = StoryChoice(id: "\(note.id.uuidString)-yes", label: note.title, isCorrect: true, symbol: "heart.fill")
            let skip = StoryChoice(id: "\(note.id.uuidString)-skip", label: "Skip this step", isCorrect: false, symbol: "forward.fill")
            let alone = StoryChoice(id: "\(note.id.uuidString)-alone", label: "Do it without a grown-up", isCorrect: false, symbol: "person.fill")
            let choices = note.id.uuidString.first?.isNumber == true
                ? [correct, skip, alone]
                : [skip, correct, alone]
            return StoryPage(
                id: note.id.uuidString,
                title: note.title,
                expression: "Encouraging",
                scene: "Kare is learning \(name)'s care.",
                speech: "A grown-up said: \(note.detail). I need help remembering this step.",
                more: note.detail,
                question: "Which care step did the grown-up write?",
                choices: choices,
                reveal: "Here's the answer: \(note.title). \(note.detail)"
            )
        }
    }

    static let pages: [StoryPage] = [
        StoryPage(
            id: "rest",
            title: "Resting after surgery",
            expression: "Calm",
            scene: "Kare is home, with a grown-up close by.",
            speech: "Hi, I'm Kare. My throat is sore after surgery. It's OK to feel tired. I stay quiet, and a grown-up stays with me.",
            more: "Rest does not have to be perfect. Holding a grown-up's hand is enough.",
            question: "Kare wants to yell and run around. What should Kare do?",
            choices: [
                StoryChoice(id: "rest-run", label: "Yell and race around", isCorrect: false, symbol: "figure.run"),
                StoryChoice(id: "rest-stay", label: "Rest with a grown-up", isCorrect: true, symbol: "moon.fill"),
                StoryChoice(id: "rest-hide", label: "Hide that it hurts", isCorrect: false, symbol: "eye.slash")
            ],
            reveal: "Here's the answer: rest with a grown-up. Let's talk about it together."
        ),
        StoryPage(
            id: "medicine",
            title: "Medicine time",
            expression: "Encouraging",
            scene: "A grown-up holds the oral syringe.",
            speech: "When it's medicine time, a grown-up measures my dose. I swallow it. I don't measure it by myself.",
            more: "The syringe shows the amount. The schedule says when the next dose is due.",
            question: "Who should measure Kare's medicine?",
            choices: [
                StoryChoice(id: "med-kare", label: "Kare, all alone", isCorrect: false, symbol: "person.fill"),
                StoryChoice(id: "med-adult", label: "A grown-up", isCorrect: true, symbol: "stethoscope"),
                StoryChoice(id: "med-friend", label: "A friend", isCorrect: false, symbol: "person.2.fill")
            ],
            reveal: "Here's the answer: a grown-up measures the medicine. Let's talk about it together."
        ),
        StoryPage(
            id: "sips",
            title: "Small cold sips",
            expression: "Cheerful",
            scene: "Kare takes one small sip, then rests.",
            speech: "Small cold sips feel better than one big gulp. I drink a little water, then I rest my throat.",
            more: "If the cups stay empty by the afternoon, tell a grown-up.",
            question: "Which drink is gentler for Kare's throat?",
            choices: [
                StoryChoice(id: "sip-hot", label: "A big gulp of hot soup", isCorrect: false, symbol: "mug.fill"),
                StoryChoice(id: "sip-cold", label: "A small sip of cold water", isCorrect: true, symbol: "drop.fill"),
                StoryChoice(id: "sip-none", label: "No drinks today", isCorrect: false, symbol: "nosign")
            ],
            reveal: "Here's the answer: a small sip of cold water. Let's talk about it together."
        ),
        StoryPage(
            id: "treat",
            title: "A cold treat",
            expression: "Cheerful",
            scene: "A popsicle can soothe a sore throat.",
            speech: "A popsicle can soothe my throat. Crunchy snacks can wait until a grown-up says they are OK.",
            more: "Cold and soft is kinder than chips or dry toast right now.",
            question: "Kare is hungry. Which snack is kinder today?",
            choices: [
                StoryChoice(id: "treat-chips", label: "Crunchy chips", isCorrect: false, symbol: "fork.knife"),
                StoryChoice(id: "treat-pop", label: "A cold popsicle", isCorrect: true, symbol: "snowflake"),
                StoryChoice(id: "treat-toast", label: "Dry toast", isCorrect: false, symbol: "birthday.cake")
            ],
            reveal: "Here's the answer: a cold popsicle. Let's talk about it together."
        ),
        StoryPage(
            id: "speak",
            title: "Tell a grown-up",
            expression: "Serious",
            scene: "Kare speaks up when something feels wrong.",
            speech: "If I cannot drink, or something feels wrong, I tell a grown-up right away. They know who to call.",
            more: "Speak up right away for bleeding, trouble breathing, or being too sleepy to sip.",
            question: "Kare cannot sip and feels very sleepy. What should happen?",
            choices: [
                StoryChoice(id: "help-wait", label: "Wait until tomorrow", isCorrect: false, symbol: "clock"),
                StoryChoice(id: "help-tell", label: "Tell a grown-up right away", isCorrect: true, symbol: "phone.fill"),
                StoryChoice(id: "help-extra", label: "Take extra medicine alone", isCorrect: false, symbol: "pills.fill")
            ],
            reveal: "Here's the answer: tell a grown-up right away. Let's talk about it together."
        )
    ]

    static let tutorialPage = StoryPage(
        id: "tour-practice",
        title: "How a page works",
        expression: "Encouraging",
        scene: "Kare is practicing with you.",
        speech: "Read what I say, then answer the question. A first miss means look again. A second miss shows the answer so you can talk with a grown-up.",
        more: "Story answers do not add stars. Finished to-dos add stars.",
        question: "Who helps with a care step?",
        choices: [
            StoryChoice(id: "tour-alone", label: "The child, all alone", isCorrect: false, symbol: "person.fill"),
            StoryChoice(id: "tour-adult", label: "A grown-up", isCorrect: true, symbol: "heart.fill"),
            StoryChoice(id: "tour-none", label: "Nobody", isCorrect: false, symbol: "nosign")
        ],
        reveal: "Here's the answer: a grown-up helps with a care step. Let's talk about it together."
    )

    static func prepPages(childName: String) -> [StoryPage] {
        let name = childName.trimmingCharacters(in: .whitespacesAndNewlines)
        let hello = name.isEmpty ? "Hi. I'm Kare." : "Hi, \(name). I'm Kare."
        return [
            StoryPage(
                id: "prep-welcome",
                title: "A tour with Kare",
                expression: "Calm",
                scene: "Kare waves in a quiet room.",
                speech: "\(hello) Before an operation, you may see new clothes, soft beeps, and helpers. We can meet them one at a time. A grown-up stays with you.",
                more: "Wiggly, shy, and brave can all be true at once. You can hold a hand.",
                question: "Who can stay with you on this tour?",
                choices: [
                    StoryChoice(id: "prep-welcome-alone", label: "You have to go alone", isCorrect: false, symbol: "person.fill"),
                    StoryChoice(id: "prep-welcome-adult", label: "A grown-up", isCorrect: true, symbol: "heart.fill"),
                    StoryChoice(id: "prep-welcome-none", label: "Nobody you know", isCorrect: false, symbol: "nosign")
                ],
                reveal: "Here's the answer: a grown-up stays with you. Let's talk about it together.",
                symbol: "heart.fill",
                tryTitle: "Breathe with Kare",
                tryDetail: "Breathe in as the circle grows. Breathe out as it rests. You can do this whenever something feels new."
            ),
            StoryPage(
                id: "prep-scrubs",
                title: "Helpers in scrubs",
                expression: "Encouraging",
                scene: "Kare sees helpers in matching clothes.",
                speech: "Hospital helpers wear scrubs. Scrubs are clean, comfy clothes for taking care of people. A name badge tells you who they are. You can ask, “What is your job?”",
                more: "Nurses, doctors, and other helpers may all wear scrubs. The color helps you see who works here.",
                question: "What are scrubs?",
                choices: [
                    StoryChoice(id: "prep-scrubs-scary", label: "Clothes that mean someone is mean", isCorrect: false, symbol: "exclamationmark.triangle"),
                    StoryChoice(id: "prep-scrubs-clothes", label: "Clean clothes helpers wear", isCorrect: true, symbol: "tshirt.fill"),
                    StoryChoice(id: "prep-scrubs-sleep", label: "Pajamas you must sleep in", isCorrect: false, symbol: "moon.fill")
                ],
                reveal: "Here's the answer: scrubs are clean clothes helpers wear. Let's talk about it together.",
                symbol: "person.2.fill",
                tryTitle: "Find the helper",
                tryDetail: "Look for a person, a name badge, and scrubs. That person is here to help."
            ),
            StoryPage(
                id: "prep-gown",
                title: "The hospital gown",
                expression: "Calm",
                scene: "Kare changes with a grown-up nearby.",
                speech: "You change into a gown. It is a loose shirt that opens in the back so helpers can take care of you. Your clothes wait in a bag. A grown-up can help you change.",
                more: "The open back is for care. You can ask for another gown if you want a second layer.",
                question: "Why do kids change into a gown?",
                choices: [
                    StoryChoice(id: "prep-gown-trouble", label: "Because they are in trouble", isCorrect: false, symbol: "exclamationmark"),
                    StoryChoice(id: "prep-gown-care", label: "So helpers can take care of them", isCorrect: true, symbol: "hands.and.sparkles.fill"),
                    StoryChoice(id: "prep-gown-wrong", label: "Because their clothes are bad", isCorrect: false, symbol: "tshirt")
                ],
                reveal: "Here's the answer: the gown helps helpers take care of you. Let's talk about it together.",
                symbol: "tshirt.fill",
                tryTitle: "Pack the clothes",
                tryDetail: "Your shirt and pants go in a bag with your name. They wait for you. The gown is just for now."
            ),
            StoryPage(
                id: "prep-measure",
                title: "Height and weight",
                expression: "Cheerful",
                scene: "Kare stands by a ruler and a scale.",
                speech: "Helpers check how tall you are and how much you weigh. You may stand on a scale and next to a ruler. Shoes sometimes come off. This is not a test. There is no failing.",
                more: "They learn the size of your body so they can take care of you. Every body is a good body to measure.",
                question: "Why do helpers check height and weight?",
                choices: [
                    StoryChoice(id: "prep-measure-contest", label: "To see who wins a contest", isCorrect: false, symbol: "trophy.fill"),
                    StoryChoice(id: "prep-measure-size", label: "To learn the size of your body", isCorrect: true, symbol: "ruler.fill"),
                    StoryChoice(id: "prep-measure-home", label: "To decide if you can leave", isCorrect: false, symbol: "door.left.hand.open")
                ],
                reveal: "Here's the answer: height and weight tell helpers the size of your body. Let's talk about it together.",
                symbol: "ruler.fill",
                tryTitle: "Stand tall with Kare",
                tryDetail: "Feet flat. Shoulders soft. The numbers are about your body today. You cannot get them wrong."
            ),
            StoryPage(
                id: "prep-thermometer",
                title: "The thermometer",
                expression: "Encouraging",
                scene: "Kare holds still for one beep.",
                speech: "A thermometer checks how warm your body is. It might touch your forehead, rest under your arm, or sit by your ear. It often beeps when it is done. The beep means finished.",
                more: "Hold still like a statue for a moment. Then you can wiggle again.",
                question: "What does a thermometer check?",
                choices: [
                    StoryChoice(id: "prep-thermo-shout", label: "How loud you can shout", isCorrect: false, symbol: "speaker.wave.3.fill"),
                    StoryChoice(id: "prep-thermo-warm", label: "How warm your body is", isCorrect: true, symbol: "thermometer.medium"),
                    StoryChoice(id: "prep-thermo-wrong", label: "Whether you did something wrong", isCorrect: false, symbol: "xmark")
                ],
                reveal: "Here's the answer: a thermometer checks how warm your body is. Let's talk about it together.",
                symbol: "thermometer.medium",
                tryTitle: "Wait for the beep",
                tryDetail: "Still for a second. Beep. Done. The number tells helpers how your body is doing today."
            ),
            StoryPage(
                id: "prep-stethoscope",
                title: "The stethoscope",
                expression: "Cheerful",
                scene: "Kare hears a soft heartbeat.",
                speech: "A stethoscope lets a helper hear your heart and your breathing. The round part can feel cool on your skin. It does not pinch. You can ask if you may listen too.",
                more: "A heart can sound like a soft drum. Breathing can sound like a little wind.",
                question: "What can a helper hear with a stethoscope?",
                choices: [
                    StoryChoice(id: "prep-steth-thoughts", label: "Your thoughts", isCorrect: false, symbol: "brain"),
                    StoryChoice(id: "prep-steth-heart", label: "Your heart and breathing", isCorrect: true, symbol: "stethoscope"),
                    StoryChoice(id: "prep-steth-alarm", label: "A secret alarm", isCorrect: false, symbol: "bell.fill")
                ],
                reveal: "Here's the answer: a stethoscope listens to your heart and breathing. Let's talk about it together.",
                symbol: "stethoscope",
                tryTitle: "Listen for the drum",
                tryDetail: "Thump-thump. That is a heart saying hello. Cool metal warms up quickly."
            ),
            StoryPage(
                id: "prep-cuff",
                title: "The blood pressure cuff",
                expression: "Calm",
                scene: "A cuff gives Kare's arm a short hug.",
                speech: "A blood pressure cuff wraps around your arm like a hug. It squeezes, then lets go. The squeeze can feel tight for a few breaths. Then it loosens. It is checking how strongly your heart pushes.",
                more: "Your arm is not stuck. If the squeeze feels like too much, tell the helper.",
                question: "What does the cuff do after it squeezes?",
                choices: [
                    StoryChoice(id: "prep-cuff-stay", label: "It stays tight all day", isCorrect: false, symbol: "lock.fill"),
                    StoryChoice(id: "prep-cuff-release", label: "It lets go", isCorrect: true, symbol: "arrow.left.and.right"),
                    StoryChoice(id: "prep-cuff-break", label: "It means the arm is hurt", isCorrect: false, symbol: "bandage.fill")
                ],
                reveal: "Here's the answer: the cuff squeezes, then lets go. Let's talk about it together.",
                symbol: "arrow.left.and.right",
                tryTitle: "Squeeze, then let go",
                tryDetail: "Tight for a moment. Then loose. The hug is finished when the cuff relaxes."
            ),
            StoryPage(
                id: "prep-vitals",
                title: "Taking vitals",
                expression: "Encouraging",
                scene: "Kare finishes a set of body checks.",
                speech: "Vitals are the body checks together: warmth, heartbeat, breathing, and blood pressure. Helpers write them down to see how you are doing today. Vitals are a hello to your body.",
                more: "You might have vitals more than once. That means the helpers are being careful.",
                question: "What are vitals?",
                choices: [
                    StoryChoice(id: "prep-vitals-punish", label: "A punishment", isCorrect: false, symbol: "nosign"),
                    StoryChoice(id: "prep-vitals-check", label: "Checks of how your body is doing", isCorrect: true, symbol: "list.clipboard.fill"),
                    StoryChoice(id: "prep-vitals-lose", label: "A game you can lose", isCorrect: false, symbol: "flag.checkered")
                ],
                reveal: "Here's the answer: vitals are checks of how your body is doing. Let's talk about it together.",
                symbol: "list.clipboard.fill",
                tryTitle: "Count the checks",
                tryDetail: "Warmth. Heart. Breathing. Blood pressure. Four hellos. Then the helper writes them down."
            ),
            StoryPage(
                id: "prep-iv",
                title: "The IV and the pole",
                expression: "Calm",
                scene: "A tall pole holds a bag beside Kare.",
                speech: "An IV is a tiny soft straw that can give your body a drink of water or medicine. Placing it can feel like a quick pinch. Then the pinch is over, and the straw stays still. The tall pole holds the bag up high so the drink can drip. The pole has wheels, so you can walk with a grown-up.",
                more: "Looking away and squeezing a hand is a good plan. Leave the straw in place. A helper takes it out when it is time.",
                question: "What happens with an IV?",
                choices: [
                    StoryChoice(id: "prep-iv-allday", label: "The pinch lasts all day", isCorrect: false, symbol: "clock.fill"),
                    StoryChoice(id: "prep-iv-pinch", label: "A quick pinch, then a helper removes it later", isCorrect: true, symbol: "hand.raised.fill"),
                    StoryChoice(id: "prep-iv-pull", label: "You should pull it out", isCorrect: false, symbol: "hand.draw")
                ],
                reveal: "Here's the answer: the pinch is quick, and a helper takes the IV out later. Let's talk about it together.",
                symbol: "bag.fill",
                tryTitle: "Watch the bag",
                tryDetail: "The bag hangs up high. Drip, drip. The pole rolls with you. The straw stays until a helper says it is done."
            ),
            StoryPage(
                id: "prep-mask",
                title: "The anaesthesia mask",
                expression: "Calm",
                scene: "Kare holds a soft mask with a grown-up close.",
                speech: "The anaesthesia mask is a soft cup over your nose and mouth. It gives sleepy air so your body can rest during the operation. Breathe slowly, like fogging a window. A grown-up can hold your hand. You wake up when it is time.",
                more: "The mask might smell like plastic, or like something sweet. Smells can differ. You can ask for a story while you breathe.",
                question: "What is the sleepy air for?",
                choices: [
                    StoryChoice(id: "prep-mask-play", label: "So you can run around the room", isCorrect: false, symbol: "figure.run"),
                    StoryChoice(id: "prep-mask-rest", label: "So your body can rest, then you wake up", isCorrect: true, symbol: "moon.stars.fill"),
                    StoryChoice(id: "prep-mask-hair", label: "So your hair grows faster", isCorrect: false, symbol: "comb.fill")
                ],
                reveal: "Here's the answer: the sleepy air helps your body rest during the operation, and you wake up afterward. Let's talk about it together.",
                symbol: "facemask.fill",
                tryTitle: "Fog the window",
                tryDetail: "Slow breath in. Slow breath out, like fog on a window. A hand can stay in yours the whole time."
            ),
            StoryPage(
                id: "prep-ready",
                title: "You know the way",
                expression: "Cheerful",
                scene: "Kare smiles beside you.",
                speech: "You met the scrubs, the gown, the measuring, the thermometer, the stethoscope, the cuff, the vitals, the IV pole, and the mask. When something looks new, you can ask what it is. When you want a hand, you can say so.",
                more: "Nervous and ready can sit side by side. You can play this tour again any time.",
                question: "What can you do when something feels new?",
                choices: [
                    StoryChoice(id: "prep-ready-hide", label: "Hide the question", isCorrect: false, symbol: "eye.slash"),
                    StoryChoice(id: "prep-ready-ask", label: "Ask what it is, and hold a hand", isCorrect: true, symbol: "bubble.left.and.heart.fill"),
                    StoryChoice(id: "prep-ready-trouble", label: "Decide you are in trouble", isCorrect: false, symbol: "exclamationmark")
                ],
                reveal: "Here's the answer: ask what it is, and you can hold a hand. Let's talk about it together.",
                symbol: "hands.and.sparkles.fill",
                tryTitle: "Practice the question",
                tryDetail: "Try saying, “What is that?” and “Can I hold your hand?” Both questions are welcome."
            )
        ]
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
                        openPrep: { screen = .prep }
                    )
                } else {
                    RewardsBearView(showsParentTools: false)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Theme.bg)
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
                    } label: {
                        VStack(spacing: 3) {
                            Image(systemName: item.symbol)
                                .font(.system(size: 20, weight: selected ? .bold : .regular))
                            Text(item.title)
                                .font(jakarta(11, selected ? .bold : .semibold))
                        }
                        .foregroundStyle(selected ? Theme.teal : Theme.muted)
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 48)
                        .padding(.top, 8)
                        .padding(.bottom, 6)
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
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
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
    var openStory: () -> Void
    var openGame: () -> Void
    var openPrep: () -> Void

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
        .background(Theme.bg)
    }

    private var phoneHub: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                VStack(spacing: 8) {
                    BearBadge(size: 132, mood: store.bearMood, showsStatus: true)
                    Text(store.bearMood.title(called: store.companionName))
                        .font(jakarta(15, .bold))
                        .foregroundStyle(store.bearMood.color)
                    NameBearButton()
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                activities
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
            .readableColumn()
        }
        .scrollIndicators(.hidden)
    }

    private var padHub: some View {
        GeometryReader { geo in
            let column = (geo.size.width - 76) / 2
            let bear = min(column * 0.92, geo.size.height * 0.58)
            HStack(alignment: .center, spacing: 24) {
                VStack(spacing: 14) {
                    BearBadge(size: bear, mood: store.bearMood, showsStatus: true)
                    Text(store.bearMood.title(called: store.companionName))
                        .font(jakarta(32, .extraBold))
                        .foregroundStyle(store.bearMood.color)
                        .multilineTextAlignment(.center)
                    Text(store.bearMood.detail(called: store.companionName))
                        .font(jakarta(18, .medium))
                        .foregroundStyle(Theme.muted)
                        .multilineTextAlignment(.center)
                    NameBearButton()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                ScrollView {
                    activities.frame(maxWidth: .infinity, alignment: .top)
                }
                .scrollIndicators(.hidden)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(24)
        }
    }

    private var activities: some View {
        VStack(alignment: .leading, spacing: 14) {
            todoList
            games
        }
    }

    private var games: some View {
        VStack(alignment: .leading, spacing: 14) {
            if showPrepGame {
                let pages = StoryLibrary.prepPages(childName: store.childName).map { $0.speaking(as: store.companionName) }
                let done = pages.filter { store.isStoryCleared($0.id) }.count
                hubCard(
                    symbol: "cross.case.fill",
                    title: "Preparing for my operation",
                    detail: "Meet scrubs, vitals, the cuff, the IV, and the mask.",
                    meta: done == pages.count ? "Finished" : "\(pages.count) pages",
                    action: openPrep
                )
            }
            hubCard(
                symbol: "book.fill",
                title: "\(store.companionName)'s story",
                detail: store.parentInstructions.isEmpty
                    ? "A short hello while care steps are on the way."
                    : "A question on every page.",
                meta: store.storyFinished ? "Finished" : "\(store.storyPages.count) pages",
                action: openStory
            )
            hubCard(
                symbol: "gamecontroller.fill",
                title: "Remember game",
                detail: "Listen, then tap the care step.",
                meta: store.parentInstructions.isEmpty ? "Waiting" : "\(store.parentInstructions.count) steps",
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
                    .foregroundStyle(.white)
                    .frame(width: 48, height: 48)
                    .background(Theme.teal, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
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
    case question
    case tryAgain
    case correct
    case revealed
    case done

    var savedName: String {
        switch self {
        case .reading: "reading"
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

    private var pages: [StoryPage] {
        store.storyPages
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
        .background(Theme.bg)
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

    private var storyScroll: some View {
        StoryBookStage { stage in
            storyBear(size: stage)
        } words: {
            storyWords
                .readableColumn()
        }
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
                        scheduleSpeech(force: true)
                    } label: {
                        Label(speaker.isSpeaking ? "Reading" : "Listen", systemImage: "speaker.wave.2.fill")
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
            Text("Check what you learned")
                .font(jakarta(22, .bold))
                .foregroundStyle(Theme.teal)
            Text(page.question)
                .font(jakarta(32, .extraBold))
                .foregroundStyle(Theme.text)
                .fixedSize(horizontal: false, vertical: true)
            ForEach(page.choices) { choice in
                choiceButton(choice)
            }
            if phase == .correct {
                feedback(StoryLibrary.correctFeedback(bear: store.companionName), tone: .good)
            } else if phase == .revealed {
                feedback(page.reveal, tone: .talk)
            }
        }
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
                    .foregroundStyle(showCorrect ? .white : Theme.teal)
                    .frame(width: 44, height: 44)
                    .background(showCorrect ? Theme.teal : Theme.tealSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
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
                    .foregroundStyle(canGoBack ? Theme.teal : Theme.teal.opacity(0.35))
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
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(canGoForward ? Theme.teal : Theme.teal.opacity(0.35), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
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
            store.isStoryCleared(page.id) ? "Next" : "Check"
        case .tryAgain:
            "Look again"
        case .question:
            "Check"
        case .correct, .revealed:
            index + 1 < pages.count ? "Next" : "Finish"
        case .done:
            "Done"
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
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
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
            ? "You finished the story. I am so proud of you."
            : StoryVoice.script(page: page, phase: phase, index: index, bear: store.companionName)
        speaker.speak(line, force: force)
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
            phase = .reading
            selectedID = nil
        case .correct, .revealed:
            advancePage()
        case .question, .done:
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
    @State private var didStart = false
    @State private var speaker = StorySpeaker()
    @State private var speakTask: Task<Void, Never>?

    private var page: StoryPage? {
        pages.indices.contains(index) ? pages[index] : nil
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
        .background(Theme.bg)
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

    private func storyScroll(_ page: StoryPage) -> some View {
        StoryBookStage { stage in
            let badge = max(stage - 6, 120)
            BearBadge(
                size: badge,
                speaking: speaker.isSpeaking,
                speechMark: speaker.speechMark
            )
            .overlay(alignment: .bottomTrailing) {
                Image(systemName: page.symbol)
                    .font(.system(size: badge * 0.09, weight: .bold))
                    .foregroundStyle(Theme.teal)
                    .frame(width: badge * 0.18, height: badge * 0.18)
                    .background(Theme.tealSoft, in: Circle())
                    .overlay(Circle().stroke(Color.white, lineWidth: 2))
                    .accessibilityHidden(true)
            }
            .accessibilityLabel(page.title)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } words: {
            prepWords(page)
                .readableColumn(compact: 520)
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
                        scheduleSpeech(force: true)
                    } label: {
                        Label(speaker.isSpeaking ? "Reading" : "Listen", systemImage: "speaker.wave.2.fill")
                            .font(jakarta(20, .bold))
                            .foregroundStyle(Theme.teal)
                            .padding(.horizontal, 12)
                            .frame(height: 40)
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
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Concept check")
                            .font(jakarta(22, .bold))
                            .foregroundStyle(Theme.teal)
                        Text(page.question)
                            .font(jakarta(32, .extraBold))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                        ForEach(page.choices) { choice in
                            choiceButton(choice, page: page)
                        }
                        if phase == .correct {
                            feedback(StoryLibrary.correctFeedback(bear: store.companionName), tone: .good)
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
                    Text("Play the checks again")
                        .font(jakarta(17, .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
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
                    .foregroundStyle(showCorrect ? .white : Theme.teal)
                    .frame(width: 44, height: 44)
                    .background(showCorrect ? Theme.teal : Theme.tealSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
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
            "Check"
        case .tryAgain:
            "Look again"
        case .correct, .revealed:
            index + 1 < pages.count ? "Next" : "Finish"
        default:
            "Check"
        }
    }

    private var pageControls: some View {
        HStack(spacing: 10) {
            Button(action: goBack) {
                Text("Back")
                    .font(jakarta(16, .bold))
                    .foregroundStyle(canGoBack ? Theme.teal : Theme.teal.opacity(0.35))
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
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(canGoForward ? Theme.teal : Theme.teal.opacity(0.35), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
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
        phase != .question
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
            speaker.speak("\(doneTitle). I am so proud of you.", force: force)
            return
        }
        guard let page else { return }
        speaker.speak(StoryVoice.script(page: page, phase: phase, index: index, bear: store.companionName), force: force)
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
        }
    }

    private func goForward() {
        speaker.stop()
        guard pages.indices.contains(index) else { return }
        switch phase {
        case .reading:
            phase = .question
            selectedID = nil
        case .tryAgain:
            phase = .reading
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
    @State private var message = "Tap the care step Kare means."
    @State private var solved: Set<String> = []

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button(action: onHome) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(width: 40, height: 40)
                        .background(Color.white, in: Circle())
                        .overlay(Circle().stroke(Theme.border, lineWidth: 1))
                }
                .buttonStyle(KidButtonStyle())
                .accessibilityLabel("Back")
                Spacer()
                Text("Remember game")
                    .font(jakarta(14, .bold))
                    .foregroundStyle(Theme.muted)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            GeometryReader { geo in
                let stage = min(geo.size.height * 0.5, sizeClass == .regular ? 520 : 360)
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
        .background(Theme.bg)
    }

    private var rememberWords: some View {
        VStack(alignment: .leading, spacing: 12) {
                    if store.parentInstructions.isEmpty {
                        Text("No care steps yet")
                            .font(jakarta(26, .extraBold))
                            .foregroundStyle(Theme.teal)
                        Text("A grown-up can add them. Then this game asks you to remember each one.")
                            .font(jakarta(15, .medium))
                            .foregroundStyle(Theme.muted)
                    } else {
                        let note = store.parentInstructions[index % store.parentInstructions.count]
                        Text("\(store.companionName) says")
                            .font(jakarta(16, .bold))
                            .foregroundStyle(Theme.teal)
                        Text(note.detail)
                            .font(jakarta(17, .bold))
                            .foregroundStyle(Theme.teal)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(message)
                            .font(jakarta(14, .medium))
                            .foregroundStyle(Theme.muted)
                        choice("This one: \(note.title)", correct: true, id: note.id.uuidString)
                        choice("Skip this step", correct: false, id: note.id.uuidString)
                        choice("Do it without a grown-up", correct: false, id: note.id.uuidString)
                    }
        }
    }

    private func choice(_ title: String, correct: Bool, id: String) -> some View {
        Button {
            if correct {
                message = solved.contains(id) ? "You already remembered this one." : "Yes! \(store.companionName) feels proud. +1 star"
                if !solved.contains(id) {
                    solved.insert(id)
                    store.awardRemembered()
                }
                if store.parentInstructions.count > 1 {
                    index = (index + 1) % store.parentInstructions.count
                }
            } else {
                message = "Not quite. Listen to \(store.companionName)'s words again."
            }
        } label: {
            Text(title)
                .font(jakarta(16, .bold))
                .foregroundStyle(Theme.teal)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                .card(border: Theme.tealBorder)
        }
        .buttonStyle(KidButtonStyle())
    }
}

private enum FeedbackTone {
    case good
    case retry
    case talk
}

private enum StoryVoice {
    static let cheers = [
        "You are doing a wonderful job.",
        "I am proud of you.",
        "We can learn this together.",
        "You are a great listener."
    ]

    static func script(page: StoryPage, phase: StoryPhase, index: Int, bear: String) -> String {
        switch phase {
        case .reading:
            "\(page.speech) \(cheers[index % cheers.count])"
        case .tryAgain:
            "\(StoryLibrary.firstMiss) \(page.speech)"
        case .question:
            "\(page.question) Is it \(choiceList(page.choices))? You can do this."
        case .correct:
            StoryLibrary.correctFeedback(bear: bear)
        case .revealed:
            "\(page.reveal) I am still proud of you."
        case .done:
            "You finished the story. I am so proud of you."
        }
    }

    private static func choiceList(_ choices: [StoryChoice]) -> String {
        let labels = choices.map(\.label)
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

    func speak(_ text: String, force: Bool = false) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        prepareAudio()
        let id = UUID()
        requestID = id
        haltAudio()
        isSpeaking = true
        speechMark = Date().timeIntervalSinceReferenceDate
        Task { @MainActor in
            do {
                let data = try await azureAudio(for: trimmed)
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
                speakLocally(trimmed)
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

    private func speakLocally(_ text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = voice ?? AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = rate
        utterance.pitchMultiplier = pitch
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

    private func azureAudio(for text: String) async throws -> Data {
        let escaped = text
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
        let cartoon = speechSSML(escaped, style: "cheerful")
        if let data = try? await requestSpeech(cartoon), !data.isEmpty {
            return data
        }
        return try await requestSpeech(speechSSML(escaped, style: nil))
    }

    /// Jenny in a cheerful style is a bright cartoon character.
    private func speechSSML(_ text: String, style: String?) -> String {
        let spoken: String
        if let style {
            spoken = "<mstts:express-as style='\(style)' styledegree='1.8'><prosody rate='1.02' pitch='+8%'>\(text)</prosody></mstts:express-as>"
        } else {
            spoken = "<prosody rate='1.02' pitch='+8%'>\(text)</prosody>"
        }
        return """
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-US'><voice name='en-US-JennyNeural'>\(spoken)</voice></speak>
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
