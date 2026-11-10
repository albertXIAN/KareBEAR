import SwiftUI

@main
struct KareBearApp: App {
    @State private var store = CareStore()

    init() {
        FontRegistrar.register()
    }

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environment(store)
        }
    }
}
