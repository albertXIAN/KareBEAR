import CryptoKit
import Foundation
import Observation

enum DoseStatus: String, Equatable {
    case done
    case due
    case upcoming
}

struct Dose: Identifiable, Equatable {
    let id: String
    let name: String
    let amount: String
    let time: String
    var status: DoseStatus
    let detail: String
}

@MainActor
@Observable
final class CareStore {
    var stars: Int
    var cups: Int
    var coldTreats: Int
    var doses: [Dose]
    var doseProgress: [String: DoseStatus]
    var snoozed: Bool
    var puppyUnlocked: Bool
    var showPuppyCelebration: Bool
    var toast: String?
    var toastID: Int
    var storyCleared: [String]
    var storyTalk: [String]
    var storyMisses: [String: Int]
    var storySpotPageID: String
    var storySpotPhase: String
    var prepSpotPageID: String
    var prepSpotPhase: String
    var restHelps: Int
    var parentInstructions: [ParentInstruction]
    var didOnboard: Bool
    var parentName: String
    var parentEmail: String
    var childName: String
    var bearName: String
    var roomStyle: String
    var childAge: String
    var recoveryFocus: String
    var wellness: Int
    var trackedDueID: String?
    var dueStarted: Date?
    var lastPenalty: Date?
    var isChildMode: Bool
    var passwordRecord: String
    var careStage: String
    var prepGameEnabled: Bool
    var isLoggedIn: Bool
    var isCreatingAccount = false
    var sessionChildName = ""
    var keptNoteIDs: Set<UUID> = []
    var replacementAddedIDs: Set<UUID> = []

    let maxCups = 8
    let puppyGoal = 17
    let maxColdTreats = 3
    let maxRest = 2

    private enum Key {
        static let saved = "kare.hasSaved"
        static let stars = "kare.stars"
        static let cups = "kare.cups"
        static let cold = "kare.cold"
        static let snoozed = "kare.snoozed"
        static let puppy = "kare.puppy"
        static let doses = "kare.doses"
        static let storyCleared = "kare.storyCleared"
        static let storyTalk = "kare.storyTalk"
        static let storyMisses = "kare.storyMisses"
        static let storySpotPage = "kare.storySpotPage"
        static let storySpotPhase = "kare.storySpotPhase"
        static let prepSpotPage = "kare.prepSpotPage"
        static let prepSpotPhase = "kare.prepSpotPhase"
        static let rest = "kare.rest"
        static let parentNotes = "kare.parentNotes"
        static let onboard = "kare.didOnboard"
        static let parentName = "kare.parentName"
        static let parentEmail = "kare.parentEmail"
        static let childName = "kare.childName"
        static let bearName = "kare.bearName"
        static let roomStyle = "kare.roomStyle"
        static let childAge = "kare.childAge"
        static let recovery = "kare.recovery"
        static let wellness = "kare.wellness"
        static let trackedDue = "kare.trackedDue"
        static let dueStarted = "kare.dueStarted"
        static let lastPenalty = "kare.lastPenalty"
        static let childMode = "kare.childMode"
        static let passwordRecord = "kare.passwordRecord"
        static let careStage = "kare.careStage"
        static let prepGame = "kare.prepGame"
        static let loggedIn = "kare.loggedIn"
    }

    private static func decodeNotes(_ data: Data?) -> [ParentInstruction] {
        guard let data else { return [] }
        return (try? JSONDecoder().decode([ParentInstruction].self, from: data)) ?? []
    }

