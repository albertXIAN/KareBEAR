import SwiftUI

struct OnboardingView: View {
    @Environment(CareStore.self) private var store
    @State private var step: Step
    @State private var parentName = ""
    @State private var email = ""
    @State private var childName = ""
    @State private var age = 7
    @State private var bearDraft = ""
    @State private var room: AppScene = .cozy
    @State private var recovery = ""
    @State private var careStage: CareStage?
    @State private var wantsPrepGame = false
    @State private var tourPassword = ""
    @State private var tourConfirm = ""
    @State private var showCare = false
    @State private var didSeed = false

    private enum Step: Int {
        case account, child, stage, postCare, prepGame, tourWrite, tourAudio, tourPassword, tourGame
    }

    private enum CareStage {
        case pre, post
    }

    init() {
        let args = ProcessInfo.processInfo.arguments
        let start: Step
        if let flag = args.firstIndex(of: "--onboard"), args.indices.contains(args.index(after: flag)) {
            switch args[args.index(after: flag)] {
            case "child": start = .child
            case "stage": start = .stage
            case "care", "post": start = .postCare
            case "pre": start = .prepGame
            case "tour", "tour-write": start = .tourWrite
            case "tour-audio": start = .tourAudio
            case "tour-password": start = .tourPassword
            case "tour-game": start = .tourGame
            default: start = .account
            }
        } else {
            start = .account
        }
        _step = State(initialValue: start)
        switch start {
        case .postCare: _careStage = State(initialValue: .post)
        case .prepGame: _careStage = State(initialValue: .pre)
        default: _careStage = State(initialValue: nil)
        }
    }

