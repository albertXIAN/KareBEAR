import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case schedule
    case rewards
    case quest
    case care

    var id: String { rawValue }

    var title: String {
        switch self {
        case .schedule: "Schedule"
        case .rewards: "Rewards"
        case .quest: "Quest"
        case .care: "Care & Help"
        }
    }

    var symbol: String {
        switch self {
        case .schedule: "calendar"
        case .rewards: "star.fill"
        case .quest: "sparkles"
        case .care: "cross.case.fill"
        }
    }

    static let parentTabs: [AppTab] = [.schedule, .rewards, .care]

    static func fromLaunchArguments() -> AppTab {
        let args = ProcessInfo.processInfo.arguments
        guard let flag = args.firstIndex(of: "--tab") else { return .schedule }
        let next = args.index(after: flag)
        guard args.indices.contains(next) else { return .schedule }
        let raw = args[next] == "dosing" ? "rewards" : args[next]
        let tab = AppTab(rawValue: raw) ?? .schedule
        return parentTabs.contains(tab) ? tab : .schedule
    }
}

struct AppActions {
    var openHelp: () -> Void
    var openProfile: () -> Void
    var openChild: () -> Void
    var leaveChild: () -> Void
}

private struct AppActionsKey: EnvironmentKey {
    static let defaultValue = AppActions(openHelp: {}, openProfile: {}, openChild: {}, leaveChild: {})
}

extension EnvironmentValues {
    var appActions: AppActions {
        get { self[AppActionsKey.self] }
        set { self[AppActionsKey.self] = newValue }
    }
}

struct BottomTabBar: View {
    @Binding var selection: AppTab

    var body: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(Theme.border)
                .frame(height: 1)
            HStack(spacing: 0) {
                ForEach(AppTab.parentTabs) { tab in
                    let selected = selection == tab
                    Button {
                        selection = tab
                    } label: {
                        VStack(spacing: 3) {
                            Image(systemName: tab.symbol)
                                .font(.system(size: 20, weight: selected ? .bold : .regular))
                            Text(tab.title)
                                .font(jakarta(11, selected ? .bold : .semibold))
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }
                        .foregroundStyle(selected ? Theme.teal : Theme.muted)
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 48)
                        .padding(.top, 8)
                        .padding(.bottom, 6)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(tab.title)
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
            .padding(.horizontal, 6)
        }
        .background(Theme.bg)
    }
}

struct ToastBanner: View {
    let text: String
    var onClose: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            Text("⭐")
                .font(.system(size: 18))
            Text(text)
                .font(jakarta(14, .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)
            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white.opacity(0.9))
                    .frame(width: 36, height: 36)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Close message")
        }
        .padding(.leading, 14)
        .padding(.trailing, 6)
        .padding(.vertical, 8)
        .background(Theme.teal, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Theme.tealDark, lineWidth: 1)
        )
        .shadow(color: Theme.teal.opacity(0.22), radius: 12, y: 6)
        .accessibilityElement(children: .combine)
    }
}

