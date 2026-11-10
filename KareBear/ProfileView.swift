import SwiftUI

struct ProfileSheet: View {
    @Environment(CareStore.self) private var store
    @Environment(\.appActions) private var actions
    @Environment(\.dismiss) private var dismiss
    @State private var isEditing: Bool
    @State private var parentName = ""
    @State private var email = ""
    @State private var childName = ""
    @State private var age = 7
    @State private var recovery = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var didSave = false
    @State private var confirmLogout = false

    init() {
        let editing = ProcessInfo.processInfo.arguments.contains("--profile-edit")
        _isEditing = State(initialValue: editing)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    if isEditing {
                        editor
                    } else {
                        details
                    }
                }
                .padding(20)
                .readableColumn(compact: 520)
            }
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .background(Theme.bg)
            .navigationTitle(isEditing ? "Edit profile" : "Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Theme.bg, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(isEditing ? "Cancel" : "Close") {
                        if isEditing {
                            load()
                            isEditing = false
                            didSave = false
                        } else {
                            dismiss()
                        }
                    }
                    .font(jakarta(16, .bold))
                    .foregroundStyle(Theme.teal)
                }
                if !isEditing {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Edit") {
                            load()
                            didSave = false
                            isEditing = true
                        }
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.teal)
                    }
                }
            }
        }
        .onAppear(perform: load)
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .presentationBackground(Theme.bg)
        .alert("Log out?", isPresented: $confirmLogout) {
            Button("Log out", role: .destructive) {
                store.logOut()
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("\(store.childName.isEmpty ? "Your child" : store.childName)'s care steps and progress stay on this device. Sign in again with the account email and password.")
        }
    }

    private var header: some View {
        VStack(spacing: 8) {
            EmmaAvatar(size: 84)
            Text(store.childName.isEmpty ? "Your child" : store.childName)
                .font(jakarta(28, .extraBold))
                .foregroundStyle(Theme.teal)
            Text(store.childSummary)
                .font(jakarta(15, .semibold))
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Text("A grown-up can update these details. They stay on this device.")
                .font(jakarta(14, .medium))
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
    }

    private var details: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionTitle("Grown-up")
            VStack(spacing: 0) {
                detailRow("Name", store.parentName)
                divider
                detailRow("Email", store.parentEmail)
                divider
                detailRow("Password", store.hasPassword ? "Saved on this device" : "Add a password")
            }
            .card(radius: 18)

            Button {
                confirmLogout = true
            } label: {
                Text("Log out")
                    .font(jakarta(16, .bold))
                    .foregroundStyle(Theme.terra)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Theme.terra.opacity(0.45), lineWidth: 1)
                    )
            }
            .buttonStyle(KidButtonStyle())
            .accessibilityLabel("Log out")

            sectionTitle("Child")
            VStack(spacing: 0) {
                detailRow("Name", store.childName)
                divider
                detailRow("Age", store.childAge.isEmpty ? "" : "\(store.childAge) years")
                divider
                detailRow("Recovery", store.recoveryFocus)
                if !store.careStage.isEmpty {
                    divider
                    detailRow("Stage", store.careStage == "pre" ? "Pre-op" : "Post-op")
                }
                if store.prepGameEnabled {
                    divider
                    detailRow("Preparing game", "On the Play tab")
                }
            }
            .card(radius: 18)

            HStack(spacing: 12) {
                stat(value: "\(store.stars)", label: "Stars")
                stat(value: "\(store.unlockedBadgeCount)/4", label: "Badges")
            }

            Button {
                dismiss()
                actions.openChild()
            } label: {
                Label("Open child's view", systemImage: "figure.and.child.holdinghands")
                    .font(jakarta(16, .bold))
                    .foregroundStyle(Theme.teal)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }
            .buttonStyle(KidButtonStyle())

            if didSave {
                Text("Saved on this device.")
                    .font(jakarta(14, .semibold))
                    .foregroundStyle(Theme.teal)
                    .frame(maxWidth: .infinity)
            }
        }
    }

    private var editor: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionTitle("Grown-up")
            fieldLabel("Your name")
            field(text: $parentName, prompt: "Alex Rivera")
            fieldLabel("Email")
            field(text: $email, prompt: "alex@email.com")
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)
                .textContentType(.emailAddress)
            fieldLabel(store.hasPassword ? "New password" : "Account password")
            SecureField("At least 6 characters", text: $newPassword)
                .textContentType(.newPassword)
                .font(jakarta(16, .medium))
                .padding(14)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.border, lineWidth: 1))
            fieldLabel("Type the password again")
            SecureField("Same password", text: $confirmPassword)
                .font(jakarta(16, .medium))
                .padding(14)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.border, lineWidth: 1))

            sectionTitle("Child")
            fieldLabel("Child's name")
            field(text: $childName, prompt: "Emma")
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

            Button(action: save) {
                Text("Save profile")
                    .font(jakarta(16, .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(KidButtonStyle())
            .disabled(!canSave)
            .opacity(canSave ? 1 : 0.45)
            .padding(.top, 4)

            if !email.isEmpty && !emailLooksValid {
                Text("Enter an email with a name and a domain.")
                    .font(jakarta(13, .semibold))
                    .foregroundStyle(Theme.terra)
            }
            if !store.hasPassword && newPassword.isEmpty {
                Text("Add an account password. A grown-up types it to leave the child's view.")
                    .font(jakarta(13, .semibold))
                    .foregroundStyle(Theme.muted)
            }
            if !passwordReady && (!newPassword.isEmpty || !confirmPassword.isEmpty) {
                Text("Use at least 6 characters, and type the same password twice.")
                    .font(jakarta(13, .semibold))
                    .foregroundStyle(Theme.terra)
            }
        }
    }

    private var divider: some View {
        Rectangle()
            .fill(Theme.border)
            .frame(height: 1)
            .padding(.leading, 14)
    }

    private var canSave: Bool {
        !parentName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && emailLooksValid
            && !childName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !recovery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && passwordReady
    }

    private var passwordReady: Bool {
        if newPassword.isEmpty && confirmPassword.isEmpty { return store.hasPassword }
        return newPassword.count >= 6 && newPassword == confirmPassword
    }

    private var emailLooksValid: Bool {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let parts = trimmed.split(separator: "@")
        return parts.count == 2 && !parts[0].isEmpty && parts[1].contains(".")
    }

    private func load() {
        parentName = store.parentName
        email = store.parentEmail
        childName = store.childName
        let parsed = Int(store.childAge) ?? 7
        age = min(17, max(1, parsed))
        recovery = store.recoveryFocus
        newPassword = ""
        confirmPassword = ""
    }

    private func save() {
        store.updateProfile(
            parentName: parentName,
            email: email,
            childName: childName,
            age: "\(age)",
            recovery: recovery
        )
        if !newPassword.isEmpty {
            store.savePassword(newPassword)
        }
        didSave = true
        isEditing = false
    }

    private func sectionTitle(_ title: String) -> some View {
        Text(title)
            .font(jakarta(13, .bold))
            .foregroundStyle(Theme.muted)
            .textCase(.uppercase)
            .padding(.top, 4)
    }

    private func detailRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label)
                .font(jakarta(15, .semibold))
                .foregroundStyle(Theme.muted)
            Spacer(minLength: 12)
            Text(value.isEmpty ? "Add this" : value)
                .font(jakarta(16, .bold))
                .foregroundStyle(value.isEmpty ? Theme.subtle : Theme.text)
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
        .accessibilityElement(children: .combine)
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

    private func stat(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(jakarta(20, .extraBold))
                .foregroundStyle(Theme.teal)
            Text(label)
                .font(jakarta(12, .semibold))
                .foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .card(radius: 16)
    }
}

