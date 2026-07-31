#if os(iOS)
import Foundation
import UIKit

/// Downloads a reel's video to a local temp file and hands it to the system share sheet.
///
/// WhatsApp only offers its "Add to Status" action for locally-held media, not for a remote
/// URL — sharing `reel.videoURL` directly would just share a link. Downloading first is what
/// makes "Set as Status" actually reach WhatsApp's Status composer (and works identically for
/// every other share target too).
@MainActor
enum ReelStatusExporter {
    private static var isExporting = false

    static func export(reel: Reel) async {
        guard !isExporting, let urlString = reel.videoURL, let remoteURL = URL(string: urlString) else { return }
        isExporting = true
        defer { isExporting = false }

        do {
            let (data, response) = try await URLSession.shared.data(from: remoteURL)
            guard (response as? HTTPURLResponse)?.statusCode == 200, !data.isEmpty else { return }

            let ext = remoteURL.pathExtension.isEmpty ? "mp4" : remoteURL.pathExtension
            let tempURL = FileManager.default.temporaryDirectory
                .appendingPathComponent(reel.slug)
                .appendingPathExtension(ext)
            try? FileManager.default.removeItem(at: tempURL)
            try data.write(to: tempURL, options: .atomic)

            presentShareSheet(for: tempURL)
        } catch {
            Telemetry.track("reel.status_export.failed", ["slug": reel.slug])
        }
    }

    private static func presentShareSheet(for fileURL: URL) {
        guard let presenter = TopViewController.find() else { return }
        let activityVC = UIActivityViewController(activityItems: [fileURL], applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = presenter.view
            popover.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.maxY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        presenter.present(activityVC, animated: true)
    }
}
#endif
