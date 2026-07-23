import SwiftUI

#if os(iOS)
import UIKit
private typealias PackageNativeImage = UIImage
#elseif os(macOS)
import AppKit
private typealias PackageNativeImage = NSImage
#endif

enum PackageAssetLoader {
    static func preload(names: [String]) {
        for name in names {
            _ = nativeImage(named: name)
        }
    }

    static func image(named name: String) -> Image {
        guard let native = nativeImage(named: name) else {
            return Image(systemName: "photo")
        }

        #if os(iOS)
        return Image(uiImage: native)
        #elseif os(macOS)
        return Image(nsImage: native)
        #endif
    }

    static func data(named name: String) -> Data? {
        if let url = resourceURL(named: name),
           let data = try? Data(contentsOf: url) {
            return data
        }

        #if os(iOS)
        if let native = nativeImage(named: name) {
            return native.pngData() ?? native.jpegData(compressionQuality: 0.95)
        }
        #elseif os(macOS)
        if let native = nativeImage(named: name),
           let tiff = native.tiffRepresentation,
           let rep = NSBitmapImageRep(data: tiff) {
            return rep.representation(using: .png, properties: [:])
        }
        #endif

        return nil
    }

    private static func nativeImage(named name: String) -> PackageNativeImage? {
        if let cached = imageCache.object(forKey: name as NSString) {
            return cached
        }

        guard let url = resourceURL(named: name) else {
            #if os(iOS)
            let image = UIImage(named: name, in: .module, compatibleWith: nil)
            if let image {
                imageCache.setObject(image, forKey: name as NSString)
            }
            return image
            #elseif os(macOS)
            let image = Bundle.module.image(forResource: NSImage.Name(name))
            if let image {
                imageCache.setObject(image, forKey: name as NSString)
            }
            return image
            #endif
        }

        #if os(iOS)
        if let image = UIImage(contentsOfFile: url.path) {
            imageCache.setObject(image, forKey: name as NSString)
            return image
        }
        let image = UIImage(named: name, in: .module, compatibleWith: nil)
        if let image {
            imageCache.setObject(image, forKey: name as NSString)
        }
        return image
        #elseif os(macOS)
        if let image = NSImage(contentsOf: url) {
            imageCache.setObject(image, forKey: name as NSString)
            return image
        }
        let image = Bundle.module.image(forResource: NSImage.Name(name))
        if let image {
            imageCache.setObject(image, forKey: name as NSString)
        }
        return image
        #endif
    }

    private static func resourceURL(named name: String) -> URL? {
        let baseName = (name as NSString).deletingPathExtension
        let explicitExtension = (name as NSString).pathExtension.lowercased()
        let extensions = explicitExtension.isEmpty ? ["png", "jpg", "jpeg"] : [explicitExtension]

        for subdirectory in ["Assets", nil] {
            for ext in extensions {
                if let url = Bundle.module.url(forResource: baseName, withExtension: ext, subdirectory: subdirectory) {
                    return url
                }
            }
        }
        return nil
    }

    private static let imageCache = NSCache<NSString, PackageNativeImage>()
}