    init() {
        let defaults = UserDefaults.standard
        let hasSaved = defaults.bool(forKey: Key.saved)
        let loadedStars: Int
        let loadedCups: Int
        let loadedCold: Int
        let loadedSnoozed: Bool
        let loadedProgress: [String: DoseStatus]
        let loadedPuppy: Bool
        let loadedCleared: [String]
        let loadedTalk: [String]
        let loadedMisses: [String: Int]
        let loadedRest: Int
        let loadedNotes: [ParentInstruction]
        let loadedOnboard = defaults.bool(forKey: Key.onboard)
        let loadedParentName = defaults.string(forKey: Key.parentName) ?? ""
        let loadedParentEmail = defaults.string(forKey: Key.parentEmail) ?? ""
        let loadedChildName = defaults.string(forKey: Key.childName) ?? ""
        let loadedBearName = defaults.string(forKey: Key.bearName) ?? "Kare"
        let loadedRoom = defaults.string(forKey: Key.roomStyle) ?? AppScene.cozy.rawValue
        let loadedChildAge = defaults.string(forKey: Key.childAge) ?? ""
        let loadedRecovery = defaults.string(forKey: Key.recovery) ?? ""
        let loadedWellness = defaults.object(forKey: Key.wellness) == nil
            ? 3
            : min(3, max(0, defaults.integer(forKey: Key.wellness)))
        let loadedTracked = defaults.string(forKey: Key.trackedDue)
        let loadedDueStarted = defaults.object(forKey: Key.dueStarted) as? Double
        let loadedPenalty = defaults.object(forKey: Key.lastPenalty) as? Double
        let loadedChildMode = defaults.bool(forKey: Key.childMode)
        let loadedPassword = defaults.string(forKey: Key.passwordRecord) ?? ""
        let loadedStage = defaults.string(forKey: Key.careStage) ?? ""
        let loadedPrepGame = defaults.bool(forKey: Key.prepGame)
        let loadedStorySpotPage = defaults.string(forKey: Key.storySpotPage) ?? ""
        let loadedStorySpotPhase = defaults.string(forKey: Key.storySpotPhase) ?? ""
        let loadedPrepSpotPage = defaults.string(forKey: Key.prepSpotPage) ?? ""
        let loadedPrepSpotPhase = defaults.string(forKey: Key.prepSpotPhase) ?? ""
        let loadedLoggedIn = defaults.object(forKey: Key.loggedIn) == nil
            ? loadedOnboard
            : defaults.bool(forKey: Key.loggedIn)
        if hasSaved {
            loadedStars = defaults.integer(forKey: Key.stars)
            loadedCups = min(8, defaults.integer(forKey: Key.cups))
            loadedCold = min(3, defaults.integer(forKey: Key.cold))
            loadedSnoozed = defaults.bool(forKey: Key.snoozed)
            loadedProgress = Self.decodeProgress(defaults.stringArray(forKey: Key.doses) ?? [])
            loadedPuppy = defaults.bool(forKey: Key.puppy) || loadedStars >= 17
            loadedCleared = defaults.stringArray(forKey: Key.storyCleared) ?? []
            loadedTalk = defaults.stringArray(forKey: Key.storyTalk) ?? []
            loadedMisses = Self.decodeMisses(defaults.stringArray(forKey: Key.storyMisses) ?? [])
            loadedRest = min(2, defaults.integer(forKey: Key.rest))
            loadedNotes = Self.decodeNotes(defaults.data(forKey: Key.parentNotes))
        } else {
            loadedStars = 14
            loadedCups = 5
            loadedCold = 0
            loadedProgress = [:]
            loadedSnoozed = false
            loadedPuppy = false
            loadedCleared = []
            loadedTalk = []
            loadedMisses = [:]
            loadedRest = 0
            loadedNotes = []
        }
        stars = loadedStars
        cups = loadedCups
        coldTreats = loadedCold
        doses = []
        doseProgress = loadedProgress
        snoozed = loadedSnoozed
        puppyUnlocked = loadedPuppy
        storyCleared = loadedCleared
        storyTalk = loadedTalk
        storyMisses = loadedMisses
        storySpotPageID = loadedStorySpotPage
        storySpotPhase = loadedStorySpotPhase
        prepSpotPageID = loadedPrepSpotPage
        prepSpotPhase = loadedPrepSpotPhase
        restHelps = loadedRest
        parentInstructions = loadedNotes
        didOnboard = loadedOnboard
        parentName = loadedParentName
        parentEmail = loadedParentEmail
        childName = loadedChildName
        bearName = loadedBearName
        roomStyle = loadedRoom
        childAge = loadedChildAge
        recoveryFocus = loadedRecovery
        wellness = loadedWellness
        trackedDueID = loadedTracked
        dueStarted = loadedDueStarted.map { Date(timeIntervalSince1970: $0) }
        lastPenalty = loadedPenalty.map { Date(timeIntervalSince1970: $0) }
        isChildMode = loadedChildMode
        passwordRecord = loadedPassword
        careStage = loadedStage
        prepGameEnabled = loadedPrepGame
        isLoggedIn = loadedLoggedIn
        showPuppyCelebration = false
        toast = nil
        toastID = 0
        rebuildSchedule()
    }

