import SwiftUI
import UIKit

/// Illustrated room variants. Colours come from the sampled palette.
enum RoomVariant {
    case playroom
    case checkup
    case garden
    case quiet
    case caregiver

    init(scene: AppScene) {
        switch scene {
        case .cozy: self = .playroom
        case .clinic: self = .checkup
        case .garden: self = .garden
        case .night: self = .quiet
        }
    }

    var wall: Color {
        switch self {
        case .playroom, .caregiver: Theme.liftedBlue
        case .checkup, .garden: Theme.liftedMint
        case .quiet: Theme.liftedLilac
        }
    }

    /// Home, bedtime, and the grown-up screens share the illustrated bedroom.
    var showsBedroom: Bool {
        switch self {
        case .playroom, .quiet, .caregiver: true
        case .checkup, .garden: false
        }
    }
}

/// Soft full-bleed backdrop. The whole room stays on screen, with the ceiling clear of the top edge.
struct CozyRoomBackground: View {
    var variant: RoomVariant = .playroom

    var body: some View {
        ZStack {
            if variant.showsBedroom {
                Color(hex: 0xC4D7F9)
                    .ignoresSafeArea()
                    .overlay {
                        RoomArtwork()
                    }
                    .clipped()
                if variant == .quiet {
                    Theme.liftedLilac.opacity(0.42)
                }
            } else {
                variant.wall
                edgeWash
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private var edgeWash: some View {
        ZStack {
                Ellipse()
                    .fill(Theme.swatchLilac.opacity(0.55))
                    .frame(width: 320, height: 200)
                    .blur(radius: 12)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .offset(x: -60, y: -40)
                Ellipse()
                    .fill(Theme.swatchCoral.opacity(0.4))
                    .frame(width: 220, height: 140)
                    .blur(radius: 16)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                    .offset(x: 40, y: -20)
                Ellipse()
                    .fill(Theme.swatchMint.opacity(0.45))
                    .frame(width: 260, height: 160)
                    .blur(radius: 14)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                    .offset(x: 40, y: 50)
        }
    }
}

/// Fills the screen with the room while keeping the whole scene in view.
private struct RoomArtwork: UIViewRepresentable {
    func makeUIView(context: Context) -> TopFilledImageView {
        let view = TopFilledImageView()
        view.clipsToBounds = true
        view.isUserInteractionEnabled = false
        return view
    }

    func updateUIView(_ view: TopFilledImageView, context: Context) {}
}

private final class TopFilledImageView: UIView {
    private let imageLayer = CALayer()

    override init(frame: CGRect) {
        super.init(frame: frame)
        isUserInteractionEnabled = false
        imageLayer.contentsGravity = .resize
        layer.addSublayer(imageLayer)
    }

    required init?(coder: NSCoder) { nil }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard bounds.width > 0, bounds.height > 0,
              let image = UIImage(named: "PlayroomFull"),
              let cgImage = image.cgImage else { return }
        let imageAspect = CGFloat(cgImage.width) / CGFloat(cgImage.height)
        let viewAspect = bounds.width / bounds.height
        let drawnWidth: CGFloat
        let drawnHeight: CGFloat
        if viewAspect > imageAspect {
            drawnWidth = bounds.width
            drawnHeight = bounds.width / imageAspect
        } else {
            drawnHeight = bounds.height
            drawnWidth = bounds.height * imageAspect
        }
        imageLayer.contents = cgImage
        imageLayer.contentsScale = 1
        imageLayer.frame = CGRect(
            x: (bounds.width - drawnWidth) / 2,
            y: (bounds.height - drawnHeight) / 2,
            width: drawnWidth,
            height: drawnHeight
        )
    }
}

struct BearStage: View {
    var size: CGFloat
    var mood: BearMood = .bright
    var showsStatus: Bool = false
    var speaking: Bool = false
    var speechMark: TimeInterval = 0

    var body: some View {
        ZStack(alignment: .bottom) {
            Ellipse()
                .fill(Theme.swatchLilac)
                .frame(width: size * 0.78, height: size * 0.2)
            BearBadge(
                size: size * 0.78,
                mood: mood,
                showsStatus: showsStatus,
                speaking: speaking,
                speechMark: speechMark
            )
            .offset(y: -size * 0.06)
        }
        .frame(width: size, height: size)
    }
}
