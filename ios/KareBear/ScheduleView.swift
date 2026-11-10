import SwiftUI

private struct WeekDay: Identifiable {
    let id: Int
    let letter: String
    let name: String
    let kind: Kind

    enum Kind {
        case past, today, future
    }
}

struct ScheduleView: View {
    @Environment(CareStore.self) private var store
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var selectedDay = 14

    private let days: [WeekDay] = [
        WeekDay(id: 12, letter: "M", name: "Monday", kind: .past),
        WeekDay(id: 13, letter: "T", name: "Tuesday", kind: .past),
        WeekDay(id: 14, letter: "W", name: "Wednesday", kind: .today),
        WeekDay(id: 15, letter: "T", name: "Thursday", kind: .future),
        WeekDay(id: 16, letter: "F", name: "Friday", kind: .future),
        WeekDay(id: 17, letter: "S", name: "Saturday", kind: .future),
        WeekDay(id: 18, letter: "S", name: "Sunday", kind: .future)
    ]

    var body: some View {
        VStack(spacing: 0) {
            header
            if sizeClass == .regular {
                padBody
            } else {
                phoneBody
            }
        }
        .background(Theme.bg)
    }

    private var phoneBody: some View {
        ScrollView {
            dayContent
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 24)
                .readableColumn()
        }
        .scrollIndicators(.hidden)
    }

    private var padBody: some View {
        GeometryReader { geo in
            let column = (geo.size.width - 76) / 2
            let bear = min(column * 0.88, geo.size.height * 0.5)
            HStack(alignment: .center, spacing: 24) {
                VStack(spacing: 12) {
                    BearBadge(size: bear, mood: store.bearMood, showsStatus: true)
                    Text(store.bearMood.title(called: store.companionName))
                        .font(jakarta(28, .extraBold))
                        .foregroundStyle(store.bearMood.color)
                        .multilineTextAlignment(.center)
                    Text(store.bearMood.detail(called: store.companionName))
                        .font(jakarta(17, .medium))
                        .foregroundStyle(Theme.muted)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                ScrollView {
                    dayContent.frame(maxWidth: .infinity, alignment: .top)
                }
                .scrollIndicators(.hidden)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var dayContent: some View {
        VStack(alignment: .leading, spacing: 18) {
            titleRow
            weekStrip
            if selectedDay == 14 {
                heroCard
                scheduleList
            } else {
                otherDayCard
            }
        }
    }

    private var header: some View {
        KareHeader()
    }

    private var titleRow: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text("\(store.childName)'s Recovery")
                    .font(jakarta(26, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text(store.recoveryFocus.isEmpty ? "Recovery" : store.recoveryFocus)
                    .font(jakarta(14, .semibold))
                    .foregroundStyle(Theme.muted)
            }
            Spacer(minLength: 0)
        }
    }

    private var weekStrip: some View {
        HStack(spacing: 6) {
            ForEach(days) { day in
                let selected = day.id == selectedDay
                Button {
                    selectedDay = day.id
                } label: {
                    VStack(spacing: 2) {
                        Text(day.letter)
                            .font(jakarta(11, .bold))
                            .foregroundStyle(selected ? Color.white.opacity(0.85) : Theme.subtle)
                        Text("\(day.id)")
                            .font(jakarta(15, .extraBold))
                            .foregroundStyle(selected ? Color.white : Theme.text)
                        dayMarker(day, selected: selected)
                            .frame(height: 16)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(selected ? Theme.teal : Color.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(selected ? Theme.teal : Theme.border, lineWidth: 1)
                    )
                }
                .buttonStyle(KidButtonStyle())
                .accessibilityLabel("\(day.name) \(day.id)")
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
        }
    }

    @ViewBuilder
    private func dayMarker(_ day: WeekDay, selected: Bool) -> some View {
        switch day.kind {
        case .past:
            Image(systemName: "checkmark")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(selected ? Color.white : Theme.teal)
        case .today:
            Circle()
                .fill(selected ? Color.white : Theme.teal)
                .frame(width: 6, height: 6)
        case .future:
            Circle()
                .fill(selected ? Color.white.opacity(0.8) : Theme.border)
                .frame(width: 6, height: 6)
        }
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            if store.doses.isEmpty {
                VStack(spacing: 8) {
                    if sizeClass != .regular {
                        BearBadge(size: 72)
                    }
                    Text("No care steps yet")
                        .font(jakarta(24, .extraBold))
                        .foregroundStyle(Theme.teal)
                    Text("A grown-up can add them on Care & Help. They will show up here.")
                        .font(jakarta(15, .medium))
                        .foregroundStyle(Theme.muted)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            } else if let dose = store.heroDose {
                Text(store.dueChip)
                    .font(jakarta(11, .extraBold))
                    .foregroundStyle(Theme.terra)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Theme.terraSoft, in: Capsule())
                    .overlay(Capsule().stroke(Theme.terra.opacity(0.25), lineWidth: 1))
                Text(dose.name)
                    .font(jakarta(24, .extraBold))
                    .foregroundStyle(Theme.teal)
                    .padding(.top, 12)
                Text(dose.detail)
                    .font(jakarta(16, .medium))
                    .foregroundStyle(Theme.muted)
                    .padding(.top, 2)
                    .fixedSize(horizontal: false, vertical: true)
                Text(dose.amount.isEmpty ? "A grown-up helps with this step." : "\(dose.amount) • A grown-up measures this.")
                    .font(jakarta(13, .semibold))
                    .foregroundStyle(Theme.subtle)
                    .padding(.top, 4)
                Button {
                    store.tookMedicine()
                } label: {
                    Label("Mark as Taken", systemImage: "checkmark.circle.fill")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(KidButtonStyle())
                .padding(.top, 16)
                .accessibilityHint("Adds two stars")
                Button {
                    store.snoozeNextDose()
                } label: {
                    Text(store.snoozeTitle)
                        .font(jakarta(14, .bold))
                        .foregroundStyle(store.snoozed ? Theme.teal : Theme.muted)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .buttonStyle(.plain)
            } else {
                VStack(spacing: 8) {
                    Text("⭐")
                        .font(.system(size: 36))
                    Text("All done today!")
                        .font(jakarta(24, .extraBold))
                        .foregroundStyle(Theme.teal)
                    Text("Every care step for today is done.")
                        .font(jakarta(15, .medium))
                        .foregroundStyle(Theme.muted)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
        .animation(.spring(duration: 0.35), value: store.doses)
    }

    private var scheduleList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Today's Schedule")
                .font(jakarta(18, .extraBold))
                .foregroundStyle(Theme.teal)
            if store.doses.isEmpty {
                Text("Nothing is scheduled until a grown-up adds care steps.")
                    .font(jakarta(14, .medium))
                    .foregroundStyle(Theme.muted)
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .card()
            }
            ForEach(store.doses) { dose in
                doseRow(dose)
            }
        }
    }

    private func doseRow(_ dose: Dose) -> some View {
        let due = dose.status == .due
        return HStack(spacing: 12) {
            Image(systemName: dose.status == .done ? "checkmark" : "clock")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(iconColor(dose))
                .frame(width: 36, height: 36)
                .background(iconFill(dose), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(iconBorder(dose), lineWidth: 1)
                )
            VStack(alignment: .leading, spacing: 2) {
                Text(dose.amount.isEmpty ? dose.name : "\(dose.name) (\(dose.amount))")
                    .font(jakarta(15, .bold))
                    .foregroundStyle(Theme.text)
                Text(store.subtitle(for: dose))
                    .font(jakarta(13, due ? .bold : .medium))
                    .foregroundStyle(due ? Theme.terra : Theme.muted)
            }
            Spacer(minLength: 8)
            Text(store.trailingLabel(for: dose))
                .font(jakarta(12, due ? .extraBold : .bold))
                .foregroundStyle(trailingColor(dose))
                .padding(.horizontal, dose.status == .upcoming ? 0 : 8)
                .padding(.vertical, 4)
                .background(trailingFill(dose), in: Capsule())
        }
        .padding(14)
        .card(
            border: due ? Theme.terra.opacity(0.4) : Theme.border,
            lineWidth: due ? 2 : 1
        )
    }

    private func iconColor(_ dose: Dose) -> Color {
        switch dose.status {
        case .done: Theme.teal
        case .due: Theme.terra
        case .upcoming: Theme.subtle
        }
    }

    private func iconFill(_ dose: Dose) -> Color {
        switch dose.status {
        case .done: Theme.tealSoft
        case .due: Theme.terraSoft
        case .upcoming: Theme.bg
        }
    }

    private func iconBorder(_ dose: Dose) -> Color {
        switch dose.status {
        case .done: Theme.tealBorder
        case .due: Theme.terra.opacity(0.3)
        case .upcoming: Theme.border
        }
    }

    private func trailingColor(_ dose: Dose) -> Color {
        switch dose.status {
        case .done: Theme.teal
        case .due: Theme.terra
        case .upcoming: Theme.subtle
        }
    }

    private func trailingFill(_ dose: Dose) -> Color {
        switch dose.status {
        case .done: Theme.tealSoft
        case .due: Theme.terraSoft
        case .upcoming: .clear
        }
    }

    private var otherDayCard: some View {
        let day = days.first { $0.id == selectedDay }
        return VStack(spacing: 8) {
            BearBadge(size: 72)
            Text(day?.kind == .past ? "\(day?.name ?? "That day") is all done" : "\(day?.name ?? "That day") is coming")
                .font(jakarta(20, .extraBold))
                .foregroundStyle(Theme.teal)
                .multilineTextAlignment(.center)
            Text(day?.kind == .past
                 ? "The care steps for this day are finished."
                 : "Today is Wednesday. This day will open when it arrives.")
                .font(jakarta(14, .medium))
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Button {
                selectedDay = 14
            } label: {
                Text("Back to today")
                    .font(jakarta(15, .bold))
                    .foregroundStyle(Theme.teal)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Theme.tealSoft, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(KidButtonStyle())
            .padding(.top, 6)
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .card()
    }
}
