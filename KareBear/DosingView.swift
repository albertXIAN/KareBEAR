import SwiftUI

struct DosingView: View {
    @Environment(CareStore.self) private var store
    @Environment(\.appActions) private var actions

    var body: some View {
        VStack(spacing: 0) {
            KareHeader()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("How much to take")
                        .font(jakarta(26, .extraBold))
                        .foregroundStyle(Theme.teal)
                    Text(store.doses.isEmpty
                         ? "Care steps from a grown-up will show up here."
                         : "A grown-up helps with each step. \(store.childName) follows along.")
                        .font(jakarta(15, .medium))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)

                    if store.doses.isEmpty {
                        Text("No care steps yet.")
                            .font(jakarta(15, .medium))
                            .foregroundStyle(Theme.muted)
                            .padding(14)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .card()
                    }

                    ForEach(store.doses) { dose in
                        doseCard(dose)
                    }

                    if store.doses.isEmpty {
                        EmptyView()
                    } else if store.heroDose != nil {
                        Button {
                            store.tookMedicine()
                        } label: {
                            Label("Mark next dose as taken", systemImage: "checkmark.circle.fill")
                                .font(jakarta(16, .bold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 52)
                                .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                        .buttonStyle(KidButtonStyle())
                        .padding(.top, 4)
                    } else {
                        HStack(spacing: 8) {
                            Text("⭐")
                            Text("Every dose for today is done.")
                                .font(jakarta(15, .bold))
                                .foregroundStyle(Theme.teal)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(16)
                        .card(fill: Theme.tealSoft, border: Theme.tealBorder)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 24)
                .readableColumn()
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
    }

    private func doseCard(_ dose: Dose) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Text(emoji(for: dose))
                .font(.system(size: 26))
                .frame(width: 56, height: 56)
                .background(fill(for: dose), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            VStack(alignment: .leading, spacing: 3) {
                Text(dose.name)
                    .font(jakarta(16, .bold))
                    .foregroundStyle(Theme.teal)
                Text(dose.amount.isEmpty ? dose.detail : dose.amount)
                    .font(dose.amount.isEmpty ? jakarta(15, .medium) : jakarta(22, .extraBold))
                    .foregroundStyle(dose.amount.isEmpty ? Theme.muted : Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
                if !dose.time.isEmpty {
                    Text(dose.time)
                        .font(jakarta(13, .semibold))
                        .foregroundStyle(dose.status == .due ? Theme.terra : Theme.muted)
                }
            }
            Spacer(minLength: 8)
            Text(store.trailingLabel(for: dose))
                .font(jakarta(12, .bold))
                .foregroundStyle(dose.status == .due ? Theme.terra : Theme.teal)
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background(dose.status == .due ? Theme.terraSoft : Theme.tealSoft, in: Capsule())
        }
        .padding(14)
        .card(border: dose.status == .due ? Theme.terra.opacity(0.4) : Theme.border, lineWidth: dose.status == .due ? 2 : 1)
        .accessibilityElement(children: .combine)
    }

    private func emoji(for dose: Dose) -> String {
        let text = "\(dose.name) \(dose.detail)".lowercased()
        if text.contains("popsicle") || text.contains("treat") { return "🍧" }
        if text.contains("sip") || text.contains("water") || text.contains("drink") { return "💧" }
        if text.contains("rest") || text.contains("sleep") { return "🌙" }
        if text.contains("medicine") || text.contains("antibiotic") || text.contains("dose") || !dose.amount.isEmpty { return "💊" }
        return "🫶"
    }

    private func fill(for dose: Dose) -> Color {
        switch dose.status {
        case .done: Theme.tealSoft
        case .due: Theme.terraSoft
        case .upcoming: Theme.bg
        }
    }
}

struct KareHeader: View {
    var showsHelp = true
    @Environment(CareStore.self) private var store
    @Environment(\.appActions) private var actions

    var body: some View {
        HStack(alignment: .center, spacing: 8) {
            HStack(alignment: .top, spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(Theme.tealSoft)
                    Image(systemName: "heart.fill")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.teal)
                }
                .frame(width: 28, height: 28)
                .padding(.top, 2)
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 0) {
                        Text("Kare")
                        Text("BEAR")
                            .foregroundStyle(Theme.terra)
                    }
                    .font(jakarta(19, .extraBold))
                    .foregroundStyle(Theme.teal)
                    .accessibilityLabel("KareBEAR")
                    HStack(spacing: 5) {
                        Circle().fill(Theme.teal).frame(width: 6, height: 6)
                        Text(store.childSummary)
                            .font(jakarta(11, .semibold))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                    .foregroundStyle(Theme.teal)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Theme.tealSoft, in: Capsule())
                    .overlay(Capsule().stroke(Theme.tealBorder.opacity(0.8), lineWidth: 1))
                }
            }
            Spacer(minLength: 8)
            Button(action: actions.openChild) {
                Image(systemName: "figure.and.child.holdinghands")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.teal)
                    .frame(width: 40, height: 40)
                    .background(Color.white, in: Circle())
                    .overlay(Circle().stroke(Theme.border, lineWidth: 1))
            }
            .buttonStyle(KidButtonStyle())
            .accessibilityLabel("Open child's view")
            if showsHelp {
                Button(action: actions.openHelp) {
                    Image(systemName: "stethoscope")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Theme.teal)
                        .frame(width: 40, height: 40)
                        .background(Color.white, in: Circle())
                        .overlay(Circle().stroke(Theme.border, lineWidth: 1))
                }
                .buttonStyle(KidButtonStyle())
                .accessibilityLabel("Care team help")
            }
            Button(action: actions.openProfile) {
                EmmaAvatar(size: 36)
                    .padding(2)
                    .background(Color.white, in: Circle())
                    .overlay(Circle().stroke(Theme.border, lineWidth: 1))
            }
            .buttonStyle(KidButtonStyle())
            .accessibilityLabel("\(store.childName)'s profile")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Theme.bg)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }
}