    var companionName: String {
        let trimmed = bearName.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "Kare" : trimmed
    }

    var appScene: AppScene {
        AppScene(rawValue: roomStyle) ?? .cozy
    }

    var childAgeYears: Int {
        min(17, max(1, Int(childAge) ?? 7))
    }

    func setRoom(_ scene: AppScene) {
        roomStyle = scene.rawValue
        persist()
    }

    func renameBear(to raw: String) {
        let allowed = raw.unicodeScalars.filter { scalar in
            CharacterSet.letters.contains(scalar)
                || CharacterSet.decimalDigits.contains(scalar)
                || scalar == " " || scalar == "'" || scalar == "-" || scalar == "’"
        }
        let collapsed = String(String.UnicodeScalarView(allowed))
            .split(whereSeparator: \.isWhitespace)
            .joined(separator: " ")
        let trimmed = String(collapsed.prefix(16))
        bearName = trimmed.isEmpty ? "Kare" : trimmed
        persist()
    }

    var childSummary: String {
        let name = childName.isEmpty ? "Your child" : childName
        let age = childAge.isEmpty ? "" : ", Age \(childAge)"
        let focus = recoveryFocus.isEmpty ? "" : " • \(recoveryFocus)"
        return "\(name)\(age)\(focus)"
    }

    var hasPassword: Bool {
        !passwordRecord.isEmpty
    }

    func completeOnboarding(parentName: String, email: String, childName: String, age: String, recovery: String, password: String, stage: String, prepGame: Bool) {
        self.parentName = parentName.trimmingCharacters(in: .whitespacesAndNewlines)
        parentEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        self.childName = childName.trimmingCharacters(in: .whitespacesAndNewlines)
        childAge = age.trimmingCharacters(in: .whitespacesAndNewlines)
        recoveryFocus = recovery.trimmingCharacters(in: .whitespacesAndNewlines)
        if isCreatingAccount {
            parentInstructions.removeAll { keptNoteIDs.contains($0.id) }
            let kept = Set(parentInstructions.map(\.id.uuidString))
            doseProgress = doseProgress.filter { kept.contains($0.key) }
            stars = 0
            cups = 0
            coldTreats = 0
            snoozed = false
            puppyUnlocked = false
            showPuppyCelebration = false
            storyCleared = []
            storyTalk = []
            storyMisses = [:]
            storySpotPageID = ""
            storySpotPhase = ""
            prepSpotPageID = ""
            prepSpotPhase = ""
            restHelps = 0
            wellness = 3
            trackedDueID = nil
            dueStarted = nil
            lastPenalty = nil
            isChildMode = false
            rebuildSchedule()
        }
        careStage = stage
        prepGameEnabled = prepGame
        didOnboard = true
        isLoggedIn = true
        isCreatingAccount = false
        sessionChildName = ""
        keptNoteIDs = []
        replacementAddedIDs = []
        if password.count >= 6 {
            passwordRecord = AccountPassword.record(for: password)
        }
        persist()
    }

    func beginNewAccount() {
        isCreatingAccount = true
        sessionChildName = ""
        keptNoteIDs = Set(parentInstructions.map(\.id))
        replacementAddedIDs = []
    }

    func cancelNewAccount() {
        let added = replacementAddedIDs
        isCreatingAccount = false
        sessionChildName = ""
        keptNoteIDs = []
        replacementAddedIDs = []
        guard !added.isEmpty else { return }
        parentInstructions.removeAll { added.contains($0.id) }
        for id in added {
            doseProgress[id.uuidString] = nil
        }
        rebuildSchedule()
        persist()
    }

    var careChildName: String {
        let raw = isCreatingAccount ? sessionChildName : childName
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "your child" : trimmed
    }

    func savePassword(_ password: String) {
        guard password.count >= 6 else { return }
        passwordRecord = AccountPassword.record(for: password)
        persist()
    }

    func passwordMatches(_ password: String) -> Bool {
        AccountPassword.matches(password, record: passwordRecord)
    }

    func logIn(email: String, password: String) -> Bool {
        let stored = parentEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let given = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !stored.isEmpty, stored == given, hasPassword, passwordMatches(password) else { return false }
        isLoggedIn = true
        persist()
        return true
    }

