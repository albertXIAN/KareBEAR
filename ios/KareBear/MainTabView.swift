import SwiftUI

struct MainTabView: View {
    @Environment(CareStore.self) private var store
    @State private var tab = AppTab.fromLaunchArguments()
    @State private var showHelp = false
    @State private var showProfile = ProcessInfo.processInfo.arguments.contains("--profile")
        || ProcessInfo.processInfo.arguments.contains("--profile-edit")
    @State private var showingChild = Self.initialShowingChild()
    @State private var showSetPassword = false
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var passwordNote = ""

    var body: some View {
        Group {
            if !store.didOnboard || store.isCreatingAccount || Self.forceOnboarding {
                OnboardingView()
            } else if !store.isLoggedIn || Self.forceLogin {
                LoginView()
            } else if showingChild {
                childShell
            } else {
                parentShell
            }
        }
        .preferredColorScheme(.light)
        .task {
            while !Task.isCancelled {
                store.checkNeglect()
                try? await Task.sleep(for: .seconds(20))
            }
        }
        .task(id: store.toastID) {
            guard store.toast != nil else { return }
            try? await Task.sleep(for: .seconds(3.5))
            store.dismissToast()
        }
    }

    private var parentShell: some View {
        shell {
            tabContent
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    BottomTabBar(selection: $tab)
                }
        }
        .environment(\.appActions, AppActions(
            openHelp: { showHelp = true },
            openProfile: { showProfile = true },
            openChild: requestChildMode,
            leaveChild: {}
        ))
        .sensoryFeedback(.selection, trigger: tab)
        .sheet(isPresented: $showProfile) {
            ProfileSheet()
        }
        .sheet(isPresented: $showHelp) {
            HelpSheet()
        }
        .sheet(isPresented: $showSetPassword) {
            setPasswordSheet
        }
    }

    private var setPasswordSheet: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Account password")
                .font(jakarta(24, .extraBold))
                .foregroundStyle(Theme.teal)
            Text("Save the password a grown-up will type to leave the child's view.")
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            SecureField("At least 6 characters", text: $newPassword)
                .textContentType(.newPassword)
                .font(jakarta(16, .medium))
                .padding(14)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.border, lineWidth: 1))
            SecureField("Type it again", text: $confirmPassword)
                .font(jakarta(16, .medium))
                .padding(14)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.border, lineWidth: 1))
            if !passwordNote.isEmpty {
                Text(passwordNote)
                    .font(jakarta(13, .semibold))
                    .foregroundStyle(Theme.terra)
            }
            Button(action: savePasswordAndEnter) {
                Text("Save and open child's view")
                    .font(jakarta(16, .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(KidButtonStyle())
            .disabled(!passwordReady)
            .opacity(passwordReady ? 1 : 0.45)
            Button {
                showSetPassword = false
                newPassword = ""
                confirmPassword = ""
                passwordNote = ""
            } label: {
                Text("Cancel")
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
        .presentationDetents([.medium, .large])
        .presentationBackground(Theme.bg)
    }

    private var passwordReady: Bool {
        newPassword.count >= 6 && newPassword == confirmPassword
    }

    private func requestChildMode() {
        if store.hasPassword {
            enterChildMode()
        } else {
            newPassword = ""
            confirmPassword = ""
            passwordNote = ""
            showSetPassword = true
        }
    }

    private func savePasswordAndEnter() {
        guard passwordReady else {
            passwordNote = "Use at least 6 characters, and type the same password twice."
            return
        }
        store.savePassword(newPassword)
        newPassword = ""
        confirmPassword = ""
        passwordNote = ""
        showSetPassword = false
        enterChildMode()
    }

    private var childShell: some View {
        shell {
            QuestHomeView()
        }
        .environment(\.appActions, AppActions(
            openHelp: {},
            openProfile: {},
            openChild: {},
            leaveChild: exitChildMode
        ))
    }

    private func shell<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        ZStack(alignment: .top) {
            Theme.bg.ignoresSafeArea()
            content()
            if let toast = store.toast {
                ToastBanner(text: toast) {
                    store.dismissToast()
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
            }
            if store.showPuppyCelebration {
                PuppyCelebration {
                    store.showPuppyCelebration = false
                }
                .transition(.opacity)
            }
        }
        .animation(.spring(duration: 0.35), value: store.toast)
        .animation(.spring(duration: 0.35), value: store.showPuppyCelebration)
        .sensoryFeedback(.success, trigger: store.stars)
    }

    private func enterChildMode() {
        showingChild = true
        store.enterChildMode()
    }

    private func exitChildMode() {
        showingChild = false
        store.leaveChildMode()
    }

    @ViewBuilder
    private var tabContent: some View {
        switch tab {
        case .schedule:
            ScheduleView()
        case .rewards:
            RewardsBearView()
        case .quest:
            ScheduleView()
        case .care:
            CareHelpView()
        }
    }

    private static var forceOnboarding: Bool {
        ProcessInfo.processInfo.arguments.contains("--onboard")
    }

    private static var forceLogin: Bool {
        ProcessInfo.processInfo.arguments.contains("--login")
    }

    private static func initialShowingChild() -> Bool {
        let args = ProcessInfo.processInfo.arguments
        if let flag = args.firstIndex(of: "--mode") {
            let next = args.index(after: flag)
            if args.indices.contains(next) {
                if args[next] == "child" { return true }
                if args[next] == "parent" { return false }
            }
        }
        return UserDefaults.standard.bool(forKey: "kare.childMode")
    }
}
