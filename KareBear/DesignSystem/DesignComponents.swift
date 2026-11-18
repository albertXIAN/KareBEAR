import SwiftUI

enum AppType {
    static var display: Font { jakarta(32, .extraBold) }
    static var screenTitle: Font { jakarta(26, .extraBold) }
    static var section: Font { jakarta(21, .bold) }
    static var cardTitle: Font { jakarta(18, .bold) }
    static var body: Font { jakarta(17, .medium) }
    static var supporting: Font { jakarta(15, .medium) }
    static var button: Font { jakarta(18, .bold) }
    static var caption: Font { jakarta(12, .bold) }
}

struct PrimaryButton: View {
    var title: String
    var systemImage: String? = nil
    var enabled: Bool = true
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.system(size: 18, weight: .bold))
                }
                Text(title)
                    .font(AppType.button)
            }
            .foregroundStyle(Theme.onPrimary)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 56)
            .padding(.horizontal, 16)
            .background(
                enabled ? Theme.brandPrimary : Theme.brandPrimary.opacity(0.35),
                in: RoundedRectangle(cornerRadius: 26, style: .continuous)
            )
        }
        .buttonStyle(KidButtonStyle())
        .disabled(!enabled)
        .accessibilityLabel(title)
    }
}

struct SecondaryButton: View {
    var title: String
    var enabled: Bool = true
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(AppType.button)
                .foregroundStyle(enabled ? Theme.brandPrimary : Theme.brandPrimary.opacity(0.35))
                .frame(maxWidth: .infinity)
                .frame(minHeight: 56)
                .padding(.horizontal, 16)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .stroke(enabled ? Theme.brandPrimary.opacity(0.45) : Theme.border, lineWidth: 1.5)
                )
        }
        .buttonStyle(KidButtonStyle())
        .disabled(!enabled)
    }
}

struct ActivityCard: View {
    var symbol: String
    var title: String
    var detail: String
    var meta: String
    var tint: Color
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                Image(systemName: symbol)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(Theme.textPrimary)
                    .frame(width: 48, height: 48)
                    .background(tint, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                Text(title)
                    .font(AppType.cardTitle)
                    .foregroundStyle(Theme.textPrimary)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Text(detail)
                    .font(AppType.supporting)
                    .foregroundStyle(Theme.textSecondary)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Text(meta)
                    .font(AppType.caption)
                    .foregroundStyle(Theme.subtle)
            }
            .padding(16)
            .frame(maxWidth: .infinity, minHeight: 168, alignment: .topLeading)
            .card(fill: Theme.surface, border: tint.opacity(0.45), radius: 22, lineWidth: 1.5)
        }
        .buttonStyle(KidButtonStyle())
        .accessibilityLabel("\(title). \(detail). \(meta)")
    }
}

struct BearSpeechBubble: View {
    var speaker: String? = nil
    var text: String
    var prominent: Bool = false
    /// Hugs the bear instead of stretching across the column.
    var compact: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: compact ? 2 : 8) {
            if let speaker {
                Text(speaker)
                    .font((compact ? AppType.caption : AppType.supporting).weight(.bold))
                    .foregroundStyle(Theme.textPrimary)
            }
            Text(text)
                .font(prominent ? AppType.screenTitle : (compact ? AppType.supporting : AppType.body))
                .foregroundStyle(Theme.textPrimary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, compact ? 12 : 16)
        .padding(.vertical, compact ? 8 : 16)
        .frame(maxWidth: compact ? nil : .infinity, alignment: .leading)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: compact ? 14 : 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: compact ? 14 : 22, style: .continuous)
                .stroke(Theme.brandPrimary.opacity(0.35), lineWidth: compact ? 1 : 1.5)
        )
        .overlay(alignment: .bottomLeading) {
            BubbleTail()
                .fill(Theme.surface)
                .frame(width: compact ? 12 : 18, height: compact ? 8 : 12)
                .offset(x: compact ? 18 : 28, y: compact ? 7 : 10)
                .accessibilityHidden(true)
        }
        .padding(.bottom, compact ? 4 : 8)
        .shadow(color: Theme.ink.opacity(0.08), radius: compact ? 6 : 10, y: 3)
        .accessibilityElement(children: .combine)
    }
}

private struct BubbleTail: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

struct EquipmentTray<Content: View>: View {
    var title: String
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(AppType.section)
                .foregroundStyle(Theme.textPrimary)
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.cream, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Theme.brandSecondary.opacity(0.4), lineWidth: 1.5)
        )
    }
}

struct StepIndicator: View {
    var current: Int
    var total: Int
    var label: String? = nil
    var fillsWidth: Bool = false

    private var spoken: String {
        label ?? "Step \(current) of \(max(total, 1))"
    }

    var body: some View {
        VStack(alignment: fillsWidth ? .leading : .trailing, spacing: 4) {
            Text(spoken)
                .font(AppType.caption)
                .foregroundStyle(Theme.textSecondary)
            GeometryReader { geo in
                let width = geo.size.width * CGFloat(min(max(current, 0), max(total, 1))) / CGFloat(max(total, 1))
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.border)
                    Capsule().fill(Theme.brandPrimary).frame(width: width)
                }
            }
            .frame(width: fillsWidth ? nil : 84, height: 6)
            .frame(maxWidth: fillsWidth ? .infinity : nil)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(spoken)
    }
}

struct ResultCard: View {
    var title: String
    var value: String
    var unit: String? = nil
    var caption: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(AppType.supporting.weight(.bold))
                .foregroundStyle(Theme.textSecondary)
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(value)
                    .font(AppType.display)
                    .foregroundStyle(Theme.textPrimary)
                    .monospacedDigit()
                if let unit, !unit.isEmpty {
                    Text(unit)
                        .font(AppType.cardTitle)
                        .foregroundStyle(Theme.textSecondary)
                }
            }
            Text(caption)
                .font(AppType.supporting)
                .foregroundStyle(Theme.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(fill: Theme.surface, border: Theme.tealBorder, radius: 22)
        .accessibilityElement(children: .combine)
    }
}

struct CozySheet<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(24)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .background {
                CozyRoomBackground(variant: .caregiver)
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
            .presentationBackground(Theme.wallBackground)
    }
}

struct LabeledTabItem: View {
    var title: String
    var systemImage: String
    var isSelected: Bool

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: systemImage)
                .font(.system(size: 20, weight: isSelected ? .bold : .regular))
            Text(title)
                .font(AppType.caption)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .foregroundStyle(isSelected ? Theme.textPrimary : Theme.textSecondary)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(isSelected ? Theme.liftedLilac : Color.clear, in: Capsule())
        .padding(.horizontal, 12)
        .padding(.vertical, 4)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

extension View {
    func cozyScreen(_ variant: RoomVariant = .caregiver) -> some View {
        background {
            CozyRoomBackground(variant: variant)
        }
    }

    /// White panel for text that would otherwise sit on the illustrated room.
    func readableSurface(alignment: Alignment = .leading) -> some View {
        self
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity, alignment: alignment)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Theme.brandPrimary.opacity(0.35), lineWidth: 1)
            )
    }
}