    func logOut() {
        isLoggedIn = false
        isChildMode = false
        persist()
    }

    func enterChildMode() {
        isChildMode = true
        persist()
    }

    func leaveChildMode() {
        isChildMode = false
        persist()
    }

    func updateProfile(parentName: String, email: String, childName: String, age: String, recovery: String) {
        self.parentName = parentName.trimmingCharacters(in: .whitespacesAndNewlines)
        parentEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        self.childName = childName.trimmingCharacters(in: .whitespacesAndNewlines)
        childAge = age.trimmingCharacters(in: .whitespacesAndNewlines)
        recoveryFocus = recovery.trimmingCharacters(in: .whitespacesAndNewlines)
        persist()
    }

    var heroDose: Dose? {
        doses.first { $0.status == .due }
    }

    var starsToPuppy: Int {
        max(0, puppyGoal - stars)
    }

    var progress: Double {
        min(1, Double(stars) / Double(puppyGoal))
    }

    var unlockedBadgeCount: Int {
        puppyUnlocked ? 4 : 3
    }

    var medicineFinished: Bool {
        !doses.isEmpty && doses.allSatisfy { $0.status == .done }
    }

    var coldTreatsFinished: Bool {
        coldTreats >= maxColdTreats
    }

    var cupsFinished: Bool {
        cups >= maxCups
    }

    var restFinished: Bool {
        restHelps >= maxRest
    }

    var bearMood: BearMood {
        guard !doses.isEmpty else { return .steady }
        let done = doses.filter { $0.status == .done }.count
        if done == doses.count { return .bright }
        let fromProgress: Int
        if done == 0 {
            fromProgress = 1
        } else if Double(done) / Double(doses.count) >= 0.5 {
            fromProgress = 2
        } else {
            fromProgress = 1
        }
        return BearMood(rawValue: min(fromProgress, wellness)) ?? .tired
    }

    var storyPages: [StoryPage] {
        StoryLibrary.pages(for: parentInstructions, childName: childName)
            .map { $0.speaking(as: companionName) }
    }

    var storyFinished: Bool {
        let ids = storyPages.map(\.id)
        return !ids.isEmpty && ids.allSatisfy { storyCleared.contains($0) }
    }

    var dueChip: String {
        guard let dose = heroDose else { return doses.isEmpty ? "Nothing yet" : "All done" }
        if snoozed { return "Snoozed • 10 min" }
        return dose.time.isEmpty ? "Up next" : "Up next • \(dose.time)"
    }

    var snoozeTitle: String {
        snoozed ? "Snoozed for 10 minutes" : "Snooze 10 mins"
    }

    func tookMedicine(cheer: String = "Medicine taken like a hero! +2 Stars") {
        guard !doses.isEmpty else {
            showToast("A grown-up has not added care steps yet.")
            return
        }
        guard let dose = doses.first(where: { $0.status != .done }) else {
            showToast("All care steps are done today!")
            return
        }
        completeCareStep(id: dose.id, cheer: cheer)
    }

    func completeCareStep(id: String, cheer: String = "To-do done. +2 stars") {
        guard let index = doses.firstIndex(where: { $0.id == id }), doses[index].status != .done else { return }
        var updated = doses
        updated[index].status = .done
        doseProgress[updated[index].id] = .done
        if !updated.contains(where: { $0.status == .due }),
           let next = updated.firstIndex(where: { $0.status == .upcoming }) {
            updated[next].status = .due
            doseProgress[updated[next].id] = .due
        }
        doses = updated
        snoozed = false
        wellness = min(3, wellness + 1)
        noteDueStep()
        award(stars: 2, message: cheer)
    }

    func awardRemembered() {
        award(stars: 1, message: "You remembered a care step. +1 star")
    }

    func checkNeglect(now: Date = .now) {
        guard heroDose != nil else { return }
        noteDueStep()
        guard let started = dueStarted else { return }
        let anchor = lastPenalty ?? started
        guard now.timeIntervalSince(anchor) >= 120 else { return }
        stars = max(0, stars - 2)
        wellness = max(0, wellness - 1)
        lastPenalty = now
        showToast("\(companionName) waited too long and feels worse. -2 stars")
        persist()
    }

