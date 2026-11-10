import SwiftUI

struct RewardsQuestView: View {
    var onHome: () -> Void = {}
    @Environment(CareStore.self) private var store
    @Environment(\.appActions) private var actions
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var showReset = false
    @State private var bearHappy = false
    @State private var pulse = false
    @State private var badgeNote = "Tap a badge to see how you earned it."

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(spacing: 16) {
                    companionCard
                    messageCard
                    awardSection
                    hydrationCard
                    badgesCard
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 20)
                .readableColumn()
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
        .alert("Start the quest over?", isPresented: $showReset) {
            Button("Keep going", role: .cancel) {}
            Button("Reset", role: .destructive) { store.reset() }
        } message: {
            Text("Stars, Kare's care, and the story go back to the start. Care steps from a grown-up stay on the schedule.")
        }
        .onChange(of: store.stars) { old, new in
            guard new > old else { return }
            bearHappy = true
            Task {
                try? await Task.sleep(for: .milliseconds(280))
                bearHappy = false
            }
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            HStack(spacing: 8) {
                HStack(spacing: 0) {
                    Text("Kare")
                    Text("BEAR")
                        .foregroundStyle(Theme.terra)
                }
                .font(jakarta(22, .extraBold))
                .foregroundStyle(Theme.teal)
                Rectangle()
                    .fill(Theme.borderSoft)
                    .frame(width: 1, height: 16)
                HStack(spacing: 5) {
                    Circle()
                        .fill(Theme.teal)
                        .frame(width: 6, height: 6)
                        .opacity(reduceMotion ? 1 : (pulse ? 1 : 0.35))
                    Text(store.childName)
                        .font(jakarta(11, .bold))
                        .lineLimit(1)
                }
                .foregroundStyle(Theme.teal)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Theme.tealSoft, in: Capsule())
                .overlay(Capsule().stroke(Theme.tealBorder, lineWidth: 1))
            }
            .layoutPriority(1)
            Spacer(minLength: 6)
            Button(action: onHome) {
                Image(systemName: "house.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.teal)
                    .frame(width: 34, height: 34)
                    .background(Color.white.opacity(0.8), in: Circle())
                    .overlay(Circle().stroke(Theme.borderSoft, lineWidth: 1))
            }
            .buttonStyle(KidButtonStyle())
            .accessibilityLabel("Home")
            Button {
                showReset = true
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 12, weight: .bold))
                    Text("Reset")
                        .font(jakarta(12, .bold))
                }
                .foregroundStyle(Theme.teal)
                .padding(.horizontal, 10)
                .frame(height: 34)
                .background(Color.white.opacity(0.75), in: Capsule())
                .overlay(Capsule().stroke(Color(hex: 0xD5CCC0), lineWidth: 1))
            }
            .buttonStyle(KidButtonStyle())
            .accessibilityLabel("Reset quest")
            Button(action: actions.openProfile) {
                EmmaAvatar(size: 36)
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
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }

    private var companionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("KARE COMPANION")
                Spacer()
                Text(store.puppyUnlocked ? "EXPRESSION: PROUD" : "EXPRESSION: CHEERFUL")
                    .foregroundStyle(Theme.teal)
            }
            .font(jakarta(11, .bold))
            .foregroundStyle(Theme.muted)
            .padding(.bottom, 2)
            .overlay(alignment: .bottom) {
                Rectangle().fill(Color(hex: 0xF0EAE1)).frame(height: 1)
            }

            VStack(spacing: 10) {
                BearBadge(size: 112)
                    .scaleEffect(bearHappy && !reduceMotion ? 1.06 : 1)
                    .animation(.spring(duration: 0.28), value: bearHappy)
                Text("⭐  Take care of Kare")
                    .font(jakarta(13, .bold))
                    .foregroundStyle(Theme.teal)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.white, in: Capsule())
                    .overlay(Capsule().stroke(Theme.borderSoft, lineWidth: 1))
                Text("Kare had throat surgery too. Help Kare rest, sip, and feel better.")
                    .font(jakarta(13, .medium))
                    .foregroundStyle(Theme.muted)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 280)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .padding(.horizontal, 12)
            .background(Theme.bg, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Color(hex: 0xEBE4D8), lineWidth: 1)
            )

            HStack(alignment: .center, spacing: 10) {
                HStack(spacing: 10) {
                    Text("⭐")
                        .font(.system(size: 18))
                        .frame(width: 40, height: 40)
                        .background(Theme.teal, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    VStack(alignment: .leading, spacing: 0) {
                        Text("CURRENT PROGRESS")
                            .font(jakarta(11, .bold))
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("\(store.stars)")
                                .font(jakarta(22, .extraBold))
                                .contentTransition(.numericText())
                            Text("Stars Earned")
                                .font(jakarta(13, .bold))
                        }
                    }
                }
                .foregroundStyle(Theme.teal)
                Spacer(minLength: 8)
                VStack(alignment: .trailing, spacing: 6) {
                    Text(store.starsToPuppy == 0 ? "Puppy Hero unlocked!" : "\(store.starsToPuppy) stars to Puppy Hero!")
                        .font(jakarta(11, .bold))
                        .foregroundStyle(store.starsToPuppy == 0 ? Theme.teal : Theme.terra)
                        .multilineTextAlignment(.trailing)
                    progressBar
                }
            }
            .padding(12)
            .background(Theme.tealSoft, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Theme.tealBorder, lineWidth: 1)
            )
        }
        .padding(16)
        .card()
    }

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.85))
                Capsule()
                    .fill(Theme.teal)
                    .frame(width: max(8, geo.size.width * store.progress))
            }
        }
        .frame(width: 96, height: 8)
        .overlay(Capsule().stroke(Theme.tealBorder, lineWidth: 1))
        .animation(.spring(duration: 0.4), value: store.progress)
        .accessibilityLabel("\(store.stars) of \(store.puppyGoal) stars")
    }

    private var messageCard: some View {
        HStack(alignment: .center, spacing: 12) {
            ZStack(alignment: .bottomTrailing) {
                BearBadge(size: 64)
                Image(systemName: "cross.case.fill")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.teal)
                    .padding(4)
                    .background(Color.white, in: Circle())
                    .overlay(Circle().stroke(Theme.border, lineWidth: 1))
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(store.puppyUnlocked ? "\"You took good care of me!\"" : "\"Please help me feel better.\"")
                    .font(jakarta(15, .bold))
                    .foregroundStyle(Theme.teal)
                    .fixedSize(horizontal: false, vertical: true)
                Text(store.puppyUnlocked
                     ? "Kare can rest now. You can still offer sips and quiet time."
                     : "Kare had surgery too. A grown-up gives the medicine. You can help with the rest.")
                    .font(jakarta(13, .medium))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .card()
    }

    private var awardSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Help Kare")
                        .font(jakarta(18, .bold))
                        .foregroundStyle(Theme.teal)
                    Text("Tap when you take care of Kare")
                        .font(jakarta(13, .medium))
                        .foregroundStyle(Theme.muted)
                }
                Spacer()
                Text("Care Actions")
                    .font(jakarta(11, .bold))
                    .foregroundStyle(Theme.teal)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Theme.tealSoft, in: Capsule())
                    .overlay(Capsule().stroke(Theme.tealBorder, lineWidth: 1))
            }
            actionCard(
                emoji: "🥄",
                fill: Theme.terraSoft,
                border: Theme.terraBorder,
                title: "Give Kare medicine",
                subtitle: "A grown-up measures the dose",
                points: "+2 ⭐",
                button: Theme.terra,
                done: store.medicineFinished,
                action: { store.tookMedicine(cheer: "You helped Kare take medicine. +2 Stars") }
            )
            actionCard(
                emoji: "🍧",
                fill: Theme.pinkSoft,
                border: Theme.pinkBorder,
                title: "Offer a popsicle",
                subtitle: "A cold treat for Kare's throat",
                points: "+1 ⭐",
                button: Theme.teal,
                done: store.coldTreatsFinished,
                action: { store.coldTreat(cheer: "Kare liked that popsicle. +1 Star") }
            )
            actionCard(
                emoji: "💧",
                fill: Theme.tealSoft,
                border: Theme.tealBorder,
                title: "Offer a cold sip",
                subtitle: "A small gentle cup for Kare",
                points: "+1 ⭐",
                button: Theme.teal,
                done: store.cupsFinished,
                action: { store.hydrationSip(cheer: "Kare took a small sip. +1 Star") }
            )
            actionCard(
                emoji: "🌙",
                fill: Theme.cream,
                border: Theme.borderSoft,
                title: "Help Kare rest",
                subtitle: "Quiet time after surgery",
                points: "+1 ⭐",
                button: Theme.teal,
                done: store.restFinished,
                action: { store.helpKareRest() }
            )
        }
    }

    private func actionCard(
        emoji: String,
        fill: Color,
        border: Color,
        title: String,
        subtitle: String,
        points: String,
        button: Color,
        done: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Text(emoji)
                    .font(.system(size: 22))
                    .frame(width: 48, height: 48)
                    .background(fill, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(border, lineWidth: 1)
                    )
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(jakarta(15, .bold))
                        .foregroundStyle(Theme.teal)
                    Text(subtitle)
                        .font(jakarta(13, .medium))
                        .foregroundStyle(Theme.muted)
                        .lineLimit(2)
                }
                Spacer(minLength: 8)
                HStack(spacing: 4) {
                    Text(done ? "Done" : points)
                    Image(systemName: done ? "checkmark.circle.fill" : "plus.circle.fill")
                        .font(.system(size: 15, weight: .bold))
                }
                .font(jakarta(13, .bold))
                .foregroundStyle(done ? Theme.teal : .white)
                .padding(.horizontal, 12)
                .frame(minHeight: 40)
                .background(done ? Theme.tealSoft : button, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .padding(14)
            .card()
        }
        .buttonStyle(KidButtonStyle())
        .accessibilityLabel("\(title). \(done ? "Done" : points)")
    }

    private var hydrationCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                HStack(spacing: 10) {
                    BearBadge(size: 40)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Kare's cold cups")
                            .font(jakarta(15, .bold))
                            .foregroundStyle(Theme.teal)
                        Text("Small sips, not one big gulp")
                            .font(jakarta(12, .medium))
                            .foregroundStyle(Theme.muted)
                    }
                }
                Spacer(minLength: 8)
                Text("\(store.cups) of \(store.maxCups) cold cups")
                    .font(jakarta(11, .bold))
                    .foregroundStyle(Theme.teal)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(Theme.tealSoft, in: Capsule())
                    .overlay(Capsule().stroke(Theme.tealBorder, lineWidth: 1))
            }
            HStack(spacing: 6) {
                ForEach(0..<store.maxCups, id: \.self) { index in
                    let filled = index < store.cups
                    Button {
                        if index == store.cups {
                            store.hydrationSip(cheer: "Kare took a small sip. +1 Star")
                        }
                    } label: {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(filled ? Theme.teal : Theme.bg)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(filled ? Color.clear : Theme.borderSoft, lineWidth: 1)
                            )
                            .overlay {
                                Image(systemName: filled ? "checkmark" : "drop.fill")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(filled ? Color.white : Theme.muted.opacity(0.65))
                            }
                            .aspectRatio(1, contentMode: .fit)
                    }
                    .buttonStyle(KidButtonStyle())
                    .accessibilityLabel(filled ? "Cup \(index + 1) done" : "Cup \(index + 1)")
                }
            }
        }
        .padding(16)
        .card()
    }

    private var badgesCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                HStack(spacing: 8) {
                    Text("\(store.childName)'s Badges")
                        .font(jakarta(15, .bold))
                        .foregroundStyle(Theme.teal)
                    Text("Quest Reward")
                        .font(jakarta(11, .bold))
                        .foregroundStyle(Theme.terra)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Theme.terraSoft, in: Capsule())
                        .overlay(Capsule().stroke(Theme.terraBorder, lineWidth: 1))
                }
                Spacer()
                Text("\(store.unlockedBadgeCount) of 4 unlocked")
                    .font(jakarta(11, .bold))
                    .foregroundStyle(Theme.muted)
            }
            HStack(spacing: 8) {
                badge(emoji: "🐧", title: "Penguin", unlocked: true, highlighted: false, note: "Earned for brave rest time.")
                badge(emoji: "🦁", title: "Lion", unlocked: true, highlighted: false, note: "Earned for taking medicine.")
                badge(emoji: "💧", title: "Sip Hero", unlocked: true, highlighted: !store.puppyUnlocked, note: "Earned for drinking cold cups.")
                badge(emoji: "🐶", title: "Puppy", unlocked: store.puppyUnlocked, highlighted: store.puppyUnlocked, note: store.puppyUnlocked ? "Puppy Hero is unlocked!" : "Earn \(store.starsToPuppy) more stars to meet Puppy.")
            }
            Text(badgeNote)
                .font(jakarta(12, .medium))
                .foregroundStyle(Theme.muted)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(16)
        .card()
    }

    private func badge(emoji: String, title: String, unlocked: Bool, highlighted: Bool, note: String) -> some View {
        Button {
            badgeNote = note
        } label: {
            VStack(spacing: 6) {
                ZStack(alignment: .bottomTrailing) {
                    Text(emoji)
                        .font(.system(size: 22))
                        .frame(width: 42, height: 42)
                        .background(Color.white, in: Circle())
                        .overlay(Circle().stroke(highlighted ? Theme.tealBorder : Theme.borderSoft, lineWidth: 1))
                    if !unlocked {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(3)
                            .background(Theme.muted, in: Circle())
                            .offset(x: 2, y: 2)
                    }
                }
                Text(title)
                    .font(jakarta(11, .bold))
                    .foregroundStyle(unlocked ? Theme.teal : Theme.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .padding(.horizontal, 2)
            .background(highlighted ? Theme.tealSoft : Theme.bg, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(highlighted ? Theme.tealBorder : Theme.border, lineWidth: 1)
            )
            .opacity(unlocked ? 1 : 0.72)
        }
        .buttonStyle(KidButtonStyle())
        .accessibilityLabel("\(title) badge. \(note)")
    }

}
