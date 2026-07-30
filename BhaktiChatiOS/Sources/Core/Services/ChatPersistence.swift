import Foundation

actor ChatPersistence {
    private let fileURL: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(filename: String = "chat_state.json") {
        let root = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
        let dir = root.appending(path: "BhaktiChatiOS", directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        self.fileURL = dir.appending(path: filename)
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601
    }

    func load() -> PersistedChatState {
        guard
            let data = try? Data(contentsOf: fileURL),
            let state = try? decoder.decode(PersistedChatState.self, from: data)
        else {
            return .empty
        }
        return state
    }

    func save(_ state: PersistedChatState) {
        guard let data = try? encoder.encode(state) else { return }
        try? data.write(to: fileURL, options: [.atomic])
    }

    /// Wipes the on-disk legacy store — used by account deletion so nothing lingers to re-migrate.
    func clear() {
        try? FileManager.default.removeItem(at: fileURL)
    }
}