    private func noteDueStep() {
        let id = heroDose?.id
        guard id != trackedDueID else { return }
        trackedDueID = id
        dueStarted = id == nil ? nil : .now
        lastPenalty = nil
    }

    func coldTreat(cheer: String? = nil) {
        guard coldTreats < maxColdTreats else {
            showToast("\(companionName) has had enough popsicles for now.")
            return
        }
        coldTreats += 1
        award(stars: 1, message: cheer ?? "\(companionName) liked that popsicle. +1 Star")
    }

    func hydrationSip(cheer: String? = nil) {
        guard cups < maxCups else {
            showToast("\(companionName)'s cups are full. Nice work!")
            return
        }
        cups += 1
        award(stars: 1, message: cheer ?? "\(companionName) took a small sip. +1 Star")
    }

    func helpKareRest() {
        guard restHelps < maxRest else {
            showToast("\(companionName) is already resting.")
            return
        }
        restHelps += 1
        award(stars: 1, message: "You helped \(companionName) rest. +1 Star")
    }

    func storyMissCount(_ id: String) -> Int {
        storyMisses[id] ?? 0
    }

    func isStoryCleared(_ id: String) -> Bool {
        storyCleared.contains(id)
    }

    func noteStoryMiss(_ id: String) {
        var next = storyMisses
        next[id] = (next[id] ?? 0) + 1
        storyMisses = next
        persist()
    }

    func clearStory(_ id: String, needsTalk: Bool) {
        if !storyCleared.contains(id) {
            storyCleared.append(id)
        }
        if needsTalk, !storyTalk.contains(id) {
            storyTalk.append(id)
        }
        persist()
    }

    func rememberStorySpot(pageID: String, phase: String) {
        guard storySpotPageID != pageID || storySpotPhase != phase else { return }
        storySpotPageID = pageID
        storySpotPhase = phase
        persist()
    }

    func rememberPrepSpot(pageID: String, phase: String) {
        guard prepSpotPageID != pageID || prepSpotPhase != phase else { return }
        prepSpotPageID = pageID
        prepSpotPhase = phase
        persist()
    }

    func snoozeNextDose() {
        guard heroDose != nil else { return }
        snoozed = true
        showToast("Snoozed for 10 minutes")
        persist()
    }

    func reset() {
        stars = 14
        cups = 5
        coldTreats = 0
        doseProgress = [:]
        snoozed = false
        puppyUnlocked = false
        showPuppyCelebration = false
        storyCleared = []
        storyTalk = []
        storyMisses = [:]
        storySpotPageID = ""
        storySpotPhase = ""
        prepSpotPageID = ""
        prepSpotPhase = ""
        restHelps = 0
        wellness = 3
        trackedDueID = nil
        dueStarted = nil
        lastPenalty = nil
        rebuildSchedule()
        showToast("\(companionName)'s care and story are back at the start.")
        persist()
    }

    func dismissToast() {
        toast = nil
    }

    func subtitle(for dose: Dose) -> String {
        let when = dose.time
        switch dose.status {
        case .done:
            return when.isEmpty ? dose.detail : when
        case .due:
            return when.isEmpty ? dose.detail : "\(when) • Up Next"
        case .upcoming:
            return when.isEmpty ? dose.detail : when
        }
    }

    func trailingLabel(for dose: Dose) -> String {
        switch dose.status {
        case .done:
            "Done"
        case .due:
            "Now"
        case .upcoming:
            "Later"
        }
    }

    private func award(stars amount: Int, message: String) {
        let before = stars
        stars += amount
        if !puppyUnlocked && stars >= puppyGoal {
            puppyUnlocked = true
            showPuppyCelebration = true
        } else if before < puppyGoal && stars >= puppyGoal {
            showPuppyCelebration = true
        }
        showToast(message)
        persist()
    }

    private func showToast(_ message: String) {
        toastID += 1
        toast = message
    }

