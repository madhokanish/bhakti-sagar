import CoreData
import Foundation

actor StatePersistence {
    private let container: NSPersistentContainer
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private let legacy = ChatPersistence()

    init() {
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601

        let model = Self.makeModel()
        container = NSPersistentContainer(name: "BhaktiState", managedObjectModel: model)

        let root = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
        let dir = root.appending(path: "BhaktiChatiOS", directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)

        let description = NSPersistentStoreDescription(url: dir.appending(path: "BhaktiState.sqlite"))
        description.type = NSSQLiteStoreType
        description.shouldMigrateStoreAutomatically = true
        description.shouldInferMappingModelAutomatically = true
        container.persistentStoreDescriptions = [description]

        container.loadPersistentStores { _, error in
            if let error {
                assertionFailure("CoreData store load failed: \(error)")
            }
        }
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }

    func load() async -> PersistedChatState {
        if let state = await loadFromCoreData() {
            return state
        }

        // One-way migration from legacy JSON store when CoreData is empty.
        let legacyState = await legacy.load()
        let hasLegacyData = !legacyState.threads.isEmpty
            || !legacyState.messagesByThread.isEmpty
            || !legacyState.divineCreations.isEmpty
            || !legacyState.savedAartiIDs.isEmpty
        if hasLegacyData {
            await save(legacyState)
            return legacyState
        }

        return .empty
    }

    /// Permanently removes all persisted chat state (CoreData blob + legacy JSON). Used by
    /// account deletion — after this, a fresh launch loads `.empty`.
    func clear() async {
        await performBackgroundTask { context in
            let request = NSFetchRequest<NSFetchRequestResult>(entityName: "AppStateBlob")
            let deleteRequest = NSBatchDeleteRequest(fetchRequest: request)
            _ = try? context.execute(deleteRequest)
            if context.hasChanges { try? context.save() }
        }
        await legacy.clear()
    }

    func save(_ state: PersistedChatState) async {
        guard let payload = try? encoder.encode(state) else { return }

        await performBackgroundTask { context in
            let request = NSFetchRequest<NSManagedObject>(entityName: "AppStateBlob")
            request.fetchLimit = 1
            let blob = (try? context.fetch(request))?.first
                ?? NSEntityDescription.insertNewObject(forEntityName: "AppStateBlob", into: context)

            blob.setValue("primary", forKey: "id")
            blob.setValue(Date(), forKey: "updatedAt")
            blob.setValue(payload, forKey: "payload")

            if context.hasChanges {
                try? context.save()
            }
        }
    }

    private func loadFromCoreData() async -> PersistedChatState? {
        await performBackgroundTaskReturning { [self] context in
            let request = NSFetchRequest<NSManagedObject>(entityName: "AppStateBlob")
            request.fetchLimit = 1
            request.sortDescriptors = [NSSortDescriptor(key: "updatedAt", ascending: false)]

            guard
                let blob = try? context.fetch(request).first,
                let payload = blob.value(forKey: "payload") as? Data,
                let state = try? decoder.decode(PersistedChatState.self, from: payload)
            else {
                return nil
            }
            return state
        }
    }

    private func performBackgroundTask(_ work: @escaping (NSManagedObjectContext) -> Void) async {
        await withCheckedContinuation { continuation in
            container.performBackgroundTask { context in
                work(context)
                continuation.resume()
            }
        }
    }

    private func performBackgroundTaskReturning<T>(_ work: @escaping (NSManagedObjectContext) -> T) async -> T {
        await withCheckedContinuation { continuation in
            container.performBackgroundTask { context in
                continuation.resume(returning: work(context))
            }
        }
    }

    private static func makeModel() -> NSManagedObjectModel {
        let model = NSManagedObjectModel()

        let entity = NSEntityDescription()
        entity.name = "AppStateBlob"
        entity.managedObjectClassName = "NSManagedObject"

        let id = NSAttributeDescription()
        id.name = "id"
        id.attributeType = .stringAttributeType
        id.isOptional = false

        let updatedAt = NSAttributeDescription()
        updatedAt.name = "updatedAt"
        updatedAt.attributeType = .dateAttributeType
        updatedAt.isOptional = false

        let payload = NSAttributeDescription()
        payload.name = "payload"
        payload.attributeType = .binaryDataAttributeType
        payload.isOptional = false

        entity.properties = [id, updatedAt, payload]
        model.entities = [entity]
        return model
    }
}
