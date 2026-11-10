import SwiftUI

struct CareHelpView: View {
    private let start: ParentCareView.Route

    init() {
        start = Self.launchParent() ?? .list
    }

    var body: some View {
        ParentCareView(start: start, embedded: true)
    }

    private static func launchParent() -> ParentCareView.Route? {
        let args = ProcessInfo.processInfo.arguments
        guard let flag = args.firstIndex(of: "--parent") else { return nil }
        let next = args.index(after: flag)
        guard args.indices.contains(next) else { return .list }
        switch args[next] {
        case "write": return .write
        case "record": return .record
        case "review": return .review
        default: return .list
        }
    }
}
