import Foundation

#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

enum ImageDataURL {
    // Higher-fidelity reference (matches Android): gpt-image-1's edit endpoint (with
    // input_fidelity=high) has more facial detail to preserve → better likeness.
    static func encodeUploadDataURL(from data: Data, maxSide: CGFloat = 1536, quality: CGFloat = 0.92) -> String {
        #if os(iOS)
        if let image = UIImage(data: data),
           let optimized = optimizedJPEGData(from: image, maxSide: maxSide, quality: quality) {
            return "data:image/jpeg;base64,\(optimized.base64EncodedString())"
        }
        #elseif os(macOS)
        if let image = NSImage(data: data),
           let optimized = optimizedJPEGData(from: image, maxSide: maxSide, quality: quality) {
            return "data:image/jpeg;base64,\(optimized.base64EncodedString())"
        }
        #endif

        return "data:image/jpeg;base64,\(data.base64EncodedString())"
    }

    static func encodeJPEGDataURL(from data: Data) -> String {
        "data:image/jpeg;base64,\(data.base64EncodedString())"
    }

    static func decodeBase64Payload(_ payload: String) -> Data? {
        if let commaIndex = payload.firstIndex(of: ",") {
            let base64 = String(payload[payload.index(after: commaIndex)...])
            return Data(base64Encoded: base64)
        }
        return Data(base64Encoded: payload)
    }

    #if os(iOS)
    private static func optimizedJPEGData(from image: UIImage, maxSide: CGFloat, quality: CGFloat) -> Data? {
        let sourceSize = image.size
        let targetSize = scaledSize(for: sourceSize, maxSide: maxSide)

        let rendererFormat = UIGraphicsImageRendererFormat.default()
        rendererFormat.scale = 1
        let rendered = UIGraphicsImageRenderer(size: targetSize, format: rendererFormat).image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
        return rendered.jpegData(compressionQuality: quality)
    }
    #elseif os(macOS)
    private static func optimizedJPEGData(from image: NSImage, maxSide: CGFloat, quality: CGFloat) -> Data? {
        let sourceSize = image.size
        let targetSize = scaledSize(for: sourceSize, maxSide: maxSide)
        let rendered = NSImage(size: targetSize)
        rendered.lockFocus()
        image.draw(in: NSRect(origin: .zero, size: targetSize))
        rendered.unlockFocus()

        guard let tiff = rendered.tiffRepresentation,
              let rep = NSBitmapImageRep(data: tiff) else {
            return nil
        }

        return rep.representation(using: .jpeg, properties: [.compressionFactor: quality])
    }
    #endif

    private static func scaledSize(for size: CGSize, maxSide: CGFloat) -> CGSize {
        let largerSide = max(size.width, size.height)
        guard largerSide > 0, largerSide > maxSide else { return size }
        let ratio = maxSide / largerSide
        return CGSize(
            width: max(1, floor(size.width * ratio)),
            height: max(1, floor(size.height * ratio))
        )
    }
}
