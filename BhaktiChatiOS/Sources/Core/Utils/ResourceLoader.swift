import Foundation

enum ResourceLoader {
    static func decodeJSON<T: Decodable>(_ type: T.Type, filename: String, ext: String = "json") throws -> T {
        guard let url = resourceURL(filename: filename, ext: ext) else {
            throw NSError(domain: "ResourceLoader", code: 404, userInfo: [NSLocalizedDescriptionKey: "Missing resource: \(filename).\(ext)"])
        }
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private static func resourceURL(filename: String, ext: String) -> URL? {
        if let nested = Bundle.module.url(forResource: filename, withExtension: ext, subdirectory: "Data") {
            return nested
        }
        return Bundle.module.url(forResource: filename, withExtension: ext)
    }
}