struct PuppyCelebration: View {
    @Environment(CareStore.self) private var store
    var onClose: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.28)
                .ignoresSafeArea()
                .onTapGesture(perform: onClose)
            VStack(spacing: 10) {
                Text("🐶")
                    .font(.system(size: 68))
                Text("Puppy Hero!")
                    .font(jakarta(28, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text("\(store.childName) earned a new friend.")
                    .font(jakarta(16, .semibold))
                    .foregroundStyle(Theme.muted)
                    .multilineTextAlignment(.center)
                Button(action: onClose) {
                    Text("Yay!")
                        .font(jakarta(17, .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(KidButtonStyle())
                .padding(.top, 8)
            }
            .padding(24)
            .frame(maxWidth: 420)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
            .padding(.horizontal, 32)
        }
        .accessibilityAddTraits(.isModal)
    }
}

struct HelpSheet: View {
    @Environment(CareStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Capsule()
                .fill(Theme.border)
                .frame(width: 40, height: 5)
                .frame(maxWidth: .infinity)
                .padding(.top, 8)
            Text("Hand this to a grown-up")
                .font(jakarta(24, .extraBold))
                .foregroundStyle(Theme.teal)
                .fixedSize(horizontal: false, vertical: true)
            Text("KareBEAR care guidance: regular small sips reduce throat tightness. Check with the surgical team if fluid intake is less than 4 cups by afternoon.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.text)
                .fixedSize(horizontal: false, vertical: true)
            Text("If \(store.childName) is bleeding, cannot drink, or has trouble breathing, a grown-up should call the care team.")
                .font(jakarta(15, .semibold))
                .foregroundStyle(Theme.text)
                .fixedSize(horizontal: false, vertical: true)
            Button {
                dismiss()
            } label: {
                Text("Okay")
                    .font(jakarta(17, .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(KidButtonStyle())
            .padding(.top, 6)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(Theme.bg)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.hidden)
        .presentationBackground(Theme.bg)
    }
}

struct TranscriptGroundingNote: View {
    var compact = false

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Theme.teal)
                .padding(.top, 2)
            VStack(alignment: .leading, spacing: 4) {
                Text("From the transcript only")
                    .font(jakarta(15, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text(compact
                     ? "Post-op steps come from the recording or words a grown-up typed. Nothing is added from other websites or outside advice."
                     : "Every post-op care step comes from the conversation transcript or the words a grown-up typed. KareBEAR does not add outside medical information.")
                    .font(jakarta(13, .medium))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(fill: Theme.tealSoft, border: Theme.tealBorder)
        .accessibilityElement(children: .combine)
    }
}

struct RoomPicker: View {
    @Binding var scene: AppScene

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            ForEach(AppScene.allCases) { option in
                Button {
                    scene = option
                } label: {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Image(systemName: option.symbol)
                                .font(.system(size: 16, weight: .bold))
                            Spacer()
                            if scene == option {
                                Image(systemName: "checkmark.circle.fill")
                            }
                        }
                        Text(option.title)
                            .font(jakarta(14, .extraBold))
                        Text(option.detail)
                            .font(jakarta(12, .medium))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .foregroundStyle(scene == option ? Theme.teal : Theme.muted)
                    .padding(12)
                    .frame(maxWidth: .infinity, minHeight: 92, alignment: .topLeading)
                    .background(option.canvas, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(scene == option ? Theme.teal : Theme.border, lineWidth: scene == option ? 2 : 1)
                    )
                }
                .buttonStyle(KidButtonStyle())
                .accessibilityLabel(option.title)
                .accessibilityAddTraits(scene == option ? .isSelected : [])
            }
        }
    }
}

struct NameBearButton: View {
    @Environment(CareStore.self) private var store
    @State private var showSheet = false
    @State private var draft = ""
    @State private var scene: AppScene = .cozy

    private let ideas = ["Sunny", "Pip", "Honey", "Mochi"]

    var body: some View {
        Button {
            draft = store.companionName
            scene = store.appScene
            showSheet = true
        } label: {
            Label(store.companionName, systemImage: "paintpalette.fill")
                .font(jakarta(15, .bold))
                .foregroundStyle(Theme.teal)
                .padding(.horizontal, 14)
                .frame(height: 40)
                .background(Color.white, in: Capsule())
                .overlay(Capsule().stroke(Theme.teal.opacity(0.35), lineWidth: 1.5))
        }
        .buttonStyle(KidButtonStyle())
        .accessibilityLabel("Change bear name and room. The bear is called \(store.companionName)")
        .sheet(isPresented: $showSheet) {
            customizeSheet
        }
    }

    private var customizeSheet: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Make it yours")
                    .font(jakarta(26, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text("Pick a bear name that does not sound like “care,” so kids who are still learning to read are not confused. Then pick a room.")
                    .font(jakarta(15, .medium))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Bear name")
                    .font(jakarta(13, .bold))
                    .foregroundStyle(Theme.teal)
                TextField("Sunny", text: $draft)
                    .font(jakarta(20, .bold))
                    .foregroundStyle(Theme.teal)
                    .padding(14)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
                    .textInputAutocapitalization(.words)
                    .autocorrectionDisabled()
                    .submitLabel(.done)
                    .onSubmit(save)
                    .onChange(of: draft) { _, next in
                        if next.count > 16 {
                            draft = String(next.prefix(16))
                        }
                    }
                HStack(spacing: 8) {
                    ForEach(ideas, id: \.self) { idea in
                        Button {
                            draft = idea
                        } label: {
                            Text(idea)
                                .font(jakarta(14, .bold))
                                .foregroundStyle(Theme.teal)
                                .padding(.horizontal, 12)
                                .frame(height: 36)
                                .background(Theme.tealSoft, in: Capsule())
                        }
                        .buttonStyle(KidButtonStyle())
                    }
                }
                Text("Room")
                    .font(jakarta(13, .bold))
                    .foregroundStyle(Theme.teal)
                    .padding(.top, 4)
                RoomPicker(scene: $scene)
                Button(action: save) {
                    Text("Save look")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(KidButtonStyle())
                Button {
                    showSheet = false
                } label: {
                    Text("Not now")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                }
                .buttonStyle(KidButtonStyle())
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(Theme.bg)
        .presentationDetents([.large])
        .presentationBackground(Theme.bg)
    }

    private func save() {
        store.renameBear(to: draft)
        store.setRoom(scene)
        showSheet = false
    }
}