    var body: some View {
        Group {
            if step == .tourGame {
                PracticeStoryView(
                    pages: [StoryLibrary.tutorialPage],
                    heading: "Practice game",
                    recordsProgress: false,
                    doneTitle: "You played a practice page",
                    doneDetail: "Games in the child's view work the same way. Saved care steps become the real pages, the remember game, and the to-do list.",
                    doneButton: "Finish and open KareBEAR",
                    onLeave: { step = .tourPassword },
                    onDone: finish
                )
            } else {
                VStack(spacing: 0) {
                    header
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            progress
                            switch step {
                            case .account:
                                accountStep
                            case .child:
                                childStep
                            case .stage:
                                stageStep
                            case .postCare:
                                postCareStep
                            case .prepGame:
                                prepGameStep
                            case .tourWrite:
                                tourWriteStep
                            case .tourAudio:
                                tourAudioStep
                            case .tourPassword:
                                tourPasswordStep
                            case .tourGame:
                                EmptyView()
                            }
                        }
                        .padding(20)
                        .readableColumn(compact: 520)
                    }
                    .scrollIndicators(.hidden)
                }
            }
        }
        .background(Theme.bg)
        .onAppear(perform: seedPreview)
        .fullScreenCover(isPresented: $showCare, onDismiss: { step = .tourWrite }) {
            ParentCareView()
        }
    }

    private var header: some View {
        HStack {
            if step == .account {
                HStack(spacing: 0) {
                    Text("Kare")
                    Text("BEAR")
                        .foregroundStyle(Theme.terra)
                }
                .font(jakarta(20, .extraBold))
                .foregroundStyle(Theme.teal)
                .accessibilityLabel("KareBEAR")
            } else {
                Button(action: goBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(width: 40, height: 40)
                        .background(Color.white, in: Circle())
                        .overlay(Circle().stroke(Theme.border, lineWidth: 1))
                }
                .buttonStyle(KidButtonStyle())
                .accessibilityLabel("Back")
            }
            Spacer()
            if step == .account && store.isCreatingAccount {
                Button {
                    store.cancelNewAccount()
                } label: {
                    Text("Sign in")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.teal)
                }
                .buttonStyle(KidButtonStyle())
            } else {
                Text(step.rawValue >= Step.tourWrite.rawValue ? "Tour" : "For a grown-up")
                    .font(jakarta(14, .bold))
                    .foregroundStyle(Theme.muted)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Theme.bg)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }

    private var progress: some View {
        HStack(spacing: 8) {
            ForEach(0..<4, id: \.self) { item in
                Capsule()
                    .fill(item <= phaseIndex ? Theme.teal : Theme.border)
                    .frame(height: 6)
            }
        }
        .accessibilityLabel("Step \(phaseIndex + 1) of 4")
    }

    private var phaseIndex: Int {
        switch step {
        case .account: 0
        case .child: 1
        case .stage, .postCare, .prepGame: 2
        default: 3
        }
    }

    private var accountStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Create your account")
                .font(jakarta(28, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("A grown-up sets up KareBEAR. This profile stays on this device.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            fieldLabel("Your name")
            field(text: $parentName, prompt: "Alex Rivera")
            fieldLabel("Email")
            field(text: $email, prompt: "alex@email.com")
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)
            primaryButton("Continue") {
                step = .child
            }
            .disabled(!accountReady)
            .opacity(accountReady ? 1 : 0.45)
        }
    }

    private var childStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("About your child")
                .font(jakarta(28, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("KareBEAR uses this on the schedule and profile.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
            fieldLabel("Child's name")
            field(text: $childName, prompt: "Emma")
            fieldLabel("Bear's name")
            field(text: $bearDraft, prompt: "Sunny")
            Text("A name that does not sound like “care” helps kids who are still learning to read. The bear uses this name in stories.")
                .font(jakarta(13, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 8) {
                suggestionName("Sunny")
                suggestionName("Pip")
                suggestionName("Honey")
                suggestionName("Mochi")
            }
            fieldLabel("Room")
            RoomPicker(scene: $room)
            fieldLabel("Age")
            HStack {
                Text("\(age)")
                    .font(jakarta(22, .extraBold))
                    .foregroundStyle(Theme.teal)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Button {
                    age = max(1, age - 1)
                } label: {
                    Image(systemName: "minus")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(width: 44, height: 44)
                        .background(Theme.tealSoft, in: Circle())
                }
                .buttonStyle(KidButtonStyle())
                .accessibilityLabel("Younger")
                Button {
                    age = min(17, age + 1)
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(width: 44, height: 44)
                        .background(Theme.tealSoft, in: Circle())
                }
                .buttonStyle(KidButtonStyle())
                .accessibilityLabel("Older")
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Theme.border, lineWidth: 1)
            )
            fieldLabel("What are they recovering from?")
            field(text: $recovery, prompt: "Tonsillectomy")
            HStack(spacing: 8) {
                suggestion("Tonsillectomy")
                suggestion("Cast care")
            }
            primaryButton("Continue") {
                step = .stage
            }
            .disabled(!childReady)
            .opacity(childReady ? 1 : 0.45)
        }
    }

    private var stageStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Where are you now?")
                .font(jakarta(28, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("Choose the stage that fits \(namedChild). You can add care steps later on Care & Help.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            stageCard(
                title: "Post-op",
                detail: "Care has started. Add the steps \(namedChild) will practice.",
                symbol: "list.bullet.clipboard",
                selected: careStage == .post
            ) {
                careStage = .post
                step = .postCare
            }
            stageCard(
                title: "Pre-op",
                detail: "The operation is still ahead. Add a getting-ready game for \(namedChild).",
                symbol: "cross.case.fill",
                selected: careStage == .pre
            ) {
                careStage = .pre
                step = .prepGame
            }
        }
    }

    private var postCareStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Add care instructions")
                .font(jakarta(28, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("Write a step or record a conversation now. Saved steps become \(namedChild)'s story, remember game, and to-do list.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            TranscriptGroundingNote()
            HStack(spacing: 12) {
                BearBadge(size: 64)
                Text("You can skip this. The tour still shows how adding a step works.")
                    .font(jakarta(15, .semibold))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(14)
            .card()
            primaryButton("Add care steps") {
                guard !isPreview else {
                    step = .tourWrite
                    return
                }
                if store.isCreatingAccount {
                    store.sessionChildName = childName.trimmingCharacters(in: .whitespacesAndNewlines)
                } else {
                    stageProfile()
                }
                showCare = true
            }
            secondaryButton("Skip for now") {
                step = .tourWrite
            }
        }
    }

    private var prepGameStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Preparing for my operation")
                .font(jakarta(28, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("This game sits on \(namedChild)'s Play tab. Kare explains the gown, vitals, blood pressure cuff, IV, anaesthesia mask, and helpers in scrubs.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 12) {
                Image(systemName: "cross.case.fill")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                Text("Each page shows one hospital moment, lets you try it, then asks a question.")
                    .font(jakarta(15, .semibold))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(14)
            .card()
            primaryButton("Add the game") {
                wantsPrepGame = true
                step = .tourWrite
            }
            secondaryButton("Not now") {
                wantsPrepGame = false
                step = .tourWrite
            }
        }
    }

    private var tourWriteStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Write a step")
                .font(jakarta(28, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("On Care & Help, a grown-up can type a step. Here is what that looks like.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            VStack(alignment: .leading, spacing: 10) {
                fieldLabel("Step name")
                exampleField("Rest")
                fieldLabel("What to do")
                exampleField("Rest on the couch after medicine.")
            }
            .padding(14)
            .card()
            Text("After you save it, the step becomes a story page, a remember-game prompt, and a to-do.")
                .font(jakarta(15, .semibold))
                .foregroundStyle(Theme.text)
                .fixedSize(horizontal: false, vertical: true)
            primaryButton("Next: recording") {
                step = .tourAudio
            }
        }
    }

    private var tourAudioStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Record a conversation")
                .font(jakarta(28, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("Or tap Start recording on Care & Help and talk through the steps. This preview does not use the microphone.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 12) {
                    Image(systemName: "mic.fill")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 52, height: 52)
                        .background(Theme.terra, in: Circle())
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Start recording")
                            .font(jakarta(16, .bold))
                            .foregroundStyle(Theme.teal)
                        Text("Speak the care steps, then stop.")
                            .font(jakarta(13, .medium))
                            .foregroundStyle(Theme.muted)
                    }
                }
                Text("“Give the antibiotic at eight in the morning.”")
                    .font(jakarta(15, .semibold))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.bg, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .padding(14)
            .card()
            Text("KareBEAR lists the steps it heard. You approve each one, and you can edit, remove, or add a step. Nothing is saved until you do.")
                .font(jakarta(15, .semibold))
                .foregroundStyle(Theme.text)
                .fixedSize(horizontal: false, vertical: true)
            primaryButton("Next: child view") {
                step = .tourPassword
            }
        }
    }

    private var tourPasswordStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Password for child mode")
                .font(jakarta(28, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("The child's view is games, stories, and to-dos. This password is how a grown-up gets back to the parent view.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            fieldLabel("Password")
            SecureField("At least 6 characters", text: $tourPassword)
                .textContentType(.newPassword)
                .font(jakarta(16, .medium))
                .padding(14)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Theme.border, lineWidth: 1)
                )
            fieldLabel("Type it again")
            SecureField("Same password", text: $tourConfirm)
                .font(jakarta(16, .medium))
                .padding(14)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Theme.border, lineWidth: 1)
                )
            if !tourConfirm.isEmpty && tourPassword != tourConfirm {
                Text("Type the same password in both fields.")
                    .font(jakarta(13, .semibold))
                    .foregroundStyle(Theme.terra)
            }
            primaryButton("See a practice game") {
                step = .tourGame
            }
            .disabled(!passwordReady)
            .opacity(passwordReady ? 1 : 0.45)
        }
    }

    private var accountReady: Bool {
        !parentName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && emailLooksValid
    }

    private var childReady: Bool {
        !childName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !recovery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var passwordReady: Bool {
        tourPassword.count >= 6 && tourPassword == tourConfirm
    }

    private var emailLooksValid: Bool {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let parts = trimmed.split(separator: "@")
        return parts.count == 2 && !parts[0].isEmpty && parts[1].contains(".")
    }

    private var namedChild: String {
        let name = childName.trimmingCharacters(in: .whitespacesAndNewlines)
        return name.isEmpty ? "your child" : name
    }

    private var isPreview: Bool {
        store.didOnboard && ProcessInfo.processInfo.arguments.contains("--onboard")
    }

    private func seedPreview() {
        guard !didSeed else { return }
        didSeed = true
        guard isPreview, !store.isCreatingAccount else { return }
        if parentName.isEmpty { parentName = store.parentName }
        if email.isEmpty { email = store.parentEmail }
        if childName.isEmpty { childName = store.childName }
        if bearDraft.isEmpty { bearDraft = store.companionName }
        room = store.appScene
        if let storedAge = Int(store.childAge), storedAge >= 1, storedAge <= 17 {
            age = storedAge
        }
        if recovery.isEmpty { recovery = store.recoveryFocus }
    }

    private func goBack() {
        switch step {
        case .account:
            break
        case .child:
            step = .account
        case .stage:
            step = .child
        case .postCare, .prepGame:
            step = .stage
        case .tourWrite:
            step = careStage == .post ? .postCare : .prepGame
        case .tourAudio:
            step = .tourWrite
        case .tourPassword:
            step = .tourAudio
        case .tourGame:
            step = .tourPassword
        }
    }

    private func stageProfile() {
        guard !isPreview else { return }
        store.parentName = parentName.trimmingCharacters(in: .whitespacesAndNewlines)
        store.parentEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        store.childName = childName.trimmingCharacters(in: .whitespacesAndNewlines)
        store.childAge = "\(age)"
        store.recoveryFocus = recovery.trimmingCharacters(in: .whitespacesAndNewlines)
        store.renameBear(to: bearDraft)
        store.setRoom(room)
    }

    private func finish() {
        guard !isPreview else { return }
        stageProfile()
        store.completeOnboarding(
            parentName: store.parentName.isEmpty ? "Grown-up" : store.parentName,
            email: store.parentEmail.isEmpty ? "parent@karebear.app" : store.parentEmail,
            childName: store.childName.isEmpty ? "Your child" : store.childName,
            age: store.childAge,
            recovery: store.recoveryFocus.isEmpty ? "Recovery" : store.recoveryFocus,
            password: tourPassword,
            stage: careStage == .pre ? "pre" : "post",
            prepGame: careStage == .pre && wantsPrepGame
        )
    }

    private func fieldLabel(_ title: String) -> some View {
        Text(title)
            .font(jakarta(13, .bold))
            .foregroundStyle(Theme.teal)
    }

    private func field(text: Binding<String>, prompt: String) -> some View {
        TextField(prompt, text: text)
            .font(jakarta(16, .medium))
            .padding(14)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Theme.border, lineWidth: 1)
            )
    }

    private func exampleField(_ value: String) -> some View {
        Text(value)
            .font(jakarta(16, .medium))
            .foregroundStyle(Theme.text)
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.bg, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Theme.border, lineWidth: 1)
            )
    }

    private func suggestion(_ title: String) -> some View {
        Button {
            recovery = title
        } label: {
            Text(title)
                .font(jakarta(13, .bold))
                .foregroundStyle(recovery == title ? .white : Theme.teal)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(recovery == title ? Theme.teal : Theme.tealSoft, in: Capsule())
        }
        .buttonStyle(KidButtonStyle())
    }

    private func stageCard(title: String, detail: String, symbol: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: symbol)
                    .font(.system(size: 18, weight: .bold))
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
                }
                Spacer(minLength: 4)
                Image(systemName: "arrow.right")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.teal)
            }
            .padding(14)
            .card(border: selected ? Theme.teal : Theme.border, lineWidth: selected ? 2 : 1)
        }
        .buttonStyle(KidButtonStyle())
    }

    private func primaryButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(jakarta(16, .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(KidButtonStyle())
    }

    private func secondaryButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(jakarta(16, .bold))
                .foregroundStyle(Theme.teal)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Theme.border, lineWidth: 1)
                )
        }
        .buttonStyle(KidButtonStyle())
    }
}
