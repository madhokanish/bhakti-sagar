import Foundation
import SwiftUI

#if os(iOS)
import UIKit

typealias PlatformImage = UIImage

extension Image {
    init(platformImage: PlatformImage) {
        self = Image(uiImage: platformImage)
    }
}
#elseif os(macOS)
import AppKit

typealias PlatformImage = NSImage

extension Image {
    init(platformImage: PlatformImage) {
        self = Image(nsImage: platformImage)
    }
}
#endif

enum PlatformImageDecoder {
    static func decode(_ data: Data) -> PlatformImage? {
        PlatformImage(data: data)
    }
}