    private func persist() {
        let defaults = UserDefaults.standard
        defaults.set(true, forKey: Key.saved)
        defaults.set(stars, forKey: Key.stars)
        defaults.set(cups, forKey: Key.cups)
        defaults.set(coldTreats, forKey: Key.cold)
        defaults.set(snoozed, forKey: Key.snoozed)
        defaults.set(puppyUnlocked, forKey: Key.puppy)
        defaults.set(doseProgress.map { "\($0.key):\($0.value.rawValue)" }, forKey: Key.doses)
        defaults.set(storyCleared, forKey: Key.storyCleared)
        defaults.set(storyTalk, forKey: Key.storyTalk)
        defaults.set(storyMisses.map { "\($0.key):\($0.value)" }, forKey: Key.storyMisses)
        defaults.set(storySpotPageID, forKey: Key.storySpotPage)
        defaults.set(storySpotPhase, forKey: Key.storySpotPhase)
        defaults.set(prepSpotPageID, forKey: Key.prepSpotPage)
        defaults.set(prepSpotPhase, forKey: Key.prepSpotPhase)
        defaults.set(restHelps, forKey: Key.rest)
        if let data = try? JSONEncoder().encode(parentInstructions) {
            defaults.set(data, forKey: Key.parentNotes)
        }
        defaults.set(didOnboard, forKey: Key.onboard)
        defaults.set(parentName, forKey: Key.parentName)
        defaults.set(parentEmail, forKey: Key.parentEmail)
        defaults.set(childName, forKey: Key.childName)
        defaults.set(bearName, forKey: Key.bearName)
        defaults.set(roomStyle, forKey: Key.roomStyle)
        defaults.set(childAge, forKey: Key.childAge)
        defaults.set(recoveryFocus, forKey: Key.recovery)
        defaults.set(wellness, forKey: Key.wellness)
        defaults.set(trackedDueID, forKey: Key.trackedDue)
        defaults.set(dueStarted?.timeIntervalSince1970, forKey: Key.dueStarted)
        defaults.set(lastPenalty?.timeIntervalSince1970, forKey: Key.lastPenalty)
        defaults.set(isChildMode, forKey: Key.childMode)
        defaults.set(passwordRecord, forKey: Key.passwordRecord)
        defaults.set(careStage, forKey: Key.careStage)
        defaults.set(prepGameEnabled, forKey: Key.prepGame)
        defaults.set(isLoggedIn, forKey: Key.loggedIn)
    }

    func addParentInstructions(_ items: [ParentInstruction]) {
        let existing = Set(parentInstructions.map { "\($0.title)|\($0.detail)" })
        let cleaned = items.filter {
            let title = $0.title.trimmingCharacters(in: .whitespacesAndNewlines)
            let detail = $0.detail.trimmingCharacters(in: .whitespacesAndNewlines)
            return !title.isEmpty && !existing.contains("\(title)|\(detail)")
        }
        guard !cleaned.isEmpty else { return }
        if isCreatingAccount {
            replacementAddedIDs.formUnion(cleaned.map(\.id))
        }
        parentInstructions.insert(contentsOf: cleaned, at: 0)
        rebuildSchedule()
        persist()
    }

    func updateParentInstruction(id: UUID, title: String, detail: String) {
        let cleanTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanDetail = detail.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanTitle.isEmpty, !cleanDetail.isEmpty else { return }
        guard let index = parentInstructions.firstIndex(where: { $0.id == id }) else { return }
        parentInstructions[index].title = cleanTitle
        parentInstructions[index].detail = cleanDetail
        rebuildSchedule()
        persist()
    }

    func removeParentInstruction(_ id: UUID) {
        parentInstructions.removeAll { $0.id == id }
        doseProgress[id.uuidString] = nil
        rebuildSchedule()
        persist()
    }

    private func rebuildSchedule() {
        let parsed: [(note: ParentInstruction, amount: String, time: String, minutes: Int?)] = parentInstructions.map { note in
            let fields = InstructionSchedule.fields(for: note)
            return (note, fields.amount, fields.time, fields.minutes)
        }
        let timed = parsed.filter { $0.minutes != nil }.sorted { ($0.minutes ?? 0) < ($1.minutes ?? 0) }
        let untimed = parsed.filter { $0.minutes == nil }
        var built: [Dose] = (timed + untimed).map { item in
            let saved = doseProgress[item.note.id.uuidString] ?? .upcoming
            return Dose(
                id: item.note.id.uuidString,
                name: item.note.title,
                amount: item.amount,
                time: item.time,
                status: saved == .done ? .done : .upcoming,
                detail: item.note.detail
            )
        }
        if let savedDue = built.firstIndex(where: { doseProgress[$0.id] == .due }) {
            built[savedDue].status = .due
        } else if let firstOpen = built.firstIndex(where: { $0.status != .done }) {
            built[firstOpen].status = .due
            doseProgress[built[firstOpen].id] = .due
        }
        let ids = Set(built.map(\.id))
        doseProgress = doseProgress.filter { ids.contains($0.key) }
        for dose in built where dose.status == .done {
            doseProgress[dose.id] = .done
        }
        doses = built
        noteDueStep()
    }

