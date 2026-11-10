import SwiftUI

struct RewardsBearView: View {
    @Environment(CareStore.self) private var store
    @Environment(\.horizontalSizeClass) private var sizeClass
    var showsParentTools = true

    var body: some View {
        VStack(spacing: 0) {
            if showsParentTools {
                KareHeader()
            }
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
            VStack(alignment: .leading, spacing: 16) {
                statusCard(bear: 180)
                starsCard
                helpCard
                badgesCard
            }
            .padding(16)
            .readableColumn()
        }
        .scrollIndicators(.hidden)
    }

    private var padBody: some View {
        GeometryReader { geo in
            let column = (geo.size.width - 76) / 2
            let bear = min(column * 0.82, geo.size.height * 0.46)
            HStack(alignment: .center, spacing: 24) {
                statusCard(bear: bear)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        starsCard
                        helpCard
                        badgesCard
                    }
                    .frame(maxWidth: .infinity, alignment: .top)
                }
                .scrollIndicators(.hidden)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(24)
        }
    }

    private func statusCard(bear: CGFloat) -> some View {
        VStack(spacing: 10) {
            BearBadge(size: bear, mood: store.bearMood, showsStatus: true)
            Text(store.doses.isEmpty ? "\(store.companionName) is waiting" : store.bearMood.title(called: store.companionName))
                .font(jakarta(26, .extraBold))
                .foregroundStyle(store.doses.isEmpty ? Theme.teal : store.bearMood.color)
                .multilineTextAlignment(.center)
            Text(store.doses.isEmpty
                 ? "When a grown-up adds care steps, you take care of \(store.companionName) by doing them."
                 : store.bearMood.detail(called: store.companionName))
                .font(jakarta(15, .medium))
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Text("If a care step waits too long, \(store.companionName) loses stars and starts to feel sick.")
                .font(jakarta(13, .semibold))
                .foregroundStyle(Theme.subtle)
                .multilineTextAlignment(.center)
            NameBearButton()
        }
        .padding(sizeClass == .regular ? 28 : 16)
        .frame(maxWidth: .infinity, maxHeight: sizeClass == .regular ? .infinity : nil)
        .card()
    }

    private var starsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(store.stars) stars")
                .font(jakarta(22, .extraBold))
                .foregroundStyle(Theme.teal)
            ProgressView(value: store.progress)
                .tint(Theme.teal)
        }
        .padding(16)
        .card()
    }

    private var helpCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Help \(store.companionName)")
                .font(jakarta(18, .extraBold))
                .foregroundStyle(Theme.teal)
            if let dose = store.heroDose {
                Text(dose.name)
                    .font(jakarta(16, .bold))
                    .foregroundStyle(Theme.text)
                Text(dose.detail)
                    .font(jakarta(14, .medium))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
                if showsParentTools {
                    Button {
                        store.tookMedicine(cheer: "You helped \(store.companionName). +2 stars")
                    } label: {
                        Label("We did this step", systemImage: "checkmark.circle.fill")
                            .font(jakarta(16, .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(Theme.teal, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                    .buttonStyle(KidButtonStyle())
                }
            } else if store.doses.isEmpty {
                Text("No care steps yet. A grown-up adds them on Care & Help.")
                    .font(jakarta(14, .medium))
                    .foregroundStyle(Theme.muted)
            } else {
                Text("Every care step is done. \(store.companionName) can rest.")
                    .font(jakarta(14, .medium))
                    .foregroundStyle(Theme.muted)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private var badgesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Badges")
                .font(jakarta(18, .extraBold))
                .foregroundStyle(Theme.teal)
            badge(emoji: "⭐", title: "Helper", unlocked: store.doses.contains { $0.status == .done }, note: "Finish a care step for \(store.companionName).")
            badge(emoji: "📖", title: "Story", unlocked: store.storyFinished, note: "Finish \(store.companionName)'s story.")
            badge(emoji: "💚", title: "Steady", unlocked: store.bearMood == .bright && !store.doses.isEmpty, note: "Keep \(store.companionName) feeling bright.")
            badge(emoji: "🐶", title: "Puppy", unlocked: store.puppyUnlocked, note: "Earn \(store.puppyGoal) stars.")
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private func badge(emoji: String, title: String, unlocked: Bool, note: String) -> some View {
        HStack(spacing: 10) {
            Text(emoji)
                .font(.system(size: 22))
                .frame(width: 40, height: 40)
                .background(unlocked ? Theme.tealSoft : Theme.bg, in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(jakarta(15, .bold))
                    .foregroundStyle(unlocked ? Theme.teal : Theme.muted)
                Text(note)
                    .font(jakarta(12, .medium))
                    .foregroundStyle(Theme.muted)
            }
            Spacer(minLength: 0)
            Image(systemName: unlocked ? "checkmark.circle.fill" : "lock.fill")
                .foregroundStyle(unlocked ? Theme.teal : Theme.subtle)
        }
        .opacity(unlocked ? 1 : 0.72)
        .accessibilityElement(children: .combine)
    }
}