struct LoginView: View {
    @Environment(CareStore.self) private var store
    @State private var email = ""
    @State private var password = ""
    @State private var note = ""
    @State private var confirmNewAccount = false

    private var canSubmit: Bool {
        email.contains("@") && password.count >= 6
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                HStack(spacing: 0) {
                    Text("Kare")
                    Text("BEAR")
                        .foregroundStyle(Theme.terra)
                }
                .font(jakarta(20, .extraBold))
                .foregroundStyle(Theme.teal)
                .accessibilityLabel("KareBEAR")
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Theme.bg)
            .overlay(alignment: .bottom) {
                Rectangle().fill(Theme.border).frame(height: 1)
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Sign in")
                        .font(jakarta(28, .extraBold))
                        .foregroundStyle(Theme.teal)
                    Text("Use the account email and password for this device. Care steps stay saved here.")
                        .font(jakarta(15, .medium))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("Email")
                        .font(jakarta(13, .bold))
                        .foregroundStyle(Theme.teal)
                    TextField("alex@email.com", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .font(jakarta(16, .medium))
                        .padding(14)
                        .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.border, lineWidth: 1))
                    Text("Password")
                        .font(jakarta(13, .bold))
                        .foregroundStyle(Theme.teal)
                    SecureField("Account password", text: $password)
                        .textContentType(.password)
                        .font(jakarta(16, .medium))
                        .padding(14)
                        .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.border, lineWidth: 1))
                    if !note.isEmpty {
                        Text(note)
                            .font(jakarta(13, .semibold))
                            .foregroundStyle(Theme.terra)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Button(action: submit) {
                        Text("Sign in")
                            .font(jakarta(16, .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                    .buttonStyle(KidButtonStyle())
                    .disabled(!canSubmit)
                    .opacity(canSubmit ? 1 : 0.45)
                    Button {
                        confirmNewAccount = true
                    } label: {
                        Text("Create a new account")
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
                .padding(20)
                .readableColumn(compact: 520)
            }
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
        }
        .background(Theme.bg)
        .alert("Create a new account?", isPresented: $confirmNewAccount) {
            Button("Continue") {
                store.beginNewAccount()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("When setup is finished, this device uses the new account. Care steps from the current account are cleared. Sign in stays available until then.")
        }
    }

    private func submit() {
        if store.logIn(email: email, password: password) {
            note = ""
            password = ""
        } else {
            note = "That email or password does not match this device."
        }
    }
}
