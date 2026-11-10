import AVFoundation
import FoundationModels
import SwiftUI

struct ParentInstruction: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var title: String
    var detail: String
    var fromRecording: Bool
    var isDemo: Bool = false
}

struct DraftInstruction: Identifiable, Equatable {
    var id = UUID()
    var title: String
    var detail: String
    var keep = false
}

@Generable
struct ExtractedCarePlan {
    @Guide(description: "Care steps that were actually spoken. Leave empty when the conversation has no care instruction.")
    var instructions: [ExtractedStep]
}

@Generable
struct ExtractedStep {
    @Guide(description: "A short title of two to five words")
    var title: String
    @Guide(description: "The spoken instruction. Include a time or amount only if it was said.")
    var detail: String
}

enum InstructionExtractor {
    static func extract(from transcript: String) async -> (items: [DraftInstruction], note: String) {
        let trimmed = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count > 8 else {
            return ([], "No words came through. Try the recording again, or type the steps.")
        }
        if let gemini = await geminiSteps(from: trimmed) {
            if gemini.isEmpty {
                return ([], "No care steps stood out. You can add one from the words below.")
            }
            return (gemini, "Approve each step you want to keep. You can edit it, remove it, or add one.")
        }
        if SystemLanguageModel.default.isAvailable {
            do {
                let session = LanguageModelSession(instructions: """
                Extract care instructions for a child's recovery from a parent's conversation.
                Include only steps that were actually said.
                Do not invent medicines, doses, times, or warnings.
                If nothing about care was said, return an empty list.
                """)
                let response = try await session.respond(to: trimmed, generating: ExtractedCarePlan.self)
                let items = response.content.instructions
                    .map { step in
                        DraftInstruction(
                            title: step.title.trimmingCharacters(in: .whitespacesAndNewlines),
                            detail: step.detail.trimmingCharacters(in: .whitespacesAndNewlines)
                        )
                    }
                    .filter { !$0.title.isEmpty && !$0.detail.isEmpty }
                if !items.isEmpty {
                    return (items, "Approve each step you want to keep. You can edit it, remove it, or add one.")
                }
            } catch {
                // The on-device model can be unavailable or refuse a prompt. The word list below still works.
            }
        }
        let local = localSteps(from: trimmed)
        if local.isEmpty {
            return ([], "No care steps stood out. You can type them from the words below.")
        }
        return (local, "Approve each step you want to keep. You can edit it, remove it, or add one.")
    }

    static func localSteps(from transcript: String) -> [DraftInstruction] {
        let cues = [
            "medicine", "dose", "ml", "milliliter", "sip", "water", "drink", "popsicle",
            "rest", "pain", "hurt", "call", "doctor", "nurse", "hour", "throat",
            "don't", "do not", "avoid", "ibuprofen", "acetaminophen", "antibiotic"
        ]
        let pieces = transcript.components(separatedBy: CharacterSet(charactersIn: ".!?\n"))
        var items: [DraftInstruction] = []
        for piece in pieces {
            let sentence = piece.trimmingCharacters(in: .whitespacesAndNewlines)
            guard sentence.count > 12 else { continue }
            let lower = sentence.lowercased()
            guard cues.contains(where: { lower.contains($0) }) else { continue }
            items.append(DraftInstruction(title: title(for: lower), detail: sentence))
            if items.count == 8 { break }
        }
        return items
    }

    private static func title(for lower: String) -> String {
        let pairs = [
            ("ibuprofen", "Pain medicine"),
            ("acetaminophen", "Pain medicine"),
            ("antibiotic", "Antibiotic"),
            ("medicine", "Medicine"),
            ("dose", "Dose"),
            ("popsicle", "Cold treat"),
            ("sip", "Cold sips"),
            ("water", "Drinks"),
            ("drink", "Drinks"),
            ("rest", "Rest"),
            ("call", "When to call"),
            ("throat", "Throat care"),
            ("pain", "Pain")
        ]
        var best: (index: Int, name: String)?
        for (cue, name) in pairs {
            guard let range = lower.range(of: cue) else { continue }
            let index = lower.distance(from: lower.startIndex, to: range.lowerBound)
            if best == nil || index < best!.index {
                best = (index, name)
            }
        }
        return best?.name ?? "Care step"
    }

