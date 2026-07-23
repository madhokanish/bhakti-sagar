import SwiftUI
import WebKit

#if os(iOS)
import UIKit

struct YouTubeEmbedView: UIViewRepresentable {
    let videoId: String?

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero, configuration: configuredWebViewConfig())
        webView.navigationDelegate = context.coordinator
        webView.scrollView.isScrollEnabled = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        context.coordinator.load(videoId: videoId, into: webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        context.coordinator.load(videoId: videoId, into: uiView)
    }
}

#elseif os(macOS)
import AppKit

struct YouTubeEmbedView: NSViewRepresentable {
    let videoId: String?

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeNSView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero, configuration: configuredWebViewConfig())
        webView.navigationDelegate = context.coordinator
        webView.setValue(false, forKey: "drawsBackground")
        context.coordinator.load(videoId: videoId, into: webView)
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {
        context.coordinator.load(videoId: videoId, into: nsView)
    }
}
#endif

extension YouTubeEmbedView {
    final class Coordinator: NSObject, WKNavigationDelegate {
        private var loadedVideoId: String?

        func load(videoId: String?, into webView: WKWebView) {
            guard loadedVideoId != videoId else { return }
            loadedVideoId = videoId

            guard let videoId, !videoId.isEmpty else {
                webView.loadHTMLString(videoUnavailableHTML, baseURL: nil)
                return
            }

            webView.load(
                Data(embedHTML(videoId: videoId).utf8),
                mimeType: "text/html",
                characterEncodingName: "utf-8",
                baseURL: URL(string: "https://www.youtube-nocookie.com")!
            )
        }
    }
}

private func configuredWebViewConfig() -> WKWebViewConfiguration {
    let config = WKWebViewConfiguration()
    #if os(iOS)
    config.allowsInlineMediaPlayback = true
    config.mediaTypesRequiringUserActionForPlayback = []
    #endif
    config.defaultWebpagePreferences.allowsContentJavaScript = true
    return config
}

private func embedHTML(videoId: String) -> String {
    let embedURL = "https://www.youtube-nocookie.com/embed/\(videoId)?modestbranding=1&rel=0&playsinline=1"
    return """
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000000;
          }
          iframe {
            border: 0;
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <iframe
          src="\(embedURL)"
          title="Aarti video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </body>
    </html>
    """
}

private let videoUnavailableHTML = """
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #11161c;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        text-align: center;
        padding: 24px;
        box-sizing: border-box;
        color: rgba(255,255,255,0.72);
      }
    </style>
  </head>
  <body>
    <div class="wrap">Read the lyrics below while the video is being prepared.</div>
  </body>
</html>
"""
