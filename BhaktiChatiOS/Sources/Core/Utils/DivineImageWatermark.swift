import Foundation
import CoreGraphics

#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

/// Draws the "BhaktiChat · bhaktichat.com" watermark onto a generated Divine Image result,
/// bottom-right, before it's cached/saved. Mirrors Android's `DivineImageGenerator.applyWatermark`
/// exactly: text size ≈4.5% of image width, padding ≈4% from the edges, translucent white
/// with a soft black shadow for legibility over any background.
enum DivineImageWatermark {
    private static let text = "BhaktiChat · bhaktichat.com"

    /// Decodes `imageData`, draws the watermark, and re-encodes as PNG. Returns `nil` if
    /// `imageData` can't be decoded as an image.
    static func watermarkedPNGData(from imageData: Data) -> Data? {
        guard let image = PlatformImageDecoder.decode(imageData) else { return nil }
        let watermarked = watermarked(image)
        #if os(iOS)
        return watermarked.pngData()
        #elseif os(macOS)
        guard let tiff = watermarked.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff) else {
            return nil
        }
        return rep.representation(using: .png, properties: [:])
        #endif
    }

    #if os(iOS)
    private static func watermarked(_ image: UIImage) -> UIImage {
        let size = image.size
        let textSize = size.width * 0.045
        let padding = size.width * 0.04

        let rendererFormat = UIGraphicsImageRendererFormat.default()
        rendererFormat.scale = image.scale
        return UIGraphicsImageRenderer(size: size, format: rendererFormat).image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))

            let shadow = NSShadow()
            shadow.shadowColor = UIColor.black.withAlphaComponent(120.0 / 255.0)
            shadow.shadowBlurRadius = textSize * 0.18
            shadow.shadowOffset = .zero

            let attributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: textSize),
                .foregroundColor: UIColor.white.withAlphaComponent(205.0 / 255.0),
                .shadow: shadow
            ]
            let attributed = NSAttributedString(string: text, attributes: attributes)
            let textBounds = attributed.size()
            let origin = CGPoint(
                x: size.width - padding - textBounds.width,
                y: size.height - padding - textBounds.height
            )
            attributed.draw(at: origin)
        }
    }
    #elseif os(macOS)
    private static func watermarked(_ image: NSImage) -> NSImage {
        let size = image.size
        let textSize = size.width * 0.045
        let padding = size.width * 0.04

        let rendered = NSImage(size: size)
        rendered.lockFocus()
        image.draw(in: NSRect(origin: .zero, size: size))

        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(120.0 / 255.0)
        shadow.shadowBlurRadius = textSize * 0.18
        shadow.shadowOffset = .zero

        let attributes: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: textSize),
            .foregroundColor: NSColor.white.withAlphaComponent(205.0 / 255.0),
            .shadow: shadow
        ]
        let attributed = NSAttributedString(string: text, attributes: attributes)
        let textBounds = attributed.size()
        // AppKit's coordinate origin is bottom-left, matching the bottom-right
        // placement directly (no y-flip needed, unlike UIKit).
        let origin = CGPoint(
            x: size.width - padding - textBounds.width,
            y: padding
        )
        attributed.draw(at: origin)
        rendered.unlockFocus()
        return rendered
    }
    #endif
}