    /// Returns nil when Gemini cannot be reached, so the caller can use another extractor.
    private static func geminiSteps(from transcript: String) async -> [DraftInstruction]? {
        let models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.0-flash"]
        let prompt = """
        Extract the care instructions a parent actually said in this transcript.
        Include only steps about the child's recovery, such as medicine, drinks, rest, or when to call a grown-up.
        Do not invent medicines, doses, times, or warnings.
        If nothing about care was said, return an empty steps list.
        Each title is two to five specific words, such as Morning antibiotic or Cold water sips. Each detail is the spoken instruction, including a time or amount only if it was said.

        Transcript:
        \(transcript)
        """
        let body: [String: Any] = [
            "contents": [["parts": [["text": prompt]]]],
            "generationConfig": [
                "temperature": 0,
                "responseMimeType": "application/json",
                "responseSchema": [
                    "type": "OBJECT",
                    "properties": [
                        "steps": [
                            "type": "ARRAY",
                            "items": [
                                "type": "OBJECT",
                                "properties": [
                                    "title": ["type": "STRING"],
                                    "detail": ["type": "STRING"]
                                ],
                                "required": ["title", "detail"]
                            ]
                        ]
                    ],
                    "required": ["steps"]
                ]
            ]
        ]
        guard let payload = try? JSONSerialization.data(withJSONObject: body) else { return nil }
        for model in models {
            guard let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateContent") else { continue }
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.httpBody = payload
            request.timeoutInterval = 25
            request.setValue(SpeechSecrets.geminiKey, forHTTPHeaderField: "x-goog-api-key")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                guard let http = response as? HTTPURLResponse else { continue }
                if http.statusCode == 401 || http.statusCode == 403 { return nil }
                guard http.statusCode == 200, let steps = parseGeminiSteps(data) else { continue }
                return steps
            } catch {
                return nil
            }
        }
        return nil
    }

    private static func parseGeminiSteps(_ data: Data) -> [DraftInstruction]? {
        guard
            let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let candidates = root["candidates"] as? [[String: Any]],
            let content = candidates.first?["content"] as? [String: Any],
            let parts = content["parts"] as? [[String: Any]],
            let text = parts.first?["text"] as? String,
            let json = text.data(using: .utf8),
            let object = try? JSONSerialization.jsonObject(with: json) as? [String: Any],
            let steps = object["steps"] as? [[String: Any]]
        else { return nil }
        return steps.compactMap { step in
            let title = (step["title"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            let detail = (step["detail"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !title.isEmpty, !detail.isEmpty else { return nil }
            return DraftInstruction(title: title, detail: detail)
        }
    }
}

@MainActor
@Observable
final class ConversationRecorder {
    var transcript = ""
    var isRecording = false
    var isTranscribing = false
    var status = "Tap record. The microphone is on only while recording. The audio is sent to turn speech into text."

    private let engine = AVAudioEngine()
    private let capture = AudioCapture()
    private var tapInstalled = false
    private var live: AzureLiveTranscriber?
    private var pump: Task<Void, Never>?

    func start() async {
        guard !isRecording, !isTranscribing else { return }
        let micOK = await AVAudioApplication.requestRecordPermission()
        guard micOK else {
            status = "The microphone is off. You can turn it on in Settings, or type the steps instead."
            return
        }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers, .defaultToSpeaker])
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            let input = engine.inputNode
            let format = input.outputFormat(forBus: 0)
            guard format.sampleRate > 0, format.channelCount > 0 else {
                status = "This device has no microphone input. Type the steps, or try another device."
                try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
                return
            }
            capture.reset(rate: format.sampleRate)
            let stream = AzureLiveTranscriber()
            stream.onTranscript = { [weak self] text in
                self?.transcript = text
            }
            await stream.connect()
            live = stream
            input.installTap(onBus: 0, bufferSize: 4096, format: format) { [capture] buffer, _ in
                capture.append(buffer)
            }
            tapInstalled = true
            engine.prepare()
            try engine.start()
            transcript = ""
            isRecording = true
            status = "Listening. The words below are what is being heard."
            pump = Task { [weak self] in
                await self?.pumpLiveAudio()
            }
        } catch {
            cancel()
            status = "Recording could not start. You can type the care steps instead."
        }
    }

    /// Stops the microphone and discards the audio. Used when leaving the screen.
    func cancel() {
        pump?.cancel()
        pump = nil
        live?.cancel()
        live = nil
        stopEngine()
        isRecording = false
        isTranscribing = false
        capture.reset(rate: 0)
    }

    /// Stops the microphone and keeps the transcript that was heard.
    func finish() async {
        guard isRecording else { return }
        isRecording = false
        stopEngine()
        await sendLiveAudio()
        pump?.cancel()
        let heard = await live?.end() ?? ""
        live = nil
        if !heard.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            transcript = heard
            status = "Recording turned into text."
            return
        }
        let taken = capture.take()
        let floats = taken.samples
        let rate = taken.rate
        guard floats.count > Int(rate * 0.4), rate > 0 else {
            transcript = ""
            status = "No audio came through. Try again, or type the steps."
            return
        }
        isTranscribing = true
        status = "Turning the recording into text..."
        let samples = Self.resample(floats, from: rate, to: 16_000)
        do {
            transcript = try await AzureConversationTranscriber.transcribe(samples)
            status = transcript.isEmpty
                ? "No words came through. Try again, or type the steps."
                : "Recording turned into text."
        } catch {
            transcript = ""
            status = "The recording could not be turned into text. Try again, or type the steps."
        }
        isTranscribing = false
    }

    private func pumpLiveAudio() async {
        while !Task.isCancelled, isRecording {
            await sendLiveAudio()
            try? await Task.sleep(nanoseconds: 180_000_000)
        }
    }

    private func sendLiveAudio() async {
        let drained = capture.drainNew()
        guard !drained.samples.isEmpty, drained.rate > 0 else { return }
        let samples = Self.resample(drained.samples, from: drained.rate, to: 16_000)
        guard !samples.isEmpty else { return }
        var bytes = Data(capacity: samples.count * 2)
        for sample in samples {
            var little = sample.littleEndian
            withUnsafeBytes(of: &little) { bytes.append(contentsOf: $0) }
        }
        await live?.send(bytes)
    }

    private func stopEngine() {
        if engine.isRunning {
            engine.stop()
        }
        if tapInstalled {
            engine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    private static func resample(_ input: [Float], from source: Double, to target: Double) -> [Int16] {
        guard !input.isEmpty, source > 0, target > 0 else { return [] }
        let ratio = source / target
        let count = max(1, Int(Double(input.count) / ratio))
        var output = [Int16]()
        output.reserveCapacity(count)
        for index in 0..<count {
            let position = Double(index) * ratio
            let left = min(Int(position), input.count - 1)
            let right = min(left + 1, input.count - 1)
            let fraction = Float(position - Double(left))
            let mixed = input[left] + (input[right] - input[left]) * fraction
            let clamped = max(-1, min(1, mixed))
            output.append(Int16(clamped * 32_767))
        }
        return output
    }
}

private final class AudioCapture: @unchecked Sendable {
    private let lock = NSLock()
    private var samples: [Float] = []
    private var rate: Double = 0

    private var readIndex = 0

    func reset(rate: Double) {
        lock.lock()
        samples.removeAll()
        readIndex = 0
        self.rate = rate
        lock.unlock()
    }

    func drainNew() -> (samples: [Float], rate: Double) {
        lock.lock()
        defer { lock.unlock() }
        guard readIndex < samples.count else { return ([], rate) }
        let fresh = Array(samples[readIndex...])
        readIndex = samples.count
        return (fresh, rate)
    }

    func append(_ buffer: AVAudioPCMBuffer) {
        guard let channel = buffer.floatChannelData?[0] else { return }
        let count = Int(buffer.frameLength)
        guard count > 0 else { return }
        var chunk = [Float](repeating: 0, count: count)
        for index in 0..<count {
            chunk[index] = channel[index]
        }
        lock.lock()
        samples.append(contentsOf: chunk)
        lock.unlock()
    }

    func take() -> (samples: [Float], rate: Double) {
        lock.lock()
        let result = (samples, rate)
        samples.removeAll()
        lock.unlock()
        return result
    }
}

enum AzureConversationTranscriber {
    static func transcribe(_ samples: [Int16]) async throws -> String {
        let chunkLength = 50 * 16_000
        var parts: [String] = []
        var start = 0
        while start < samples.count {
            let end = min(start + chunkLength, samples.count)
            let text = try await request(wav(from: Array(samples[start..<end])))
            if !text.isEmpty {
                parts.append(text)
            }
            start = end
        }
        return parts.joined(separator: " ")
    }

    private static func request(_ wav: Data) async throws -> String {
        var components = URLComponents()
        components.scheme = "https"
        components.host = "\(SpeechSecrets.region).stt.speech.microsoft.com"
        components.path = "/speech/recognition/conversation/cognitiveservices/v1"
        components.queryItems = [URLQueryItem(name: "language", value: "en-US")]
        guard let url = components.url else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = wav
        request.timeoutInterval = 30
        request.setValue(SpeechSecrets.key, forHTTPHeaderField: "Ocp-Apim-Subscription-Key")
        request.setValue("audio/wav; codecs=audio/pcm; samplerate=16000", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        let decoded = try JSONDecoder().decode(AzureRecognition.self, from: data)
        guard decoded.RecognitionStatus == "Success" else { return "" }
        return decoded.DisplayText?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }

    private static func wav(from samples: [Int16]) -> Data {
        let dataSize = samples.count * MemoryLayout<Int16>.size
        var data = Data()
        func appendString(_ value: String) { data.append(Data(value.utf8)) }
        func append32(_ value: UInt32) {
            var little = value.littleEndian
            withUnsafeBytes(of: &little) { data.append(contentsOf: $0) }
        }
        func append16(_ value: UInt16) {
            var little = value.littleEndian
            withUnsafeBytes(of: &little) { data.append(contentsOf: $0) }
        }
        appendString("RIFF")
        append32(UInt32(36 + dataSize))
        appendString("WAVE")
        appendString("fmt ")
        append32(16)
        append16(1)
        append16(1)
        append32(16_000)
        append32(32_000)
        append16(2)
        append16(16)
        appendString("data")
        append32(UInt32(dataSize))
        samples.withUnsafeBytes { data.append(contentsOf: $0) }
        return data
    }
}

private struct AzureRecognition: Decodable {
    var RecognitionStatus: String
    var DisplayText: String?
}

/// Streams microphone audio to Azure and reports words as they are heard.
@MainActor
private final class AzureLiveTranscriber {
    var onTranscript: ((String) -> Void)?

    private var session: URLSession?
    private var socket: URLSessionWebSocketTask?
    private var receiveTask: Task<Void, Never>?
    private var confirmed: [String] = []
    private var hypothesis = ""
    private var sentHeader = false
    private var ended = false
    private let requestID = UUID().uuidString

    func connect() async {
        var components = URLComponents()
        components.scheme = "wss"
        components.host = "\(SpeechSecrets.region).stt.speech.microsoft.com"
        components.path = "/speech/recognition/conversation/cognitiveservices/v1"
        components.queryItems = [
            URLQueryItem(name: "language", value: "en-US"),
            URLQueryItem(name: "format", value: "simple")
        ]
        guard let url = components.url else { return }
        var request = URLRequest(url: url)
        request.setValue(SpeechSecrets.key, forHTTPHeaderField: "Ocp-Apim-Subscription-Key")
        let session = URLSession(configuration: .default)
        let socket = session.webSocketTask(with: request)
        self.session = session
        self.socket = socket
        socket.resume()
        let config = [
            "Path: speech.config",
            "X-RequestId: \(requestID)",
            "X-Timestamp: \(Self.timestamp())",
            "Content-Type: application/json; charset=utf-8",
            "",
            #"{"context":{"system":{"version":"1.0.0"},"os":{"platform":"iOS","name":"iOS","version":"26.0"},"audio":{"source":{"bitspersample":16,"channelcount":1,"sampleRate":16000}}}}"#
        ].joined(separator: "\r\n")
        try? await socket.send(.string(config))
        receiveTask = Task { [weak self] in
            await self?.receiveLoop()
        }
    }

    func send(_ pcm: Data) async {
        guard let socket, !pcm.isEmpty else { return }
        var body = Data()
        if !sentHeader {
            body.append(Self.streamHeader())
            sentHeader = true
        }
        body.append(pcm)
        let header = "Path: audio\r\nX-RequestId: \(requestID)\r\nX-Timestamp: \(Self.timestamp())\r\nContent-Type: audio/x-wav\r\n"
        try? await socket.send(.data(Self.binaryMessage(header: header, body: body)))
    }

    func end() async -> String {
        ended = true
        if let socket {
            let turn = "Path: turn.end\r\nX-RequestId: \(requestID)\r\nX-Timestamp: \(Self.timestamp())\r\n\r\n"
            try? await socket.send(.string(turn))
        }
        let start = Date()
        while Date().timeIntervalSince(start) < 2.2, hypothesis.isEmpty == false || confirmed.isEmpty {
            if !hypothesis.isEmpty, Date().timeIntervalSince(start) > 1.4 { break }
            try? await Task.sleep(nanoseconds: 120_000_000)
        }
        cancel()
        return displayed.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    func cancel() {
        receiveTask?.cancel()
        receiveTask = nil
        socket?.cancel(with: .goingAway, reason: nil)
        socket = nil
        session?.invalidateAndCancel()
        session = nil
    }

    private var displayed: String {
        let spoken = confirmed.joined(separator: " ")
        guard !hypothesis.isEmpty else { return spoken }
        return spoken.isEmpty ? hypothesis : "\(spoken) \(hypothesis)"
    }

    private func receiveLoop() async {
        while !Task.isCancelled, let socket {
            do {
                let message = try await socket.receive()
                switch message {
                case .string(let text):
                    apply(text)
                case .data(let data):
                    if let text = Self.text(from: data) { apply(text) }
                @unknown default:
                    break
                }
            } catch {
                break
            }
        }
    }

    private func apply(_ message: String) {
        let lower = message.lowercased()
        guard let body = Self.jsonObject(in: message) else { return }
        if lower.contains("speech.hypothesis") {
            hypothesis = (body["Text"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            onTranscript?(displayed)
        } else if lower.contains("speech.phrase") {
            let phrase = (body["DisplayText"] as? String ?? body["Text"] as? String ?? "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            if !phrase.isEmpty {
                confirmed.append(phrase)
            }
            hypothesis = ""
            onTranscript?(displayed)
        }
    }

    private static func jsonObject(in message: String) -> [String: Any]? {
        guard let range = message.range(of: "\r\n\r\n") else { return nil }
        let json = String(message[range.upperBound...])
        guard let data = json.data(using: .utf8) else { return nil }
        return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }

    private static func text(from data: Data) -> String? {
        guard data.count > 2 else { return nil }
        let headerLength = Int(data[0]) << 8 | Int(data[1])
        guard headerLength > 0, data.count >= 2 + headerLength else {
            return String(data: data, encoding: .utf8)
        }
        let header = String(data: data[2..<(2 + headerLength)], encoding: .utf8) ?? ""
        let body = String(data: data[(2 + headerLength)...], encoding: .utf8) ?? ""
        return header + "\r\n\r\n" + body
    }

    private static func binaryMessage(header: String, body: Data) -> Data {
        let headerBytes = Data(header.utf8)
        var data = Data(capacity: 2 + headerBytes.count + body.count)
        data.append(UInt8((headerBytes.count >> 8) & 0xFF))
        data.append(UInt8(headerBytes.count & 0xFF))
        data.append(headerBytes)
        data.append(body)
        return data
    }

    private static func streamHeader() -> Data {
        var data = Data()
        func appendString(_ value: String) { data.append(Data(value.utf8)) }
        func append32(_ value: UInt32) {
            var little = value.littleEndian
            withUnsafeBytes(of: &little) { data.append(contentsOf: $0) }
        }
        func append16(_ value: UInt16) {
            var little = value.littleEndian
            withUnsafeBytes(of: &little) { data.append(contentsOf: $0) }
        }
        appendString("RIFF")
        append32(0xFFFF_FFFF)
        appendString("WAVE")
        appendString("fmt ")
        append32(16)
        append16(1)
        append16(1)
        append32(16_000)
        append32(32_000)
        append16(2)
        append16(16)
        appendString("data")
        append32(0xFFFF_FFFF)
        return data
    }

    private static func timestamp() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: Date())
    }
}

struct ParentCareView: View {
    @Environment(CareStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @State private var route: Route = .list
    @State private var recorder = ConversationRecorder()
    @State private var drafts: [DraftInstruction] = []
    @State private var reviewNote = ""
    @State private var isExtracting = false
    var embedded = false

    enum Route: Equatable {
        case list
        case write
        case edit(ParentInstruction)
        case record
        case review
    }

    init(start: Route = .list, embedded: Bool = false) {
        _route = State(initialValue: start)
        self.embedded = embedded
    }

    var body: some View {
        VStack(spacing: 0) {
            if embedded && route == .list {
                KareHeader(showsHelp: false)
            } else {
                header
            }
            switch route {
            case .list:
                list
            case .write:
                ManualInstructionForm {
                    route = .list
                }
                .id("new-step")
            case .edit(let note):
                ManualInstructionForm(existing: note) {
                    route = .list
                }
                .id(note.id)
            case .record:
                recorderScreen
            case .review:
                reviewScreen
            }
        }
        .background(Theme.bg)
        .onChange(of: scenePhase) { _, phase in
            if phase != .active {
                recorder.cancel()
            }
        }
        .onDisappear {
            recorder.cancel()
        }
    }

    private var header: some View {
        HStack {
            Button(action: goBack) {
                Image(systemName: route == .list ? "xmark" : "chevron.left")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.teal)
                    .frame(width: 40, height: 40)
                    .background(Color.white, in: Circle())
                    .overlay(Circle().stroke(Theme.border, lineWidth: 1))
            }
            .buttonStyle(KidButtonStyle())
            .accessibilityLabel(route == .list ? "Close" : "Back")
            Spacer()
            Text("For a grown-up")
                .font(jakarta(14, .bold))
                .foregroundStyle(Theme.muted)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Theme.bg)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }

    private var list: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Care instructions")
                    .font(jakarta(28, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text("These steps become \(store.careChildName)'s story, remember game, and to-do list. A saved step can be changed.")
                    .font(jakarta(15, .medium))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)

                Button {
                    route = .write
                } label: {
                    actionLabel("Write a step", symbol: "square.and.pencil", fill: Theme.teal)
                }
                .buttonStyle(KidButtonStyle())

                Button {
                    route = .record
                } label: {
                    actionLabel("Record a conversation", symbol: "mic.fill", fill: Theme.terra)
                }
                .buttonStyle(KidButtonStyle())

                if store.parentInstructions.isEmpty {
                    Text("No care steps yet.")
                        .font(jakarta(14, .medium))
                        .foregroundStyle(Theme.muted)
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .card(fill: Theme.bg)
                } else {
                    Text("Saved steps")
                        .font(jakarta(18, .extraBold))
                        .foregroundStyle(Theme.teal)
                        .padding(.top, 6)
                    ForEach(store.parentInstructions) { note in
                        HStack(alignment: .top, spacing: 10) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(note.title)
                                    .font(jakarta(16, .bold))
                                    .foregroundStyle(Theme.teal)
                                Text(note.detail)
                                    .font(jakarta(14, .medium))
                                    .foregroundStyle(Theme.text)
                                    .fixedSize(horizontal: false, vertical: true)
                                Text(note.isDemo ? "Demo" : (note.fromRecording ? "From a recording" : "Written"))
                                    .font(jakarta(12, .semibold))
                                    .foregroundStyle(Theme.subtle)
                            }
                            Spacer(minLength: 8)
                            Button {
                                route = .edit(note)
                            } label: {
                                Image(systemName: "pencil")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(Theme.teal)
                                    .frame(width: 40, height: 40)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Edit \(note.title)")
                            Button {
                                store.removeParentInstruction(note.id)
                            } label: {
                                Image(systemName: "trash")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(Theme.terra)
                                    .frame(width: 40, height: 40)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Remove \(note.title)")
                        }
                        .padding(14)
                        .card()
                    }
                }
            }
            .padding(16)
            .readableColumn(compact: 520)
        }
        .scrollIndicators(.hidden)
    }

    private var recorderScreen: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Record the conversation")
                    .font(jakarta(28, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text(recorder.status)
                    .font(jakarta(15, .medium))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 8) {
                    Circle()
                        .fill(recorder.isRecording ? Theme.terra : Theme.border)
                        .frame(width: 12, height: 12)
                    Text(recorder.isRecording ? "Recording" : "Not recording")
                        .font(jakarta(14, .bold))
                        .foregroundStyle(recorder.isRecording ? Theme.terra : Theme.muted)
                }

                Text(recorder.isRecording
                     ? "Speak the care steps. The words appear as they are heard."
                     : "Speak the care steps, then stop. Each step waits for your approval.")
                    .font(jakarta(15, .medium))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
                VStack(alignment: .leading, spacing: 6) {
                    Text("What is being heard")
                        .font(jakarta(13, .bold))
                        .foregroundStyle(Theme.teal)
                    Text(recorder.transcript.isEmpty ? "Words will show up here as you speak." : recorder.transcript)
                        .font(jakarta(16, .medium))
                        .foregroundStyle(recorder.transcript.isEmpty ? Theme.subtle : Theme.text)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .card()

                if recorder.isRecording {
                    Button {
                        Task { await findSteps() }
                    } label: {
                        actionLabel("Stop and find care steps", symbol: "stop.fill", fill: Theme.terra)
                    }
                    .buttonStyle(KidButtonStyle())
                } else if recorder.isTranscribing || isExtracting {
                    actionLabel("Finding care steps...", symbol: "waveform", fill: Theme.teal.opacity(0.45))
                } else {
                    Button {
                        Task { await recorder.start() }
                    } label: {
                        actionLabel("Start recording", symbol: "mic.fill", fill: Theme.teal)
                    }
                    .buttonStyle(KidButtonStyle())
                }
            }
            .padding(16)
            .readableColumn(compact: 520)
        }
        .scrollIndicators(.hidden)
    }

    private var reviewScreen: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Check the steps")
                    .font(jakarta(28, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text(reviewNote)
                    .font(jakarta(15, .medium))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
                if !recorder.transcript.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("What was said")
                            .font(jakarta(13, .bold))
                            .foregroundStyle(Theme.teal)
                        Text(recorder.transcript)
                            .font(jakarta(15, .medium))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .card()
                }
                if drafts.isEmpty {
                    Text("No care steps stood out. You can add one from the words above.")
                        .font(jakarta(15, .medium))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                ForEach($drafts) { $draft in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(draft.keep ? "Approved" : "Needs approval")
                                .font(jakarta(13, .bold))
                                .foregroundStyle(draft.keep ? Theme.teal : Theme.terra)
                            Spacer()
                            Button {
                                drafts.removeAll { $0.id == draft.id }
                            } label: {
                                Image(systemName: "trash")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(Theme.terra)
                                    .frame(width: 36, height: 36)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Remove this step")
                        }
                        TextField("Title", text: $draft.title)
                            .font(jakarta(16, .bold))
                            .padding(12)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Theme.border, lineWidth: 1)
                            )
                        TextField("What to do", text: $draft.detail, axis: .vertical)
                            .font(jakarta(15, .medium))
                            .lineLimit(3...6)
                            .padding(12)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Theme.border, lineWidth: 1)
                            )
                        Button {
                            draft.keep.toggle()
                        } label: {
                            Text(draft.keep ? "Approved" : "Approve this step")
                                .font(jakarta(15, .bold))
                                .foregroundStyle(draft.keep ? Theme.teal : .white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 46)
                                .background(draft.keep ? Theme.tealSoft : Theme.teal, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .buttonStyle(KidButtonStyle())
                    }
                    .padding(14)
                    .card(border: draft.keep ? Theme.tealBorder : Theme.border)
                }
                Button {
                    drafts.append(DraftInstruction(title: "", detail: ""))
                } label: {
                    Label("Add a step", systemImage: "plus")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Color.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(Theme.tealBorder, lineWidth: 1.5)
                        )
                }
                .buttonStyle(KidButtonStyle())
                Button {
                    let saved = drafts.compactMap { draft -> ParentInstruction? in
                        let title = draft.title.trimmingCharacters(in: .whitespacesAndNewlines)
                        let detail = draft.detail.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard draft.keep, !title.isEmpty, !detail.isEmpty else { return nil }
                        return ParentInstruction(title: title, detail: detail, fromRecording: true)
                    }
                    store.addParentInstructions(saved)
                    route = .list
                } label: {
                    actionLabel("Save approved steps", symbol: "checkmark.circle.fill", fill: canSaveApproved ? Theme.teal : Theme.teal.opacity(0.35))
                }
                .buttonStyle(KidButtonStyle())
                .disabled(!canSaveApproved)
            }
            .padding(16)
            .readableColumn(compact: 520)
        }
        .scrollIndicators(.hidden)
    }

    private func actionLabel(_ title: String, symbol: String, fill: Color) -> some View {
        Label(title, systemImage: symbol)
            .font(jakarta(16, .bold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(fill, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var canSaveApproved: Bool {
        drafts.contains { draft in
            draft.keep
                && !draft.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                && !draft.detail.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
    }

    private func goBack() {
        recorder.cancel()
        switch route {
        case .list:
            if !embedded { dismiss() }
        case .write, .edit, .record:
            route = .list
        case .review:
            route = .record
        }
    }

    private func findSteps() async {
        isExtracting = true
        await recorder.finish()
        guard route == .record else {
            isExtracting = false
            return
        }
        let text = recorder.transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else {
            isExtracting = false
            return
        }
        let result = await InstructionExtractor.extract(from: text)
        drafts = result.items
        reviewNote = result.note
        isExtracting = false
        route = .review
    }
}

struct ManualInstructionForm: View {
    @Environment(CareStore.self) private var store
    var existing: ParentInstruction?
    var onSave: () -> Void
    @State private var title: String
    @State private var detail: String

    init(existing: ParentInstruction? = nil, onSave: @escaping () -> Void) {
        self.existing = existing
        self.onSave = onSave
        _title = State(initialValue: existing?.title ?? "")
        _detail = State(initialValue: existing?.detail ?? "")
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text(existing == nil ? "Write a step" : "Edit this step")
                    .font(jakarta(28, .extraBold))
                    .foregroundStyle(Theme.teal)
                Text("Use the words you want \(store.careChildName) and \(store.companionName) to follow.")
                    .font(jakarta(15, .medium))
                    .foregroundStyle(Theme.muted)
                Text("Title")
                    .font(jakarta(13, .bold))
                    .foregroundStyle(Theme.teal)
                TextField("Cold sips", text: $title)
                    .font(jakarta(16, .semibold))
                    .padding(14)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
                Text("What to do")
                    .font(jakarta(13, .bold))
                    .foregroundStyle(Theme.teal)
                TextField("Offer a small sip of cold water after medicine.", text: $detail, axis: .vertical)
                    .font(jakarta(16, .medium))
                    .lineLimit(4...8)
                    .padding(14)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
                Button {
                    let cleanTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
                    let cleanDetail = detail.trimmingCharacters(in: .whitespacesAndNewlines)
                    if let existing {
                        store.updateParentInstruction(id: existing.id, title: cleanTitle, detail: cleanDetail)
                    } else {
                        store.addParentInstructions([
                            ParentInstruction(
                                title: cleanTitle,
                                detail: cleanDetail,
                                fromRecording: false
                            )
                        ])
                    }
                    onSave()
                } label: {
                    Text(existing == nil ? "Save step" : "Save changes")
                        .font(jakarta(16, .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(canSave ? Theme.teal : Theme.teal.opacity(0.35), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(KidButtonStyle())
                .disabled(!canSave)
            }
            .padding(16)
            .readableColumn(compact: 520)
        }
        .scrollIndicators(.hidden)
    }

    private var canSave: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !detail.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}