    private static func decodeProgress(_ raw: [String]) -> [String: DoseStatus] {
        var map: [String: DoseStatus] = [:]
        for item in raw {
            let parts = item.split(separator: ":", maxSplits: 1)
            if parts.count == 2, let status = DoseStatus(rawValue: String(parts[1])) {
                map[String(parts[0])] = status
            }
        }
        return map
    }

    private static func decodeMisses(_ raw: [String]) -> [String: Int] {
        var map: [String: Int] = [:]
        for item in raw {
            let parts = item.split(separator: ":", maxSplits: 1)
            if parts.count == 2, let count = Int(parts[1]) {
                map[String(parts[0])] = count
            }
        }
        return map
    }
}

private enum InstructionSchedule {
    static func fields(for note: ParentInstruction) -> (amount: String, time: String, minutes: Int?) {
        let text = "\(note.title) \(note.detail)"
        let amount = amount(in: text)
        let time = clock(in: text)
        return (amount, time, minutes(from: time))
    }

    private static func amount(in text: String) -> String {
        let pattern = #"(?i)\b(\d+(?:\.\d+)?)\s*(ml|milliliters?)\b"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(match.range(at: 1), in: text) else { return "" }
        return "\(text[range]) mL"
    }

    private static func clock(in text: String) -> String {
        let lower = text.lowercased()
        let pattern = #"\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b"#
        if let regex = try? NSRegularExpression(pattern: pattern) {
            let matches = regex.matches(in: lower, range: NSRange(lower.startIndex..., in: lower))
            for match in matches {
                guard let hourRange = Range(match.range(at: 1), in: lower),
                      let hour = Int(lower[hourRange]),
                      (1...12).contains(hour) else { continue }
                let minute: Int
                if match.range(at: 2).location != NSNotFound,
                   let minuteRange = Range(match.range(at: 2), in: lower),
                   let parsed = Int(lower[minuteRange]) {
                    minute = parsed
                } else {
                    minute = 0
                }
                let token = Range(match.range(at: 3), in: lower).map { String(lower[$0]) } ?? ""
                guard let suffix = meridiem(token: token, in: lower, allowBare: match.range(at: 2).location != NSNotFound) else { continue }
                return String(format: "%d:%02d %@", hour, minute, suffix)
            }
        }
        return wordClock(in: lower)
    }

    private static func wordClock(in lower: String) -> String {
        let words = [
            ("twelve", 12), ("eleven", 11), ("ten", 10), ("nine", 9), ("eight", 8),
            ("seven", 7), ("six", 6), ("five", 5), ("four", 4), ("three", 3), ("two", 2), ("one", 1)
        ]
        for (word, hour) in words where lower.range(of: "\\b\(word)\\b", options: .regularExpression) != nil {
            guard let suffix = meridiem(token: "", in: lower, allowBare: lower.contains("at \(word)")) else { continue }
            return String(format: "%d:00 %@", hour, suffix)
        }
        return ""
    }

    private static func meridiem(token: String, in lower: String, allowBare: Bool) -> String? {
        if token.contains("p") { return "PM" }
        if token.contains("a") { return "AM" }
        if lower.contains("afternoon") || lower.contains("evening") || lower.contains("night") { return "PM" }
        if lower.contains("morning") { return "AM" }
        return allowBare ? "AM" : nil
    }

    private static func minutes(from time: String) -> Int? {
        let parts = time.split(separator: " ")
        guard parts.count == 2 else { return nil }
        let clock = parts[0].split(separator: ":")
        guard clock.count == 2, var hour = Int(clock[0]), let minute = Int(clock[1]) else { return nil }
        let isPM = parts[1] == "PM"
        if hour == 12 { hour = 0 }
        if isPM { hour += 12 }
        return hour * 60 + minute
    }
}
